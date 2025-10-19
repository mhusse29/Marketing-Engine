-- ============================================================================
-- Enterprise Dashboard Enhancement - Database Schema
-- Created: October 19, 2024
-- Purpose: Add tables for SLO tracking, incident management, distributed
--          tracing, alerting, audit logging, and advanced analytics
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- SLO (Service Level Objectives) TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS slo_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('latency', 'availability', 'error_rate', 'throughput')),
  target_value NUMERIC NOT NULL CHECK (target_value >= 0 AND target_value <= 100),
  time_window INTERVAL NOT NULL, -- e.g., '24 hours', '7 days', '30 days'
  alert_threshold NUMERIC CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slo_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slo_id UUID REFERENCES slo_definitions(id) ON DELETE CASCADE,
  measured_value NUMERIC NOT NULL,
  target_value NUMERIC NOT NULL,
  error_budget_remaining NUMERIC, -- percentage remaining
  burn_rate NUMERIC, -- percentage per day
  status TEXT CHECK (status IN ('healthy', 'at_risk', 'breached')),
  measurement_window_start TIMESTAMPTZ NOT NULL,
  measurement_window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_slo_measurements_slo_time ON slo_measurements(slo_id, created_at DESC);
CREATE INDEX idx_slo_measurements_status ON slo_measurements(status, created_at DESC);

-- ============================================================================
-- INCIDENT MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  affected_services TEXT[], -- array of service names
  affected_users_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  mttr_seconds INTEGER, -- mean time to resolution
  root_cause TEXT,
  resolution_summary TEXT,
  postmortem_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('detected', 'acknowledged', 'investigating', 'update', 'identified', 'resolved')),
  description TEXT NOT NULL,
  metadata JSONB, -- additional context
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_status ON incidents(status, created_at DESC);
CREATE INDEX idx_incidents_severity ON incidents(severity, created_at DESC);
CREATE INDEX idx_incident_timeline ON incident_timeline(incident_id, created_at ASC);

-- ============================================================================
-- DISTRIBUTED TRACING
-- ============================================================================

CREATE TABLE IF NOT EXISTS traces (
  trace_id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id UUID,
  operation_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  service_count INTEGER DEFAULT 1,
  span_count INTEGER DEFAULT 1,
  total_cost NUMERIC DEFAULT 0,
  error_message TEXT,
  tags JSONB, -- custom tags for filtering
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spans (
  span_id UUID PRIMARY KEY,
  trace_id UUID REFERENCES traces(trace_id) ON DELETE CASCADE,
  parent_span_id UUID REFERENCES spans(span_id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  operation_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  tags JSONB, -- span-level metadata
  logs JSONB, -- array of log entries
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_traces_user_time ON traces(user_id, started_at DESC);
CREATE INDEX idx_traces_status ON traces(status, started_at DESC);
CREATE INDEX idx_spans_trace ON spans(trace_id, started_at ASC);
CREATE INDEX idx_spans_parent ON spans(parent_span_id, started_at ASC);
CREATE INDEX idx_spans_service ON spans(service_name, started_at DESC);

-- ============================================================================
-- ADVANCED ALERTING
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  condition JSONB NOT NULL, -- {metric, operator, threshold, duration}
  channels TEXT[] NOT NULL, -- ['email', 'slack', 'webhook', 'pagerduty']
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  enabled BOOLEAN DEFAULT TRUE,
  cooldown_minutes INTEGER DEFAULT 5,
  escalation_policy JSONB, -- rules for escalating alerts
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  trigger_value NUMERIC,
  threshold_value NUMERIC,
  channels_sent TEXT[],
  notification_status JSONB, -- delivery status per channel
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  incident_id UUID REFERENCES incidents(id), -- link to incident if created
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alert_notifications_rule ON alert_notifications(alert_rule_id, triggered_at DESC);
CREATE INDEX idx_alert_notifications_status ON alert_notifications(resolved_at NULLS FIRST, triggered_at DESC);

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'view', 'export', 'configure', 'delete', 'create', 'update'
  resource_type TEXT NOT NULL, -- 'dashboard', 'slo', 'alert', 'incident', etc.
  resource_id UUID,
  resource_name TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB, -- additional context about the action
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- ============================================================================
-- SCHEDULED REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('executive', 'technical', 'financial', 'compliance', 'custom')),
  format TEXT NOT NULL CHECK (format IN ('pdf', 'csv', 'excel', 'json')),
  filters JSONB, -- report parameters
  schedule_cron TEXT NOT NULL, -- cron expression
  recipients TEXT[] NOT NULL, -- email addresses
  enabled BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheduled_report_id UUID REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'timeout')),
  file_url TEXT,
  file_size_bytes INTEGER,
  generation_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE enabled = TRUE;
CREATE INDEX idx_report_executions_report ON report_executions(scheduled_report_id, executed_at DESC);

-- ============================================================================
-- COST OPTIMIZATION SUGGESTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cost_optimization_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('model_switch', 'caching', 'batch_processing', 'prompt_optimization', 'rate_limit')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_monthly_savings NUMERIC NOT NULL,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  implementation_effort TEXT CHECK (implementation_effort IN ('low', 'medium', 'high')),
  details JSONB NOT NULL, -- specific recommendation details
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'accepted', 'rejected', 'implemented')),
  expires_at TIMESTAMPTZ NOT NULL,
  implemented_at TIMESTAMPTZ,
  actual_savings NUMERIC, -- tracked after implementation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_optimizations_status ON cost_optimization_suggestions(status, estimated_monthly_savings DESC);
CREATE INDEX idx_cost_optimizations_expires ON cost_optimization_suggestions(expires_at) WHERE status = 'new';

-- ============================================================================
-- CACHE ANALYSIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cache_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_hash TEXT NOT NULL,
  model TEXT NOT NULL,
  hit_count INTEGER DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  potential_savings NUMERIC DEFAULT 0,
  should_cache BOOLEAN DEFAULT FALSE,
  cache_priority INTEGER, -- higher = more important to cache
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_cache_analysis_prompt_model ON cache_analysis(prompt_hash, model);
CREATE INDEX idx_cache_analysis_priority ON cache_analysis(cache_priority DESC NULLS LAST) WHERE should_cache = TRUE;

-- ============================================================================
-- PROVIDER QUALITY SCORES
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_quality_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  service_type TEXT NOT NULL,
  avg_latency_ms NUMERIC,
  success_rate_pct NUMERIC,
  avg_cost_per_request NUMERIC,
  quality_per_dollar NUMERIC, -- composite score
  user_satisfaction_avg NUMERIC, -- from feedback
  total_requests INTEGER DEFAULT 0,
  measurement_window_start TIMESTAMPTZ NOT NULL,
  measurement_window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_provider_quality_provider ON provider_quality_scores(provider, created_at DESC);
CREATE INDEX idx_provider_quality_score ON provider_quality_scores(quality_per_dollar DESC NULLS LAST);

-- ============================================================================
-- USAGE FORECASTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('cost', 'requests', 'users', 'latency')),
  forecast_date DATE NOT NULL,
  predicted_value NUMERIC NOT NULL,
  confidence_interval_lower NUMERIC,
  confidence_interval_upper NUMERIC,
  model_accuracy NUMERIC, -- how accurate past predictions were
  actual_value NUMERIC, -- filled in after the date passes
  metadata JSONB, -- model parameters, features used, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_forecasts_type_date ON usage_forecasts(forecast_type, forecast_date);

-- ============================================================================
-- DASHBOARD LAYOUTS (Custom User Dashboards)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  layout JSONB NOT NULL, -- widget configuration
  filters JSONB, -- default filters
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dashboard_layouts_user ON dashboard_layouts(user_id, is_default DESC);

-- ============================================================================
-- PII DETECTION (for compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pii_scan_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_usage_id UUID REFERENCES api_usage(id) ON DELETE CASCADE,
  pii_detected BOOLEAN NOT NULL,
  pii_types TEXT[], -- ['email', 'phone', 'ssn', 'credit_card', 'address']
  redacted_content TEXT,
  scan_confidence NUMERIC,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pii_scans_usage ON pii_scan_results(api_usage_id);
CREATE INDEX idx_pii_scans_detected ON pii_scan_results(pii_detected, scanned_at DESC) WHERE pii_detected = TRUE;

-- ============================================================================
-- DEPLOYMENT TRACKING (correlate deploys with performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  service_name TEXT NOT NULL,
  deployed_by UUID REFERENCES auth.users(id),
  commit_hash TEXT,
  commit_message TEXT,
  deployed_at TIMESTAMPTZ NOT NULL,
  rollback_at TIMESTAMPTZ,
  was_rolled_back BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- CI/CD details, build info, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deployments_time ON deployments(deployed_at DESC);
CREATE INDEX idx_deployments_service ON deployments(service_name, deployed_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_slo_definitions_updated_at BEFORE UPDATE ON slo_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at BEFORE UPDATE ON scheduled_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_optimizations_updated_at BEFORE UPDATE ON cost_optimization_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_layouts_updated_at BEFORE UPDATE ON dashboard_layouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate MTTR when incident is resolved
CREATE OR REPLACE FUNCTION calculate_incident_mttr()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL THEN
    NEW.mttr_seconds = EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.started_at));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_mttr_trigger BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION calculate_incident_mttr();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own dashboard layouts
CREATE POLICY dashboard_layouts_select_own ON dashboard_layouts
  FOR SELECT USING (auth.uid() = user_id OR is_shared = TRUE);

CREATE POLICY dashboard_layouts_insert_own ON dashboard_layouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY dashboard_layouts_update_own ON dashboard_layouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY dashboard_layouts_delete_own ON dashboard_layouts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- INITIAL DATA / SEEDS
-- ============================================================================

-- Insert default SLO definitions
INSERT INTO slo_definitions (name, description, metric_type, target_value, time_window, alert_threshold) VALUES
  ('API Availability', '99.9% uptime for all API endpoints', 'availability', 99.9, '30 days', 99.0),
  ('Response Time P95', '95% of requests under 2000ms', 'latency', 95.0, '24 hours', 90.0),
  ('Error Rate', 'Less than 1% error rate', 'error_rate', 99.0, '7 days', 95.0),
  ('Model Response Quality', '90% user satisfaction rating', 'error_rate', 90.0, '30 days', 85.0)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_user_time 
  ON api_usage(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_model_cost 
  ON api_usage(model, total_cost DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_provider_service 
  ON api_usage(provider, service_type, created_at DESC);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE slo_definitions IS 'Service Level Objectives definitions and targets';
COMMENT ON TABLE slo_measurements IS 'Historical SLO measurements and compliance tracking';
COMMENT ON TABLE incidents IS 'Incident tracking and management';
COMMENT ON TABLE incident_timeline IS 'Timeline of events for each incident';
COMMENT ON TABLE traces IS 'Distributed tracing - top level trace information';
COMMENT ON TABLE spans IS 'Distributed tracing - individual spans within traces';
COMMENT ON TABLE alert_rules IS 'Configurable alerting rules';
COMMENT ON TABLE alert_notifications IS 'History of triggered alerts';
COMMENT ON TABLE audit_logs IS 'Audit trail of all user actions in the dashboard';
COMMENT ON TABLE scheduled_reports IS 'Configuration for automated report generation';
COMMENT ON TABLE report_executions IS 'History of report generation runs';
COMMENT ON TABLE cost_optimization_suggestions IS 'AI-generated cost saving opportunities';
COMMENT ON TABLE cache_analysis IS 'Analysis of caching opportunities';
COMMENT ON TABLE provider_quality_scores IS 'Quality metrics by provider and model';
COMMENT ON TABLE usage_forecasts IS 'Predictive analytics for usage and costs';
COMMENT ON TABLE dashboard_layouts IS 'User-customized dashboard configurations';
COMMENT ON TABLE pii_scan_results IS 'PII detection results for compliance';
COMMENT ON TABLE deployments IS 'Deployment tracking for correlation analysis';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Create a migration log entry
DO $$
BEGIN
  RAISE NOTICE 'Enterprise dashboard tables created successfully';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update frontend hooks to use new tables';
  RAISE NOTICE '2. Configure scheduled jobs for forecasts and cache analysis';
  RAISE NOTICE '3. Set up alert notification channels';
  RAISE NOTICE '4. Test RLS policies with different user roles';
END $$;
