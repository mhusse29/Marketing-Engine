# 🎯 USAGE TRACKING & COST MANAGEMENT MASTER PLAN
## Marketing Engine - Comprehensive Database & API Tracking System

---

## 📊 **CURRENT STATE ANALYSIS**

### **Existing Database Tables:**
```sql
✅ profiles (id, full_name, avatar_url, bio, created_at, updated_at)
✅ activity_logs (id, user_id, action, details, ip_address, user_agent, created_at)
```

### **Identified AI Services & APIs:**

| Service | Model | Usage | Location |
|---------|-------|-------|----------|
| **OpenAI GPT-5** | `gpt-5` | Content generation (primary) | `server/ai-gateway.mjs:457` |
| **OpenAI GPT-4o** | `gpt-4o` | Content fallback | `server/ai-gateway.mjs:458` |
| **OpenAI GPT-5 Chat** | `gpt-5-chat-latest` | BADU assistant | `server/ai-gateway.mjs:459` |
| **DALL-E 3** | `dall-e-3` | Image generation | `server/ai-gateway.mjs:1553` |
| **FLUX Pro 1.1** | `flux-pro-1.1` / `flux-pro-1.1-ultra` | Image generation | `server/ai-gateway.mjs:1573-1575` |
| **Stability AI** | `stable-diffusion-*` | Image generation | `server/ai-gateway.mjs:1493` |
| **Ideogram** | `ideogram-v2` | Image generation | `server/ai-gateway.mjs:1507` |
| **Runway** | `gen-3-alpha (Veo-3)` | Video generation | Code implied |
| **Luma AI** | `ray-2` | Video generation | Code implied |

---

## 💰 **API PRICING RESEARCH** (October 2025)

### **1. OpenAI Pricing**

#### **GPT-5 (Latest Model - Oct 2025)**
- **Input tokens:** $2.50 per 1M tokens
- **Output tokens:** $10.00 per 1M tokens
- **Context window:** 200K tokens
- **Use case:** Content generation (primary)
- **Average cost per request:** ~$0.015-0.05 (depending on brief size + output length)

#### **GPT-4o (Fallback)**
- **Input tokens:** $0.25 per 1M tokens
- **Output tokens:** $1.00 per 1M tokens
- **Context window:** 128K tokens
- **Use case:** Content fallback
- **Average cost per request:** ~$0.002-0.008

#### **GPT-5-Chat-Latest (BADU)**
- **Input tokens:** $2.50 per 1M tokens
- **Output tokens:** $10.00 per 1M tokens (streaming)
- **Context window:** 200K tokens
- **Use case:** BADU assistant conversations
- **Average cost per chat:** ~$0.01-0.03 (with history)

#### **DALL-E 3**
- **Standard 1024x1024:** $0.040 per image
- **HD 1024x1024:** $0.080 per image
- **Standard 1792x1024:** $0.080 per image
- **HD 1792x1024:** $0.120 per image
- **Use case:** Image generation (fallback)

---

### **2. FLUX (Black Forest Labs) Pricing**

#### **FLUX Pro 1.1 (Standard)**
- **Base cost:** $0.045 per image
- **Resolution:** Up to 1440x1440
- **Average generation time:** 10-15 seconds
- **Use case:** High-quality image generation

#### **FLUX Pro 1.1 Ultra**
- **Base cost:** $0.060 per image
- **Resolution:** Up to 2048x2048
- **Quality:** Ultra-high fidelity
- **Average generation time:** 15-25 seconds

---

### **3. Stability AI Pricing**

#### **Stable Diffusion 3**
- **Base cost:** $0.035 per image
- **Resolution:** Up to 2048x2048
- **API credits:** Pay-per-image or subscription
- **Use case:** Cost-effective image generation

---

### **4. Ideogram Pricing**

#### **Ideogram V2**
- **Base cost:** $0.080 per image
- **Magic Prompt:** +$0.010 (optional)
- **Resolution:** Up to 2048x2048
- **Use case:** Text-in-image, creative designs

---

### **5. Runway Pricing**

#### **Gen-3 Alpha (Veo-3)**
- **Base cost:** $0.05 per second of video
- **Typical generation:** 5-10 seconds (~$0.25-0.50)
- **HD quality:** +25% cost
- **Resolution:** Up to 1080p
- **Use case:** Cinema-quality video

---

### **6. Luma AI Pricing**

#### **Dream Machine (Ray-2)**
- **Base cost:** $0.10 per 5-second clip
- **Extended (10 seconds):** $0.18 per clip
- **Resolution:** 1080p
- **Use case:** Fast creative video generation

---

## 📐 **COST CALCULATION FORMULAS**

### **Content Generation (GPT-5)**
```javascript
// Estimate tokens
const promptTokens = brief.length / 4 + systemPrompt.length / 4 + 200; // Safety margin
const completionTokens = variants * platforms * avgLength / 4;

// Calculate cost
const inputCost = (promptTokens / 1_000_000) * 2.50;
const outputCost = (completionTokens / 1_000_000) * 10.00;
const totalCost = inputCost + outputCost;
```

### **Image Generation**
```javascript
// Provider-specific cost
const costs = {
  'openai': { standard: 0.040, hd: 0.080 },
  'flux': { standard: 0.045, ultra: 0.060 },
  'stability': { base: 0.035 },
  'ideogram': { base: 0.080, magic: 0.010 }
};

const totalCost = imageCount * costs[provider][quality];
```

### **Video Generation**
```javascript
// Duration-based cost
const costs = {
  'runway': 0.05, // per second
  'luma': 0.02    // per second (5sec min)
};

const totalCost = durationSeconds * costs[provider];
```

---

## 🗄️ **NEW DATABASE SCHEMA DESIGN**

### **1. API Usage Tracking Table**

```sql
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- API Call Metadata
  service_type TEXT NOT NULL, -- 'content', 'images', 'video', 'chat', 'tools'
  provider TEXT NOT NULL,     -- 'openai', 'flux', 'runway', etc.
  model TEXT NOT NULL,        -- Specific model used
  endpoint TEXT NOT NULL,     -- API endpoint called
  
  -- Request Details
  request_id TEXT,            -- Unique request identifier
  request_data JSONB,         -- Sanitized request payload
  response_data JSONB,        -- Sanitized response data
  
  -- Usage Metrics
  input_tokens INTEGER,       -- For text models
  output_tokens INTEGER,      -- For text models
  total_tokens INTEGER,       -- Sum
  images_generated INTEGER DEFAULT 0,
  video_seconds NUMERIC(10,2) DEFAULT 0,
  
  -- Cost Calculation
  input_cost NUMERIC(12,6) DEFAULT 0,
  output_cost NUMERIC(12,6) DEFAULT 0,
  generation_cost NUMERIC(12,6) DEFAULT 0,
  total_cost NUMERIC(12,6) NOT NULL,
  
  -- Performance
  latency_ms INTEGER,         -- Response time
  status TEXT NOT NULL,       -- 'success', 'error', 'rate_limited', 'timeout'
  error_message TEXT,
  
  -- Tracking
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes for fast queries
  CONSTRAINT valid_service_type CHECK (service_type IN ('content', 'images', 'video', 'chat', 'tools', 'refine')),
  CONSTRAINT valid_status CHECK (status IN ('success', 'error', 'rate_limited', 'timeout', 'cancelled'))
);

-- Indexes for performance
CREATE INDEX idx_api_usage_user_created ON api_usage(user_id, created_at DESC);
CREATE INDEX idx_api_usage_service_provider ON api_usage(service_type, provider);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at DESC);
CREATE INDEX idx_api_usage_status ON api_usage(status) WHERE status != 'success';
```

---

### **2. User Subscription & Limits Table**

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription Tier
  plan_type TEXT NOT NULL DEFAULT 'free', -- 'free', 'starter', 'pro', 'enterprise'
  plan_name TEXT NOT NULL DEFAULT 'Free Plan',
  
  -- Billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  
  -- Usage Limits (per month)
  content_generations_limit INTEGER DEFAULT 50,
  image_generations_limit INTEGER DEFAULT 100,
  video_generations_limit INTEGER DEFAULT 10,
  chat_messages_limit INTEGER DEFAULT 100,
  
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
  
  CONSTRAINT valid_plan_type CHECK (plan_type IN ('free', 'starter', 'pro', 'enterprise', 'custom'))
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

### **3. Usage Alerts Table**

```sql
CREATE TABLE usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Alert Configuration
  alert_type TEXT NOT NULL, -- 'usage_threshold', 'cost_threshold', 'limit_reached', 'error_spike'
  threshold_type TEXT NOT NULL, -- 'percentage', 'absolute', 'count'
  threshold_value NUMERIC(12,2) NOT NULL,
  
  -- Alert Details
  current_value NUMERIC(12,2),
  limit_value NUMERIC(12,2),
  resource_type TEXT NOT NULL, -- 'content', 'images', 'video', 'chat', 'cost'
  
  -- Notification
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
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

CREATE INDEX idx_usage_alerts_user_unresolved ON usage_alerts(user_id, is_resolved, created_at DESC);
```

---

### **4. API Rate Limits Table**

```sql
CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rate Limit Config
  service_type TEXT NOT NULL,
  window_type TEXT NOT NULL, -- 'minute', 'hour', 'day'
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
  
  -- Composite unique constraint
  CONSTRAINT unique_user_service_window UNIQUE (user_id, service_type, window_type),
  CONSTRAINT valid_window_type CHECK (window_type IN ('minute', 'hour', 'day', 'month'))
);

CREATE INDEX idx_rate_limits_user_service ON api_rate_limits(user_id, service_type);
```

---

### **5. Cost Aggregations Table (Materialized View)**

```sql
CREATE TABLE usage_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Time Period
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
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

CREATE INDEX idx_aggregations_user_period ON usage_aggregations(user_id, period_type, period_start DESC);
```

---

### **6. Campaigns Table (Optional - For Organization)**

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Campaign Details
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  
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

CREATE INDEX idx_campaigns_user_status ON campaigns(user_id, status);

-- Link API usage to campaigns
ALTER TABLE api_usage ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
CREATE INDEX idx_api_usage_campaign ON api_usage(campaign_id);
```

---

## 🔐 **ROW LEVEL SECURITY (RLS) POLICIES**

### **1. API Usage Table**

```sql
-- Enable RLS
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON api_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert usage records
CREATE POLICY "System can insert usage"
  ON api_usage
  FOR INSERT
  WITH CHECK (true); -- Server-side only

-- Prevent updates/deletes (immutable log)
CREATE POLICY "No updates allowed"
  ON api_usage
  FOR UPDATE
  USING (false);

CREATE POLICY "No deletes allowed"
  ON api_usage
  FOR DELETE
  USING (false);
```

---

### **2. User Subscriptions Table**

```sql
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can manage subscriptions
CREATE POLICY "System can manage subscriptions"
  ON user_subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Auto-create subscription on user signup
CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type, plan_name)
  VALUES (
    NEW.id,
    'free',
    'Free Plan'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_subscription();
```

---

### **3. Usage Alerts Table**

```sql
ALTER TABLE usage_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON usage_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark alerts resolved"
  ON usage_alerts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

### **4. Rate Limits Table**

```sql
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON api_rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
  ON api_rate_limits
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

---

### **5. Usage Aggregations**

```sql
ALTER TABLE usage_aggregations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own aggregations"
  ON usage_aggregations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage aggregations"
  ON usage_aggregations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## 📊 **USAGE TRACKING IMPLEMENTATION**

### **Server-Side Tracking Function**

```javascript
// server/lib/usageTracker.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function trackAPIUsage({
  userId,
  serviceType, // 'content', 'images', 'video', 'chat', 'tools'
  provider,     // 'openai', 'flux', 'runway', etc.
  model,        // Specific model
  endpoint,     // API endpoint
  requestId,
  requestData,  // Sanitized
  responseData, // Sanitized
  inputTokens,
  outputTokens,
  imagesGenerated,
  videoSeconds,
  inputCost,
  outputCost,
  generationCost,
  totalCost,
  latency,
  status,
  errorMessage,
  ipAddress,
  userAgent,
  campaignId
}) {
  try {
    // Insert usage record
    const { data: usageRecord, error: usageError } = await supabase
      .from('api_usage')
      .insert({
        user_id: userId,
        service_type: serviceType,
        provider,
        model,
        endpoint,
        request_id: requestId,
        request_data: requestData,
        response_data: responseData,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: (inputTokens || 0) + (outputTokens || 0),
        images_generated: imagesGenerated || 0,
        video_seconds: videoSeconds || 0,
        input_cost: inputCost || 0,
        output_cost: outputCost || 0,
        generation_cost: generationCost || 0,
        total_cost: totalCost,
        latency_ms: latency,
        status,
        error_message: errorMessage,
        ip_address: ipAddress,
        user_agent: userAgent,
        campaign_id: campaignId
      })
      .select()
      .single();

    if (usageError) throw usageError;

    // Update subscription usage
    await updateSubscriptionUsage(userId, serviceType, totalCost);

    // Check limits and send alerts if needed
    await checkUsageLimits(userId, serviceType);

    return usageRecord;
  } catch (error) {
    console.error('[UsageTracker] Error:', error);
    // Don't fail the request if tracking fails
    return null;
  }
}

async function updateSubscriptionUsage(userId, serviceType, cost) {
  const field = getUsageFieldForService(serviceType);
  
  const { error } = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_field: field,
    p_cost: cost
  });

  if (error) console.error('[UsageTracker] Update usage error:', error);
}

function getUsageFieldForService(serviceType) {
  const mapping = {
    'content': 'content_generations_used',
    'images': 'image_generations_used',
    'video': 'video_generations_used',
    'chat': 'chat_messages_used'
  };
  return mapping[serviceType] || 'content_generations_used';
}

async function checkUsageLimits(userId, serviceType) {
  // Get user subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!subscription) return;

  // Check if approaching or exceeding limits
  const checks = [
    {
      type: 'content',
      used: subscription.content_generations_used,
      limit: subscription.content_generations_limit
    },
    {
      type: 'images',
      used: subscription.image_generations_used,
      limit: subscription.image_generations_limit
    },
    {
      type: 'video',
      used: subscription.video_generations_used,
      limit: subscription.video_generations_limit
    },
    {
      type: 'cost',
      used: subscription.current_month_cost,
      limit: subscription.monthly_cost_limit
    }
  ];

  for (const check of checks) {
    const percentage = (check.used / check.limit) * 100;
    
    // Send alert at 80%, 90%, 100%
    if (percentage >= 80) {
      await createUsageAlert(userId, check, percentage);
    }
  }
}

async function createUsageAlert(userId, check, percentage) {
  const severity = percentage >= 100 ? 'critical' : percentage >= 90 ? 'warning' : 'info';
  const message = `You've used ${percentage.toFixed(0)}% of your ${check.type} limit (${check.used}/${check.limit})`;

  await supabase.from('usage_alerts').insert({
    user_id: userId,
    alert_type: 'usage_threshold',
    threshold_type: 'percentage',
    threshold_value: percentage,
    current_value: check.used,
    limit_value: check.limit,
    resource_type: check.type,
    severity,
    message
  });
}

// Cost calculation helpers
export function calculateOpenAICost(inputTokens, outputTokens, model) {
  const pricing = {
    'gpt-5': { input: 2.50, output: 10.00 },
    'gpt-5-chat-latest': { input: 2.50, output: 10.00 },
    'gpt-4o': { input: 0.25, output: 1.00 }
  };

  const rates = pricing[model] || pricing['gpt-4o'];
  
  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost
  };
}

export function calculateImageCost(provider, quality, count = 1) {
  const pricing = {
    'openai': { standard: 0.040, hd: 0.080 },
    'flux': { standard: 0.045, ultra: 0.060 },
    'stability': { base: 0.035 },
    'ideogram': { base: 0.080, magic: 0.090 }
  };

  const rate = pricing[provider]?.[quality] || pricing[provider]?.base || 0.040;
  return rate * count;
}

export function calculateVideoCost(provider, durationSeconds) {
  const pricing = {
    'runway': 0.05, // per second
    'luma': 0.02    // per second
  };

  const rate = pricing[provider] || 0.05;
  return durationSeconds * rate;
}
```

---

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Core Tables & Tracking (Week 1)**
- ✅ Create `api_usage` table with indexes
- ✅ Create `user_subscriptions` table
- ✅ Implement RLS policies
- ✅ Auto-create subscription on signup
- ✅ Server-side tracking function
- ✅ Integrate tracking into AI gateway

### **Phase 2: Usage Limits & Alerts (Week 2)**
- ✅ Create `usage_alerts` table
- ✅ Create `api_rate_limits` table
- ✅ Implement limit checking logic
- ✅ Alert creation system
- ✅ Frontend display of usage/limits

### **Phase 3: Aggregations & Analytics (Week 3)**
- ✅ Create `usage_aggregations` table
- ✅ Daily aggregation cron job
- ✅ Analytics dashboard
- ✅ Cost breakdown charts
- ✅ Export functionality

### **Phase 4: Advanced Features (Week 4)**
- ✅ Campaign tracking
- ✅ Webhook notifications
- ✅ Stripe integration
- ✅ Usage-based billing
- ✅ Admin dashboard

---

## 📈 **SUBSCRIPTION TIERS**

### **Free Tier**
- 50 content generations/month
- 100 images/month
- 10 videos/month
- 100 chat messages/month
- $0/month

### **Starter Tier**
- 500 content generations/month
- 1,000 images/month
- 50 videos/month
- 1,000 chat messages/month
- $29/month

### **Pro Tier**
- 5,000 content generations/month
- 10,000 images/month
- 500 videos/month
- Unlimited chat
- $99/month

### **Enterprise Tier**
- Unlimited everything
- Custom pricing
- Dedicated support
- Custom

 models

---

## ✅ **NEXT STEPS**

1. **Review this plan** - Provide feedback on schema, pricing, limits
2. **Create migrations** - Generate SQL migration files
3. **Implement tracking** - Integrate into AI gateway
4. **Test thoroughly** - Ensure accurate tracking
5. **Deploy** - Roll out with monitoring

---

**This is a comprehensive foundation for tracking every API call, calculating costs accurately, and managing user limits effectively. Ready to implement!** 🎯
