// ═══════════════════════════════════════════════════════════════
// QUALITY TRACKING & COST OPTIMIZATION - PHASE 2
// Track quality metrics and generate optimization suggestions
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key (server-side only)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[QualityTracking] Supabase credentials missing - quality tracking disabled');
}

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Record quality metrics for an API call
 */
export async function recordQualityMetrics({
  apiUsageId,
  userId,
  userRating = null,
  userFeedbackText = null,
  wasEdited = false,
  editPercentage = null,
  wasUsed = null,
  regenerationCount = 0,
  timeToFeedbackSeconds = null,
  useCase = null
}) {
  if (!supabase) return null;

  try {
    // Calculate quality score
    const { data: scoreData } = await supabase.rpc('calculate_quality_score', {
      p_user_rating: userRating,
      p_was_edited: wasEdited,
      p_edit_percentage: editPercentage,
      p_was_used: wasUsed,
      p_regeneration_count: regenerationCount
    });

    const qualityScore = scoreData?.[0] || 50;

    const { error } = await supabase
      .from('quality_metrics')
      .insert({
        api_usage_id: apiUsageId,
        user_id: userId,
        user_rating: userRating,
        user_feedback_text: userFeedbackText,
        was_edited: wasEdited,
        edit_percentage: editPercentage,
        was_used: wasUsed,
        regeneration_count: regenerationCount,
        time_to_feedback_seconds: timeToFeedbackSeconds,
        quality_score: qualityScore,
        use_case: useCase
      });

    if (error) {
      console.error('[Quality] Metrics recording failed:', error);
      return null;
    }

    console.log(`[Quality] Recorded score ${qualityScore} for ${apiUsageId}`);
    return qualityScore;
  } catch (error) {
    console.error('[Quality] Exception:', error);
    return null;
  }
}

/**
 * Analyze prompts for caching opportunities
 */
export async function analyzeCachingOpportunities(userId, serviceType = 'content') {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc('find_cacheable_prompts', {
      p_user_id: userId,
      p_service_type: serviceType,
      p_min_frequency: 3,
      p_days_back: 30
    });

    if (error || !data || data.length === 0) {
      return [];
    }

    // Store in cache_analysis table
    for (const pattern of data) {
      const promptHash = hashPrompt(pattern.prompt_pattern);
      
      await supabase
        .from('cache_analysis')
        .upsert({
          user_id: userId,
          service_type: serviceType,
          prompt_hash: promptHash,
          prompt_pattern: pattern.prompt_pattern,
          similar_prompts_count: pattern.occurrence_count,
          total_cost: pattern.total_cost,
          potential_savings: pattern.potential_savings,
          sample_prompt: pattern.sample_prompt,
          should_cache: pattern.potential_savings > 5, // Cache if saves >$5
          cache_priority: Math.min(10, Math.floor(pattern.potential_savings / 10)),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'prompt_hash'
        });
    }

    return data;
  } catch (error) {
    console.error('[Caching] Analysis failed:', error);
    return [];
  }
}

/**
 * Generate cost optimization suggestions
 */
export async function generateOptimizationSuggestions(userId) {
  if (!supabase) return;

  try {
    // Use database function to generate suggestions
    const { error } = await supabase.rpc('generate_cost_suggestions', {
      p_user_id: userId
    });

    if (error) {
      console.error('[Optimization] Generation failed:', error);
      return [];
    }

    // Fetch active suggestions
    const { data: suggestions } = await supabase
      .from('cost_optimization_suggestions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('estimated_monthly_savings', { ascending: false });

    return suggestions || [];
  } catch (error) {
    console.error('[Optimization] Exception:', error);
    return [];
  }
}

/**
 * Update provider quality scores
 */
export async function updateProviderQualityScores(userId) {
  if (!supabase) return;

  try {
    // Get quality metrics from last 30 days
    const { data: metrics, error } = await supabase
      .from('quality_metrics')
      .select(`
        *,
        api_usage:api_usage_id (
          provider,
          model,
          service_type,
          total_cost,
          latency_ms,
          status
        )
      `)
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error || !metrics || metrics.length === 0) {
      return;
    }

    // Group by provider/model
    const grouped = {};
    
    for (const metric of metrics) {
      if (!metric.api_usage) continue;
      
      const key = `${metric.api_usage.provider}-${metric.api_usage.model || 'default'}-${metric.api_usage.service_type}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          provider: metric.api_usage.provider,
          model: metric.api_usage.model,
          service_type: metric.api_usage.service_type,
          metrics: []
        };
      }
      
      grouped[key].metrics.push({
        quality: metric.quality_score,
        rating: metric.user_rating,
        cost: metric.api_usage.total_cost,
        latency: metric.api_usage.latency_ms,
        success: metric.api_usage.status === 'success'
      });
    }

    // Calculate aggregates and upsert
    for (const [key, group] of Object.entries(grouped)) {
      const totalRequests = group.metrics.length;
      const avgQuality = group.metrics.reduce((sum, m) => sum + (m.quality || 50), 0) / totalRequests;
      const avgRating = group.metrics.filter(m => m.rating !== null).reduce((sum, m) => sum + m.rating, 0) / 
                        Math.max(1, group.metrics.filter(m => m.rating !== null).length);
      const successRate = group.metrics.filter(m => m.success).length / totalRequests;
      const avgLatency = group.metrics.reduce((sum, m) => sum + (m.latency || 0), 0) / totalRequests;
      const avgCost = group.metrics.reduce((sum, m) => sum + m.cost, 0) / totalRequests;
      const qualityPerDollar = avgCost > 0 ? avgQuality / avgCost : 0;

      await supabase
        .from('provider_quality_scores')
        .upsert({
          user_id: userId,
          service_type: group.service_type,
          provider: group.provider,
          model: group.model,
          total_requests: totalRequests,
          avg_quality_score: avgQuality,
          avg_user_rating: avgRating,
          success_rate: successRate,
          avg_latency_ms: avgLatency,
          avg_cost_per_request: avgCost,
          quality_per_dollar: qualityPerDollar,
          calculated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,service_type,provider,model'
        });
    }

    console.log(`[Quality] Updated scores for ${Object.keys(grouped).length} provider/model combinations`);
  } catch (error) {
    console.error('[Quality] Score update failed:', error);
  }
}

/**
 * Simple prompt hashing function
 */
function hashPrompt(prompt) {
  if (!prompt) return 'empty';
  
  // Simple hash - normalize and take first 100 chars
  const normalized = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .substring(0, 100);
  
  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Run daily quality analysis (call once per day)
 */
export async function runDailyQualityAnalysis() {
  if (!supabase) {
    console.log('[QualityAnalysis] Disabled - Supabase not configured');
    return;
  }

  try {
    console.log('[QualityAnalysis] Starting daily analysis...');

    // Get users with activity in last 30 days
    const { data: activeUsers, error } = await supabase
      .from('api_usage')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1000);

    if (error || !activeUsers) {
      console.log('[QualityAnalysis] No active users');
      return;
    }

    const uniqueUsers = [...new Set(activeUsers.map(u => u.user_id))];

    for (const userId of uniqueUsers) {
      // Run all analyses
      await updateProviderQualityScores(userId);
      await generateOptimizationSuggestions(userId);
      await analyzeCachingOpportunities(userId, 'content');
      await analyzeCachingOpportunities(userId, 'images');
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('[QualityAnalysis] Completed for', uniqueUsers.length, 'users');
  } catch (error) {
    console.error('[QualityAnalysis] Error:', error);
  }
}

export default {
  recordQualityMetrics,
  analyzeCachingOpportunities,
  generateOptimizationSuggestions,
  updateProviderQualityScores,
  runDailyQualityAnalysis
};
