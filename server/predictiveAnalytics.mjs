// ═══════════════════════════════════════════════════════════════
// PREDICTIVE ANALYTICS & A/B TESTING - PHASE 3
// Forecasting, A/B tests, ROI attribution, Model routing
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key (server-side only)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[PredictiveAnalytics] Supabase credentials missing - predictive analytics disabled');
}

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Generate usage and cost forecasts
 */
export async function generateForecasts(userId, daysAhead = 30) {
  if (!supabase) return [];

  try {
    const { error } = await supabase.rpc('generate_cost_forecast', {
      p_user_id: userId,
      p_days_ahead: daysAhead
    });

    if (error) {
      console.error('[Forecast] Generation failed:', error);
      return null;
    }

    // Fetch generated forecasts
    const { data: forecasts } = await supabase
      .from('usage_forecasts')
      .select('*')
      .eq('user_id', userId)
      .gte('forecast_date', new Date().toISOString().split('T')[0])
      .order('forecast_date', { ascending: true })
      .limit(daysAhead);

    return forecasts || [];
  } catch (error) {
    console.error('[Forecast] Exception:', error);
    return null;
  }
}

/**
 * Create A/B test
 */
export async function createABTest({
  userId,
  testName,
  serviceType,
  testPrompt,
  variantA,
  variantB,
  sampleSizeTarget = 30
}) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('ab_tests')
      .insert({
        user_id: userId,
        test_name: testName,
        test_type: 'provider_comparison',
        service_type: serviceType,
        test_prompt: testPrompt,
        variant_a_provider: variantA.provider,
        variant_a_model: variantA.model,
        variant_a_config: variantA.config,
        variant_b_provider: variantB.provider,
        variant_b_model: variantB.model,
        variant_b_config: variantB.config,
        sample_size_target: sampleSizeTarget,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('[ABTest] Creation failed:', error);
      return null;
    }

    console.log(`[ABTest] Created test: ${testName}`);
    return data;
  } catch (error) {
    console.error('[ABTest] Exception:', error);
    return null;
  }
}

/**
 * Record A/B test result
 */
export async function recordABTestResult({
  abTestId,
  apiUsageId,
  variant,
  cost,
  latencyMs,
  qualityScore,
  userPreference = null
}) {
  if (!supabase) return null;

  try {
    // Insert result
    const { error: insertError } = await supabase
      .from('ab_test_results')
      .insert({
        ab_test_id: abTestId,
        api_usage_id: apiUsageId,
        variant,
        cost,
        latency_ms: latencyMs,
        quality_score: qualityScore,
        user_preference: userPreference
      });

    if (insertError) {
      console.error('[ABTest] Result recording failed:', insertError);
      return;
    }

    // Update test aggregates
    const updateField = variant === 'variant_a' ? {
      variant_a_requests: await incrementField(abTestId, 'variant_a_requests'),
      sample_size_current: await incrementField(abTestId, 'sample_size_current')
    } : {
      variant_b_requests: await incrementField(abTestId, 'variant_b_requests'),
      sample_size_current: await incrementField(abTestId, 'sample_size_current')
    };

    // Recalculate averages
    await recalculateABTestMetrics(abTestId);

    // Check if test is complete
    const { data: test } = await supabase
      .from('ab_tests')
      .select('sample_size_current, sample_size_target')
      .eq('id', abTestId)
      .single();

    if (test && test.sample_size_current >= test.sample_size_target) {
      await supabase.rpc('determine_ab_test_winner', {
        p_ab_test_id: abTestId
      });
    }
  } catch (error) {
    console.error('[ABTest] Exception:', error);
  }
}

/**
 * Helper to increment a field
 */
async function incrementField(testId, fieldName) {
  if (!supabase) return null;

  const { data } = await supabase
    .from('ab_tests')
    .select(fieldName)
    .eq('id', testId)
    .single();
  
  const currentValue = data?.[fieldName] || 0;
  
  await supabase
    .from('ab_tests')
    .update({ [fieldName]: currentValue + 1 })
    .eq('id', testId);
  
  return currentValue + 1;
}

/**
 * Recalculate A/B test metrics
 */
async function recalculateABTestMetrics(abTestId) {
  if (!supabase) return null;

  try {
    const { data: results } = await supabase
      .from('ab_test_results')
      .select('*')
      .eq('ab_test_id', abTestId);

    if (!results || results.length === 0) return;

    const variantA = results.filter(r => r.variant === 'variant_a');
    const variantB = results.filter(r => r.variant === 'variant_b');

    const calcAvg = (arr, field) => arr.length > 0 
      ? arr.reduce((sum, r) => sum + (r[field] || 0), 0) / arr.length 
      : 0;

    await supabase
      .from('ab_tests')
      .update({
        variant_a_avg_cost: calcAvg(variantA, 'cost'),
        variant_a_avg_latency: calcAvg(variantA, 'latency_ms'),
        variant_a_avg_quality: calcAvg(variantA, 'quality_score'),
        variant_b_avg_cost: calcAvg(variantB, 'cost'),
        variant_b_avg_latency: calcAvg(variantB, 'latency_ms'),
        variant_b_avg_quality: calcAvg(variantB, 'quality_score')
      })
      .eq('id', abTestId);
  } catch (error) {
    console.error('[ABTest] Metric recalculation failed:', error);
  }
}

/**
 * Record campaign outcome for ROI tracking
 */
export async function recordCampaignOutcome({
  campaignId,
  apiUsageId,
  userId,
  outcomeType,
  outcomeValue,
  outcomeCount = 1,
  platform = null,
  contentType = null
}) {
  if (!supabase) return null;

  try {
    // Get API usage cost
    const { data: apiUsage } = await supabase
      .from('api_usage')
      .select('total_cost')
      .eq('id', apiUsageId)
      .single();

    const attributedCost = apiUsage?.total_cost || 0;
    const roi = attributedCost > 0 ? outcomeValue / attributedCost : 0;
    const roiPercentage = attributedCost > 0 ? ((outcomeValue - attributedCost) / attributedCost) * 100 : 0;

    const { error } = await supabase
      .from('campaign_outcomes')
      .insert({
        campaign_id: campaignId,
        api_usage_id: apiUsageId,
        user_id: userId,
        outcome_type: outcomeType,
        outcome_value: outcomeValue,
        outcome_count: outcomeCount,
        attributed_cost: attributedCost,
        roi,
        roi_percentage: roiPercentage,
        platform,
        content_type: contentType
      });

    if (error) {
      console.error('[ROI] Outcome recording failed:', error);
      return null;
    }

    console.log(`[ROI] Recorded ${outcomeType}: $${outcomeValue} (ROI: ${roi.toFixed(2)}x)`);
    return { roi, roiPercentage };
  } catch (error) {
    console.error('[ROI] Exception:', error);
    return null;
  }
}

/**
 * Get campaign ROI summary
 */
export async function getCampaignROI(campaignId) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc('get_campaign_roi_summary', {
      p_campaign_id: campaignId
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('[ROI] Summary fetch failed:', error);
    return null;
  }
}

/**
 * Intelligent model router - select best model for request
 */
export async function selectOptimalModel({
  userId,
  serviceType,
  promptText,
  qualityRequirement = 'standard',
  speedRequirement = 'normal',
  costConstraint = null
}) {
  try {
    // Get routing rules for user
    const { data: rules } = await supabase
      .from('model_routing_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    // Analyze prompt
    const promptLength = promptText?.length || 0;
    const wordCount = promptText?.split(/\s+/).length || 0;
    
    // Determine complexity
    let complexity = 'simple';
    if (wordCount > 200 || promptLength > 1000) {
      complexity = 'complex';
    } else if (wordCount > 50 || promptLength > 250) {
      complexity = 'medium';
    }

    // Find matching rule
    for (const rule of rules || []) {
      // Check all conditions
      if (rule.service_type && rule.service_type !== serviceType) continue;
      if (rule.prompt_length_min && promptLength < rule.prompt_length_min) continue;
      if (rule.prompt_length_max && promptLength > rule.prompt_length_max) continue;
      if (rule.complexity_level && rule.complexity_level !== complexity) continue;
      if (rule.quality_requirement && rule.quality_requirement !== qualityRequirement) continue;
      if (rule.speed_requirement && rule.speed_requirement !== speedRequirement) continue;
      
      // Rule matches!
      return {
        provider: rule.target_provider,
        model: rule.target_model,
        reason: `Matched rule: ${rule.rule_name}`,
        complexity
      };
    }

    // Default routing logic
    return getDefaultRoute(serviceType, complexity, qualityRequirement);
  } catch (error) {
    console.error('[ModelRouter] Selection failed:', error);
    return getDefaultRoute(serviceType, 'medium', qualityRequirement);
  }
}

/**
 * Default routing fallback
 */
function getDefaultRoute(serviceType, complexity, qualityRequirement) {
  if (serviceType === 'content') {
    if (qualityRequirement === 'premium' || complexity === 'complex') {
      return { provider: 'openai', model: 'gpt-5', reason: 'Premium quality/complex prompt' };
    }
    return { provider: 'openai', model: 'gpt-4o', reason: 'Standard quality/simple prompt' };
  }
  
  if (serviceType === 'images') {
    if (qualityRequirement === 'premium') {
      return { provider: 'ideogram', model: 'v2', reason: 'Premium image quality' };
    }
    return { provider: 'flux', model: 'standard', reason: 'Standard image quality' };
  }
  
  if (serviceType === 'video') {
    return { provider: 'luma', model: 'ray-2', reason: 'Cost-effective video' };
  }
  
  return { provider: 'openai', model: 'gpt-4o', reason: 'Default fallback' };
}

/**
 * Run daily predictive analysis
 */
export async function runDailyPredictiveAnalysis() {
  if (!supabase) {
    console.log('[PredictiveAnalysis] Disabled - Supabase not configured');
    return;
  }

  try {
    console.log('[PredictiveAnalysis] Starting daily analysis...');

    // Get active users
    const { data: activeUsers, error } = await supabase
      .from('api_usage')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1000);

    if (error || !activeUsers) {
      console.log('[PredictiveAnalysis] No active users');
      return;
    }

    const uniqueUsers = [...new Set(activeUsers.map(u => u.user_id))];

    for (const userId of uniqueUsers) {
      // Generate forecasts
      await generateForecasts(userId, 30);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('[PredictiveAnalysis] Completed for', uniqueUsers.length, 'users');
  } catch (error) {
    console.error('[PredictiveAnalysis] Error:', error);
  }
}

export default {
  generateForecasts,
  createABTest,
  recordABTestResult,
  recordCampaignOutcome,
  getCampaignROI,
  selectOptimalModel,
  runDailyPredictiveAnalysis
};
