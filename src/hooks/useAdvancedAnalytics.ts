/* eslint-disable @typescript-eslint/no-explicit-any */

// ═══════════════════════════════════════════════════════════════
// ADVANCED ANALYTICS HOOKS - Phases 1, 2, 3
// React hooks for budget, alerts, quality, forecasts, A/B tests, ROI
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════════
// PHASE 1: BUDGET & ALERTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get user's budget limits and current spend
 */
export function useBudgetLimits() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBudgets = async () => {
      const { data, error } = await supabase
        .from('budget_limits' as any) // Future table - eslint-disable-line @typescript-eslint/no-explicit-any
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBudgets(data);
      }
      setLoading(false);
    };

    fetchBudgets();
  }, []);

  return { budgets, loading };
}

/**
 * Get unread alerts
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('alert_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setAlerts(data);
        setUnreadCount(data.filter(a => !a.is_read).length);
      }
      setLoading(false);
    };

    fetchAlerts();

    // Real-time subscription
    const channel = supabase
      .channel('alerts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'alert_history' },
        (payload) => {
          setAlerts(prev => [payload.new, ...prev]);
          if (!payload.new.is_read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (alertId: string) => {
    await supabase
      .from('alert_history')
      .update({ is_read: true })
      .eq('id', alertId);

    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, is_read: true } : a
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return { alerts, unreadCount, loading, markAsRead };
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2: QUALITY & OPTIMIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Get cost optimization suggestions
 */
export function useOptimizationSuggestions() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { data, error } = await supabase
        .from('cost_optimization_suggestions' as any) // Future table - eslint-disable-line @typescript-eslint/no-explicit-any
        .select('*')
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('estimated_monthly_savings', { ascending: false });

      if (!error && data) {
        setSuggestions(data);
      }
      setLoading(false);
    };

    fetchSuggestions();
  }, []);

  const acceptSuggestion = async (id: string) => {
    await supabase
      .from('cost_optimization_suggestions' as any) // Future table - eslint-disable-line @typescript-eslint/no-explicit-any
      .update({ status: 'accepted', implemented_at: new Date().toISOString() })
      .eq('id', id);

    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const rejectSuggestion = async (id: string) => {
    await supabase
      .from('cost_optimization_suggestions' as any) // Future table - eslint-disable-line @typescript-eslint/no-explicit-any
      .update({ status: 'rejected' })
      .eq('id', id);

    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  return { suggestions, loading, acceptSuggestion, rejectSuggestion };
}

/**
 * Get caching opportunities
 */
export function useCacheOpportunities() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    const fetchOpportunities = async () => {
      const { data, error } = await supabase
        .from('cache_analysis' as any) // Future table - eslint-disable-line @typescript-eslint/no-explicit-any
        .select('*')
        .eq('should_cache', true)
        .order('cache_priority', { ascending: false })
        .limit(20);

      if (!error && data) {
        setOpportunities(data);
        setTotalSavings((data as any[]).reduce((sum, o) => sum + (o.potential_savings || 0), 0));
      }
      setLoading(false);
    };

    fetchOpportunities();
  }, []);

  return { opportunities, totalSavings, loading };
}

/**
 * Get provider quality scores
 */
export function useProviderQuality() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuality = async () => {
      const { data, error } = await supabase
        .from('provider_quality_scores' as any) // Future table - eslint-disable-line @typescript-eslint/no-explicit-any
        .select('*')
        .order('quality_per_dollar', { ascending: false });

      if (!error && data) {
        setProviders(data);
      }
      setLoading(false);
    };

    fetchQuality();
  }, []);

  return { providers, loading };
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3: FORECASTS, A/B TESTS, ROI
// ═══════════════════════════════════════════════════════════════

/**
 * Get cost forecasts
 */
export function useForecasts(days = 30) {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecasts = async () => {
      const { data, error } = await supabase
        .from('usage_forecasts' as any) // Future table - eslint-disable-line @typescript-eslint/no-explicit-any
        .select('*')
        .eq('forecast_type', 'cost')
        .gte('forecast_date', new Date().toISOString().split('T')[0])
        .order('forecast_date', { ascending: true })
        .limit(days);

      if (!error && data) {
        setForecasts(data);
      }
      setLoading(false);
    };

    fetchForecasts();
  }, [days]);

  return { forecasts, loading };
}

/**
 * Get active A/B tests
 */
export function useABTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      const { data, error } = await supabase
        .from('ab_tests' as any) // Future table - eslint-disable-line @typescript-eslint/no-explicit-any
        .select('*')
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTests(data);
      }
      setLoading(false);
    };

    fetchTests();
  }, []);

  return { tests, loading };
}

/**
 * Get campaign ROI data
 */
export function useCampaignROI(campaignId?: string) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchROI = async () => {
      let query = supabase
        .from('campaign_outcomes')
        .select('*')
        .order('occurred_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query.limit(100);

      if (!error && data) {
        // Group by campaign
        const grouped = data.reduce((acc: any, outcome: any) => {
          const id = outcome.campaign_id;
          if (!acc[id]) {
            acc[id] = {
              campaign_id: id,
              outcomes: [],
              total_cost: 0,
              total_revenue: 0,
              roi: 0
            };
          }
          acc[id].outcomes.push(outcome);
          acc[id].total_cost += outcome.attributed_cost || 0;
          acc[id].total_revenue += outcome.outcome_value || 0;
          return acc;
        }, {});

        // Calculate ROI
        const campaignList = Object.values(grouped).map((c: any) => ({
          ...c,
          roi: c.total_cost > 0 ? c.total_revenue / c.total_cost : 0,
          roi_percentage: c.total_cost > 0 
            ? ((c.total_revenue - c.total_cost) / c.total_cost) * 100 
            : 0
        }));

        setCampaigns(campaignList);
      }
      setLoading(false);
    };

    fetchROI();
  }, [campaignId]);

  return { campaigns, loading };
}

/**
 * Submit quality feedback
 */
export async function submitQualityFeedback({
  apiUsageId,
  rating,
  feedbackText = null,
  wasEdited = false,
  wasUsed = true
}: {
  apiUsageId: string;
  rating: number;
  feedbackText?: string | null;
  wasEdited?: boolean;
  wasUsed?: boolean;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('quality_metrics')
    .insert({
      api_usage_id: apiUsageId,
      user_id: user.id,
      user_rating: rating,
      user_feedback_text: feedbackText,
      was_edited: wasEdited,
      was_used: wasUsed
    })
    .select()
    .single();

  if (error) {
    console.error('Quality feedback error:', error);
    return null;
  }

  return data;
}

export default {
  useBudgetLimits,
  useAlerts,
  useOptimizationSuggestions,
  useCacheOpportunities,
  useProviderQuality,
  useForecasts,
  useABTests,
  useCampaignROI,
  submitQualityFeedback
};
