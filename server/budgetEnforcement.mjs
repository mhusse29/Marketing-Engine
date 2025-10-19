// ═══════════════════════════════════════════════════════════════
// BUDGET ENFORCEMENT & ALERTS - PHASE 1
// Middleware to check budget limits before API calls
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key (server-side only)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[BudgetEnforcement] Supabase credentials missing - budget enforcement disabled');
}

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Check if user has budget and can make this API call
 */
export async function checkBudgetLimit(userId, serviceType, estimatedCost) {
  if (!supabase) {
    return { allowed: true, has_budget: false }; // Fail open when disabled
  }

  try {
    const { data, error } = await supabase.rpc('check_budget_limit', {
      p_user_id: userId,
      p_service_type: serviceType,
      p_cost: estimatedCost
    });

    if (error) {
      console.error('[Budget] Check failed:', error);
      return { allowed: true, has_budget: false }; // Fail open
    }

    return data[0] || { allowed: true, has_budget: false };
  } catch (error) {
    console.error('[Budget] Exception:', error);
    return { allowed: true, has_budget: false }; // Fail open
  }
}

/**
 * Update budget spend after successful API call
 */
export async function updateBudgetSpend(userId, serviceType, actualCost) {
  if (!supabase) return;

  try {
    const { error } = await supabase.rpc('update_budget_spend', {
      p_user_id: userId,
      p_service_type: serviceType,
      p_cost: actualCost
    });

    if (error) {
      console.error('[Budget] Update failed:', error);
    }
  } catch (error) {
    console.error('[Budget] Update exception:', error);
  }
}

/**
 * Detect and alert on cost spikes
 */
export async function detectCostSpike(userId, hoursBack = 24) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc('detect_cost_spike', {
      p_user_id: userId,
      p_hours_back: hoursBack
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    const result = data[0];
    
    if (result.spike_detected) {
      // Create alert
      await createAlert({
        userId,
        alertType: 'cost_spike',
        severity: result.severity,
        title: '⚠️ Cost Spike Detected',
        message: `Your costs increased by ${result.percent_change}% in the last ${hoursBack} hours. Current: $${result.current_cost}, Previous: $${result.previous_cost}`,
        data: result
      });
    }

    return result;
  } catch (error) {
    console.error('[Budget] Spike detection failed:', error);
    return null;
  }
}

/**
 * Create alert in database
 */
export async function createAlert({ userId, alertType, severity, title, message, data }) {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('alert_history')
      .insert({
        user_id: userId,
        alert_type: alertType,
        severity,
        title,
        message,
        data
      });

    if (error) {
      console.error('[Alert] Creation failed:', error);
    }

    console.log(`[Alert] Created ${alertType} for user ${userId}`);
  } catch (error) {
    console.error('[Alert] Exception:', error);
  }
}

/**
 * Check performance degradation (high latency)
 */
export async function checkPerformanceDegradation(userId) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('api_usage')
      .select('latency_ms, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data || data.length < 10) {
      return null;
    }

    const avgLatency = data.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / data.length;
    const highLatencyCount = data.filter(r => (r.latency_ms || 0) > 2000).length;
    const highLatencyRate = highLatencyCount / data.length;

    if (avgLatency > 1500 || highLatencyRate > 0.3) {
      await createAlert({
        userId,
        alertType: 'performance_degradation',
        severity: avgLatency > 2000 ? 'critical' : 'warning',
        title: '🐌 Performance Degradation Detected',
        message: `Average latency: ${Math.round(avgLatency)}ms. ${Math.round(highLatencyRate * 100)}% of requests are slow.`,
        data: { avgLatency, highLatencyRate, sampleSize: data.length }
      });

      return { avgLatency, highLatencyRate };
    }

    return null;
  } catch (error) {
    console.error('[Performance] Check failed:', error);
    return null;
  }
}

/**
 * Check error rate
 */
export async function checkErrorRate(userId) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('api_usage')
      .select('status')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .limit(100);

    if (error || !data || data.length < 10) {
      return null;
    }

    const errorCount = data.filter(r => r.status !== 'success').length;
    const errorRate = errorCount / data.length;

    if (errorRate > 0.1) { // More than 10% errors
      await createAlert({
        userId,
        alertType: 'error_rate_high',
        severity: errorRate > 0.25 ? 'critical' : 'warning',
        title: '❌ High Error Rate Detected',
        message: `${Math.round(errorRate * 100)}% of recent requests failed (${errorCount}/${data.length})`,
        data: { errorRate, errorCount, totalRequests: data.length }
      });

      return { errorRate, errorCount };
    }

    return null;
  } catch (error) {
    console.error('[ErrorRate] Check failed:', error);
    return null;
  }
}

/**
 * Budget enforcement middleware for Express
 */
export function budgetEnforcementMiddleware(serviceType, estimateCostFn) {
  return async (req, res, next) => {
    const userId = req.userId || req.user?.id;
    
    if (!userId) {
      return next(); // Skip if no user
    }

    try {
      // Estimate cost based on request
      const estimatedCost = estimateCostFn ? estimateCostFn(req.body) : 0.01;

      // Check budget
      const budgetCheck = await checkBudgetLimit(userId, serviceType, estimatedCost);

      if (!budgetCheck.allowed) {
        return res.status(402).json({
          error: 'budget_exceeded',
          message: 'Budget limit reached. Please upgrade your plan or wait for the next billing period.',
          budget: {
            current: budgetCheck.current,
            limit: budgetCheck.limit,
            would_be: budgetCheck.would_be
          }
        });
      }

      // Add budget info to request for logging
      req.budgetInfo = budgetCheck;

      next();
    } catch (error) {
      console.error('[BudgetMiddleware] Error:', error);
      next(); // Fail open - don't block requests on middleware errors
    }
  };
}

/**
 * Run periodic checks (call this every 15 minutes)
 */
export async function runPeriodicChecks() {
  if (!supabase) {
    console.log('[PeriodicChecks] Disabled - Supabase not configured');
    return;
  }

  try {
    // Get active users from last 24 hours
    const { data: activeUsers, error } = await supabase
      .from('api_usage')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1000);

    if (error || !activeUsers) {
      console.log('[PeriodicChecks] No active users');
      return;
    }

    const uniqueUsers = [...new Set(activeUsers.map(u => u.user_id))];

    console.log(`[PeriodicChecks] Checking ${uniqueUsers.length} active users`);

    for (const userId of uniqueUsers) {
      // Run all checks
      await detectCostSpike(userId, 24);
      await checkPerformanceDegradation(userId);
      await checkErrorRate(userId);
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('[PeriodicChecks] Completed');
  } catch (error) {
    console.error('[PeriodicChecks] Error:', error);
  }
}

export default {
  checkBudgetLimit,
  updateBudgetSpend,
  detectCostSpike,
  createAlert,
  checkPerformanceDegradation,
  checkErrorRate,
  budgetEnforcementMiddleware,
  runPeriodicChecks
};
