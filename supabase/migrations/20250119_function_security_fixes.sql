-- Security Audit Fix Part 3: Function search_path Security
-- This migration adds search_path restrictions to all functions to prevent SQL injection
-- via search_path manipulation attacks

-- ============================================================================
-- Set search_path = pg_catalog, public for all functions
-- This prevents malicious users from manipulating search_path to inject code
-- ============================================================================

-- 1. calculate_quality_score
CREATE OR REPLACE FUNCTION calculate_quality_score(
    p_user_rating integer,
    p_was_edited boolean,
    p_edit_percentage double precision,
    p_was_used boolean,
    p_regeneration_count integer
) RETURNS double precision
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_score double precision := 50.0;
BEGIN
    IF p_user_rating IS NOT NULL THEN
        v_score := p_user_rating * 20.0;
    END IF;
    
    IF p_was_edited THEN
        v_score := v_score - (p_edit_percentage * 10.0);
    END IF;
    
    IF p_was_used THEN
        v_score := v_score + 10.0;
    END IF;
    
    v_score := v_score - (p_regeneration_count * 5.0);
    
    RETURN GREATEST(0.0, LEAST(100.0, v_score));
END;
$$;

-- 2. check_budget_limit
CREATE OR REPLACE FUNCTION check_budget_limit(
    p_user_id uuid,
    p_service_type text,
    p_cost numeric
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_monthly_limit numeric;
    v_current_spend numeric;
BEGIN
    SELECT monthly_cost_limit, current_month_cost
    INTO v_monthly_limit, v_current_spend
    FROM user_subscriptions
    WHERE user_id = p_user_id;
    
    IF v_monthly_limit IS NULL THEN
        RETURN true;
    END IF;
    
    RETURN (v_current_spend + p_cost) <= v_monthly_limit;
END;
$$;

-- 3. check_usage_limit
CREATE OR REPLACE FUNCTION check_usage_limit(
    p_user_id uuid,
    p_service_type text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_limit integer;
    v_used integer;
BEGIN
    IF p_service_type = 'content' THEN
        SELECT content_generations_limit, content_generations_used
        INTO v_limit, v_used
        FROM user_subscriptions
        WHERE user_id = p_user_id;
    ELSIF p_service_type = 'images' THEN
        SELECT image_generations_limit, image_generations_used
        INTO v_limit, v_used
        FROM user_subscriptions
        WHERE user_id = p_user_id;
    ELSIF p_service_type = 'video' THEN
        SELECT video_generations_limit, video_generations_used
        INTO v_limit, v_used
        FROM user_subscriptions
        WHERE user_id = p_user_id;
    ELSIF p_service_type = 'chat' THEN
        SELECT chat_messages_limit, chat_messages_used
        INTO v_limit, v_used
        FROM user_subscriptions
        WHERE user_id = p_user_id;
    ELSE
        RETURN true;
    END IF;
    
    RETURN v_used < v_limit;
END;
$$;

-- 4. detect_cost_spike
CREATE OR REPLACE FUNCTION detect_cost_spike(
    p_user_id uuid,
    p_hours_back integer DEFAULT 1
) RETURNS TABLE(
    spike_detected boolean,
    current_rate numeric,
    baseline_rate numeric,
    spike_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN QUERY
    WITH recent_cost AS (
        SELECT COALESCE(SUM(total_cost), 0) as cost
        FROM api_usage
        WHERE user_id = p_user_id
        AND created_at >= NOW() - (p_hours_back || ' hours')::interval
    ),
    baseline_cost AS (
        SELECT COALESCE(AVG(hourly_cost), 0) as cost
        FROM (
            SELECT DATE_TRUNC('hour', created_at) as hour,
                   SUM(total_cost) as hourly_cost
            FROM api_usage
            WHERE user_id = p_user_id
            AND created_at >= NOW() - interval '7 days'
            AND created_at < NOW() - (p_hours_back || ' hours')::interval
            GROUP BY DATE_TRUNC('hour', created_at)
        ) hourly_costs
    )
    SELECT 
        (recent.cost > baseline.cost * 2) as spike_detected,
        recent.cost as current_rate,
        baseline.cost as baseline_rate,
        CASE 
            WHEN baseline.cost > 0 THEN ((recent.cost - baseline.cost) / baseline.cost * 100)
            ELSE 0
        END as spike_percentage
    FROM recent_cost recent, baseline_cost baseline;
END;
$$;

-- 5. determine_ab_test_winner
CREATE OR REPLACE FUNCTION determine_ab_test_winner(p_ab_test_id uuid)
RETURNS TABLE(
    winner text,
    variant_a_avg_cost numeric,
    variant_b_avg_cost numeric,
    variant_a_avg_quality numeric,
    variant_b_avg_quality numeric,
    variant_a_avg_latency numeric,
    variant_b_avg_latency numeric,
    sample_size integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            variant,
            AVG(cost) as avg_cost,
            AVG(quality_score) as avg_quality,
            AVG(latency_ms) as avg_latency,
            COUNT(*) as count
        FROM ab_test_results
        WHERE ab_test_id = p_ab_test_id
        GROUP BY variant
    ),
    a_stats AS (SELECT * FROM stats WHERE variant = 'variant_a'),
    b_stats AS (SELECT * FROM stats WHERE variant = 'variant_b')
    SELECT 
        CASE
            WHEN a.avg_quality > b.avg_quality * 1.1 THEN 'variant_a'
            WHEN b.avg_quality > a.avg_quality * 1.1 THEN 'variant_b'
            WHEN a.avg_cost < b.avg_cost * 0.9 THEN 'variant_a'
            WHEN b.avg_cost < a.avg_cost * 0.9 THEN 'variant_b'
            ELSE 'tie'
        END as winner,
        a.avg_cost,
        b.avg_cost,
        a.avg_quality,
        b.avg_quality,
        a.avg_latency,
        b.avg_latency,
        (a.count + b.count)::integer as sample_size
    FROM a_stats a, b_stats b;
END;
$$;

-- 6. find_cacheable_prompts
CREATE OR REPLACE FUNCTION find_cacheable_prompts(
    p_user_id uuid,
    p_service_type text,
    p_min_frequency integer DEFAULT 3,
    p_days_back integer DEFAULT 30
) RETURNS TABLE(
    prompt_hash text,
    frequency bigint,
    avg_cost numeric,
    total_cost numeric,
    potential_savings numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        MD5(request_data::text) as prompt_hash,
        COUNT(*) as frequency,
        AVG(total_cost) as avg_cost,
        SUM(total_cost) as total_cost,
        SUM(total_cost) * 0.8 as potential_savings
    FROM api_usage
    WHERE user_id = p_user_id
    AND service_type = p_service_type
    AND created_at >= NOW() - (p_days_back || ' days')::interval
    AND status = 'success'
    GROUP BY MD5(request_data::text)
    HAVING COUNT(*) >= p_min_frequency
    ORDER BY COUNT(*) DESC, SUM(total_cost) DESC
    LIMIT 50;
END;
$$;

-- 7. generate_cost_forecast
CREATE OR REPLACE FUNCTION generate_cost_forecast(
    p_user_id uuid,
    p_days_ahead integer DEFAULT 30
) RETURNS TABLE(
    forecast_date date,
    predicted_cost numeric,
    confidence_lower numeric,
    confidence_upper numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_avg_daily_cost numeric;
    v_stddev numeric;
BEGIN
    SELECT 
        AVG(daily_cost),
        STDDEV(daily_cost)
    INTO v_avg_daily_cost, v_stddev
    FROM (
        SELECT DATE_TRUNC('day', created_at)::date as day,
               SUM(total_cost) as daily_cost
        FROM api_usage
        WHERE user_id = p_user_id
        AND created_at >= NOW() - interval '90 days'
        GROUP BY DATE_TRUNC('day', created_at)::date
    ) daily_costs;
    
    v_stddev := COALESCE(v_stddev, v_avg_daily_cost * 0.2);
    
    RETURN QUERY
    SELECT 
        (CURRENT_DATE + i)::date as forecast_date,
        v_avg_daily_cost as predicted_cost,
        GREATEST(0, v_avg_daily_cost - (v_stddev * 1.96)) as confidence_lower,
        v_avg_daily_cost + (v_stddev * 1.96) as confidence_upper
    FROM generate_series(1, p_days_ahead) as i;
END;
$$;

-- 8. generate_cost_suggestions
CREATE OR REPLACE FUNCTION generate_cost_suggestions(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    INSERT INTO cost_optimization_suggestions (
        user_id, suggestion_type, current_provider, current_model,
        current_avg_cost, suggested_provider, suggested_model,
        suggested_avg_cost, estimated_monthly_savings, confidence_score,
        based_on_requests, description
    )
    SELECT 
        p_user_id,
        'provider_switch',
        provider,
        model,
        AVG(total_cost),
        'openai',
        'gpt-4o-mini',
        AVG(total_cost) * 0.7,
        (AVG(total_cost) - AVG(total_cost) * 0.7) * COUNT(*) * 30 / EXTRACT(DAY FROM (MAX(created_at) - MIN(created_at))),
        0.85,
        COUNT(*),
        'Consider switching to more cost-effective models for similar quality'
    FROM api_usage
    WHERE user_id = p_user_id
    AND created_at >= NOW() - interval '30 days'
    AND service_type = 'content'
    GROUP BY provider, model
    HAVING COUNT(*) > 10 AND AVG(total_cost) > 0.01
    ON CONFLICT DO NOTHING;
END;
$$;

-- 9. get_campaign_roi_summary
CREATE OR REPLACE FUNCTION get_campaign_roi_summary(p_campaign_id uuid)
RETURNS TABLE(
    total_cost numeric,
    total_content_generated bigint,
    avg_quality_score numeric,
    conversion_rate numeric,
    roi_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(au.total_cost) as total_cost,
        COUNT(*) as total_content_generated,
        AVG(qm.overall_quality_score) as avg_quality_score,
        (SUM(CASE WHEN co.conversion_achieved THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100) as conversion_rate,
        ((SUM(CASE WHEN co.conversion_achieved THEN 1 ELSE 0 END)::numeric / NULLIF(SUM(au.total_cost), 0)) * 100) as roi_score
    FROM api_usage au
    LEFT JOIN quality_metrics qm ON au.id = qm.api_usage_id
    LEFT JOIN campaign_outcomes co ON au.id = co.api_usage_id
    WHERE au.campaign_id = p_campaign_id;
END;
$$;

-- 10. get_churn_risk_users
CREATE OR REPLACE FUNCTION get_churn_risk_users(min_score integer DEFAULT 70)
RETURNS TABLE(
    user_id uuid,
    churn_risk_score integer,
    last_activity timestamp with time zone,
    days_since_activity numeric,
    avg_quality_score numeric,
    error_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN QUERY
    WITH user_stats AS (
        SELECT 
            au.user_id,
            MAX(au.created_at) as last_activity,
            EXTRACT(DAY FROM NOW() - MAX(au.created_at)) as days_inactive,
            AVG(qm.overall_quality_score) as avg_quality,
            (SUM(CASE WHEN au.status = 'error' THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100) as error_pct
        FROM api_usage au
        LEFT JOIN quality_metrics qm ON au.id = qm.api_usage_id
        WHERE au.created_at >= NOW() - interval '90 days'
        GROUP BY au.user_id
    )
    SELECT 
        us.user_id,
        (
            (LEAST(us.days_inactive * 2, 50)) +
            (CASE WHEN us.avg_quality < 70 THEN 25 ELSE 0 END) +
            (CASE WHEN us.error_pct > 10 THEN 25 ELSE 0 END)
        )::integer as churn_risk_score,
        us.last_activity,
        us.days_inactive,
        us.avg_quality,
        us.error_pct
    FROM user_stats us
    WHERE (
        (LEAST(us.days_inactive * 2, 50)) +
        (CASE WHEN us.avg_quality < 70 THEN 25 ELSE 0 END) +
        (CASE WHEN us.error_pct > 10 THEN 25 ELSE 0 END)
    ) >= min_score
    ORDER BY churn_risk_score DESC;
END;
$$;

-- Continue in next migration file due to size...
