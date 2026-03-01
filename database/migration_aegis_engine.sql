-- AEGIS Engine Migration
-- Creates tables for: Decision Memory, Stop-Loss Events, Opportunity Scores

-- ============================================================
-- TABLE: decision_memory
-- Stores all decisions AEGIS makes with their outcomes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.decision_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    decision_type TEXT NOT NULL CHECK (decision_type IN ('allocation','stoploss','scaling','creative','channel')),
    context_hash TEXT NOT NULL,
    context_summary TEXT,
    action_taken TEXT NOT NULL,
    outcome TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('win','loss','neutral','pending')),
    capital_in NUMERIC(12,2) NOT NULL DEFAULT 0,
    capital_out NUMERIC(12,2) NOT NULL DEFAULT 0,
    roi NUMERIC(8,4) NOT NULL DEFAULT 0,
    confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
  );

CREATE INDEX IF NOT EXISTS idx_decision_memory_tenant ON public.decision_memory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decision_memory_type ON public.decision_memory(tenant_id, decision_type);
CREATE INDEX IF NOT EXISTS idx_decision_memory_hash ON public.decision_memory(tenant_id, context_hash);
CREATE INDEX IF NOT EXISTS idx_decision_memory_outcome ON public.decision_memory(tenant_id, outcome);

ALTER TABLE public.decision_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_decision_memory"
  ON public.decision_memory FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true));

-- ============================================================
-- TABLE: stoploss_events
-- Records every stop-loss trigger with full context
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stoploss_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    allocation_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    capital_deployed NUMERIC(12,2) NOT NULL DEFAULT 0,
    capital_recovered NUMERIC(12,2) NOT NULL DEFAULT 0,
    roas_at_trigger NUMERIC(8,4) NOT NULL DEFAULT 0,
    roas_threshold NUMERIC(8,4) NOT NULL DEFAULT 0,
    cpa_at_trigger NUMERIC(10,2),
    cpa_threshold NUMERIC(10,2),
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('roas_below','cpa_above','spend_limit','time_limit','manual')),
    status TEXT NOT NULL DEFAULT 'triggered' CHECK (status IN ('triggered','executed','cancelled','reviewing')),
    metadata JSONB NOT NULL DEFAULT '{}',
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    executed_at TIMESTAMPTZ
  );

CREATE INDEX IF NOT EXISTS idx_stoploss_tenant ON public.stoploss_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stoploss_allocation ON public.stoploss_events(tenant_id, allocation_id);
CREATE INDEX IF NOT EXISTS idx_stoploss_channel ON public.stoploss_events(tenant_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_stoploss_status ON public.stoploss_events(tenant_id, status);

ALTER TABLE public.stoploss_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_stoploss_events"
  ON public.stoploss_events FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true));

-- ============================================================
-- TABLE: opportunity_scores
-- Records product/market opportunity scoring results
-- ============================================================
CREATE TABLE IF NOT EXISTS public.opportunity_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_category TEXT NOT NULL,
    raw_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    adjusted_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
    recommended_allocation NUMERIC(12,2) NOT NULL DEFAULT 0,
    max_allocation NUMERIC(12,2) NOT NULL DEFAULT 0,
    verdict TEXT NOT NULL CHECK (verdict IN ('go','wait','pass')),
    reasoning JSONB NOT NULL DEFAULT '[]',
    memory_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    memory_recommendation TEXT,
    channels_scored JSONB NOT NULL DEFAULT '[]',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

CREATE INDEX IF NOT EXISTS idx_opportunity_tenant ON public.opportunity_scores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_verdict ON public.opportunity_scores(tenant_id, verdict);
CREATE INDEX IF NOT EXISTS idx_opportunity_score ON public.opportunity_scores(tenant_id, adjusted_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_product ON public.opportunity_scores(tenant_id, product_name);

ALTER TABLE public.opportunity_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_opportunity_scores"
  ON public.opportunity_scores FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true));

-- ============================================================
-- HELPER: Grant anon access for Supabase client (RLS enforced)
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.decision_memory TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.stoploss_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.opportunity_scores TO anon, authenticated;
