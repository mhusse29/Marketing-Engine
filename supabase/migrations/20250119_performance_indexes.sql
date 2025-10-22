-- Security Audit Fix Part 4: Performance Indexes
-- This migration adds missing foreign key indexes for better join performance

-- ============================================================================
-- Add Missing Foreign Key Indexes
-- These indexes significantly improve query performance for joins
-- ============================================================================

-- 1. Index for ab_test_results.api_usage_id
CREATE INDEX IF NOT EXISTS idx_ab_test_results_api_usage_id 
ON ab_test_results(api_usage_id);

COMMENT ON INDEX idx_ab_test_results_api_usage_id IS 
'Improves join performance when querying AB test results with API usage data';

-- 2. Index for alert_history.alert_rule_id
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_rule_id 
ON alert_history(alert_rule_id);

COMMENT ON INDEX idx_alert_history_alert_rule_id IS 
'Improves join performance when querying alert history with alert rules';

-- 3. Index for cache_analysis.sample_request_id
CREATE INDEX IF NOT EXISTS idx_cache_analysis_sample_request_id 
ON cache_analysis(sample_request_id);

COMMENT ON INDEX idx_cache_analysis_sample_request_id IS 
'Improves join performance when querying cache analysis with API usage data';

-- 4. Index for deployments.rollback_of (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'deployments') THEN
        CREATE INDEX IF NOT EXISTS idx_deployments_rollback_of 
        ON deployments(rollback_of);
        
        COMMENT ON INDEX idx_deployments_rollback_of IS 
        'Improves join performance when querying deployment rollback chains';
    END IF;
END $$;

-- ============================================================================
-- Additional Performance Indexes for Common Query Patterns
-- ============================================================================

-- Index for user_id + created_at (common filtering pattern)
CREATE INDEX IF NOT EXISTS idx_api_usage_user_created 
ON api_usage(user_id, created_at DESC);

COMMENT ON INDEX idx_api_usage_user_created IS 
'Composite index for user-specific time-range queries';

-- Index for service_type queries
CREATE INDEX IF NOT EXISTS idx_api_usage_service_type 
ON api_usage(service_type, created_at DESC);

COMMENT ON INDEX idx_api_usage_service_type IS 
'Improves performance for service-type specific analytics';

-- Index for status-based queries
CREATE INDEX IF NOT EXISTS idx_api_usage_status_created 
ON api_usage(status, created_at DESC) 
WHERE status != 'success';

COMMENT ON INDEX idx_api_usage_status_created IS 
'Partial index for error and rate-limited request queries';

-- Index for campaign analytics
CREATE INDEX IF NOT EXISTS idx_api_usage_campaign_id 
ON api_usage(campaign_id, created_at DESC) 
WHERE campaign_id IS NOT NULL;

COMMENT ON INDEX idx_api_usage_campaign_id IS 
'Partial index for campaign-specific analytics';

-- ============================================================================
-- Indexes for Anomaly Detection Tables
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cost_anomalies_user_severity 
ON cost_anomalies(user_id, severity, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_anomalies_user_severity 
ON usage_anomalies(user_id, severity, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_quality_anomalies_user_severity 
ON quality_anomalies(user_id, severity, detected_at DESC);

-- ============================================================================
-- Indexes for Alert System Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_alert_history_user_unread 
ON alert_history(user_id, created_at DESC) 
WHERE is_read = false;

COMMENT ON INDEX idx_alert_history_user_unread IS 
'Partial index for fetching unread alerts per user';

CREATE INDEX IF NOT EXISTS idx_alert_rules_user_active 
ON alert_rules(user_id, is_active) 
WHERE is_active = true;

COMMENT ON INDEX idx_alert_rules_user_active IS 
'Partial index for active alert rules per user';

-- ============================================================================
-- Indexes for Optimization Tables
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cost_optimization_suggestions_user_status 
ON cost_optimization_suggestions(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_optimization_history_user_created 
ON optimization_history(user_id, created_at DESC);

-- ============================================================================
-- Index Statistics
-- ============================================================================

-- Add a comment with index creation summary
COMMENT ON TABLE api_usage IS 
'Core usage tracking table with optimized indexes for user queries, time-range filters, and analytics';

-- Verify index creation
DO $$
DECLARE
    v_index_count integer;
BEGIN
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE 'Total performance indexes created: %', v_index_count;
END $$;
