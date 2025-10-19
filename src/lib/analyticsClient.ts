/**
 * Analytics Gateway Client
 * 
 * Typed API client for routing all analytics requests through the gateway
 * Provides schema validation, caching metadata, and error handling
 */

import { supabase } from './supabase';

export interface AnalyticsMetadata {
  timestamp: string;
  cached: boolean;
  source: 'database' | 'cache' | 'realtime';
  freshness: 'current' | 'stale' | 'live';
  version: string;
  lastRefresh?: string;
  error?: string;
}

export interface AnalyticsResponse<T> {
  data: T;
  metadata: AnalyticsMetadata;
}

export interface DailyMetrics {
  date: string;
  daily_active_users: number;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate_pct: number;
  total_cost: number;
  total_tokens: number;
  total_images: number;
  total_video_seconds: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
}

export interface ProviderPerformance {
  provider: string;
  service_type: string;
  total_requests: number;
  successful_requests: number;
  success_rate_pct: number;
  avg_success_latency_ms: number;
  p95_success_latency_ms: number;
  avg_cost_per_request: number;
  total_cost: number;
}

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

export interface ExecutiveSummary {
  total_users: number;
  active_users_today: number;
  total_requests_today: number;
  success_rate: number; // Already a percentage (0-100)
  total_cost_today: number | string; // Can be numeric or string
  avg_latency_ms: number;
  health_score: number; // 0-100 scale
}

export interface RealtimeApiUsage {
  id: string;
  user_id: string;
  service_type: string;
  provider: string;
  model: string;
  status: string;
  latency_ms: number | null;
  total_cost: number;
  created_at: string;
}

export interface HealthScore {
  health_score: number;
  uptime_pct: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  total_requests: number;
}

export interface UserSegment {
  user_id?: string;
  plan_type?: string;
  total_calls: number;
  total_spent: number;
  features_used: number;
  last_active: string;
  usage_segment: string;
  churn_risk_segment: string;
  user_count?: number;
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

export interface ChurnRiskUser {
  user_id: string;
  plan_type: string;
  churn_score: number;
  days_inactive: number;
  total_spent: number;
  last_active: string;
  risk_category: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  timestamp: string;
  error?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'error';
  service: string;
  version: string;
  uptime: number;
  cache: {
    keys: number;
    hits: number;
    misses: number;
    hitRate: string;
  };
}

class AnalyticsClient {
  private baseUrl: string;
  private rateLimitMap: Map<string, number> = new Map();

  constructor() {
    // Default to localhost, can be overridden via env var
    this.baseUrl = import.meta.env.VITE_ANALYTICS_GATEWAY_URL || 'http://localhost:8788';
  }

  /**
   * Check rate limit (client-side protection)
   */
  private checkRateLimit(endpoint: string, limitPerMinute = 60): boolean {
    const now = Date.now();
    const key = `${endpoint}_${Math.floor(now / 60000)}`; // Per-minute bucket
    const count = this.rateLimitMap.get(key) || 0;

    if (count >= limitPerMinute) {
      return false;
    }

    this.rateLimitMap.set(key, count + 1);
    
    // Clean up old entries
    this.rateLimitMap.forEach((_, k) => {
      if (!k.startsWith(`${endpoint}_${Math.floor(now / 60000)}`)) {
        this.rateLimitMap.delete(k);
      }
    });

    return true;
  }

  /**
   * Generic fetch with error handling
   */
  private async buildHeaders(existingHeaders?: HeadersInit): Promise<Headers> {
    const headers = new Headers(existingHeaders || {});

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (error) {
      console.error('[AnalyticsClient] Failed to retrieve Supabase session:', error);
    }

    return headers;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = false
  ): Promise<AnalyticsResponse<T>> {
    try {
      const headers = await this.buildHeaders(options.headers);
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401 && !retry) {
          window.dispatchEvent(new CustomEvent('analytics:unauthorized'));
          try {
            const { data, error } = await supabase.auth.refreshSession();
            if (!error && data.session) {
              return this.fetch<T>(endpoint, options, true);
            }
          } catch (refreshError) {
            console.error('[AnalyticsClient] Session refresh failed:', refreshError);
          }
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Ensure metadata exists
      if (!result.metadata) {
        result.metadata = {
          timestamp: new Date().toISOString(),
          cached: false,
          source: 'database',
          freshness: 'current',
          version: 'v1',
        };
      }

      if (typeof result.metadata.error === 'string' && result.metadata.error.toLowerCase().includes('unauthorized')) {
        window.dispatchEvent(new CustomEvent('analytics:unauthorized'));
      }

      return result as AnalyticsResponse<T>;
    } catch (error) {
      // Return error wrapped in metadata
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.toLowerCase().includes('unauthorized')) {
        window.dispatchEvent(new CustomEvent('analytics:unauthorized'));
      }
      return {
        data: null as unknown as T,
        metadata: {
          timestamp: new Date().toISOString(),
          cached: false,
          source: 'database',
          freshness: 'stale',
          version: 'v1',
          error: message,
        },
      };
    }
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<HealthStatus | null> {
    try {
      const headers = await this.buildHeaders();
      const response = await fetch(`${this.baseUrl}/health`, {
        headers,
        credentials: 'include',
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Get daily metrics
   */
  async getDailyMetrics(days = 30): Promise<AnalyticsResponse<DailyMetrics[]>> {
    return this.fetch<DailyMetrics[]>(`/api/v1/metrics/daily?days=${days}`);
  }

  /**
   * Get provider performance
   */
  async getProviderPerformance(): Promise<AnalyticsResponse<ProviderPerformance[]>> {
    return this.fetch<ProviderPerformance[]>('/api/v1/metrics/providers');
  }

  /**
   * Get model usage
   */
  async getModelUsage(): Promise<AnalyticsResponse<ModelUsageMetrics[]>> {
    return this.fetch<ModelUsageMetrics[]>('/api/v1/metrics/models');
  }

  /**
   * Get executive summary
   */
  async getExecutiveSummary(days = 30): Promise<AnalyticsResponse<ExecutiveSummary>> {
    return this.fetch<ExecutiveSummary>(`/api/v1/metrics/executive?days=${days}`);
  }

  /**
   * Get realtime API usage
   */
  async getRealtimeUsage(params?: {
    limit?: number;
    service_type?: string;
    status?: string;
  }): Promise<AnalyticsResponse<RealtimeApiUsage[]>> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.service_type) query.set('service_type', params.service_type);
    if (params?.status) query.set('status', params.status);

    const queryString = query.toString();
    return this.fetch<RealtimeApiUsage[]>(
      `/api/v1/metrics/realtime${queryString ? `?${queryString}` : ''}`
    );
  }

  /**
   * Get health score
   */
  async getHealthScore(intervalMinutes = 60): Promise<AnalyticsResponse<HealthScore[]>> {
    return this.fetch<HealthScore[]>(`/api/v1/metrics/health?interval=${intervalMinutes}`);
  }

  /**
   * Get user segments
   */
  async getUserSegments(limit = 100): Promise<AnalyticsResponse<UserSegment[]>> {
    return this.fetch<UserSegment[]>(`/api/v1/segments/users?limit=${limit}`);
  }

  /**
   * Get revenue metrics by plan
   */
  async getRevenuePlans(): Promise<AnalyticsResponse<RevenueMetrics[]>> {
    return this.fetch<RevenueMetrics[]>('/api/v1/revenue/plans');
  }

  /**
   * Get churn risk users
   */
  async getChurnRiskUsers(minScore = 50): Promise<AnalyticsResponse<ChurnRiskUser[]>> {
    return this.fetch<ChurnRiskUser[]>(`/api/v1/users/churn-risk?min_score=${minScore}`);
  }

  /**
   * Refresh materialized views
   * Rate limited to prevent abuse
   */
  async refresh(): Promise<RefreshResponse> {
    // Client-side rate limit: 1 refresh per 10 seconds
    if (!this.checkRateLimit('refresh', 6)) {
      return {
        success: false,
        message: 'Rate limited: Please wait before refreshing again',
        timestamp: new Date().toISOString(),
        error: 'RATE_LIMIT_EXCEEDED',
      };
    }

    try {
      const headers = await this.buildHeaders();
      const response = await fetch(`${this.baseUrl}/api/v1/refresh`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Refresh failed');
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Refresh failed',
        timestamp: new Date().toISOString(),
        error: 'REFRESH_ERROR',
      };
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  async getCacheStats() {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/cache/stats`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const analyticsClient = new AnalyticsClient();
