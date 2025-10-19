-- =====================================================
-- USAGE TRACKING SYSTEM - DEMO VERSION
-- High limits for free trial, tracking everything
-- =====================================================

-- 1. API USAGE TRACKING TABLE
-- Tracks every API call with costs, tokens, and performance
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- API Call Metadata
  service_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  
  -- Request Details
  request_id TEXT,
  request_data JSONB,
  response_data JSONB,
  
  -- Usage Metrics
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  images_generated INTEGER DEFAULT 0,
  video_seconds NUMERIC(10,2) DEFAULT 0,
  
  -- Cost Calculation
  input_cost NUMERIC(12,6) DEFAULT 0,
  output_cost NUMERIC(12,6) DEFAULT 0,
  generation_cost NUMERIC(12,6) DEFAULT 0,
  total_cost NUMERIC(12,6) NOT NULL,
  
  -- Performance
  latency_ms INTEGER,
  status TEXT NOT NULL,
  error_message TEXT,
  
  -- Tracking
  ip_address INET,
  user_agent TEXT,
  campaign_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_service_type CHECK (service_type IN ('content', 'images', 'video', 'chat', 'tools', 'refine', 'enhance')),
  CONSTRAINT valid_status CHECK (status IN ('success', 'error', 'rate_limited', 'timeout', 'cancelled'))
);

-- Indexes for performance
CREATE INDEX idx_api_usage_user_created ON public.api_usage(user_id, created_at DESC);
CREATE INDEX idx_api_usage_service_provider ON public.api_usage(service_type, provider);
CREATE INDEX idx_api_usage_created_at ON public.api_usage(created_at DESC);
CREATE INDEX idx_api_usage_status ON public.api_usage(status) WHERE status != 'success';
CREATE INDEX idx_api_usage_campaign ON public.api_usage(campaign_id) WHERE campaign_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON public.api_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert usage records (service_role only)
CREATE POLICY "System can insert usage"
  ON public.api_usage
  FOR INSERT
  WITH CHECK (true);

-- Prevent updates/deletes (immutable audit log)
CREATE POLICY "No updates allowed"
  ON public.api_usage
  FOR UPDATE
  USING (false);

CREATE POLICY "No deletes allowed"
  ON public.api_usage
  FOR DELETE
  USING (false);

-- =====================================================
-- 2. USER SUBSCRIPTIONS TABLE
-- Manages plans, limits, and current usage
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription Tier
  plan_type TEXT NOT NULL DEFAULT 'demo',
  plan_name TEXT NOT NULL DEFAULT 'Demo Plan',
  
  -- Billing (for future)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  
  -- Usage Limits (per month) - DEMO: Very high limits
  content_generations_limit INTEGER DEFAULT 999999,
  image_generations_limit INTEGER DEFAULT 999999,
  video_generations_limit INTEGER DEFAULT 999999,
  chat_messages_limit INTEGER DEFAULT 999999,
  
  -- Current Usage (resets monthly)
  content_generations_used INTEGER DEFAULT 0,
  image_generations_used INTEGER DEFAULT 0,
  video_generations_used INTEGER DEFAULT 0,
  chat_messages_used INTEGER DEFAULT 0,
  
  -- Cost Tracking
  monthly_cost_limit NUMERIC(12,2),
  current_month_cost NUMERIC(12,2) DEFAULT 0,
  lifetime_cost NUMERIC(12,2) DEFAULT 0,
  
  -- Flags
  is_active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT true,
  usage_alerts_enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_reset_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_plan_type CHECK (plan_type IN ('demo', 'free', 'starter', 'pro', 'enterprise', 'custom'))
);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update certain fields (alerts preference)
CREATE POLICY "Users can update own preferences"
  ON public.user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-create demo subscription on user signup
CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (
    user_id,
    plan_type,
    plan_name,
    billing_period_start,
    billing_period_end
  )
  VALUES (
    NEW.id,
    'demo',
    'Demo Plan - Unlimited Access',
    now(),
    now() + INTERVAL '1 year' -- Demo period
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_subscription();

-- =====================================================
-- 3. USAGE ALERTS TABLE
-- Automated alerts for usage thresholds
-- =====================================================

CREATE TABLE IF NOT EXISTS public.usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Alert Configuration
  alert_type TEXT NOT NULL,
  threshold_type TEXT NOT NULL,
  threshold_value NUMERIC(12,2) NOT NULL,
  
  -- Alert Details
  current_value NUMERIC(12,2),
  limit_value NUMERIC(12,2),
  resource_type TEXT NOT NULL,
  
  -- Notification
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_alert_type CHECK (alert_type IN ('usage_threshold', 'cost_threshold', 'limit_reached', 'error_spike', 'rate_limit')),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical'))
);

CREATE INDEX idx_usage_alerts_user_unresolved ON public.usage_alerts(user_id, is_resolved, created_at DESC);

-- Enable RLS
ALTER TABLE public.usage_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON public.usage_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark alerts resolved"
  ON public.usage_alerts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. API RATE LIMITS TABLE
-- Per-service rate limiting
-- =====================================================

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rate Limit Config
  service_type TEXT NOT NULL,
  window_type TEXT NOT NULL,
  max_requests INTEGER NOT NULL,
  
  -- Current State
  current_requests INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL,
  
  -- Blocking
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMPTZ,
  blocked_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_user_service_window UNIQUE (user_id, service_type, window_type),
  CONSTRAINT valid_window_type CHECK (window_type IN ('minute', 'hour', 'day', 'month'))
);

CREATE INDEX idx_rate_limits_user_service ON public.api_rate_limits(user_id, service_type);

-- Enable RLS
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON public.api_rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. USAGE AGGREGATIONS TABLE
-- Daily/weekly/monthly summaries
-- =====================================================

CREATE TABLE IF NOT EXISTS public.usage_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Time Period
  period_type TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Usage Counts
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  
  -- Service-specific
  content_generations INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  video_seconds NUMERIC(12,2) DEFAULT 0,
  chat_messages INTEGER DEFAULT 0,
  
  -- Cost Breakdown
  content_cost NUMERIC(12,6) DEFAULT 0,
  image_cost NUMERIC(12,6) DEFAULT 0,
  video_cost NUMERIC(12,6) DEFAULT 0,
  chat_cost NUMERIC(12,6) DEFAULT 0,
  tools_cost NUMERIC(12,6) DEFAULT 0,
  total_cost NUMERIC(12,6) DEFAULT 0,
  
  -- Token Usage (text models only)
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  
  -- Performance
  avg_latency_ms INTEGER,
  p95_latency_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_user_period UNIQUE (user_id, period_type, period_start),
  CONSTRAINT valid_period_type CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly'))
);

CREATE INDEX idx_aggregations_user_period ON public.usage_aggregations(user_id, period_type, period_start DESC);

-- Enable RLS
ALTER TABLE public.usage_aggregations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own aggregations"
  ON public.usage_aggregations
  FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. CAMPAIGNS TABLE (Optional)
-- Organize generations by campaign
-- =====================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Campaign Details
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  
  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  
  -- Usage Tracking
  total_cost NUMERIC(12,6) DEFAULT 0,
  total_generations INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived'))
);

CREATE INDEX idx_campaigns_user_status ON public.campaigns(user_id, status);
CREATE INDEX idx_campaigns_user_created ON public.campaigns(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own campaigns"
  ON public.campaigns
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to increment subscription usage
CREATE OR REPLACE FUNCTION increment_subscription_usage(
  p_user_id UUID,
  p_service_type TEXT,
  p_cost NUMERIC
)
RETURNS void AS $$
DECLARE
  v_field TEXT;
BEGIN
  -- Determine which field to increment
  v_field := CASE p_service_type
    WHEN 'content' THEN 'content_generations_used'
    WHEN 'images' THEN 'image_generations_used'
    WHEN 'video' THEN 'video_generations_used'
    WHEN 'chat' THEN 'chat_messages_used'
    ELSE 'content_generations_used'
  END;
  
  -- Update the subscription
  EXECUTE format(
    'UPDATE public.user_subscriptions
     SET %I = %I + 1,
         current_month_cost = current_month_cost + $1,
         lifetime_cost = lifetime_cost + $1
     WHERE user_id = $2',
    v_field, v_field
  ) USING p_cost, p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has exceeded limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_service_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_used INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get subscription
  SELECT * INTO v_subscription
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false; -- No subscription, allow
  END IF;
  
  -- Check specific service limit
  CASE p_service_type
    WHEN 'content' THEN
      v_used := v_subscription.content_generations_used;
      v_limit := v_subscription.content_generations_limit;
    WHEN 'images' THEN
      v_used := v_subscription.image_generations_used;
      v_limit := v_subscription.image_generations_limit;
    WHEN 'video' THEN
      v_used := v_subscription.video_generations_used;
      v_limit := v_subscription.video_generations_limit;
    WHEN 'chat' THEN
      v_used := v_subscription.chat_messages_used;
      v_limit := v_subscription.chat_messages_limit;
    ELSE
      RETURN false; -- Unknown service, allow
  END CASE;
  
  -- Return true if limit exceeded
  RETURN v_used >= v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage (called by cron job)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET 
    content_generations_used = 0,
    image_generations_used = 0,
    video_generations_used = 0,
    chat_messages_used = 0,
    current_month_cost = 0,
    last_reset_at = now()
  WHERE 
    last_reset_at < date_trunc('month', now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.api_usage IS 'Tracks every API call with costs, tokens, and performance metrics';
COMMENT ON TABLE public.user_subscriptions IS 'Manages user subscription plans, limits, and current usage';
COMMENT ON TABLE public.usage_alerts IS 'Automated alerts when usage thresholds are reached';
COMMENT ON TABLE public.api_rate_limits IS 'Rate limiting per service to prevent abuse';
COMMENT ON TABLE public.usage_aggregations IS 'Pre-calculated daily/weekly/monthly usage summaries for analytics';
COMMENT ON TABLE public.campaigns IS 'Optional: Organize API usage by campaign for better tracking';

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create demo subscriptions for existing users (if any)
INSERT INTO public.user_subscriptions (user_id, plan_type, plan_name, billing_period_start, billing_period_end)
SELECT 
  id,
  'demo',
  'Demo Plan - Unlimited Access',
  now(),
  now() + INTERVAL '1 year'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_subscriptions WHERE user_subscriptions.user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;
