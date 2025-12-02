-- Media Plan Integration Schema
-- Integrates Media Plan Lite with Marketing Engine for seamless campaign planning

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- MEDIA PLANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.media_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Plan Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    
    -- Budget & Targeting
    total_budget DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    market VARCHAR(50) NOT NULL DEFAULT 'Egypt',
    goal VARCHAR(50) NOT NULL DEFAULT 'LEADS' CHECK (goal IN ('LEADS', 'TRAFFIC', 'BRAND', 'SALES')),
    niche VARCHAR(100) DEFAULT 'Generic',
    
    -- Conversion Metrics
    lead_to_sale_percent DECIMAL(5, 2) DEFAULT 20.00,
    revenue_per_sale DECIMAL(10, 2) DEFAULT 800.00,
    
    -- Planning Mode
    manual_split BOOLEAN DEFAULT FALSE,
    manual_cpl BOOLEAN DEFAULT FALSE,
    include_all_platforms BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Optional Campaign Link
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    
    CONSTRAINT valid_budget CHECK (total_budget > 0),
    CONSTRAINT valid_conversion CHECK (lead_to_sale_percent >= 0 AND lead_to_sale_percent <= 100)
);

-- =============================================
-- MEDIA PLAN PLATFORMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.media_plan_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_plan_id UUID NOT NULL REFERENCES public.media_plans(id) ON DELETE CASCADE,
    
    -- Platform Info
    platform VARCHAR(50) NOT NULL CHECK (platform IN (
        'FACEBOOK', 'INSTAGRAM', 'GOOGLE_SEARCH', 'GOOGLE_DISPLAY', 
        'YOUTUBE', 'TIKTOK', 'LINKEDIN'
    )),
    
    -- Allocation
    allocation_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    budget_allocated DECIMAL(12, 2) GENERATED ALWAYS AS (
        (allocation_percent / 100.0) * (SELECT total_budget FROM public.media_plans WHERE id = media_plan_id)
    ) STORED,
    
    -- Manual Overrides
    manual_cpl DECIMAL(10, 2),
    
    -- Calculated Metrics (stored for historical tracking)
    estimated_impressions INTEGER,
    estimated_reach INTEGER,
    estimated_clicks INTEGER,
    estimated_leads INTEGER,
    estimated_sales INTEGER,
    estimated_revenue DECIMAL(12, 2),
    
    -- Performance Metrics
    calculated_cpl DECIMAL(10, 2),
    calculated_ctr DECIMAL(5, 4),
    calculated_cpc DECIMAL(10, 2),
    calculated_cpm DECIMAL(10, 2),
    calculated_cac DECIMAL(10, 2),
    calculated_roas DECIMAL(10, 2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one entry per platform per plan
    CONSTRAINT unique_platform_per_plan UNIQUE(media_plan_id, platform),
    CONSTRAINT valid_allocation CHECK (allocation_percent >= 0 AND allocation_percent <= 100)
);

-- =============================================
-- MEDIA PLAN SNAPSHOTS TABLE (for versioning)
-- =============================================
CREATE TABLE IF NOT EXISTS public.media_plan_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_plan_id UUID NOT NULL REFERENCES public.media_plans(id) ON DELETE CASCADE,
    
    -- Snapshot Data (JSONB for flexibility)
    snapshot_data JSONB NOT NULL,
    snapshot_version INTEGER NOT NULL,
    snapshot_name VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT unique_version_per_plan UNIQUE(media_plan_id, snapshot_version)
);

-- =============================================
-- MEDIA PLAN TO CAMPAIGN LINK TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.campaign_media_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    media_plan_id UUID NOT NULL REFERENCES public.media_plans(id) ON DELETE CASCADE,
    
    -- Link Metadata
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    linked_by UUID REFERENCES auth.users(id),
    notes TEXT,
    
    CONSTRAINT unique_campaign_plan UNIQUE(campaign_id, media_plan_id)
);

-- =============================================
-- INDEXES for Performance
-- =============================================
CREATE INDEX idx_media_plans_user_id ON public.media_plans(user_id);
CREATE INDEX idx_media_plans_status ON public.media_plans(status);
CREATE INDEX idx_media_plans_campaign_id ON public.media_plans(campaign_id);
CREATE INDEX idx_media_plans_created_at ON public.media_plans(created_at DESC);

CREATE INDEX idx_media_plan_platforms_plan_id ON public.media_plan_platforms(media_plan_id);
CREATE INDEX idx_media_plan_platforms_platform ON public.media_plan_platforms(platform);

CREATE INDEX idx_media_plan_snapshots_plan_id ON public.media_plan_snapshots(media_plan_id);
CREATE INDEX idx_media_plan_snapshots_created_at ON public.media_plan_snapshots(created_at DESC);

CREATE INDEX idx_campaign_media_plans_campaign_id ON public.campaign_media_plans(campaign_id);
CREATE INDEX idx_campaign_media_plans_media_plan_id ON public.campaign_media_plans(media_plan_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.media_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_plan_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_plan_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_media_plans ENABLE ROW LEVEL SECURITY;

-- Policies for media_plans
CREATE POLICY "Users can view their own media plans"
    ON public.media_plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own media plans"
    ON public.media_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media plans"
    ON public.media_plans FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media plans"
    ON public.media_plans FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for media_plan_platforms
CREATE POLICY "Users can view platforms for their media plans"
    ON public.media_plan_platforms FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.media_plans 
            WHERE id = media_plan_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage platforms for their media plans"
    ON public.media_plan_platforms FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.media_plans 
            WHERE id = media_plan_id AND user_id = auth.uid()
        )
    );

-- Policies for media_plan_snapshots
CREATE POLICY "Users can view snapshots for their media plans"
    ON public.media_plan_snapshots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.media_plans 
            WHERE id = media_plan_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create snapshots for their media plans"
    ON public.media_plan_snapshots FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.media_plans 
            WHERE id = media_plan_id AND user_id = auth.uid()
        )
    );

-- Policies for campaign_media_plans
CREATE POLICY "Users can view their campaign-plan links"
    ON public.campaign_media_plans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns 
            WHERE id = campaign_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their campaign-plan links"
    ON public.campaign_media_plans FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns 
            WHERE id = campaign_id AND user_id = auth.uid()
        )
    );

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_media_plans_updated_at
    BEFORE UPDATE ON public.media_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_plan_platforms_updated_at
    BEFORE UPDATE ON public.media_plan_platforms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create snapshot on major changes
CREATE OR REPLACE FUNCTION create_auto_snapshot()
RETURNS TRIGGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(snapshot_version), 0) + 1 INTO next_version
    FROM public.media_plan_snapshots
    WHERE media_plan_id = NEW.id;
    
    -- Create snapshot
    INSERT INTO public.media_plan_snapshots (media_plan_id, snapshot_data, snapshot_version, snapshot_name, created_by)
    VALUES (
        NEW.id,
        to_jsonb(NEW),
        next_version,
        'Auto-save ' || NOW()::DATE,
        NEW.user_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_snapshot_on_status_change
    AFTER UPDATE OF status ON public.media_plans
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION create_auto_snapshot();

-- =============================================
-- HELPER VIEWS
-- =============================================

-- View for complete media plan with platforms
CREATE OR REPLACE VIEW public.media_plans_with_platforms AS
SELECT 
    mp.*,
    jsonb_agg(
        jsonb_build_object(
            'id', mpp.id,
            'platform', mpp.platform,
            'allocation_percent', mpp.allocation_percent,
            'budget_allocated', mpp.budget_allocated,
            'estimated_leads', mpp.estimated_leads,
            'calculated_cpl', mpp.calculated_cpl,
            'calculated_roas', mpp.calculated_roas
        ) ORDER BY mpp.allocation_percent DESC
    ) FILTER (WHERE mpp.id IS NOT NULL) as platforms
FROM public.media_plans mp
LEFT JOIN public.media_plan_platforms mpp ON mp.id = mpp.media_plan_id
GROUP BY mp.id;

-- Grant access to authenticated users
GRANT SELECT ON public.media_plans_with_platforms TO authenticated;

-- =============================================
-- SAMPLE DATA (optional - for testing)
-- =============================================

-- Uncomment to insert sample data
/*
INSERT INTO public.media_plans (user_id, name, total_budget, currency, market, goal, status)
VALUES 
    ((SELECT id FROM auth.users LIMIT 1), 'Q1 2024 Campaign', 10000.00, 'USD', 'Egypt', 'LEADS', 'draft'),
    ((SELECT id FROM auth.users LIMIT 1), 'Holiday Promo', 25000.00, 'USD', 'USA', 'SALES', 'active');
*/

COMMENT ON TABLE public.media_plans IS 'Media planning configurations for marketing campaigns';
COMMENT ON TABLE public.media_plan_platforms IS 'Platform-specific allocations and metrics for media plans';
COMMENT ON TABLE public.media_plan_snapshots IS 'Historical snapshots for media plan versioning';
COMMENT ON TABLE public.campaign_media_plans IS 'Links media plans to marketing engine campaigns';
