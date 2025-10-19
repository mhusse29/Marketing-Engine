import { useEffect, useState } from 'react';
import { analyticsClient } from '../lib/analyticsClient';
import type { AnalyticsMetadata } from '../lib/analyticsClient';
import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';

export interface HealthScore {
  health_score: number;
  uptime_pct: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  total_requests: number;
}

export interface DailyMetrics {
  date: string | null;
  daily_active_users: number | null;
  total_requests: number | null;
  successful_requests: number | null;
  failed_requests: number | null;
  success_rate_pct: number | null;
  total_cost: number | null;
  total_tokens: number | null;
  total_images: number | null;
  total_video_seconds: number | null;
  avg_latency_ms: number | null;
  p95_latency_ms: number | null;
}

export interface ProviderPerformance {
  provider: string | null;
  service_type: string | null;
  total_requests: number | null;
  successful_requests: number | null;
  success_rate_pct: number | null;
  avg_success_latency_ms: number | null;
  p95_success_latency_ms: number | null;
  avg_cost_per_request: number | null;
  total_cost: number | null;
}

export interface UserSegment {
  user_id?: string | null;
  plan_type?: string | null;
  total_calls: number | null;
  total_spent: number | null;
  features_used: number | null;
  last_active: string | null;
  usage_segment: string | null;
  churn_risk_segment: string | null;
  user_count?: number | null;
}

export interface ApiUsageRow {
  id: string;
  user_id: string;
  service_type: string;
  provider: string;
  model: string;
  status: string;
  latency_ms: number | null;
  total_cost: number;
  created_at: string | null;
}

export interface RevenueMetrics {
  plan_name: string;
  total_subscribers: number;
  active_subscribers: number;
  total_monthly_revenue: number;
  avg_lifetime_value: number;
  auto_renew_count: number;
  auto_renew_pct: number;
}

// Health Score Hook
export function useHealthScore(intervalMinutes = 60) {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthScore = async () => {
      setLoading(true);
      const response = await analyticsClient.getHealthScore(intervalMinutes);

      setMetadata(response.metadata);

      if (response.metadata.error) {
        setError(response.metadata.error);
        setHealthScore(null);
      } else if (response.data && response.data.length > 0) {
        setHealthScore(response.data[0]);
        setError(null);
      } else {
        setHealthScore(null);
        setError(null);
      }
      setLoading(false);
    };

    fetchHealthScore();
    const interval = setInterval(fetchHealthScore, 60000); // Refresh every minute
    
    // Listen to manual refresh events
    const handleManualRefresh = () => fetchHealthScore();
    window.addEventListener('refreshAnalytics', handleManualRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshAnalytics', handleManualRefresh);
    };
  }, [intervalMinutes]);

  return { healthScore, loading, metadata, error };
}

// Real-time API Usage Hook
export function useRealtimeApiUsage(limit = 100) {
  const [apiUsage, setApiUsage] = useState<ApiUsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let socket: Socket | null = null;
    let isMounted = true;

    const fetchApiUsage = async () => {
      if (!isMounted) return;
      setLoading(true);
      const response = await analyticsClient.getRealtimeUsage({ limit });

      if (!isMounted) return;

      setMetadata(response.metadata);

      if (response.metadata.error) {
        setError(response.metadata.error);
        setApiUsage([]);
      } else {
        setError(null);
        setApiUsage(response.data || []);
      }
      setLoading(false);
    };

    const attachSocketHandlers = (activeSocket: Socket) => {
      activeSocket.on('connected', (data) => {
        console.log('[Gateway WebSocket] Connected:', data.message);
      });

      activeSocket.on('api_usage:insert', (enrichedEvent: { data: ApiUsageRow; metadata: AnalyticsMetadata }) => {
        if (!isMounted) return;
        setApiUsage((prev) => [enrichedEvent.data, ...prev.slice(0, limit - 1)]);
        setMetadata(enrichedEvent.metadata);
        setError(enrichedEvent.metadata.error || null);
      });

      activeSocket.on('disconnect', (reason) => {
        console.log('[Gateway WebSocket] Disconnected:', reason);
      });

      activeSocket.on('connect_error', async (err) => {
        console.error('[Gateway WebSocket] Connection error:', err.message);
        if (!isMounted) return;

        if (err.message === 'Unauthorized') {
          try {
            const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError && refreshed.session) {
              activeSocket.disconnect();
              const gatewayUrl = import.meta.env.VITE_ANALYTICS_GATEWAY_URL || 'http://localhost:8788';
              socket = io(gatewayUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                auth: { token: refreshed.session.access_token },
              });
              attachSocketHandlers(socket);
              return;
            }
          } catch (refreshErr) {
            console.error('[Gateway WebSocket] Refresh failed:', refreshErr);
          }
        }

        setError('WebSocket connection failed');
      });
    };

    const connectSocket = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setError((prev) => prev ?? 'Authentication required for live updates');
        return;
      }

      const gatewayUrl = import.meta.env.VITE_ANALYTICS_GATEWAY_URL || 'http://localhost:8788';
      socket = io(gatewayUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        auth: { token },
      });

      attachSocketHandlers(socket);
    };

    const initialize = async () => {
      await fetchApiUsage();
      if (!isMounted) return;
      await connectSocket();
    };

    initialize();

    const handleManualRefresh = () => {
      fetchApiUsage();
    };

    window.addEventListener('refreshAnalytics', handleManualRefresh);

    return () => {
      isMounted = false;
      if (socket) socket.disconnect();
      window.removeEventListener('refreshAnalytics', handleManualRefresh);
    };
  }, [limit]);

  return { apiUsage, loading, metadata, error };
}

// Daily Metrics Hook (with real-time refresh)
export function useDailyMetrics(days = 30) {
  const [metrics, setMetrics] = useState<DailyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const response = await analyticsClient.getDailyMetrics(days);

      setMetadata(response.metadata);

      if (response.metadata.error) {
        setError(response.metadata.error);
        setMetrics([]);
      } else {
        setError(null);
        setMetrics(response.data || []);
      }
      setLoading(false);
    };

    fetchMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    
    // Listen to manual refresh events
    const handleManualRefresh = () => fetchMetrics();
    window.addEventListener('refreshAnalytics', handleManualRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshAnalytics', handleManualRefresh);
    };
  }, [days]);

  return { metrics, loading, metadata, error };
}

// Provider Performance Hook (with real-time refresh)
export function useProviderPerformance() {
  const [providers, setProviders] = useState<ProviderPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      const response = await analyticsClient.getProviderPerformance();

      setMetadata(response.metadata);

      if (response.metadata.error) {
        setError(response.metadata.error);
        setProviders([]);
      } else {
        setError(null);
        setProviders(response.data || []);
      }
      setLoading(false);
    };

    fetchProviders();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchProviders, 30000);
    
    // Listen to manual refresh events
    const handleManualRefresh = () => fetchProviders();
    window.addEventListener('refreshAnalytics', handleManualRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshAnalytics', handleManualRefresh);
    };
  }, []);

  return { providers, loading, metadata, error };
}

// User Segments Hook
export function useUserSegments(limit = 100) {
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSegments = async () => {
      setLoading(true);
      const response = await analyticsClient.getUserSegments(limit);

      setMetadata(response.metadata);

      if (response.metadata.error) {
        setError(response.metadata.error);
        setSegments([]);
      } else {
        setError(null);
        setSegments(response.data || []);
      }
      setLoading(false);
    };

    fetchSegments();
    
    // Listen to manual refresh events
    const handleManualRefresh = () => fetchSegments();
    window.addEventListener('refreshAnalytics', handleManualRefresh);

    return () => {
      window.removeEventListener('refreshAnalytics', handleManualRefresh);
    };
  }, [limit]);

  return { segments, loading, metadata, error };
}

// Revenue Metrics Hook
export function useRevenueMetrics() {
  const [revenue, setRevenue] = useState<RevenueMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true);
      const response = await analyticsClient.getRevenuePlans();

      setMetadata(response.metadata);

      if (response.metadata.error) {
        setError(response.metadata.error);
        setRevenue([]);
      } else {
        setError(null);
        setRevenue(response.data || []);
      }
      setLoading(false);
    };

    fetchRevenue();
    
    // Listen to manual refresh events
    const handleManualRefresh = () => fetchRevenue();
    window.addEventListener('refreshAnalytics', handleManualRefresh);

    return () => {
      window.removeEventListener('refreshAnalytics', handleManualRefresh);
    };
  }, []);

  return { revenue, loading, metadata, error };
}

// Executive Summary Hook
export interface ExecutiveSummary {
  total_users: number;
  active_users_today: number;
  total_requests_today: number;
  success_rate: number;
  total_cost_today: number;
  avg_latency_ms: number;
  health_score: number;
}

export function useExecutiveSummary(days = 30) {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      const response = await analyticsClient.getExecutiveSummary(days);

      setMetadata(response.metadata);

      if (response.metadata.error) {
        setError(response.metadata.error);
        setSummary(null);
      } else {
        setError(null);
        setSummary(response.data ?? null);
      }
      setLoading(false);
    };

    fetchSummary();
    const interval = setInterval(fetchSummary, 30000); // Refresh every 30 seconds
    
    // Listen to manual refresh events
    const handleManualRefresh = () => fetchSummary();
    window.addEventListener('refreshAnalytics', handleManualRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshAnalytics', handleManualRefresh);
    };
  }, [days]);

  return { summary, loading, metadata, error };
}

// Churn Risk Users Hook
export interface ChurnRiskUser {
  user_id: string;
  plan_type: string;
  churn_score: number;
  days_inactive: number;
  total_spent: number;
  last_active: string;
  risk_category: string;
}

export function useChurnRiskUsers(minScore = 50) {
  const [users, setUsers] = useState<ChurnRiskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const response = await analyticsClient.getChurnRiskUsers(minScore);

      setMetadata(response.metadata);

      if (response.metadata.error) {
        setError(response.metadata.error);
        setUsers([]);
      } else {
        setError(null);
        setUsers(response.data || []);
      }
      setLoading(false);
    };

    fetchUsers();
    
    // Listen to manual refresh events
    const handleManualRefresh = () => fetchUsers();
    window.addEventListener('refreshAnalytics', handleManualRefresh);

    return () => {
      window.removeEventListener('refreshAnalytics', handleManualRefresh);
    };
  }, [minScore]);

  return { users, loading, metadata, error };
}

// Model Usage Hook
export interface ModelUsageMetrics {
  model: string;
  provider: string;
  service_type: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  success_rate: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  avg_cost_per_call: number;
  avg_latency_ms: number;
  images_generated: number;
  video_seconds: number;
  last_used: string;
}

export function useModelUsage(days = 30) {
  const [models, setModels] = useState<ModelUsageMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModelUsage = async () => {
      setLoading(true);
      const response = await analyticsClient.getModelUsage();

      setMetadata(response.metadata);

      if (response.metadata.error) {
        setError(response.metadata.error);
        setModels([]);
      } else {
        setError(null);
        setModels(response.data || []);
      }
      setLoading(false);
    };

    fetchModelUsage();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchModelUsage, 30000);
    
    // Listen to manual refresh events
    const handleManualRefresh = () => fetchModelUsage();
    window.addEventListener('refreshAnalytics', handleManualRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshAnalytics', handleManualRefresh);
    };
  }, [days]);

  return { models, loading, metadata, error };
}

// Model Usage Over Time Hook (DISABLED - unused and causes performance issues)
// TODO: If needed, create a materialized view for time-series data
/*
export function useModelUsageOverTime(days = 30) {
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeSeriesData = async () => {
      const { data, error } = await supabase
        .from('api_usage')
        .select('created_at, model, provider, service_type, total_cost, status')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (!error && data) {
        // Group by date and model
        const grouped = data.reduce((acc: any, row: any) => {
          const date = new Date(row.created_at).toLocaleDateString();
          const key = `${date}-${row.model}`;
          if (!acc[key]) {
            acc[key] = {
              date,
              model: row.model,
              provider: row.provider,
              service_type: row.service_type,
              calls: 0,
              cost: 0,
              success: 0,
            };
          }
          acc[key].calls++;
          acc[key].cost += Number(row.total_cost || 0);
          if (row.status === 'success') acc[key].success++;
          return acc;
        }, {});

        setTimeSeriesData(Object.values(grouped));
      }
      setLoading(false);
    };

    fetchTimeSeriesData();
  }, [days]);

  return { timeSeriesData, loading };
}
*/
