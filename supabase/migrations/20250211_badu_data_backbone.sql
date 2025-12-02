-- =====================================================
-- BADU AI DATA BACKBONE - COMPREHENSIVE SYSTEM
-- Profiles, Sessions, Messages, Feedback, and RAG
-- =====================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 1. USER PROFILES WITH PREFERENCES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.badu_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User traits
  tier TEXT NOT NULL DEFAULT 'demo',
  role TEXT DEFAULT 'marketer',
  preferred_language TEXT DEFAULT 'en',
  favorite_panels TEXT[] DEFAULT '{}', -- ['content', 'pictures', 'video']
  
  -- JSON preferences (flexible storage for panel-specific settings)
  preferences JSONB DEFAULT '{
    "content": {
      "defaultPersona": "Generic",
      "defaultTone": "Professional",
      "defaultPlatforms": ["Facebook", "Instagram"]
    },
    "pictures": {
      "defaultProvider": "flux",
      "defaultStyle": "modern"
    },
    "video": {
      "defaultProvider": "runway",
      "defaultDuration": 5
    }
  }'::jsonb,
  
  -- Computed preference vector (soft defaults based on usage)
  preference_vector JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_user_profile UNIQUE(user_id),
  CONSTRAINT valid_tier CHECK (tier IN ('demo', 'basic', 'pro', 'enterprise'))
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_badu_profiles_user_id ON public.badu_profiles(user_id);

-- =====================================================
-- 2. BADU SESSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.badu_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.badu_profiles(id) ON DELETE CASCADE,
  
  -- Session metadata
  channel TEXT NOT NULL DEFAULT 'web', -- 'web' or 'app'
  initial_context JSONB DEFAULT '{}', -- First user query context
  
  -- Session state
  message_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  
  CONSTRAINT valid_channel CHECK (channel IN ('web', 'app'))
);

-- Indexes for session queries
CREATE INDEX IF NOT EXISTS idx_badu_sessions_user_id ON public.badu_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_badu_sessions_active ON public.badu_sessions(is_active, last_activity_at);

-- =====================================================
-- 3. BADU MESSAGES (CONVERSATION HISTORY)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.badu_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.badu_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message content
  role TEXT NOT NULL, -- 'user' or 'assistant'
  raw_prompt TEXT NOT NULL, -- Original user input
  structured_response JSONB, -- Parsed JSON response
  
  -- Schema and metadata
  schema_type TEXT, -- 'quickstart', 'explanation', 'comparison', etc.
  detected_panel TEXT, -- 'content', 'pictures', 'video', 'general'
  
  -- RAG sources (chunk IDs that were retrieved)
  sources TEXT[] DEFAULT '{}',
  
  -- Model information
  model TEXT,
  tokens_used INTEGER,
  latency_ms INTEGER,
  
  -- Attachments
  has_attachments BOOLEAN DEFAULT false,
  attachment_types TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_role CHECK (role IN ('user', 'assistant')),
  CONSTRAINT valid_panel CHECK (detected_panel IN ('content', 'pictures', 'video', 'general', NULL))
);

-- Indexes for message retrieval
CREATE INDEX IF NOT EXISTS idx_badu_messages_session_id ON public.badu_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_badu_messages_user_id ON public.badu_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_badu_messages_schema_type ON public.badu_messages(schema_type);

-- =====================================================
-- 4. BADU FEEDBACK
-- =====================================================
CREATE TABLE IF NOT EXISTS public.badu_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.badu_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feedback content
  rating INTEGER, -- 1-5 stars or -1/0/1 for thumbs
  reason_tags TEXT[] DEFAULT '{}', -- ['inaccurate', 'helpful', 'unclear', etc.]
  free_text TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_rating CHECK (rating BETWEEN -1 AND 5)
);

-- Index for feedback analysis
CREATE INDEX IF NOT EXISTS idx_badu_feedback_message_id ON public.badu_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_badu_feedback_user_rating ON public.badu_feedback(user_id, rating);

-- =====================================================
-- 5. BADU DOCS (RAG KNOWLEDGE BASE WITH VECTORS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.badu_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id TEXT NOT NULL UNIQUE, -- Stable identifier for each chunk
  
  -- Content organization
  panel TEXT NOT NULL, -- 'content', 'pictures', 'video', 'general'
  provider TEXT, -- 'flux', 'runway', 'luma', etc. (NULL for general)
  section TEXT, -- 'quickstart', 'settings', 'providers', etc.
  
  -- Content
  title TEXT,
  markdown TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Additional structured data
  
  -- Vector embedding (1536 dimensions for text-embedding-3-small)
  embedding vector(1536),
  
  -- Version control
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_panel CHECK (panel IN ('content', 'pictures', 'video', 'general'))
);

-- Indexes for RAG retrieval
CREATE INDEX IF NOT EXISTS idx_badu_docs_panel ON public.badu_docs(panel);
CREATE INDEX IF NOT EXISTS idx_badu_docs_provider ON public.badu_docs(provider);

-- HNSW index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_badu_docs_embedding_hnsw 
  ON public.badu_docs 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- =====================================================
-- 6. BADU METRICS (TELEMETRY)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.badu_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.badu_sessions(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.badu_messages(id) ON DELETE SET NULL,
  
  -- Request metadata
  schema_type TEXT,
  model TEXT,
  panel TEXT,
  
  -- Tokens and cost
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  total_cost NUMERIC(12,6),
  
  -- Performance
  retrieval_latency_ms INTEGER,
  llm_latency_ms INTEGER,
  total_latency_ms INTEGER,
  
  -- RAG diagnostics
  chunks_retrieved INTEGER,
  chunk_ids TEXT[],
  chunk_scores NUMERIC[],
  user_preference_applied BOOLEAN DEFAULT false,
  
  -- Guardrails
  guardrail_hits TEXT[] DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('success', 'error', 'timeout', 'guardrail_blocked'))
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_badu_metrics_user_id ON public.badu_metrics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_badu_metrics_session_id ON public.badu_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_badu_metrics_status ON public.badu_metrics(status, created_at);

-- =====================================================
-- 7. ROW-LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.badu_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badu_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badu_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badu_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badu_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badu_metrics ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.badu_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.badu_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.badu_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sessions: Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON public.badu_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.badu_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.badu_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Messages: Users can only see their own messages
CREATE POLICY "Users can view own messages" ON public.badu_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON public.badu_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Feedback: Users can only see/manage their own feedback
CREATE POLICY "Users can view own feedback" ON public.badu_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON public.badu_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON public.badu_feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- Docs: All authenticated users can read (no PII)
CREATE POLICY "Authenticated users can view docs" ON public.badu_docs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Metrics: Users can only see their own metrics
CREATE POLICY "Users can view own metrics" ON public.badu_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics" ON public.badu_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to search docs using vector similarity
CREATE OR REPLACE FUNCTION match_badu_docs(
  query_embedding vector(1536),
  top_k INTEGER DEFAULT 5,
  panel_bias TEXT DEFAULT NULL,
  provider_bias TEXT DEFAULT NULL
)
RETURNS TABLE (
  chunk_id TEXT,
  panel TEXT,
  provider TEXT,
  title TEXT,
  markdown TEXT,
  metadata JSONB,
  similarity NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.chunk_id,
    d.panel,
    d.provider,
    d.title,
    d.markdown,
    d.metadata,
    ROUND((1 - (d.embedding <=> query_embedding))::numeric, 4) AS similarity
  FROM public.badu_docs d
  WHERE 
    (panel_bias IS NULL OR d.panel = panel_bias) AND
    (provider_bias IS NULL OR d.provider = provider_bias)
  ORDER BY d.embedding <=> query_embedding
  LIMIT top_k;
END;
$$;

-- Function to get user preference snapshot
CREATE OR REPLACE FUNCTION get_user_preference_vector(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Aggregate recent messages and feedback to compute preferences
  WITH recent_activity AS (
    SELECT 
      m.detected_panel,
      m.schema_type,
      COUNT(*) as usage_count,
      AVG(COALESCE(f.rating, 0)) as avg_rating
    FROM public.badu_messages m
    LEFT JOIN public.badu_feedback f ON f.message_id = m.id
    WHERE m.user_id = p_user_id
      AND m.created_at > now() - interval '30 days'
    GROUP BY m.detected_panel, m.schema_type
  ),
  profile_data AS (
    SELECT preferences, preference_vector
    FROM public.badu_profiles
    WHERE user_id = p_user_id
  )
  SELECT jsonb_build_object(
    'favorite_panels', (
      SELECT jsonb_agg(detected_panel ORDER BY usage_count DESC)
      FROM recent_activity
      LIMIT 3
    ),
    'preferred_schemas', (
      SELECT jsonb_agg(schema_type ORDER BY usage_count DESC)
      FROM recent_activity
      WHERE schema_type IS NOT NULL
      LIMIT 3
    ),
    'stored_preferences', COALESCE(profile_data.preferences, '{}'::jsonb),
    'computed_weights', COALESCE(profile_data.preference_vector, '{}'::jsonb)
  )
  INTO result
  FROM profile_data;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.badu_sessions
  SET 
    message_count = message_count + 1,
    last_activity_at = now()
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-update session on new message
CREATE TRIGGER trigger_update_session_activity
  AFTER INSERT ON public.badu_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION create_badu_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.badu_profiles (user_id, tier, role)
  VALUES (NEW.id, 'demo', 'marketer')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile
CREATE TRIGGER trigger_create_badu_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_badu_profile_for_new_user();

-- =====================================================
-- 9. GRANT PERMISSIONS FOR SERVICE ROLE
-- =====================================================

-- Grant service role full access for gateway writes
GRANT ALL ON public.badu_profiles TO service_role;
GRANT ALL ON public.badu_sessions TO service_role;
GRANT ALL ON public.badu_messages TO service_role;
GRANT ALL ON public.badu_feedback TO service_role;
GRANT ALL ON public.badu_docs TO service_role;
GRANT ALL ON public.badu_metrics TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION match_badu_docs TO service_role;
GRANT EXECUTE ON FUNCTION get_user_preference_vector TO service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run scripts/build-badu-rag.mjs to populate badu_docs
-- 2. Update gateway to use new tables
-- 3. Implement preference learning background job
