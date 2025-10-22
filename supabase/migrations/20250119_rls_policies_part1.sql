-- Security Audit Fix Part 1: RLS Policies for Core Analytics Tables
-- This migration enables RLS and creates policies based on actual database tables

-- ============================================================================
-- 1. AB Tests and Results
-- ============================================================================

ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AB tests"
ON ab_tests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AB tests"
ON ab_tests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AB tests"
ON ab_tests FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AB tests"
ON ab_tests FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view AB test results for their tests"
ON ab_test_results FOR SELECT
USING (EXISTS (
    SELECT 1 FROM ab_tests 
    WHERE ab_tests.id = ab_test_results.ab_test_id 
    AND ab_tests.user_id = auth.uid()
));

CREATE POLICY "System can insert AB test results"
ON ab_test_results FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- 2. Quality Metrics
-- ============================================================================

ALTER TABLE quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quality metrics for their data"
ON quality_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert quality metrics"
ON quality_metrics FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their quality metrics"
ON quality_metrics FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Provider Quality Scores
-- ============================================================================

ALTER TABLE provider_quality_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their provider quality scores"
ON provider_quality_scores FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert provider quality scores"
ON provider_quality_scores FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- 4. Alert System
-- ============================================================================

ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert rules"
ON alert_rules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alert rules"
ON alert_rules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert rules"
ON alert_rules FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alert rules"
ON alert_rules FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own alert history"
ON alert_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert alert history"
ON alert_history FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own alert history"
ON alert_history FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================================================
-- 5. Analytics Reports
-- ============================================================================

ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics reports"
ON analytics_reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics reports"
ON analytics_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics reports"
ON analytics_reports FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics reports"
ON analytics_reports FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 6. Budget Limits
-- ============================================================================

ALTER TABLE budget_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budget limits"
ON budget_limits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget limits"
ON budget_limits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget limits"
ON budget_limits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget limits"
ON budget_limits FOR DELETE
USING (auth.uid() = user_id);
