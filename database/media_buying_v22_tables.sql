/* =============================================================================
   AEGIS Media Buying v2.2 - Tables Additionnelles
   PostgreSQL 14+ - Complément au schema.sql principal
   ============================================================================= */

BEGIN;

SET LOCAL search_path = ads, saas, public;

-- =============================================================================
-- 1) API USAGE TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS ads.api_usage_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    platform text NOT NULL,
    endpoint text NOT NULL,
    method text NOT NULL DEFAULT 'GET',
    
    calls_count bigint DEFAULT 0,
    success_count bigint DEFAULT 0,
    error_count bigint DEFAULT 0,
    
    avg_response_time_ms integer,
    p95_response_time_ms integer,
    max_response_time_ms integer,
    
    cost_usd decimal(12,4) DEFAULT 0,
    quota_used integer,
    quota_limit integer,
    
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL,
    granularity text DEFAULT 'hourly',
    
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT unique_api_usage UNIQUE (tenant_id, platform, endpoint, method, period_start)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_tenant_period 
    ON ads.api_usage_tracking(tenant_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_platform 
    ON ads.api_usage_tracking(platform, period_start DESC);

-- =============================================================================
-- 2) API RATE LIMITS
-- =============================================================================

CREATE TABLE IF NOT EXISTS ads.api_rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    platform text NOT NULL,
    endpoint_pattern text NOT NULL,
    
    requests_per_second integer,
    requests_per_minute integer,
    requests_per_hour integer,
    requests_per_day integer,
    
    current_minute_count integer DEFAULT 0,
    current_hour_count integer DEFAULT 0,
    current_day_count integer DEFAULT 0,
    
    window_reset_at timestamptz,
    
    backoff_strategy text DEFAULT 'exponential',
    max_retries integer DEFAULT 3,
    retry_after_seconds integer DEFAULT 60,
    
    is_throttled boolean DEFAULT false,
    throttled_until timestamptz,
    last_request_at timestamptz,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT unique_rate_limit UNIQUE (tenant_id, platform, endpoint_pattern)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
    ON ads.api_rate_limits(tenant_id, platform, is_throttled);

-- =============================================================================
-- 3) ALERTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS ads.alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    
    alert_name text NOT NULL,
    alert_type text NOT NULL,
    description text,
    
    conditions jsonb NOT NULL,
    channels jsonb NOT NULL DEFAULT '[]'::jsonb,
    
    cooldown_minutes integer DEFAULT 60,
    max_alerts_per_day integer DEFAULT 10,
    
    applies_to_platforms text[] DEFAULT ARRAY[]::text[],
    applies_to_campaigns text[] DEFAULT ARRAY[]::text[],
    applies_to_level text,
    
    active_hours jsonb,
    active_days integer[] DEFAULT ARRAY[1,2,3,4,5],
    
    is_active boolean DEFAULT true,
    last_triggered_at timestamptz,
    trigger_count integer DEFAULT 0,
    
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_active 
    ON ads.alerts(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alerts_type 
    ON ads.alerts(alert_type, is_active);

-- =============================================================================
-- 4) ALERT HISTORY
-- =============================================================================

CREATE TABLE IF NOT EXISTS ads.alert_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id uuid NOT NULL REFERENCES ads.alerts(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL,
    
    triggered_at timestamptz DEFAULT now(),
    trigger_reason jsonb NOT NULL DEFAULT '{}'::jsonb,
    
    channels_notified jsonb,
    notification_status jsonb,
    
    acknowledged_at timestamptz,
    acknowledged_by uuid,
    resolution_notes text
);

CREATE INDEX IF NOT EXISTS idx_alert_history_alert 
    ON ads.alert_history(alert_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_tenant 
    ON ads.alert_history(tenant_id, triggered_at DESC);

-- =============================================================================
-- 5) CURRENCY RATES
-- =============================================================================

CREATE TABLE IF NOT EXISTS ads.currency_rates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    from_currency text NOT NULL,
    to_currency text NOT NULL DEFAULT 'USD',
    
    exchange_rate decimal(12,6) NOT NULL,
    
    valid_from date NOT NULL,
    valid_until date,
    
    source text DEFAULT 'manual',
    
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT unique_currency_rate UNIQUE (from_currency, to_currency, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_currency_rates_lookup 
    ON ads.currency_rates(from_currency, to_currency, valid_from DESC);

-- Seed initial exchange rates
INSERT INTO ads.currency_rates (from_currency, to_currency, exchange_rate, valid_from, source)
VALUES 
    ('EUR', 'USD', 1.0854, CURRENT_DATE, 'seed'),
    ('GBP', 'USD', 1.2634, CURRENT_DATE, 'seed'),
    ('JPY', 'USD', 0.0067, CURRENT_DATE, 'seed'),
    ('CAD', 'USD', 0.7142, CURRENT_DATE, 'seed'),
    ('AUD', 'USD', 0.6389, CURRENT_DATE, 'seed'),
    ('CHF', 'USD', 1.1234, CURRENT_DATE, 'seed'),
    ('CNY', 'USD', 0.1389, CURRENT_DATE, 'seed'),
    ('INR', 'USD', 0.0120, CURRENT_DATE, 'seed'),
    ('BRL', 'USD', 0.1980, CURRENT_DATE, 'seed'),
    ('MXN', 'USD', 0.0580, CURRENT_DATE, 'seed')
ON CONFLICT (from_currency, to_currency, valid_from) DO NOTHING;

-- =============================================================================
-- 6) SEASONAL EVENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS ads.seasonal_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    event_name text NOT NULL,
    event_type text NOT NULL,
    
    event_date date NOT NULL,
    event_end_date date,
    is_recurring boolean DEFAULT false,
    recurrence_pattern text,
    
    estimated_traffic_multiplier decimal(5,2) DEFAULT 1.0,
    estimated_conversion_multiplier decimal(5,2) DEFAULT 1.0,
    estimated_cpc_multiplier decimal(5,2) DEFAULT 1.0,
    
    countries text[] DEFAULT ARRAY[]::text[],
    
    industries text[] DEFAULT ARRAY[]::text[],
    impact_level text,
    
    strategic_notes text,
    recommended_actions jsonb,
    
    created_at timestamptz DEFAULT now(),
    source text DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_seasonal_events_date 
    ON ads.seasonal_events(event_date);
CREATE INDEX IF NOT EXISTS idx_seasonal_events_recurring 
    ON ads.seasonal_events(is_recurring, event_type);

-- Seed major shopping events
INSERT INTO ads.seasonal_events (
    event_name, event_type, event_date, event_end_date,
    is_recurring, recurrence_pattern,
    estimated_traffic_multiplier, estimated_conversion_multiplier, estimated_cpc_multiplier,
    countries, industries, impact_level,
    strategic_notes, recommended_actions
) VALUES 
    ('Black Friday', 'shopping', '2026-11-27', '2026-11-29', true, 'yearly',
     3.5, 2.8, 1.9,
     ARRAY['US', 'CA', 'UK', 'FR', 'DE', 'ES', 'IT'],
     ARRAY['ecommerce', 'retail'],
     'extreme',
     'Major shopping event. High competition for ad space.',
     '{"pre_event": ["Increase budget 150% from D-7", "Prepare special creatives", "Test broad audiences"], "during_event": ["Aggressive bidding on warm audiences", "Continuous CPA monitoring", "Quick-wins on retargeting"], "post_event": ["Analyze Black Friday buyer cohort", "Post-purchase retargeting", "Document performance"]}'::jsonb),
    
    ('Cyber Monday', 'shopping', '2026-11-30', '2026-11-30', true, 'yearly',
     3.2, 2.5, 1.8,
     ARRAY['US', 'CA', 'UK', 'DE'],
     ARRAY['ecommerce', 'tech'],
     'extreme',
     'Online-focused shopping day following Black Friday.',
     '{"pre_event": ["Prepare email sequences", "Set up countdown timers"], "during_event": ["Focus on tech products", "Flash sales every 2 hours"], "post_event": ["Analyze vs Black Friday performance"]}'::jsonb),
    
    ('Christmas', 'holiday', '2026-12-25', '2026-12-26', true, 'yearly',
     1.5, 1.8, 1.3,
     ARRAY['US', 'CA', 'UK', 'FR', 'DE', 'ES', 'IT', 'AU'],
     ARRAY['ecommerce', 'retail', 'travel', 'hospitality'],
     'high',
     'Major holiday. Lower traffic but high gift intent.',
     '{"pre_event": ["Gift guide campaigns", "Shipping deadline reminders"], "during_event": ["Gift card promotions", "Last-minute deals"], "post_event": ["Returns/exchanges messaging", "New year campaigns"]}'::jsonb),
    
    ('Valentines Day', 'holiday', '2026-02-14', '2026-02-14', true, 'yearly',
     2.0, 2.2, 1.5,
     ARRAY['US', 'UK', 'FR', 'DE'],
     ARRAY['ecommerce', 'flowers', 'jewelry', 'hospitality'],
     'high',
     'Strong gift-giving occasion. High conversion for romantic products.',
     '{"pre_event": ["Start campaigns D-14", "Gift bundles", "Express shipping options"], "during_event": ["Last-minute same-day delivery", "Digital gift cards"], "post_event": ["Self-purchase campaigns"]}'::jsonb),
    
    ('Singles Day', 'shopping', '2026-11-11', '2026-11-11', true, 'yearly',
     2.5, 2.0, 1.6,
     ARRAY['CN', 'SG', 'MY', 'TH'],
     ARRAY['ecommerce', 'fashion', 'tech'],
     'extreme',
     'Largest shopping day globally. Focus on APAC markets.',
     '{"pre_event": ["Prepare APAC-specific creatives", "Partner with local influencers"], "during_event": ["Flash sales", "Limited edition releases"], "post_event": ["Analyze for Black Friday insights"]}'::jsonb),
    
    ('Prime Day', 'shopping', '2026-07-15', '2026-07-16', true, 'yearly',
     2.8, 2.3, 1.7,
     ARRAY['US', 'UK', 'DE', 'JP', 'AU'],
     ARRAY['ecommerce', 'tech', 'home'],
     'high',
     'Amazon Prime Day - spillover effect to all ecommerce.',
     '{"pre_event": ["Competitive counter-promotions", "Price match campaigns"], "during_event": ["Real-time price monitoring", "Urgency messaging"], "post_event": ["Capture non-Prime customers"]}'::jsonb),
    
    ('Back to School', 'shopping', '2026-08-15', '2026-09-15', true, 'yearly',
     1.8, 1.5, 1.3,
     ARRAY['US', 'CA', 'UK', 'FR', 'DE'],
     ARRAY['ecommerce', 'education', 'tech', 'fashion'],
     'medium',
     'Extended shopping period for school supplies and clothing.',
     '{"pre_event": ["Build awareness campaigns", "Parent-focused messaging"], "during_event": ["Category-specific promotions", "Bundle deals"], "post_event": ["College/university transition campaigns"]}'::jsonb),
    
    ('Super Bowl', 'sports', '2026-02-08', '2026-02-08', true, 'yearly',
     2.2, 1.4, 1.8,
     ARRAY['US'],
     ARRAY['food', 'beverages', 'electronics', 'betting'],
     'high',
     'Massive viewership. High engagement on social media.',
     '{"pre_event": ["Game day snack promotions", "TV deals", "Party supplies"], "during_event": ["Real-time social engagement", "Second-screen experiences"], "post_event": ["Highlight replays", "Winner merchandise"]}'::jsonb),
    
    ('Champions League Final', 'sports', '2026-05-30', '2026-05-30', true, 'yearly',
     2.0, 1.4, 1.5,
     ARRAY['UK', 'ES', 'DE', 'IT', 'FR'],
     ARRAY['sports', 'betting', 'hospitality'],
     'high',
     'Major European football event.',
     '{"pre_event": ["Team merchandise", "Viewing party promotions"], "during_event": ["Live betting", "Social engagement"], "post_event": ["Winner celebrations", "Recap content"]}'::jsonb),
    
    ('Chinese New Year', 'holiday', '2026-02-17', '2026-02-24', true, 'yearly',
     1.8, 1.6, 1.4,
     ARRAY['CN', 'TW', 'HK', 'SG', 'MY', 'TH', 'VN'],
     ARRAY['ecommerce', 'travel', 'luxury', 'food'],
     'high',
     'Major holiday in APAC. Gift-giving and travel season.',
     '{"pre_event": ["Red envelope campaigns", "Luxury gift sets", "Travel packages"], "during_event": ["Family-focused messaging", "Reunion themes"], "post_event": ["New year, new beginnings campaigns"]}'::jsonb)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 7) AUDIT LOG
-- =============================================================================

CREATE TABLE IF NOT EXISTS ads.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    
    user_id uuid,
    user_email text,
    user_ip inet,
    user_agent text,
    
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id uuid,
    
    old_values jsonb,
    new_values jsonb,
    changes jsonb,
    
    action_source text,
    api_endpoint text,
    request_id uuid,
    
    status text DEFAULT 'success',
    error_message text,
    
    performed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_time 
    ON ads.audit_log(tenant_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user 
    ON ads.audit_log(user_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource 
    ON ads.audit_log(resource_type, resource_id);

-- =============================================================================
-- 8) METRICS_DAILY COLUMNS UPDATE (if table exists)
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'ads' AND table_name = 'metrics_daily') THEN
        ALTER TABLE ads.metrics_daily 
            ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'USD',
            ADD COLUMN IF NOT EXISTS exchange_rate decimal(12,6) DEFAULT 1.0,
            ADD COLUMN IF NOT EXISTS spend_usd decimal(12,2),
            ADD COLUMN IF NOT EXISTS conversion_value_usd decimal(12,2);
    END IF;
END $$;

-- =============================================================================
-- 9) BASELINES COLUMNS UPDATE (if table exists)
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'ads' AND table_name = 'baselines') THEN
        ALTER TABLE ads.baselines 
            ADD COLUMN IF NOT EXISTS platform_id text,
            ADD COLUMN IF NOT EXISTS avg_roas decimal(10,4),
            ADD COLUMN IF NOT EXISTS valid_until timestamptz DEFAULT (now() + interval '30 days'),
            ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
    END IF;
END $$;

-- =============================================================================
-- 10) ANOMALIES TABLE (if not exists)
-- =============================================================================

CREATE TABLE IF NOT EXISTS ads.anomalies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    platform_id text NOT NULL,
    
    anomaly_type text NOT NULL,
    severity text NOT NULL DEFAULT 'medium',
    
    metric_name text NOT NULL,
    expected_value decimal(12,4),
    actual_value decimal(12,4),
    deviation_percent decimal(8,2),
    
    resolved boolean DEFAULT false,
    resolved_at timestamptz,
    resolved_by uuid,
    
    is_false_positive boolean DEFAULT false,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_tenant 
    ON ads.anomalies(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_unresolved 
    ON ads.anomalies(tenant_id, resolved) WHERE resolved = false;

-- =============================================================================
-- 11) BUDGET ALLOCATION TABLE (if not exists)
-- =============================================================================

CREATE TABLE IF NOT EXISTS ads.budget_allocation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    campaign_id text NOT NULL,
    
    allocated_budget decimal(12,2) NOT NULL DEFAULT 0,
    spent_budget decimal(12,2) NOT NULL DEFAULT 0,
    remaining_budget decimal(12,2) GENERATED ALWAYS AS (allocated_budget - spent_budget) STORED,
    
    period_type text DEFAULT 'monthly',
    period_start date NOT NULL,
    period_end date NOT NULL,
    
    notes text,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT unique_budget_allocation UNIQUE (tenant_id, campaign_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_budget_allocation_tenant 
    ON ads.budget_allocation(tenant_id, period_start);

-- =============================================================================
-- 12) VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW ads.api_cost_summary AS
SELECT 
    tenant_id,
    platform,
    DATE_TRUNC('day', period_start) as day,
    SUM(calls_count) as total_calls,
    SUM(success_count) as successful_calls,
    SUM(error_count) as failed_calls,
    AVG(avg_response_time_ms) as avg_latency_ms,
    SUM(cost_usd) as total_cost_usd,
    SUM(cost_usd) / NULLIF(SUM(calls_count), 0) as cost_per_call
FROM ads.api_usage_tracking
WHERE granularity = 'hourly'
GROUP BY tenant_id, platform, DATE_TRUNC('day', period_start);

CREATE OR REPLACE VIEW ads.active_alerts_with_context AS
SELECT 
    a.*,
    COUNT(ah.id) as total_triggers,
    MAX(ah.triggered_at) as last_triggered,
    COUNT(ah.id) FILTER (WHERE ah.triggered_at >= CURRENT_DATE) as triggers_today,
    AVG(EXTRACT(EPOCH FROM (ah.acknowledged_at - ah.triggered_at)) / 60) as avg_acknowledgment_minutes
FROM ads.alerts a
LEFT JOIN ads.alert_history ah ON a.id = ah.alert_id
WHERE a.is_active = true
GROUP BY a.id;

CREATE OR REPLACE VIEW ads.upcoming_seasonal_events AS
SELECT 
    se.*,
    se.event_date - CURRENT_DATE as days_until_event,
    CASE 
        WHEN se.event_date - CURRENT_DATE <= 3 THEN 'immediate_action'
        WHEN se.event_date - CURRENT_DATE <= 7 THEN 'prepare_now'
        WHEN se.event_date - CURRENT_DATE <= 14 THEN 'plan_ahead'
        ELSE 'monitor'
    END as urgency_level
FROM ads.seasonal_events se
WHERE se.event_date >= CURRENT_DATE
    AND se.event_date <= CURRENT_DATE + INTERVAL '90 days'
ORDER BY se.event_date;

CREATE OR REPLACE VIEW ads.audit_trail_summary AS
SELECT 
    tenant_id,
    user_email,
    action,
    resource_type,
    COUNT(*) as action_count,
    COUNT(*) FILTER (WHERE status = 'success') as successful_actions,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_actions,
    MAX(performed_at) as last_action_at
FROM ads.audit_log
WHERE performed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY tenant_id, user_email, action, resource_type;

-- =============================================================================
-- 13) ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE ads.api_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads.anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads.budget_allocation ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS rls_api_usage ON ads.api_usage_tracking 
    FOR ALL USING (tenant_id = saas.current_tenant_id());

CREATE POLICY IF NOT EXISTS rls_rate_limits ON ads.api_rate_limits 
    FOR ALL USING (tenant_id = saas.current_tenant_id());

CREATE POLICY IF NOT EXISTS rls_alerts ON ads.alerts 
    FOR ALL USING (tenant_id = saas.current_tenant_id());

CREATE POLICY IF NOT EXISTS rls_alert_history ON ads.alert_history 
    FOR ALL USING (tenant_id = saas.current_tenant_id());

CREATE POLICY IF NOT EXISTS rls_audit_log ON ads.audit_log 
    FOR ALL USING (tenant_id = saas.current_tenant_id());

CREATE POLICY IF NOT EXISTS rls_anomalies ON ads.anomalies 
    FOR ALL USING (tenant_id = saas.current_tenant_id());

CREATE POLICY IF NOT EXISTS rls_budget_allocation ON ads.budget_allocation 
    FOR ALL USING (tenant_id = saas.current_tenant_id());

COMMIT;
