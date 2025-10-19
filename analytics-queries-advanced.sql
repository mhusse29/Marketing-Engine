-- =====================================================
-- ADVANCED ANALYTICS QUERIES
-- 30+ Additional queries beyond the basic 10
-- Run these for comprehensive dashboard insights
-- =====================================================

-- =====================================================
-- SECTION 11: LATENCY & PERFORMANCE ANALYSIS
-- =====================================================

-- Latency percentiles by service and provider
SELECT 
  service_type,
  provider,
  COUNT(*) as sample_size,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) as p50_latency_ms,
  ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) as p90_latency_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) as p95_latency_ms,
  ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) as p99_latency_ms
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND status = 'success'
  AND latency_ms IS NOT NULL
GROUP BY service_type, provider
ORDER BY p95_latency_ms DESC;

-- Real-time performance (last hour)
SELECT 
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) as requests,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
  ROUND(100.0 * COUNT(CASE WHEN status = 'error' THEN 1 END) / COUNT(*), 2) as error_rate_pct,
  ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms,
  ROUND(SUM(total_cost)::numeric, 4) as total_cost
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY DATE_TRUNC('minute', created_at)
ORDER BY minute DESC;

-- =====================================================
-- SECTION 12: PROVIDER RELIABILITY COMPARISON
-- =====================================================

-- Provider reliability scorecard
SELECT 
  provider,
  service_type,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
  ROUND(100.0 * COUNT(CASE WHEN status = 'success' THEN 1 END) / COUNT(*), 2) as success_rate_pct,
  ROUND(AVG(CASE WHEN status = 'success' THEN latency_ms END)::numeric, 0) as avg_success_latency_ms,
  ROUND(AVG(total_cost)::numeric, 4) as avg_cost,
  ROUND(AVG(CASE WHEN status = 'success' THEN total_cost END) / 
    NULLIF(AVG(CASE WHEN status = 'success' THEN latency_ms END), 0) * 1000, 6) as cost_per_second
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY provider, service_type
ORDER BY success_rate_pct DESC, avg_success_latency_ms ASC;

-- =====================================================
-- SECTION 13: TOKEN EFFICIENCY ANALYSIS
-- =====================================================

-- Token efficiency by service and model
SELECT 
  service_type,
  provider,
  model,
  COUNT(*) as uses,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  ROUND(AVG(output_tokens::float / NULLIF(input_tokens, 0)), 2) as avg_output_input_ratio,
  ROUND((SUM(total_cost) / NULLIF(SUM(total_tokens), 0))::numeric, 6) as cost_per_token,
  ROUND(AVG(total_cost)::numeric, 4) as avg_cost
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND status = 'success'
  AND total_tokens > 0
GROUP BY service_type, provider, model
ORDER BY uses DESC;

-- =====================================================
-- SECTION 14: REAL-TIME HEALTH DASHBOARD
-- =====================================================

-- System health score (last hour)
WITH hourly_stats AS (
  SELECT 
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
    AVG(latency_ms) as avg_latency,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency
  FROM api_usage
  WHERE created_at >= NOW() - INTERVAL '1 hour'
)
SELECT 
  total_requests,
  successful_requests,
  ROUND(100.0 * successful_requests / NULLIF(total_requests, 0), 2) as uptime_pct,
  ROUND(avg_latency::numeric, 0) as avg_latency_ms,
  ROUND(p95_latency::numeric, 0) as p95_latency_ms,
  -- Health score: uptime% * speed_factor (normalized latency)
  ROUND(
    (100.0 * successful_requests / NULLIF(total_requests, 0)) * 
    (1.0 / (1.0 + p95_latency / 1000.0))
  , 2) as health_score
FROM hourly_stats;

-- Current active users (last 5 minutes)
SELECT 
  COUNT(DISTINCT user_id) as active_users_now,
  COUNT(*) as requests_last_5min,
  ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '5 minutes';

-- =====================================================
-- SECTION 15: REVENUE & FINANCIAL METRICS
-- =====================================================

-- Revenue metrics by plan
SELECT 
  plan_name,
  COUNT(*) as total_subscribers,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_subscribers,
  ROUND(AVG(current_month_cost)::numeric, 2) as avg_monthly_cost,
  ROUND(SUM(current_month_cost)::numeric, 2) as total_monthly_revenue,
  ROUND(AVG(lifetime_cost)::numeric, 2) as avg_lifetime_value,
  ROUND(SUM(lifetime_cost)::numeric, 2) as total_lifetime_revenue,
  COUNT(CASE WHEN auto_renew = true THEN 1 END) as auto_renew_count,
  ROUND(100.0 * COUNT(CASE WHEN auto_renew = true THEN 1 END) / NULLIF(COUNT(*), 0), 1) as auto_renew_pct
FROM user_subscriptions
GROUP BY plan_name
ORDER BY total_monthly_revenue DESC;

-- Cost efficiency by user
SELECT 
  u.user_id,
  s.plan_name,
  COUNT(*) as api_calls,
  ROUND(SUM(u.total_cost)::numeric, 2) as total_cost,
  ROUND(s.current_month_cost::numeric, 2) as subscription_revenue,
  ROUND((s.current_month_cost - SUM(u.total_cost))::numeric, 2) as margin,
  ROUND(100.0 * (s.current_month_cost - SUM(u.total_cost)) / NULLIF(s.current_month_cost, 0), 1) as margin_pct
FROM api_usage u
JOIN user_subscriptions s ON u.user_id = s.user_id
WHERE u.created_at >= NOW() - INTERVAL '30 days'
  AND s.is_active = true
GROUP BY u.user_id, s.plan_name, s.current_month_cost
ORDER BY margin DESC
LIMIT 20;

-- =====================================================
-- SECTION 16: GEOGRAPHIC ANALYTICS
-- =====================================================

-- User distribution by country (from IP addresses)
-- Note: Requires IP geolocation lookup
SELECT 
  ip_address,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_requests,
  ROUND(SUM(total_cost)::numeric, 2) as total_cost,
  ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND ip_address IS NOT NULL
GROUP BY ip_address
ORDER BY total_requests DESC
LIMIT 50;

-- =====================================================
-- SECTION 17: DEVICE & BROWSER ANALYTICS
-- =====================================================

-- User agent analysis (requires parsing)
SELECT 
  user_agent,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_requests,
  ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND user_agent IS NOT NULL
GROUP BY user_agent
ORDER BY total_requests DESC
LIMIT 20;

-- =====================================================
-- SECTION 18: ANOMALY DETECTION
-- =====================================================

-- Detect unusual cost spikes (3x+ normal)
WITH user_avg_cost AS (
  SELECT 
    user_id,
    AVG(total_cost) as avg_cost,
    STDDEV(total_cost) as stddev_cost
  FROM api_usage
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id
)
SELECT 
  a.user_id,
  a.created_at,
  a.service_type,
  a.provider,
  ROUND(a.total_cost::numeric, 4) as cost,
  ROUND(u.avg_cost::numeric, 4) as user_avg_cost,
  ROUND((a.total_cost / NULLIF(u.avg_cost, 0))::numeric, 1) as cost_multiplier,
  ROUND(((a.total_cost - u.avg_cost) / NULLIF(u.stddev_cost, 0))::numeric, 2) as z_score
FROM api_usage a
JOIN user_avg_cost u ON a.user_id = u.user_id
WHERE a.created_at >= NOW() - INTERVAL '24 hours'
  AND a.total_cost > u.avg_cost * 3
  AND u.avg_cost > 0
ORDER BY cost_multiplier DESC
LIMIT 20;

-- Detect unusual activity patterns (off-hours usage)
SELECT 
  user_id,
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  COUNT(*) as requests,
  ROUND(SUM(total_cost)::numeric, 2) as total_cost
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND EXTRACT(HOUR FROM created_at) BETWEEN 0 AND 5  -- Late night/early morning
GROUP BY user_id, EXTRACT(HOUR FROM created_at)
HAVING COUNT(*) > 50  -- Significant activity
ORDER BY requests DESC;

-- =====================================================
-- SECTION 19: USER LIFECYCLE & RFM ANALYSIS
-- =====================================================

-- RFM (Recency, Frequency, Monetary) segmentation
WITH user_rfm AS (
  SELECT 
    user_id,
    EXTRACT(DAY FROM NOW() - MAX(created_at)) as recency_days,
    COUNT(*) as frequency,
    SUM(total_cost) as monetary_value
  FROM api_usage
  WHERE created_at >= NOW() - INTERVAL '90 days'
  GROUP BY user_id
),
rfm_scores AS (
  SELECT 
    user_id,
    recency_days,
    frequency,
    monetary_value,
    NTILE(5) OVER (ORDER BY recency_days ASC) as r_score,
    NTILE(5) OVER (ORDER BY frequency DESC) as f_score,
    NTILE(5) OVER (ORDER BY monetary_value DESC) as m_score
  FROM user_rfm
)
SELECT 
  user_id,
  recency_days,
  frequency,
  ROUND(monetary_value::numeric, 2) as monetary_value,
  r_score,
  f_score,
  m_score,
  (r_score + f_score + m_score) as rfm_total,
  CASE 
    WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
    WHEN r_score >= 3 AND f_score >= 3 AND m_score >= 3 THEN 'Loyal Customers'
    WHEN r_score >= 4 AND f_score <= 2 THEN 'Promising'
    WHEN r_score <= 2 AND f_score >= 3 THEN 'At Risk'
    WHEN r_score <= 2 AND f_score <= 2 THEN 'Lost'
    ELSE 'Regular'
  END as customer_segment
FROM rfm_scores
ORDER BY rfm_total DESC;

-- =====================================================
-- SECTION 20: FEATURE CORRELATION MATRIX
-- =====================================================

-- Which features are used together?
WITH user_features AS (
  SELECT 
    user_id,
    service_type,
    COUNT(*) as uses
  FROM api_usage
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_id, service_type
)
SELECT 
  f1.service_type as feature_1,
  f2.service_type as feature_2,
  COUNT(DISTINCT f1.user_id) as users_using_both,
  ROUND(AVG(f1.uses + f2.uses)::numeric, 1) as avg_combined_uses
FROM user_features f1
JOIN user_features f2 ON f1.user_id = f2.user_id
WHERE f1.service_type < f2.service_type  -- Avoid duplicates
GROUP BY f1.service_type, f2.service_type
HAVING COUNT(DISTINCT f1.user_id) >= 5
ORDER BY users_using_both DESC
LIMIT 20;

-- =====================================================
-- SECTION 21: PREDICTIVE CHURN SCORING
-- =====================================================

-- Churn risk score (based on declining usage + errors + approaching limits)
WITH user_metrics AS (
  SELECT 
    user_id,
    EXTRACT(DAY FROM NOW() - MAX(created_at)) as days_inactive,
    COUNT(*) as total_calls,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as calls_last_7d,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days' THEN 1 END) as calls_prev_7d,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as total_errors,
    SUM(total_cost) as lifetime_cost
  FROM api_usage
  GROUP BY user_id
),
user_limits AS (
  SELECT 
    user_id,
    plan_name,
    GREATEST(
      100.0 * content_generations_used / NULLIF(content_generations_limit, 0),
      100.0 * image_generations_used / NULLIF(image_generations_limit, 0),
      100.0 * video_generations_used / NULLIF(video_generations_limit, 0)
    ) as max_limit_usage_pct
  FROM user_subscriptions
  WHERE is_active = true
)
SELECT 
  m.user_id,
  l.plan_name,
  m.days_inactive,
  m.calls_last_7d,
  m.calls_prev_7d,
  ROUND((m.calls_last_7d::float / NULLIF(m.calls_prev_7d, 1) - 1) * 100, 1) as usage_change_pct,
  m.total_errors,
  ROUND(l.max_limit_usage_pct::numeric, 1) as limit_usage_pct,
  ROUND(m.lifetime_cost::numeric, 2) as lifetime_cost,
  -- Churn score (0-100, higher = more risk)
  LEAST(100, GREATEST(0,
    (m.days_inactive * 5) +  -- Inactivity penalty
    (CASE WHEN m.calls_last_7d < m.calls_prev_7d THEN 20 ELSE 0 END) +  -- Declining usage
    (m.total_errors * 2) +  -- Error penalty
    (CASE WHEN l.max_limit_usage_pct > 90 THEN -20 ELSE 0 END)  -- Near limit is engagement
  )) as churn_risk_score,
  CASE 
    WHEN m.days_inactive > 14 THEN 'Critical'
    WHEN m.days_inactive > 7 OR m.calls_last_7d < m.calls_prev_7d * 0.5 THEN 'High'
    WHEN m.days_inactive > 3 THEN 'Medium'
    ELSE 'Low'
  END as churn_risk_category
FROM user_metrics m
LEFT JOIN user_limits l ON m.user_id = l.user_id
WHERE m.days_inactive >= 1
ORDER BY churn_risk_score DESC
LIMIT 50;

-- =====================================================
-- SECTION 22: COST FORECASTING (30 DAY)
-- =====================================================

-- Cost trend and 30-day forecast
WITH daily_costs AS (
  SELECT 
    DATE(created_at) as date,
    SUM(total_cost) as daily_cost
  FROM api_usage
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
),
cost_stats AS (
  SELECT 
    AVG(daily_cost) as avg_daily_cost,
    STDDEV(daily_cost) as stddev_daily_cost,
    -- Simple linear regression slope (trend)
    REGR_SLOPE(daily_cost, EXTRACT(EPOCH FROM date)::numeric) as trend_slope
  FROM daily_costs
)
SELECT 
  ROUND(avg_daily_cost::numeric, 2) as current_avg_daily_cost,
  ROUND(stddev_daily_cost::numeric, 2) as volatility,
  ROUND((avg_daily_cost * 30)::numeric, 2) as projected_30d_cost_stable,
  ROUND(((avg_daily_cost + trend_slope * 30 * 86400) * 30)::numeric, 2) as projected_30d_cost_trending
FROM cost_stats;

-- =====================================================
-- SECTION 23: CAMPAIGN PERFORMANCE ANALYTICS
-- =====================================================

-- Campaign ROI and performance
SELECT 
  c.id as campaign_id,
  c.name as campaign_name,
  c.status,
  COUNT(DISTINCT a.user_id) as unique_users,
  COUNT(*) as total_generations,
  ROUND(SUM(a.total_cost)::numeric, 2) as total_cost,
  ROUND(AVG(a.total_cost)::numeric, 4) as avg_cost_per_generation,
  ROUND(AVG(a.latency_ms)::numeric, 0) as avg_latency_ms,
  COUNT(CASE WHEN a.status = 'error' THEN 1 END) as errors,
  ROUND(100.0 * COUNT(CASE WHEN a.status = 'error' THEN 1 END) / COUNT(*), 2) as error_rate_pct
FROM campaigns c
LEFT JOIN api_usage a ON c.id = a.campaign_id
WHERE c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.id, c.name, c.status
ORDER BY total_cost DESC;

-- =====================================================
-- SECTION 24: RATE LIMIT ANALYSIS
-- =====================================================

-- Rate limit hit patterns
SELECT 
  user_id,
  service_type,
  window_type,
  max_requests,
  AVG(current_requests) as avg_requests,
  MAX(current_requests) as peak_requests,
  COUNT(CASE WHEN is_blocked = true THEN 1 END) as times_blocked,
  MAX(blocked_until) as last_blocked_until
FROM api_rate_limits
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id, service_type, window_type, max_requests
ORDER BY times_blocked DESC;

-- =====================================================
-- SECTION 25: ERROR PATTERN ANALYSIS
-- =====================================================

-- Most common error messages
SELECT 
  error_message,
  service_type,
  provider,
  COUNT(*) as occurrences,
  COUNT(DISTINCT user_id) as affected_users,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen,
  ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_before_error
FROM api_usage
WHERE status = 'error'
  AND created_at >= NOW() - INTERVAL '7 days'
  AND error_message IS NOT NULL
GROUP BY error_message, service_type, provider
ORDER BY occurrences DESC
LIMIT 20;

-- =====================================================
-- SECTION 26: CONTENT GENERATION PATTERNS
-- =====================================================

-- Generation success patterns by content type
SELECT 
  service_type,
  CASE 
    WHEN images_generated > 0 THEN 'Image Generation'
    WHEN video_seconds > 0 THEN 'Video Generation'
    WHEN output_tokens > 0 THEN 'Text Generation'
    ELSE 'Other'
  END as generation_type,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
  ROUND(100.0 * COUNT(CASE WHEN status = 'success' THEN 1 END) / COUNT(*), 2) as success_rate_pct,
  ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms,
  ROUND(AVG(total_cost)::numeric, 4) as avg_cost,
  ROUND(SUM(total_cost)::numeric, 2) as total_cost
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY service_type, generation_type
ORDER BY total_attempts DESC;

-- =====================================================
-- SECTION 27: HOURLY ACTIVITY HEATMAP DATA
-- =====================================================

-- Activity by day of week and hour (for heatmap visualization)
SELECT 
  EXTRACT(DOW FROM created_at) as day_of_week,  -- 0=Sunday
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  COUNT(*) as request_count,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms,
  ROUND(SUM(total_cost)::numeric, 2) as total_cost
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY day_of_week, hour_of_day
ORDER BY day_of_week, hour_of_day;

-- =====================================================
-- SECTION 28: SUBSCRIPTION HEALTH METRICS
-- =====================================================

-- Users approaching limits (upsell opportunities)
SELECT 
  user_id,
  plan_name,
  ROUND(100.0 * content_generations_used / NULLIF(content_generations_limit, 0), 1) as content_usage_pct,
  ROUND(100.0 * image_generations_used / NULLIF(image_generations_limit, 0), 1) as image_usage_pct,
  ROUND(100.0 * video_generations_used / NULLIF(video_generations_limit, 0), 1) as video_usage_pct,
  ROUND(100.0 * chat_messages_used / NULLIF(chat_messages_limit, 0), 1) as chat_usage_pct,
  ROUND(current_month_cost::numeric, 2) as current_spend,
  ROUND(lifetime_cost::numeric, 2) as lifetime_value,
  CASE 
    WHEN GREATEST(
      100.0 * content_generations_used / NULLIF(content_generations_limit, 0),
      100.0 * image_generations_used / NULLIF(image_generations_limit, 0),
      100.0 * video_generations_used / NULLIF(video_generations_limit, 0)
    ) >= 90 THEN 'Urgent Upsell'
    WHEN GREATEST(
      100.0 * content_generations_used / NULLIF(content_generations_limit, 0),
      100.0 * image_generations_used / NULLIF(image_generations_limit, 0),
      100.0 * video_generations_used / NULLIF(video_generations_limit, 0)
    ) >= 75 THEN 'Consider Upsell'
    ELSE 'Normal Usage'
  END as upsell_priority
FROM user_subscriptions
WHERE is_active = true
ORDER BY 
  GREATEST(
    100.0 * content_generations_used / NULLIF(content_generations_limit, 0),
    100.0 * image_generations_used / NULLIF(image_generations_limit, 0),
    100.0 * video_generations_used / NULLIF(video_generations_limit, 0)
  ) DESC
LIMIT 50;

-- =====================================================
-- SECTION 29: DAILY EXECUTIVE SUMMARY
-- =====================================================

-- Single query for daily executive dashboard
WITH today_stats AS (
  SELECT 
    COUNT(DISTINCT user_id) as dau,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
    SUM(total_cost) as total_cost,
    AVG(latency_ms) as avg_latency,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency
  FROM api_usage
  WHERE DATE(created_at) = CURRENT_DATE
),
yesterday_stats AS (
  SELECT 
    COUNT(DISTINCT user_id) as dau_yesterday,
    SUM(total_cost) as cost_yesterday
  FROM api_usage
  WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
),
active_subs AS (
  SELECT 
    COUNT(*) as total_active_subs,
    SUM(current_month_cost) as mrr
  FROM user_subscriptions
  WHERE is_active = true
)
SELECT 
  -- Users
  today_stats.dau as active_users_today,
  yesterday_stats.dau_yesterday,
  ROUND(100.0 * (today_stats.dau - yesterday_stats.dau_yesterday) / NULLIF(yesterday_stats.dau_yesterday, 0), 1) as dau_change_pct,
  active_subs.total_active_subs,
  
  -- Performance
  today_stats.total_requests,
  today_stats.successful_requests,
  ROUND(100.0 * today_stats.successful_requests / NULLIF(today_stats.total_requests, 0), 2) as success_rate_pct,
  ROUND(today_stats.avg_latency::numeric, 0) as avg_latency_ms,
  ROUND(today_stats.p95_latency::numeric, 0) as p95_latency_ms,
  
  -- Financial
  ROUND(today_stats.total_cost::numeric, 2) as cost_today,
  ROUND(yesterday_stats.cost_yesterday::numeric, 2) as cost_yesterday,
  ROUND(active_subs.mrr::numeric, 2) as monthly_recurring_revenue,
  ROUND((active_subs.mrr - today_stats.total_cost * 30)::numeric, 2) as projected_monthly_margin,
  
  -- Health Score
  ROUND(
    (100.0 * today_stats.successful_requests / NULLIF(today_stats.total_requests, 0)) * 
    (1.0 / (1.0 + today_stats.p95_latency / 1000.0))
  , 2) as health_score
FROM today_stats, yesterday_stats, active_subs;

-- =====================================================
-- SECTION 30: ALERT CONDITIONS
-- =====================================================

-- Active alerts that need attention
SELECT 
  alert_type,
  user_id,
  severity,
  message,
  current_value,
  threshold_value,
  created_at,
  EXTRACT(HOUR FROM NOW() - created_at) as hours_since_alert
FROM usage_alerts
WHERE is_resolved = false
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    ELSE 3
  END,
  created_at DESC;

-- =====================================================
-- END OF ADVANCED ANALYTICS QUERIES
-- Total: 30+ additional queries for comprehensive insights
-- =====================================================
