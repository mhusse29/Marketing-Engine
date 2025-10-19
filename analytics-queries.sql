-- =====================================================
-- DEMO PHASE ANALYTICS QUERIES
-- Run these daily/weekly to monitor user behavior
-- =====================================================

-- =====================================================
-- 1. DAILY SNAPSHOT
-- =====================================================

-- Active users today
SELECT 
  COUNT(DISTINCT user_id) as active_users_today,
  COUNT(*) as total_api_calls,
  SUM(total_cost) as total_cost_today
FROM api_usage
WHERE DATE(created_at) = CURRENT_DATE;

-- =====================================================
-- 2. FEATURE ADOPTION
-- =====================================================

-- Which features are most popular?
SELECT 
  service_type,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_uses,
  ROUND(AVG(total_cost)::numeric, 4) as avg_cost_per_use,
  SUM(total_cost) as total_cost
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY service_type
ORDER BY unique_users DESC;

-- Provider preferences
SELECT 
  provider,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as uses,
  ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY provider
ORDER BY uses DESC;

-- =====================================================
-- 3. USER SEGMENTATION
-- =====================================================

-- Identify power users (top 20% by usage)
WITH user_totals AS (
  SELECT 
    user_id,
    COUNT(*) as total_calls,
    SUM(total_cost) as total_spent,
    COUNT(DISTINCT service_type) as features_used
  FROM api_usage
  GROUP BY user_id
)
SELECT 
  user_id,
  total_calls,
  ROUND(total_spent::numeric, 2) as total_spent,
  features_used,
  CASE 
    WHEN total_calls > (SELECT PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY total_calls) FROM user_totals) 
    THEN 'Power User'
    WHEN total_calls > (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_calls) FROM user_totals)
    THEN 'Regular User'
    ELSE 'Light User'
  END as user_segment
FROM user_totals
ORDER BY total_calls DESC;

-- =====================================================
-- 4. COST ANALYSIS
-- =====================================================

-- Cost distribution by user
SELECT 
  user_id,
  COUNT(*) as api_calls,
  ROUND(SUM(total_cost)::numeric, 2) as total_cost,
  ROUND(AVG(total_cost)::numeric, 4) as avg_cost_per_call,
  ROUND((SUM(total_cost) / COUNT(DISTINCT DATE(created_at)))::numeric, 2) as avg_daily_cost
FROM api_usage
GROUP BY user_id
ORDER BY total_cost DESC
LIMIT 20;

-- Most expensive operations
SELECT 
  service_type,
  provider,
  model,
  ROUND(AVG(total_cost)::numeric, 4) as avg_cost,
  COUNT(*) as times_used
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY service_type, provider, model
ORDER BY avg_cost DESC
LIMIT 10;

-- =====================================================
-- 5. ENGAGEMENT PATTERNS
-- =====================================================

-- When are users most active? (hourly)
SELECT 
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  COUNT(*) as api_calls,
  COUNT(DISTINCT user_id) as unique_users
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY hour_of_day
ORDER BY hour_of_day;

-- Daily active users trend
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as daily_active_users,
  COUNT(*) as api_calls,
  ROUND(SUM(total_cost)::numeric, 2) as daily_cost
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =====================================================
-- 6. USER JOURNEY ANALYSIS
-- =====================================================

-- First action by new users
WITH first_actions AS (
  SELECT 
    user_id,
    service_type as first_feature,
    created_at as first_use_time,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM api_usage
)
SELECT 
  first_feature,
  COUNT(*) as users_started_here,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM first_actions
WHERE rn = 1
GROUP BY first_feature
ORDER BY users_started_here DESC;

-- Feature sequences (what do users do after content generation?)
WITH sequences AS (
  SELECT 
    user_id,
    service_type,
    LEAD(service_type) OVER (PARTITION BY user_id ORDER BY created_at) as next_service
  FROM api_usage
)
SELECT 
  service_type as first_action,
  next_service as second_action,
  COUNT(*) as occurrences
FROM sequences
WHERE next_service IS NOT NULL
GROUP BY service_type, next_service
ORDER BY occurrences DESC
LIMIT 20;

-- =====================================================
-- 7. RETENTION ANALYSIS
-- =====================================================

-- User retention by cohort (users who joined same week)
WITH cohorts AS (
  SELECT 
    user_id,
    DATE_TRUNC('week', MIN(created_at)) as cohort_week
  FROM api_usage
  GROUP BY user_id
),
user_activity AS (
  SELECT 
    c.user_id,
    c.cohort_week,
    DATE_TRUNC('week', a.created_at) as activity_week,
    EXTRACT(WEEK FROM AGE(a.created_at, c.cohort_week)) as weeks_since_join
  FROM cohorts c
  JOIN api_usage a ON c.user_id = a.user_id
)
SELECT 
  cohort_week,
  COUNT(DISTINCT user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN weeks_since_join = 0 THEN user_id END) as week_0,
  COUNT(DISTINCT CASE WHEN weeks_since_join = 1 THEN user_id END) as week_1,
  COUNT(DISTINCT CASE WHEN weeks_since_join = 2 THEN user_id END) as week_2,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN weeks_since_join = 1 THEN user_id END) / 
    NULLIF(COUNT(DISTINCT CASE WHEN weeks_since_join = 0 THEN user_id END), 0), 1) as week_1_retention_pct
FROM user_activity
GROUP BY cohort_week
ORDER BY cohort_week DESC;

-- =====================================================
-- 8. QUALITY METRICS
-- =====================================================

-- Error rates by service
SELECT 
  service_type,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
  ROUND(100.0 * COUNT(CASE WHEN status = 'error' THEN 1 END) / COUNT(*), 2) as error_rate_pct,
  ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY service_type
ORDER BY error_rate_pct DESC;

-- Slowest operations
SELECT 
  service_type,
  provider,
  model,
  ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms,
  MAX(latency_ms) as max_latency_ms,
  COUNT(*) as sample_size
FROM api_usage
WHERE status = 'success'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY service_type, provider, model
HAVING COUNT(*) >= 10
ORDER BY avg_latency_ms DESC
LIMIT 10;

-- =====================================================
-- 9. SUBSCRIPTION STATUS
-- =====================================================

-- Current subscription usage
SELECT 
  user_id,
  plan_name,
  content_generations_used || ' / ' || content_generations_limit as content,
  image_generations_used || ' / ' || image_generations_limit as images,
  video_generations_used || ' / ' || video_generations_limit as videos,
  chat_messages_used || ' / ' || chat_messages_limit as chat,
  ROUND(current_month_cost::numeric, 2) as month_cost,
  ROUND(lifetime_cost::numeric, 2) as lifetime_cost,
  ROUND(100.0 * content_generations_used / NULLIF(content_generations_limit, 0), 1) as content_usage_pct
FROM user_subscriptions
ORDER BY current_month_cost DESC;

-- =====================================================
-- 10. CHURN RISK INDICATORS
-- =====================================================

-- Users who haven't been active recently (potential churn)
WITH last_activity AS (
  SELECT 
    user_id,
    MAX(created_at) as last_seen,
    COUNT(*) as total_lifetime_calls,
    EXTRACT(DAY FROM NOW() - MAX(created_at)) as days_inactive
  FROM api_usage
  GROUP BY user_id
)
SELECT 
  user_id,
  last_seen,
  days_inactive,
  total_lifetime_calls,
  CASE 
    WHEN days_inactive > 14 THEN 'High Risk'
    WHEN days_inactive > 7 THEN 'Medium Risk'
    WHEN days_inactive > 3 THEN 'Low Risk'
    ELSE 'Active'
  END as churn_risk
FROM last_activity
WHERE days_inactive > 3
ORDER BY days_inactive DESC, total_lifetime_calls DESC;
