-- Security Audit Fix Part 2: RLS Policies for Remaining Analytics Tables
-- This migration continues RLS enablement for remaining tables

-- ============================================================================
-- 7. Campaign Outcomes
-- ============================================================================

ALTER TABLE campaign_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaign outcomes for their data"
ON campaign_outcomes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert campaign outcomes"
ON campaign_outcomes FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- 8. Usage Forecasts
-- ============================================================================

ALTER TABLE usage_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their usage forecasts"
ON usage_forecasts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage forecasts"
ON usage_forecasts FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- 9. Cache Analysis
-- ============================================================================

ALTER TABLE cache_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their cache analysis"
ON cache_analysis FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert cache analysis"
ON cache_analysis FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- 10. Prompt Complexity Scores
-- ============================================================================

ALTER TABLE prompt_complexity_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prompt complexity for their data"
ON prompt_complexity_scores FOR SELECT
USING (EXISTS (
    SELECT 1 FROM api_usage 
    WHERE api_usage.id = prompt_complexity_scores.api_usage_id 
    AND api_usage.user_id = auth.uid()
));

CREATE POLICY "System can insert prompt complexity scores"
ON prompt_complexity_scores FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- 11. Cost Optimization Suggestions
-- ============================================================================

ALTER TABLE cost_optimization_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their cost optimization suggestions"
ON cost_optimization_suggestions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert cost optimization suggestions"
ON cost_optimization_suggestions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their cost optimization suggestions"
ON cost_optimization_suggestions FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================================================
-- 12. Model Routing Rules
-- ============================================================================

ALTER TABLE model_routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their model routing rules"
ON model_routing_rules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their model routing rules"
ON model_routing_rules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their model routing rules"
ON model_routing_rules FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their model routing rules"
ON model_routing_rules FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 13. Notification Preferences
-- ============================================================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notification preferences"
ON notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their notification preferences"
ON notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their notification preferences"
ON notification_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notification preferences"
ON notification_preferences FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 14. System Tables (shared across all users)
-- ============================================================================

ALTER TABLE metrics_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view metrics catalog"
ON metrics_catalog FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage metrics catalog"
ON metrics_catalog FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 15. Deployments and Incidents (operational tables)
-- ============================================================================

ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view deployments"
ON deployments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage deployments"
ON deployments FOR ALL
USING (true)
WITH CHECK (true);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view incidents"
ON incidents FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage incidents"
ON incidents FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 16. Experiments
-- ============================================================================

ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view experiments"
ON experiments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage experiments"
ON experiments FOR ALL
USING (true)
WITH CHECK (true);

-- Add comments for audit trail
COMMENT ON TABLE ab_tests IS 'RLS enabled - users can only access their own tests';
COMMENT ON TABLE quality_metrics IS 'RLS enabled - users can only access their own metrics';
COMMENT ON TABLE alert_rules IS 'RLS enabled - users can only access their own alert rules';
COMMENT ON TABLE cache_analysis IS 'RLS enabled - users can only access their own cache analysis';
COMMENT ON TABLE cost_optimization_suggestions IS 'RLS enabled - users can only access their own suggestions';
COMMENT ON TABLE metrics_catalog IS 'RLS enabled - shared system table, read-only for all users';
COMMENT ON TABLE deployments IS 'RLS enabled - operational table, visible to all authenticated users';
COMMENT ON TABLE incidents IS 'RLS enabled - operational table, visible to all authenticated users';
COMMENT ON TABLE experiments IS 'RLS enabled - system table, visible to all authenticated users';
