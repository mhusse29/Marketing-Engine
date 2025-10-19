-- =====================================================
-- SCHEMA ENHANCEMENTS FOR ADVANCED ANALYTICS
-- Optional improvements to capture richer data
-- =====================================================

-- =====================================================
-- PART 1: ADD TRACKING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add session tracking to api_usage (if not exists)
ALTER TABLE api_usage 
ADD COLUMN IF NOT EXISTS session_id UUID,
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- Add geographic data columns (parsed from ip_address)
ALTER TABLE api_usage
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2),
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Add device info columns (parsed from user_agent)
ALTER TABLE api_usage
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS browser_version TEXT,
ADD COLUMN IF NOT EXISTS os TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT; -- 'desktop', 'mobile', 'tablet'

-- Add content quality tracking
ALTER TABLE api_usage
ADD COLUMN IF NOT EXISTS user_rating SMALLINT CHECK (user_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS regeneration_of UUID, -- References another api_usage.id if this is a retry
ADD COLUMN IF NOT EXISTS is_downloaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- =====================================================
-- PART 2: CREATE NEW TRACKING TABLES
-- =====================================================

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  actions_count INTEGER DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  landing_page TEXT,
  exit_page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_sessions_started_at ON user_sessions(started_at DESC);

-- Frontend performance tracking
CREATE TABLE IF NOT EXISTS frontend_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID,
  page_url TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'page_load', 'interaction', 'error'
  metric_name TEXT NOT NULL, -- 'FCP', 'LCP', 'CLS', 'FID', 'TTFB'
  metric_value NUMERIC,
  browser TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_frontend_metrics_user_id ON frontend_metrics(user_id);
CREATE INDEX idx_frontend_metrics_type ON frontend_metrics(metric_type, metric_name);
CREATE INDEX idx_frontend_metrics_created_at ON frontend_metrics(created_at DESC);

-- User feedback and ratings
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  api_usage_id UUID REFERENCES api_usage(id),
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  feedback_type TEXT, -- 'quality', 'speed', 'accuracy', 'general'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_feedback_api_usage_id ON user_feedback(api_usage_id);
CREATE INDEX idx_feedback_rating ON user_feedback(rating);

-- A/B Test assignments
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  experiment_name TEXT NOT NULL,
  variant_name TEXT NOT NULL, -- 'control', 'variant_a', 'variant_b'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ
);

CREATE INDEX idx_ab_test_user_id ON ab_test_assignments(user_id);
CREATE INDEX idx_ab_test_experiment ON ab_test_assignments(experiment_name, variant_name);

-- Feature usage events
CREATE TABLE IF NOT EXISTS feature_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID,
  event_type TEXT NOT NULL, -- 'click', 'view', 'interact', 'complete'
  feature_name TEXT NOT NULL,
  event_properties JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_events_user_id ON feature_events(user_id);
CREATE INDEX idx_feature_events_feature ON feature_events(feature_name, event_type);
CREATE INDEX idx_feature_events_created_at ON feature_events(created_at DESC);

-- =====================================================
-- PART 3: HELPER FUNCTIONS FOR DATA ENRICHMENT
-- =====================================================

-- Function to parse user agent (basic implementation)
-- In production, use a proper user agent parser library
CREATE OR REPLACE FUNCTION parse_user_agent(user_agent_string TEXT)
RETURNS TABLE(
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  device_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN user_agent_string ILIKE '%chrome%' THEN 'Chrome'
      WHEN user_agent_string ILIKE '%firefox%' THEN 'Firefox'
      WHEN user_agent_string ILIKE '%safari%' THEN 'Safari'
      WHEN user_agent_string ILIKE '%edge%' THEN 'Edge'
      ELSE 'Other'
    END as browser,
    NULL::TEXT as browser_version, -- TODO: Extract version
    CASE 
      WHEN user_agent_string ILIKE '%windows%' THEN 'Windows'
      WHEN user_agent_string ILIKE '%mac%' THEN 'macOS'
      WHEN user_agent_string ILIKE '%linux%' THEN 'Linux'
      WHEN user_agent_string ILIKE '%android%' THEN 'Android'
      WHEN user_agent_string ILIKE '%ios%' OR user_agent_string ILIKE '%iphone%' THEN 'iOS'
      ELSE 'Other'
    END as os,
    CASE 
      WHEN user_agent_string ILIKE '%mobile%' OR user_agent_string ILIKE '%android%' THEN 'mobile'
      WHEN user_agent_string ILIKE '%tablet%' OR user_agent_string ILIKE '%ipad%' THEN 'tablet'
      ELSE 'desktop'
    END as device_type;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-populate device info when api_usage is inserted
CREATE OR REPLACE FUNCTION enrich_api_usage_device_info()
RETURNS TRIGGER AS $$
DECLARE
  parsed_ua RECORD;
BEGIN
  IF NEW.user_agent IS NOT NULL AND NEW.browser IS NULL THEN
    SELECT * INTO parsed_ua FROM parse_user_agent(NEW.user_agent);
    NEW.browser := parsed_ua.browser;
    NEW.browser_version := parsed_ua.browser_version;
    NEW.os := parsed_ua.os;
    NEW.device_type := parsed_ua.device_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (only if columns exist)
-- DROP TRIGGER IF EXISTS trigger_enrich_device_info ON api_usage;
-- CREATE TRIGGER trigger_enrich_device_info
--   BEFORE INSERT ON api_usage
--   FOR EACH ROW
--   EXECUTE FUNCTION enrich_api_usage_device_info();

-- =====================================================
-- PART 4: VIEWS FOR ENHANCED ANALYTICS
-- =====================================================

-- Comprehensive user profile view
CREATE OR REPLACE VIEW v_user_profiles AS
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as signup_date,
  s.plan_name,
  s.is_active as is_subscriber,
  s.current_month_cost,
  s.lifetime_cost,
  seg.usage_segment,
  seg.churn_risk_segment,
  seg.total_calls,
  seg.features_used,
  seg.days_inactive,
  seg.last_active
FROM auth.users u
LEFT JOIN user_subscriptions s ON u.id = s.user_id
LEFT JOIN mv_user_segments seg ON u.id = seg.user_id;

-- Session summary view
CREATE OR REPLACE VIEW v_session_summary AS
SELECT 
  s.session_id,
  s.user_id,
  s.started_at,
  s.duration_seconds,
  s.page_views,
  COUNT(a.id) as api_calls,
  SUM(a.total_cost) as session_cost,
  COUNT(DISTINCT a.service_type) as features_used
FROM user_sessions s
LEFT JOIN api_usage a ON s.session_id = a.session_id
GROUP BY s.session_id, s.user_id, s.started_at, s.duration_seconds, s.page_views;

-- Daily executive dashboard view
CREATE OR REPLACE VIEW v_daily_executive_dashboard AS
WITH today AS (
  SELECT 
    COUNT(DISTINCT user_id) as dau,
    COUNT(*) as requests,
    SUM(total_cost) as cost,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
  FROM api_usage
  WHERE DATE(created_at) = CURRENT_DATE
),
yesterday AS (
  SELECT 
    COUNT(DISTINCT user_id) as dau,
    SUM(total_cost) as cost
  FROM api_usage
  WHERE DATE(created_at) = CURRENT_DATE - 1
)
SELECT 
  today.dau as active_users_today,
  yesterday.dau as active_users_yesterday,
  today.requests as total_requests_today,
  ROUND(today.cost::numeric, 2) as cost_today,
  ROUND(yesterday.cost::numeric, 2) as cost_yesterday,
  today.errors as errors_today,
  ROUND(100.0 * today.errors / NULLIF(today.requests, 0), 2) as error_rate_pct,
  (SELECT COUNT(*) FROM user_subscriptions WHERE is_active = true) as active_subscribers,
  (SELECT ROUND(SUM(current_month_cost)::numeric, 2) FROM user_subscriptions WHERE is_active = true) as mrr
FROM today, yesterday;

-- =====================================================
-- PART 5: DATA QUALITY CHECKS
-- =====================================================

-- View to identify data quality issues
CREATE OR REPLACE VIEW v_data_quality_issues AS
SELECT 
  'Missing User Agent' as issue_type,
  COUNT(*) as count
FROM api_usage
WHERE user_agent IS NULL AND created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  'Missing IP Address' as issue_type,
  COUNT(*) as count
FROM api_usage
WHERE ip_address IS NULL AND created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  'High Latency (>30s)' as issue_type,
  COUNT(*) as count
FROM api_usage
WHERE latency_ms > 30000 AND created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  'Zero Cost Requests' as issue_type,
  COUNT(*) as count
FROM api_usage
WHERE total_cost = 0 AND status = 'success' AND created_at >= NOW() - INTERVAL '7 days';

-- =====================================================
-- PART 6: AGGREGATION FUNCTIONS FOR DASHBOARD
-- =====================================================

-- Get dashboard summary for any time period
CREATE OR REPLACE FUNCTION get_dashboard_summary(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
  total_users BIGINT,
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT,
  success_rate_pct NUMERIC,
  total_cost NUMERIC,
  avg_latency_ms NUMERIC,
  p95_latency_ms NUMERIC,
  unique_services BIGINT,
  top_service TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT user_id) as total_users,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_requests,
    ROUND(100.0 * COUNT(CASE WHEN status = 'success' THEN 1 END) / NULLIF(COUNT(*), 0), 2) as success_rate_pct,
    ROUND(SUM(api_usage.total_cost)::numeric, 2) as total_cost,
    ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) as p95_latency_ms,
    COUNT(DISTINCT service_type) as unique_services,
    (
      SELECT service_type 
      FROM api_usage 
      WHERE created_at BETWEEN start_date AND end_date
      GROUP BY service_type 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ) as top_service
  FROM api_usage
  WHERE created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT * FROM get_dashboard_summary(NOW() - INTERVAL '7 days', NOW());

-- =====================================================
-- PART 7: SCHEDULED JOBS (REQUIRES pg_cron EXTENSION)
-- =====================================================

-- Enable pg_cron extension (run as superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule materialized view refresh every hour
-- SELECT cron.schedule('refresh-analytics-hourly', '0 * * * *', 'SELECT refresh_analytics_views()');

-- Schedule daily aggregation at midnight
-- SELECT cron.schedule('daily-aggregation', '0 0 * * *', $$
--   INSERT INTO usage_aggregations (user_id, period_type, period_start, period_end, total_requests, ...)
--   SELECT user_id, 'daily', CURRENT_DATE - 1, CURRENT_DATE, COUNT(*), ...
--   FROM api_usage
--   WHERE DATE(created_at) = CURRENT_DATE - 1
--   GROUP BY user_id;
-- $$);

-- =====================================================
-- PART 8: MIGRATION SCRIPT EXAMPLE
-- =====================================================

-- To apply all enhancements safely:
/*
BEGIN;

-- Add columns one by one
ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
-- ... add more columns

-- Create new tables
-- ... create tables

-- Create indexes
-- ... create indexes

-- Test queries work
SELECT * FROM get_dashboard_summary() LIMIT 1;

-- If all good:
COMMIT;

-- If issues:
-- ROLLBACK;
*/

-- =====================================================
-- PART 9: CLEANUP OLD DATA (OPTIONAL)
-- =====================================================

-- Function to archive old data
CREATE OR REPLACE FUNCTION archive_old_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Count records to archive
  SELECT COUNT(*) INTO archived_count
  FROM api_usage
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  -- In production, you'd move to archive table first
  -- Then delete from main table
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- END OF SCHEMA ENHANCEMENTS
-- These are OPTIONAL improvements for richer analytics
-- =====================================================

-- IMPLEMENTATION NOTES:
-- 1. Review each enhancement before applying
-- 2. Test in development environment first
-- 3. Some enhancements require frontend changes to send data
-- 4. Consider data privacy implications
-- 5. Not all enhancements may be needed immediately
