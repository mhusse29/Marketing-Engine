/**
 * USAGE TRACKER - Server-side tracking for all API calls
 * Tracks costs, tokens, performance, and enforces limits (demo: very high limits)
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key (server-side only)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[UsageTracker] Supabase credentials missing - tracking disabled');
}

const supabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// =====================================================
// PRICING CONSTANTS (October 2025)
// =====================================================

const PRICING = {
  // OpenAI Models (per 1M tokens)
  openai: {
    'gpt-5': { input: 2.50, output: 10.00 },
    'gpt-5-chat-latest': { input: 2.50, output: 10.00 },
    'gpt-4o': { input: 0.25, output: 1.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 }
  },
  
  // Image Providers (per image)
  images: {
    'openai': { standard: 0.040, hd: 0.080, hd_large: 0.120 },
    'flux': { standard: 0.045, ultra: 0.060 },
    'stability': { base: 0.035 },
    'ideogram': { base: 0.080, magic: 0.090 }
  },
  
  // Video Providers (per second)
  video: {
    'runway': 0.05,
    'luma': 0.02
  }
};

// =====================================================
// COST CALCULATION HELPERS
// =====================================================

/**
 * Calculate cost for OpenAI text models
 */
export function calculateOpenAICost(inputTokens, outputTokens, model) {
  const rates = PRICING.openai[model] || PRICING.openai['gpt-4o'];
  
  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;
  
  return {
    inputCost: Number(inputCost.toFixed(6)),
    outputCost: Number(outputCost.toFixed(6)),
    totalCost: Number((inputCost + outputCost).toFixed(6))
  };
}

/**
 * Calculate cost for image generation
 */
export function calculateImageCost(provider, quality, count = 1) {
  const pricing = PRICING.images[provider];
  if (!pricing) return count * 0.040; // Default fallback
  
  const rate = pricing[quality] || pricing.base || pricing.standard || 0.040;
  return Number((rate * count).toFixed(6));
}

/**
 * Calculate cost for video generation
 */
export function calculateVideoCost(provider, durationSeconds) {
  const rate = PRICING.video[provider] || 0.05;
  return Number((durationSeconds * rate).toFixed(6));
}

/**
 * Estimate tokens from text (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// =====================================================
// USAGE TRACKING FUNCTIONS
// =====================================================

/**
 * Track API usage in database
 */
export async function trackAPIUsage({
  userId,
  serviceType,
  provider,
  model,
  endpoint,
  requestId = null,
  requestData = null,
  responseData = null,
  inputTokens = 0,
  outputTokens = 0,
  imagesGenerated = 0,
  videoSeconds = 0,
  inputCost = 0,
  outputCost = 0,
  generationCost = 0,
  totalCost = 0,
  latency = 0,
  status = 'success',
  errorMessage = null,
  ipAddress = null,
  userAgent = null,
  campaignId = null
}) {
  if (!supabase) {
    console.warn('[UsageTracker] Tracking disabled - Supabase not configured');
    return null;
  }

  try {
    // Sanitize data (remove sensitive info)
    const sanitizedRequest = sanitizeData(requestData);
    const sanitizedResponse = sanitizeData(responseData);

    // Insert usage record
    const { data: usageRecord, error: usageError } = await supabase
      .from('api_usage')
      .insert({
        user_id: userId,
        service_type: serviceType,
        provider,
        model,
        endpoint,
        request_id: requestId,
        request_data: sanitizedRequest,
        response_data: sanitizedResponse,
        input_tokens: inputTokens || null,
        output_tokens: outputTokens || null,
        total_tokens: (inputTokens || 0) + (outputTokens || 0) || null,
        images_generated: imagesGenerated || 0,
        video_seconds: videoSeconds || 0,
        input_cost: inputCost || 0,
        output_cost: outputCost || 0,
        generation_cost: generationCost || 0,
        total_cost: totalCost,
        latency_ms: latency || null,
        status,
        error_message: errorMessage,
        ip_address: ipAddress,
        user_agent: userAgent,
        campaign_id: campaignId
      })
      .select()
      .single();

    if (usageError) {
      console.error('[UsageTracker] Insert error:', usageError);
      return null;
    }

    // Update subscription usage asynchronously (don't block)
    updateSubscriptionUsage(userId, serviceType, totalCost).catch(err => {
      console.error('[UsageTracker] Update subscription error:', err);
    });

    // Check limits and send alerts if needed (async, don't block)
    checkUsageLimits(userId, serviceType).catch(err => {
      console.error('[UsageTracker] Check limits error:', err);
    });

    return usageRecord;
  } catch (error) {
    console.error('[UsageTracker] Tracking error:', error);
    // Don't fail the request if tracking fails
    return null;
  }
}

/**
 * Update user subscription usage counters
 */
async function updateSubscriptionUsage(userId, serviceType, cost) {
  if (!supabase) return;

  try {
    await supabase.rpc('increment_subscription_usage', {
      p_user_id: userId,
      p_service_type: serviceType,
      p_cost: cost
    });
  } catch (error) {
    console.error('[UsageTracker] Update subscription error:', error);
  }
}

/**
 * Check if user has exceeded usage limits
 */
export async function checkUsageLimit(userId, serviceType) {
  if (!supabase) return false; // No limits in demo mode without DB

  try {
    const { data, error } = await supabase.rpc('check_usage_limit', {
      p_user_id: userId,
      p_service_type: serviceType
    });

    if (error) {
      console.error('[UsageTracker] Check limit error:', error);
      return false; // Allow on error
    }

    return data || false;
  } catch (error) {
    console.error('[UsageTracker] Check limit error:', error);
    return false; // Allow on error
  }
}

/**
 * Check usage limits and create alerts if thresholds reached
 */
async function checkUsageLimits(userId, serviceType) {
  if (!supabase) return;

  try {
    // Get user subscription
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) return;

    // Check each resource type
    const checks = [
      {
        type: 'content',
        used: subscription.content_generations_used,
        limit: subscription.content_generations_limit
      },
      {
        type: 'images',
        used: subscription.image_generations_used,
        limit: subscription.image_generations_limit
      },
      {
        type: 'video',
        used: subscription.video_generations_used,
        limit: subscription.video_generations_limit
      },
      {
        type: 'chat',
        used: subscription.chat_messages_used,
        limit: subscription.chat_messages_limit
      },
      {
        type: 'cost',
        used: subscription.current_month_cost,
        limit: subscription.monthly_cost_limit
      }
    ];

    for (const check of checks) {
      if (!check.limit) continue; // Skip if no limit set
      
      const percentage = (check.used / check.limit) * 100;
      
      // Create alerts at 80%, 90%, 100%
      if (percentage >= 80 && subscription.usage_alerts_enabled) {
        await createUsageAlert(userId, check, percentage);
      }
    }
  } catch (error) {
    console.error('[UsageTracker] Check limits error:', error);
  }
}

/**
 * Create usage alert
 */
async function createUsageAlert(userId, check, percentage) {
  if (!supabase) return;

  try {
    const severity = percentage >= 100 ? 'critical' : percentage >= 90 ? 'warning' : 'info';
    const message = percentage >= 100
      ? `You've reached your ${check.type} limit (${check.used}/${check.limit})`
      : `You've used ${percentage.toFixed(0)}% of your ${check.type} limit (${check.used}/${check.limit})`;

    // Check if similar alert already exists (within last hour)
    const { data: existingAlerts } = await supabase
      .from('usage_alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('resource_type', check.type)
      .eq('is_resolved', false)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .limit(1);

    if (existingAlerts && existingAlerts.length > 0) {
      return; // Alert already exists
    }

    // Create new alert
    await supabase.from('usage_alerts').insert({
      user_id: userId,
      alert_type: 'usage_threshold',
      threshold_type: 'percentage',
      threshold_value: percentage,
      current_value: check.used,
      limit_value: check.limit,
      resource_type: check.type,
      severity,
      message
    });
  } catch (error) {
    console.error('[UsageTracker] Create alert error:', error);
  }
}

/**
 * Get user's current usage statistics
 */
export async function getUserUsage(userId) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[UsageTracker] Get usage error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[UsageTracker] Get usage error:', error);
    return null;
  }
}

/**
 * Get user's recent usage history
 */
export async function getUserUsageHistory(userId, limit = 50) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('api_usage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[UsageTracker] Get history error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[UsageTracker] Get history error:', error);
    return [];
  }
}

/**
 * Get user's usage aggregations
 */
export async function getUserAggregations(userId, periodType = 'daily', limit = 30) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('usage_aggregations')
      .select('*')
      .eq('user_id', userId)
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[UsageTracker] Get aggregations error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[UsageTracker] Get aggregations error:', error);
    return [];
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Sanitize data to remove sensitive information
 */
function sanitizeData(data) {
  if (!data) return null;
  
  // Create a copy
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Remove sensitive fields
  const sensitiveFields = [
    'api_key', 'apiKey', 'token', 'password', 'secret',
    'authorization', 'auth', 'key', 'credentials'
  ];
  
  function removeSensitiveFields(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        removeSensitiveFields(obj[key]);
      }
    }
  }
  
  removeSensitiveFields(sanitized);
  return sanitized;
}

/**
 * Extract user ID from request (helper for middleware)
 */
export function extractUserId(req) {
  // Try to get from various sources
  return req.userId || req.user?.id || req.auth?.userId || null;
}

/**
 * Extract IP address from request
 */
export function extractIPAddress(req) {
  return req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         null;
}

/**
 * Extract user agent from request
 */
export function extractUserAgent(req) {
  return req.headers['user-agent'] || null;
}

// =====================================================
// EXPORT ALL
// =====================================================

export default {
  trackAPIUsage,
  checkUsageLimit,
  getUserUsage,
  getUserUsageHistory,
  getUserAggregations,
  calculateOpenAICost,
  calculateImageCost,
  calculateVideoCost,
  estimateTokens,
  extractUserId,
  extractIPAddress,
  extractUserAgent
};
