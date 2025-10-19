-- =====================================================
-- ANALYTICS DASHBOARD VIEWS AND FUNCTIONS
-- Created: 2025-01-18
-- =====================================================

-- =====================================================
-- 1. HEALTH SCORE FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION get_health_score(interval_duration TEXT DEFAULT '60 minutes')
RETURNS TABLE (
  health_score NUMERIC,
  uptime_pct NUMERIC,
  avg_latency_ms NUMERIC,
  p95_latency_ms NUMERIC,
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'success') as success_count,
      COUNT(*) FILTER (WHERE status != 'success') as fail_count,
      AVG(latency_ms) as avg_lat,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_lat
    FROM api_usage
    WHERE created_at > NOW() - interval_duration::interval
  )
  SELECT
    CASE 
      WHEN s.total = 0 THEN 0
      ELSE ROUND(((s.success_count::NUMERIC / s.total::NUMERIC) * 100), 2)
    END as health_score,
    CASE 
      WHEN s.total = 0 THEN 0
      ELSE ROUND(((s.success_count::NUMERIC / s.total::NUMERIC) * 100), 2)
    END as uptime_pct,
    ROUND(COALESCE(s.avg_lat, 0), 2) as avg_latency_ms,
    ROUND(COALESCE(s.p95_lat, 0), 2) as p95_latency_ms,
    s.total as total_requests,
    s.success_count as successful_requests,
    s.fail_count as failed_requests
  FROM stats s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. DAILY METRICS MATERIALIZED VIEW
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_metrics AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as daily_active_users,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'success') as successful_requests,
  COUNT(*) FILTER (WHERE status != 'success') as failed_requests,
  ROUND((COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as success_rate_pct,
  SUM(total_cost) as total_cost,
  SUM(total_tokens) as total_tokens,
  AVG(latency_ms) as avg_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency_ms,
  SUM(images_generated) as total_images,
  SUM(video_seconds) as total_video_seconds
FROM api_usage
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create index
CREATE UNIQUE INDEX idx_mv_daily_metrics_date ON mv_daily_metrics(date);

-- =====================================================
-- 3. PROVIDER PERFORMANCE MATERIALIZED VIEW
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_provider_performance AS
SELECT
  provider,
  service_type,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'success') as successful_requests,
  ROUND((COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as success_rate_pct,
  AVG(latency_ms) FILTER (WHERE status = 'success') as avg_success_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) FILTER (WHERE status = 'success') as p95_success_latency_ms,
  SUM(total_cost) as total_cost,
  AVG(total_cost) as avg_cost_per_request
FROM api_usage
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY provider, service_type
ORDER BY total_requests DESC;

-- =====================================================
-- 4. USER SEGMENTS MATERIALIZED VIEW
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_segments AS
SELECT
  u.user_id,
  u.plan_type,
  COUNT(*) as total_calls,
  SUM(u.total_cost) as total_spent,
  COUNT(DISTINCT u.service_type) as features_used,
  MAX(u.created_at) as last_active,
  CASE
    WHEN COUNT(*) > 100 THEN 'Power User'
    WHEN COUNT(*) > 50 THEN 'Active User'
    WHEN COUNT(*) > 10 THEN 'Regular User'
    ELSE 'Light User'
  END as usage_segment,
  CASE
    WHEN MAX(u.created_at) < NOW() - INTERVAL '7 days' THEN 'At Risk'
    WHEN MAX(u.created_at) < NOW() - INTERVAL '30 days' THEN 'Churned'
    ELSE 'Active'
  END as churn_risk_segment,
  COUNT(DISTINCT u.user_id) as user_count
FROM api_usage u
LEFT JOIN user_subscriptions s ON u.user_id = s.user_id
WHERE u.created_at > NOW() - INTERVAL '90 days'
GROUP BY u.user_id, u.plan_type;

-- =====================================================
-- 5. EXECUTIVE DASHBOARD VIEW
-- =====================================================
CREATE OR REPLACE VIEW v_daily_executive_dashboard AS
SELECT
  COUNT(DISTINCT user_id) as active_users_today,
  (SELECT COUNT(DISTINCT user_id) FROM api_usage WHERE DATE(created_at) = CURRENT_DATE - 1) as active_users_yesterday,
  ROUND((
    (COUNT(DISTINCT user_id)::NUMERIC - (SELECT COUNT(DISTINCT user_id) FROM api_usage WHERE DATE(created_at) = CURRENT_DATE - 1)::NUMERIC) /
    NULLIF((SELECT COUNT(DISTINCT user_id) FROM api_usage WHERE DATE(created_at) = CURRENT_DATE - 1)::NUMERIC, 0) * 100
  ), 2) as dau_change_pct,
  COUNT(*) as total_requests_today,
  ROUND((COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as success_rate,
  SUM(total_cost) as revenue_today,
  ROUND(AVG(latency_ms), 0) as avg_latency_ms
FROM api_usage
WHERE DATE(created_at) = CURRENT_DATE;

-- =====================================================
-- 6. CHURN RISK USERS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION get_churn_risk_users(min_score INTEGER DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  plan_type TEXT,
  last_active TIMESTAMPTZ,
  days_inactive INTEGER,
  total_spent NUMERIC,
  churn_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.user_id,
    COALESCE(s.plan_type, 'free') as plan_type,
    MAX(u.created_at) as last_active,
    EXTRACT(DAY FROM NOW() - MAX(u.created_at))::INTEGER as days_inactive,
    SUM(u.total_cost) as total_spent,
    CASE
      WHEN EXTRACT(DAY FROM NOW() - MAX(u.created_at)) > 30 THEN 90
      WHEN EXTRACT(DAY FROM NOW() - MAX(u.created_at)) > 14 THEN 70
      WHEN EXTRACT(DAY FROM NOW() - MAX(u.created_at)) > 7 THEN 50
      ELSE 20
    END as churn_score
  FROM api_usage u
  LEFT JOIN user_subscriptions s ON u.user_id = s.user_id
  GROUP BY u.user_id, s.plan_type
  HAVING CASE
    WHEN EXTRACT(DAY FROM NOW() - MAX(u.created_at)) > 30 THEN 90
    WHEN EXTRACT(DAY FROM NOW() - MAX(u.created_at)) > 14 THEN 70
    WHEN EXTRACT(DAY FROM NOW() - MAX(u.created_at)) > 7 THEN 50
    ELSE 20
  END >= min_score
  ORDER BY churn_score DESC, total_spent DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. REFRESH FUNCTION FOR MATERIALIZED VIEWS
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_provider_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_segments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON mv_daily_metrics TO authenticated;
GRANT SELECT ON mv_provider_performance TO authenticated;
GRANT SELECT ON mv_user_segments TO authenticated;
GRANT SELECT ON v_daily_executive_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_health_score TO authenticated;
GRANT EXECUTE ON FUNCTION get_churn_risk_users TO authenticated;

-- =====================================================
-- DONE! Analytics dashboard ready to use
-- =====================================================
