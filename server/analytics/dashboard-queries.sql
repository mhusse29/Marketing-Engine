-- ═══════════════════════════════════════════════════════════════════════════════
-- BADU ANALYTICS DASHBOARD QUERIES
-- Power dashboards with Metabase, Superset, or custom in-app views
-- ═══════════════════════════════════════════════════════════════════════════════

-- Query 1: Overall Performance Metrics
-- Tracks latency, retrieval quality, token usage, and costs
CREATE OR REPLACE VIEW badu_performance_overview AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_requests,
  AVG(total_latency_ms) as avg_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_latency_ms) as p95_latency_ms,
  AVG(retrieval_latency_ms) as avg_retrieval_ms,
  AVG(llm_latency_ms) as avg_llm_ms,
  AVG(chunks_retrieved) as avg_chunks,
  SUM(total_tokens) as total_tokens,
  SUM(total_cost) as total_cost,
  COUNT(*) FILTER (WHERE status = 'success') as successful_requests,
  COUNT(*) FILTER (WHERE status = 'error') as failed_requests,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate
FROM badu_metrics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Query 2: Model Usage & Costs
-- Tracks which models are used and their cost efficiency
CREATE OR REPLACE VIEW badu_model_usage AS
SELECT 
  model,
  panel,
  COUNT(*) as request_count,
  AVG(llm_latency_ms) as avg_latency_ms,
  SUM(total_tokens) as total_tokens,
  AVG(total_tokens) as avg_tokens_per_request,
  SUM(total_cost) as total_cost,
  AVG(total_cost) as avg_cost_per_request,
  ROUND(SUM(total_cost) / NULLIF(SUM(total_tokens), 0) * 1000, 4) as cost_per_1k_tokens,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate
FROM badu_metrics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY model, panel
ORDER BY request_count DESC;

-- Query 3: User Engagement & Retention
-- Tracks user activity, session patterns, and retention
CREATE OR REPLACE VIEW badu_user_engagement AS
SELECT 
  DATE_TRUNC('week', s.created_at) as week,
  COUNT(DISTINCT s.user_id) as active_users,
  COUNT(DISTINCT s.id) as total_sessions,
  AVG(msg_counts.message_count) as avg_messages_per_session,
  COUNT(DISTINCT s.user_id) FILTER (WHERE msg_counts.message_count > 5) as engaged_users,
  ROUND(AVG(EXTRACT(EPOCH FROM (s.updated_at - s.created_at)) / 60), 2) as avg_session_duration_min
FROM badu_sessions s
LEFT JOIN (
  SELECT session_id, COUNT(*) as message_count
  FROM badu_messages
  GROUP BY session_id
) msg_counts ON s.id = msg_counts.session_id
WHERE s.created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', s.created_at)
ORDER BY week DESC;

-- Query 4: Panel & Schema Usage
-- Shows which features users interact with most
CREATE OR REPLACE VIEW badu_feature_usage AS
SELECT 
  panel,
  schema_type,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(retrieval_latency_ms) as avg_retrieval_ms,
  AVG(llm_latency_ms) as avg_llm_ms,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate
FROM badu_metrics
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND panel IS NOT NULL
GROUP BY panel, schema_type
ORDER BY usage_count DESC;

-- Query 5: Retrieval Quality Metrics
-- Tracks RAG chunk retrieval and relevance
CREATE OR REPLACE VIEW badu_retrieval_quality AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  panel,
  AVG(chunks_retrieved) as avg_chunks,
  AVG(
    CASE 
      WHEN chunk_scores IS NOT NULL AND array_length(chunk_scores, 1) > 0
      THEN (
        SELECT AVG(score::numeric) 
        FROM unnest(chunk_scores) as score
      )
      ELSE NULL
    END
  ) as avg_chunk_score,
  COUNT(*) as total_queries,
  COUNT(*) FILTER (WHERE chunks_retrieved = 0) as zero_chunk_queries
FROM badu_metrics
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND panel IS NOT NULL
GROUP BY DATE_TRUNC('day', created_at), panel
ORDER BY date DESC, panel;

-- Query 6: Feedback Analysis
-- Shows user satisfaction and feedback patterns
CREATE OR REPLACE VIEW badu_feedback_analysis AS
SELECT 
  DATE_TRUNC('week', f.created_at) as week,
  AVG(f.rating) as avg_rating,
  COUNT(*) as feedback_count,
  COUNT(*) FILTER (WHERE f.rating >= 4) as positive_feedback,
  COUNT(*) FILTER (WHERE f.rating <= 2) as negative_feedback,
  ROUND(100.0 * COUNT(*) FILTER (WHERE f.rating >= 4) / COUNT(*), 2) as positive_rate,
  string_agg(DISTINCT tag, ', ' ORDER BY tag) as common_tags
FROM badu_feedback f
LEFT JOIN LATERAL unnest(f.reason_tags) as tag ON true
WHERE f.created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', f.created_at)
ORDER BY week DESC;

-- Query 7: Guardrail Hits & Safety
-- Tracks content moderation and policy violations
CREATE OR REPLACE VIEW badu_safety_metrics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE array_length(guardrail_hits, 1) > 0) as guardrail_triggered,
  string_agg(DISTINCT hit, ', ' ORDER BY hit) as triggered_rules
FROM badu_metrics,
LATERAL unnest(COALESCE(guardrail_hits, ARRAY[]::text[])) as hit
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Query 8: Complexity & Model Routing
-- Tracks adaptive model selection effectiveness
CREATE OR REPLACE VIEW badu_complexity_analysis AS
SELECT 
  CASE 
    WHEN (structured_response->>'_meta')::jsonb->>'complexity_score' IS NULL THEN 'unknown'
    WHEN ((structured_response->>'_meta')::jsonb->>'complexity_score')::numeric < 0.5 THEN 'low'
    WHEN ((structured_response->>'_meta')::jsonb->>'complexity_score')::numeric < 0.75 THEN 'medium'
    ELSE 'high'
  END as complexity_bucket,
  model,
  COUNT(*) as request_count,
  AVG(latency_ms) as avg_latency,
  AVG(tokens_used) as avg_tokens,
  SUM(tokens_used) * 0.00001 as estimated_cost
FROM badu_messages
WHERE role = 'assistant'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY complexity_bucket, model
ORDER BY complexity_bucket, request_count DESC;

-- Query 9: Regression Detection
-- Identifies potential regressions in performance or quality
CREATE OR REPLACE VIEW badu_regression_alerts AS
WITH current_week AS (
  SELECT 
    AVG(total_latency_ms) as avg_latency,
    AVG(chunks_retrieved) as avg_chunks,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate
  FROM badu_metrics
  WHERE created_at >= NOW() - INTERVAL '7 days'
),
previous_week AS (
  SELECT 
    AVG(total_latency_ms) as avg_latency,
    AVG(chunks_retrieved) as avg_chunks,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate
  FROM badu_metrics
  WHERE created_at >= NOW() - INTERVAL '14 days'
    AND created_at < NOW() - INTERVAL '7 days'
)
SELECT 
  'latency' as metric,
  c.avg_latency as current_value,
  p.avg_latency as previous_value,
  ROUND(100.0 * (c.avg_latency - p.avg_latency) / NULLIF(p.avg_latency, 0), 2) as change_pct,
  CASE 
    WHEN (c.avg_latency - p.avg_latency) / NULLIF(p.avg_latency, 0) > 0.2 THEN 'WARNING'
    ELSE 'OK'
  END as status
FROM current_week c, previous_week p
UNION ALL
SELECT 
  'chunks_retrieved' as metric,
  c.avg_chunks,
  p.avg_chunks,
  ROUND(100.0 * (c.avg_chunks - p.avg_chunks) / NULLIF(p.avg_chunks, 0), 2),
  CASE 
    WHEN (c.avg_chunks - p.avg_chunks) / NULLIF(p.avg_chunks, 0) < -0.2 THEN 'WARNING'
    ELSE 'OK'
  END
FROM current_week c, previous_week p
UNION ALL
SELECT 
  'success_rate' as metric,
  c.success_rate,
  p.success_rate,
  ROUND(c.success_rate - p.success_rate, 2),
  CASE 
    WHEN c.success_rate - p.success_rate < -5 THEN 'WARNING'
    ELSE 'OK'
  END
FROM current_week c, previous_week p;
