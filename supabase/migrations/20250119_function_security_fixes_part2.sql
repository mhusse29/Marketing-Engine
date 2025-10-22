-- Security Audit Fix Part 3B: Remaining Function search_path Security
-- Continuation of function security fixes

-- 11. get_health_score
CREATE OR REPLACE FUNCTION get_health_score(interval_duration text DEFAULT '1 hour')
RETURNS TABLE(
    health_score integer,
    total_requests bigint,
    success_rate numeric,
    avg_latency numeric,
    error_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (
            CASE 
                WHEN success_pct >= 99 THEN 100
                WHEN success_pct >= 95 THEN 90
                WHEN success_pct >= 90 THEN 80
                WHEN success_pct >= 85 THEN 70
                ELSE 50
            END -
            CASE 
                WHEN avg_lat > 5000 THEN 20
                WHEN avg_lat > 3000 THEN 10
                WHEN avg_lat > 1000 THEN 5
                ELSE 0
            END
        )::integer as health_score,
        total_reqs,
        success_pct,
        avg_lat,
        error_cnt
    FROM (
        SELECT 
            COUNT(*) as total_reqs,
            (SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100) as success_pct,
            AVG(latency_ms) as avg_lat,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_cnt
        FROM api_usage
        WHERE created_at >= NOW() - interval_duration::interval
    ) stats;
END;
$$;

-- 12. handle_new_user_subscription
CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    INSERT INTO user_subscriptions (user_id, plan_type, plan_name)
    VALUES (NEW.id, 'demo', 'Demo Plan')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- 13. increment_subscription_usage
CREATE OR REPLACE FUNCTION increment_subscription_usage(
    p_user_id uuid,
    p_service_type text,
    p_cost numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF p_service_type = 'content' THEN
        UPDATE user_subscriptions
        SET content_generations_used = content_generations_used + 1,
            current_month_cost = current_month_cost + p_cost,
            lifetime_cost = lifetime_cost + p_cost
        WHERE user_id = p_user_id;
    ELSIF p_service_type = 'images' THEN
        UPDATE user_subscriptions
        SET image_generations_used = image_generations_used + 1,
            current_month_cost = current_month_cost + p_cost,
            lifetime_cost = lifetime_cost + p_cost
        WHERE user_id = p_user_id;
    ELSIF p_service_type = 'video' THEN
        UPDATE user_subscriptions
        SET video_generations_used = video_generations_used + 1,
            current_month_cost = current_month_cost + p_cost,
            lifetime_cost = lifetime_cost + p_cost
        WHERE user_id = p_user_id;
    ELSIF p_service_type = 'chat' THEN
        UPDATE user_subscriptions
        SET chat_messages_used = chat_messages_used + 1,
            current_month_cost = current_month_cost + p_cost,
            lifetime_cost = lifetime_cost + p_cost
        WHERE user_id = p_user_id;
    END IF;
END;
$$;

-- 14. refresh_analytics_if_stale
CREATE OR REPLACE FUNCTION refresh_analytics_if_stale(max_age_minutes integer DEFAULT 5)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_last_refresh timestamp with time zone;
BEGIN
    SELECT last_refresh_at INTO v_last_refresh
    FROM metrics_catalog
    WHERE metric_name = 'analytics_views'
    LIMIT 1;
    
    IF v_last_refresh IS NULL OR v_last_refresh < NOW() - (max_age_minutes || ' minutes')::interval THEN
        PERFORM refresh_analytics_views();
    END IF;
END;
$$;

-- 15. refresh_analytics_views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_start_time timestamp := clock_timestamp();
    v_duration_ms integer;
BEGIN
    -- Note: This would refresh materialized views if they exist
    -- Since we're using regular views for better real-time data, this is a no-op
    -- but kept for compatibility
    
    v_duration_ms := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::integer;
    
    UPDATE metrics_catalog
    SET last_refresh_at = NOW(),
        last_refresh_duration_ms = v_duration_ms,
        status = 'healthy'
    WHERE metric_name = 'analytics_views';
    
    IF NOT FOUND THEN
        INSERT INTO metrics_catalog (
            metric_name, metric_type, refresh_schedule, last_refresh_at, 
            last_refresh_duration_ms, status
        ) VALUES (
            'analytics_views', 'view', '*/5 * * * *', NOW(), v_duration_ms, 'healthy'
        );
    END IF;
END;
$$;

-- 16. reset_monthly_usage
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    UPDATE user_subscriptions
    SET content_generations_used = 0,
        image_generations_used = 0,
        video_generations_used = 0,
        chat_messages_used = 0,
        current_month_cost = 0,
        last_reset_at = NOW()
    WHERE billing_period_end < NOW()
    AND auto_renew = true;
    
    UPDATE user_subscriptions
    SET billing_period_start = billing_period_end,
        billing_period_end = billing_period_end + interval '1 month'
    WHERE billing_period_end < NOW()
    AND auto_renew = true;
END;
$$;

-- 17. trigger_refresh_analytics_views
CREATE OR REPLACE FUNCTION trigger_refresh_analytics_views()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    PERFORM refresh_analytics_if_stale(5);
    RETURN NEW;
END;
$$;

-- 18. update_budget_spend
CREATE OR REPLACE FUNCTION update_budget_spend(
    p_user_id uuid,
    p_service_type text,
    p_cost numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    UPDATE user_subscriptions
    SET current_month_cost = current_month_cost + p_cost,
        lifetime_cost = lifetime_cost + p_cost,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$;

-- 19. update_metrics_catalog_entry
CREATE OR REPLACE FUNCTION update_metrics_catalog_entry(
    p_metric_name text,
    p_row_count bigint,
    p_duration_ms integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    UPDATE metrics_catalog
    SET last_refresh_at = NOW(),
        last_refresh_duration_ms = p_duration_ms,
        row_count = p_row_count,
        data_freshness_minutes = 0,
        status = 'healthy',
        updated_at = NOW()
    WHERE metric_name = p_metric_name;
    
    IF NOT FOUND THEN
        INSERT INTO metrics_catalog (
            metric_name, metric_type, last_refresh_at, 
            last_refresh_duration_ms, row_count, status
        ) VALUES (
            p_metric_name, 'table', NOW(), p_duration_ms, p_row_count, 'healthy'
        );
    END IF;
END;
$$;

-- 20. update_updated_at (generic trigger function)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Add comments for audit trail
COMMENT ON FUNCTION calculate_quality_score IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION check_budget_limit IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION check_usage_limit IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION detect_cost_spike IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION determine_ab_test_winner IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION find_cacheable_prompts IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION generate_cost_forecast IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION generate_cost_suggestions IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION get_campaign_roi_summary IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION get_churn_risk_users IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION get_health_score IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION handle_new_user_subscription IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION increment_subscription_usage IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION refresh_analytics_if_stale IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION refresh_analytics_views IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION reset_monthly_usage IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION trigger_refresh_analytics_views IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION update_budget_spend IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION update_metrics_catalog_entry IS 'Security hardened with search_path restriction';
COMMENT ON FUNCTION update_updated_at IS 'Security hardened with search_path restriction';
