/* =============================================================================
   AEGIS v5.0 ULTIMATE - PRODUCTION-READY SCHEMA
   PostgreSQL 14+ • Multi-tenant • RLS • 16 Agents • 5 Connectors
   ============================================================================= */

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '900s';
SET LOCAL idle_in_transaction_session_timeout = '120s';

-- =============================================================================
-- 1) SCHEMAS + EXTENSIONS
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS saas;
CREATE SCHEMA IF NOT EXISTS ops;
CREATE SCHEMA IF NOT EXISTS jobs;
CREATE SCHEMA IF NOT EXISTS intel;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS observability;
CREATE SCHEMA IF NOT EXISTS connectors;
CREATE SCHEMA IF NOT EXISTS ads;

SET LOCAL search_path = saas,ops,jobs,intel,crm,audit,observability,connectors,ads,public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 2) TENANT CONTEXT + SECURITY
-- =============================================================================
CREATE OR REPLACE FUNCTION saas.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('saas.tenant_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION saas.require_tenant()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE v uuid := saas.current_tenant_id();
BEGIN
  IF v IS NULL THEN 
    RAISE EXCEPTION 'Security Error: saas.tenant_id not set';
  END IF;
  RETURN v;
END;
$$;

-- =============================================================================
-- 3) CORE TENANT TABLES
-- =============================================================================
CREATE TABLE IF NOT EXISTS ops.tenant_config (
  tenant_id uuid PRIMARY KEY,
  company_name text,
  is_enabled boolean NOT NULL DEFAULT true,
  max_llm_tokens_daily int NOT NULL DEFAULT 1000000,
  current_llm_tokens_today int NOT NULL DEFAULT 0,
  tokens_reset_at date NOT NULL DEFAULT CURRENT_DATE,
  timezone text NOT NULL DEFAULT 'UTC',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops.plan (
  code text PRIMARY KEY,
  name text NOT NULL,
  price_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  trial_days int NOT NULL DEFAULT 30,
  grace_days int NOT NULL DEFAULT 3,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops.tenant_subscription (
  tenant_id uuid PRIMARY KEY,
  plan_code text NOT NULL REFERENCES ops.plan(code),
  status text NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing','active','past_due','canceled','expired','paused')),
  trial_start_at timestamptz NOT NULL DEFAULT now(),
  trial_end_at timestamptz NOT NULL,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  paused_at timestamptz,
  payment_method text,
  payment_ref text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops.subscription_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  event_type text NOT NULL,
  old_status text,
  new_status text,
  old_plan_code text,
  new_plan_code text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor text DEFAULT current_user,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 4) JOBS & QUEUE SYSTEM
-- =============================================================================
CREATE TABLE IF NOT EXISTS jobs.task_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  task_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority int NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending','running','completed','failed','retrying','dead_letter','canceled')),
  retry_count int NOT NULL DEFAULT 0,
  max_retries int NOT NULL DEFAULT 3,
  idempotency_key text,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  visible_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  locked_by text,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  result jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS jobs.dlq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  task_id uuid,
  task_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text NOT NULL,
  error_message text,
  retry_count int,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  replayed boolean NOT NULL DEFAULT false,
  replayed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs.recurring_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  job_code text NOT NULL,
  job_name text NOT NULL,
  description text,
  every_seconds int NOT NULL CHECK (every_seconds BETWEEN 5 AND 86400),
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz,
  last_run_status text,
  is_enabled boolean NOT NULL DEFAULT true,
  run_count bigint NOT NULL DEFAULT 0,
  error_count bigint NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, job_code)
);

-- =============================================================================
-- 5) AI AGENTS INFRASTRUCTURE
-- =============================================================================
CREATE TABLE IF NOT EXISTS intel.agent_role (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata_schema jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intel.ai_agent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  agent_name citext NOT NULL,
  role_code text NOT NULL REFERENCES intel.agent_role(code),
  system_prompt text NOT NULL,
  model text NOT NULL DEFAULT 'gpt-4o',
  temperature numeric(3,2) NOT NULL DEFAULT 0.7 CHECK (temperature BETWEEN 0 AND 2),
  max_tokens int NOT NULL DEFAULT 4000,
  is_production boolean NOT NULL DEFAULT true,
  is_enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  execution_count bigint NOT NULL DEFAULT 0,
  success_count bigint NOT NULL DEFAULT 0,
  error_count bigint NOT NULL DEFAULT 0,
  total_tokens_used bigint NOT NULL DEFAULT 0,
  avg_duration_ms int,
  last_execution_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, agent_name)
);

CREATE TABLE IF NOT EXISTS intel.agent_catalog (
  agent_name citext PRIMARY KEY,
  role_code text NOT NULL REFERENCES intel.agent_role(code),
  display_name text NOT NULL,
  description text NOT NULL,
  system_prompt text NOT NULL,
  model text NOT NULL DEFAULT 'gpt-4o',
  temperature numeric(3,2) NOT NULL DEFAULT 0.7,
  max_tokens int NOT NULL DEFAULT 4000,
  default_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  dependencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 100,
  is_default boolean NOT NULL DEFAULT true,
  is_premium boolean NOT NULL DEFAULT false,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intel.agent_execution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES intel.ai_agent(id) ON DELETE CASCADE,
  task_id uuid REFERENCES jobs.task_queue(id) ON DELETE SET NULL,
  execution_id uuid NOT NULL DEFAULT gen_random_uuid(),
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  model text,
  tokens_used int,
  prompt_tokens int,
  completion_tokens int,
  duration_ms int,
  status text NOT NULL CHECK (status IN ('success','error','timeout','canceled')),
  error_message text,
  error_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intel.agent_message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  from_agent_id uuid REFERENCES intel.ai_agent(id) ON DELETE CASCADE,
  to_agent_id uuid NOT NULL REFERENCES intel.ai_agent(id) ON DELETE CASCADE,
  message_type text NOT NULL,
  priority int NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending','delivered','failed','expired')),
  delivered_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  retry_count int NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intel.agent_workflow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  workflow_name text NOT NULL,
  description text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('manual','scheduled','event','webhook')),
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  last_run_status text,
  run_count bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, workflow_name)
);

-- =============================================================================
-- 6) CONNECTORS INFRASTRUCTURE
-- =============================================================================
CREATE TABLE IF NOT EXISTS connectors.credential_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  connector_type text NOT NULL 
    CHECK (connector_type IN ('meta','tiktok','google','pinterest','shopify','stripe','sendgrid','klaviyo')),
  connector_name text NOT NULL,
  credential_data jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_valid boolean NOT NULL DEFAULT true,
  last_validated_at timestamptz,
  expires_at timestamptz,
  refresh_token_encrypted bytea,
  scopes text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, connector_type, connector_name)
);

CREATE TABLE IF NOT EXISTS connectors.sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  connector_type text NOT NULL,
  sync_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('running','completed','failed','partial')),
  records_synced int NOT NULL DEFAULT 0,
  records_failed int NOT NULL DEFAULT 0,
  duration_ms int,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS connectors.webhook_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  connector_type text NOT NULL,
  event_type text NOT NULL,
  event_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  signature text,
  verified boolean NOT NULL DEFAULT false,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  error_message text,
  retry_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (connector_type, event_id)
);

-- =============================================================================
-- META ADS CONNECTOR
-- =============================================================================
CREATE TABLE IF NOT EXISTS connectors.meta_ad_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ad_account_id text NOT NULL,
  business_id text,
  name text NOT NULL,
  currency text NOT NULL,
  timezone text,
  account_status text,
  amount_spent numeric(12,2),
  balance numeric(12,2),
  sync_status text NOT NULL DEFAULT 'active',
  last_sync_at timestamptz,
  next_sync_at timestamptz,
  sync_frequency_minutes int NOT NULL DEFAULT 60,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, ad_account_id)
);

CREATE TABLE IF NOT EXISTS connectors.meta_campaign (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ad_account_id uuid NOT NULL REFERENCES connectors.meta_ad_account(id) ON DELETE CASCADE,
  campaign_id text NOT NULL,
  name text NOT NULL,
  status text NOT NULL,
  objective text,
  daily_budget numeric(12,2),
  lifetime_budget numeric(12,2),
  budget_remaining numeric(12,2),
  start_time timestamptz,
  stop_time timestamptz,
  spend numeric(12,2) NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  conversions int NOT NULL DEFAULT 0,
  cpm numeric(12,4),
  cpc numeric(12,4),
  ctr numeric(6,4),
  cpa numeric(12,4),
  roas numeric(8,4),
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, campaign_id)
);

-- =============================================================================
-- TIKTOK ADS CONNECTOR
-- =============================================================================
CREATE TABLE IF NOT EXISTS connectors.tiktok_ad_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  advertiser_id text NOT NULL,
  advertiser_name text NOT NULL,
  currency text NOT NULL,
  timezone text,
  account_status text,
  balance numeric(12,2),
  sync_status text NOT NULL DEFAULT 'active',
  last_sync_at timestamptz,
  next_sync_at timestamptz,
  sync_frequency_minutes int NOT NULL DEFAULT 60,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, advertiser_id)
);

CREATE TABLE IF NOT EXISTS connectors.tiktok_campaign (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ad_account_id uuid NOT NULL REFERENCES connectors.tiktok_ad_account(id) ON DELETE CASCADE,
  campaign_id text NOT NULL,
  campaign_name text NOT NULL,
  status text NOT NULL,
  objective text,
  budget numeric(12,2),
  budget_mode text,
  spend numeric(12,2) NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  conversions int NOT NULL DEFAULT 0,
  video_views bigint NOT NULL DEFAULT 0,
  engagement_rate numeric(6,4),
  ctr numeric(6,4),
  cpm numeric(12,4),
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, campaign_id)
);

-- =============================================================================
-- GOOGLE ADS CONNECTOR
-- =============================================================================
CREATE TABLE IF NOT EXISTS connectors.google_ad_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id text NOT NULL,
  descriptive_name text NOT NULL,
  currency text NOT NULL,
  timezone text,
  account_status text,
  manager_customer_id text,
  sync_status text NOT NULL DEFAULT 'active',
  last_sync_at timestamptz,
  next_sync_at timestamptz,
  sync_frequency_minutes int NOT NULL DEFAULT 60,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, customer_id)
);

CREATE TABLE IF NOT EXISTS connectors.google_campaign (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ad_account_id uuid NOT NULL REFERENCES connectors.google_ad_account(id) ON DELETE CASCADE,
  campaign_id text NOT NULL,
  name text NOT NULL,
  status text NOT NULL,
  campaign_type text NOT NULL,
  advertising_channel_type text,
  bidding_strategy_type text,
  budget_amount numeric(12,2),
  target_cpa numeric(12,2),
  target_roas numeric(8,4),
  cost numeric(12,2) NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  conversions numeric(12,2) NOT NULL DEFAULT 0,
  conversion_value numeric(12,2) NOT NULL DEFAULT 0,
  ctr numeric(6,4),
  avg_cpc numeric(12,4),
  cost_per_conversion numeric(12,4),
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, campaign_id)
);

-- =============================================================================
-- PINTEREST ADS CONNECTOR
-- =============================================================================
CREATE TABLE IF NOT EXISTS connectors.pinterest_ad_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ad_account_id text NOT NULL,
  name text NOT NULL,
  currency text NOT NULL,
  country text,
  account_type text,
  sync_status text NOT NULL DEFAULT 'active',
  last_sync_at timestamptz,
  next_sync_at timestamptz,
  sync_frequency_minutes int NOT NULL DEFAULT 60,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, ad_account_id)
);

CREATE TABLE IF NOT EXISTS connectors.pinterest_campaign (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ad_account_id uuid NOT NULL REFERENCES connectors.pinterest_ad_account(id) ON DELETE CASCADE,
  campaign_id text NOT NULL,
  name text NOT NULL,
  status text NOT NULL,
  objective text,
  daily_budget numeric(12,2),
  lifetime_budget numeric(12,2),
  spend numeric(12,2) NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  conversions int NOT NULL DEFAULT 0,
  ctr numeric(6,4),
  ecpm numeric(12,4),
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, campaign_id)
);

-- =============================================================================
-- SHOPIFY CONNECTOR
-- =============================================================================
CREATE TABLE IF NOT EXISTS connectors.shopify_store (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  shop_domain text NOT NULL,
  shop_name text NOT NULL,
  email text,
  currency text NOT NULL,
  timezone text,
  country text,
  plan_name text,
  total_products int NOT NULL DEFAULT 0,
  total_orders int NOT NULL DEFAULT 0,
  total_revenue numeric(12,2) NOT NULL DEFAULT 0,
  sync_status text NOT NULL DEFAULT 'active',
  last_sync_at timestamptz,
  next_sync_at timestamptz,
  sync_frequency_minutes int NOT NULL DEFAULT 30,
  webhook_verified boolean NOT NULL DEFAULT false,
  webhook_address text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, shop_domain)
);

CREATE TABLE IF NOT EXISTS connectors.shopify_product (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES connectors.shopify_store(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  title text NOT NULL,
  body_html text,
  vendor text,
  product_type text,
  handle text,
  status text NOT NULL,
  published_at timestamptz,
  tags text[],
  total_inventory int NOT NULL DEFAULT 0,
  price numeric(12,2),
  compare_at_price numeric(12,2),
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  seo_title text,
  seo_description text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, product_id)
);

CREATE TABLE IF NOT EXISTS connectors.shopify_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES connectors.shopify_store(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  order_number text NOT NULL,
  customer_id text,
  customer_email text,
  total_price numeric(12,2) NOT NULL,
  subtotal_price numeric(12,2) NOT NULL,
  total_tax numeric(12,2) NOT NULL DEFAULT 0,
  total_discounts numeric(12,2) NOT NULL DEFAULT 0,
  total_shipping numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL,
  financial_status text NOT NULL,
  fulfillment_status text,
  tags text[],
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  shipping_address jsonb,
  billing_address jsonb,
  discount_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_name text,
  processed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, order_id)
);

-- =============================================================================
-- INDEXES (Performance Optimization)
-- =============================================================================
CREATE INDEX idx_task_queue_tenant_status ON jobs.task_queue(tenant_id, status);
CREATE INDEX idx_task_queue_scheduled_for ON jobs.task_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_task_queue_idempotency ON jobs.task_queue(tenant_id, idempotency_key);
CREATE INDEX idx_ai_agent_tenant_enabled ON intel.ai_agent(tenant_id, is_enabled);
CREATE INDEX idx_agent_execution_log_tenant_agent ON intel.agent_execution_log(tenant_id, agent_id);
CREATE INDEX idx_agent_execution_log_created ON intel.agent_execution_log(created_at DESC);
CREATE INDEX idx_webhook_log_connector_event ON connectors.webhook_log(connector_type, event_id);
CREATE INDEX idx_webhook_log_processed ON connectors.webhook_log(processed, created_at DESC);
CREATE INDEX idx_meta_campaign_tenant_status ON connectors.meta_campaign(tenant_id, status);
CREATE INDEX idx_tiktok_campaign_tenant_status ON connectors.tiktok_campaign(tenant_id, status);
CREATE INDEX idx_google_campaign_tenant_status ON connectors.google_campaign(tenant_id, status);
CREATE INDEX idx_pinterest_campaign_tenant_status ON connectors.pinterest_campaign(tenant_id, status);
CREATE INDEX idx_shopify_order_tenant_date ON connectors.shopify_order(tenant_id, processed_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (Multi-tenant isolation)
-- =============================================================================
ALTER TABLE jobs.task_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE intel.ai_agent ENABLE ROW LEVEL SECURITY;
ALTER TABLE intel.agent_execution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors.meta_ad_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors.tiktok_ad_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors.google_ad_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors.pinterest_ad_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors.shopify_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors.shopify_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors.credential_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_task_queue ON jobs.task_queue 
  FOR ALL USING (tenant_id = saas.require_tenant());

CREATE POLICY rls_ai_agent ON intel.ai_agent 
  FOR ALL USING (tenant_id = saas.require_tenant());

CREATE POLICY rls_agent_execution_log ON intel.agent_execution_log 
  FOR ALL USING (tenant_id = saas.require_tenant());

CREATE POLICY rls_meta_ad_account ON connectors.meta_ad_account 
  FOR ALL USING (tenant_id = saas.require_tenant());

CREATE POLICY rls_credential_vault ON connectors.credential_vault 
  FOR ALL USING (tenant_id = saas.require_tenant());

-- =============================================================================
-- AUDIT LOGGING
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit.event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  table_name text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  actor text DEFAULT current_user,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_event_log_tenant ON audit.event_log(tenant_id, created_at DESC);

-- =============================================================================
-- OBSERVABILITY
-- =============================================================================
CREATE TABLE IF NOT EXISTS observability.metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_type text NOT NULL CHECK (metric_type IN ('counter','gauge','histogram','summary')),
  tags jsonb NOT NULL DEFAULT '{}'::jsonb,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS observability.health_check (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component text NOT NULL,
  status text NOT NULL CHECK (status IN ('healthy','degraded','unhealthy')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_metrics_name_timestamp ON observability.metrics(metric_name, timestamp DESC);
CREATE INDEX idx_health_check_component ON observability.health_check(component, last_checked_at DESC);

-- =============================================================================
-- ADS BASELINES (AEGIS MEDIA BUYING v2.0)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ads.baselines (
  tenant_id     uuid NOT NULL,
  platform      text NOT NULL,
  level         text NOT NULL CHECK (level IN ('campaign','adset')),
  window_days   integer NOT NULL CHECK (window_days BETWEEN 1 AND 365),
  spend         numeric NOT NULL DEFAULT 0,
  conversions   numeric NOT NULL DEFAULT 0,
  value         numeric NOT NULL DEFAULT 0,
  roas          numeric,
  cpa           numeric,
  ctr           numeric,
  computed_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, platform, level, window_days)
);

CREATE INDEX IF NOT EXISTS idx_baselines_lookup
ON ads.baselines (tenant_id, platform, level);

CREATE OR REPLACE FUNCTION ads.compute_baselines(
  p_tenant_id uuid,
  p_platform text,
  p_level text,
  p_window_days integer DEFAULT 7
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_window_days IS NULL OR p_window_days <= 0 OR p_window_days > 365 THEN
    RAISE EXCEPTION 'Invalid window_days: %. Must be 1-365', p_window_days;
  END IF;

  IF p_level NOT IN ('campaign','adset') THEN
    RAISE EXCEPTION 'Invalid level: %. Must be campaign or adset', p_level;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'ads' AND table_name = 'metrics_daily'
  ) THEN
    RAISE EXCEPTION 'Table ads.metrics_daily does not exist';
  END IF;

  INSERT INTO ads.baselines (
    tenant_id, platform, level, window_days,
    spend, conversions, value, roas, cpa, ctr, computed_at
  )
  SELECT
    m.tenant_id,
    m.platform,
    m.level,
    p_window_days,
    COALESCE(SUM(m.spend), 0) AS spend,
    COALESCE(SUM(m.conversions), 0) AS conversions,
    COALESCE(SUM(m.value), 0) AS value,
    CASE WHEN COALESCE(SUM(m.spend), 0) > 0
         THEN COALESCE(SUM(m.value), 0) / NULLIF(SUM(m.spend), 0) END AS roas,
    CASE WHEN COALESCE(SUM(m.conversions), 0) > 0
         THEN COALESCE(SUM(m.spend), 0) / NULLIF(SUM(m.conversions), 0) END AS cpa,
    CASE WHEN COALESCE(SUM(m.impressions), 0) > 0
         THEN COALESCE(SUM(m.clicks), 0)::numeric / NULLIF(SUM(m.impressions), 0) END AS ctr,
    now()
  FROM ads.metrics_daily m
  WHERE m.tenant_id = p_tenant_id
    AND m.platform = p_platform
    AND m.level = p_level
    AND m.day >= CURRENT_DATE - (p_window_days - 1)
  GROUP BY m.tenant_id, m.platform, m.level
  HAVING COUNT(*) > 0
  ON CONFLICT (tenant_id, platform, level, window_days)
  DO UPDATE SET
    spend       = EXCLUDED.spend,
    conversions = EXCLUDED.conversions,
    value       = EXCLUDED.value,
    roas        = EXCLUDED.roas,
    cpa         = EXCLUDED.cpa,
    ctr         = EXCLUDED.ctr,
    computed_at = now();
END $$;

CREATE OR REPLACE FUNCTION ads.refresh_all_baselines(
  p_window_days integer DEFAULT 7
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  r record;
  v_count integer := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT tenant_id, platform, level
    FROM ads.metrics_daily
    WHERE level IN ('campaign','adset')
  LOOP
    BEGIN
      PERFORM ads.compute_baselines(
        r.tenant_id, r.platform, r.level, p_window_days
      );
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Baseline computation failed for tenant %, platform %, level %: %',
        r.tenant_id, r.platform, r.level, SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END $$;

CREATE OR REPLACE FUNCTION ads.get_baseline(
  p_tenant_id uuid,
  p_platform text,
  p_level text,
  p_window_days integer DEFAULT 7
) RETURNS TABLE (
  roas numeric,
  cpa  numeric,
  ctr  numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT roas, cpa, ctr
  FROM ads.baselines
  WHERE tenant_id = p_tenant_id
    AND platform  = p_platform
    AND level     = p_level
    AND window_days = p_window_days;
$$;

COMMIT;
