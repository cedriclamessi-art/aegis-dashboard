/*
 ============================================================================
  AEGIS v5.0 - PRODUCTION DEPLOYMENT SQL
  
  PostgreSQL 14+ | Multi-tenant | RLS | OAuth-ready
  Last Updated: 2026-02-01
  
  DEPLOYMENT INSTRUCTIONS:
  1. Backup existing database
  2. Connect to PostgreSQL as superuser
  3. Run: psql -U postgres -d aegis_db -f deploy.sql
  4. Verify: Run validation queries at bottom
  
  ============================================================================
*/

-- ============================================================================
-- PHASE 1: INITIALIZATION & SAFETY
-- ============================================================================
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '900s';
SET LOCAL idle_in_transaction_session_timeout = '120s';

-- Create basic report table for tracking
CREATE TABLE IF NOT EXISTS public.deployment_log (
  id serial PRIMARY KEY,
  phase text,
  status text,
  message text,
  created_at timestamptz DEFAULT now()
);

INSERT INTO public.deployment_log (phase, status, message)
VALUES ('INIT', 'started', 'AEGIS v5.0 deployment initiated');

-- ============================================================================
-- PHASE 2: SCHEMAS & EXTENSIONS
-- ============================================================================
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

INSERT INTO public.deployment_log (phase, status, message)
VALUES ('EXTENSIONS', 'success', 'Schemas and extensions created');

-- ============================================================================
-- PHASE 3: CORE TENANT & SUBSCRIPTION INFRASTRUCTURE
-- ============================================================================

-- Tenant Context Functions
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

-- Tenant Configuration
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

-- Subscription Plans
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

-- Tenant Subscriptions
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

-- Subscription Event Log
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

INSERT INTO public.deployment_log (phase, status, message)
VALUES ('TENANT_INFRA', 'success', 'Tenant and subscription tables created');

-- ============================================================================
-- PHASE 4: JOB QUEUE & BACKGROUND PROCESSING
-- ============================================================================

-- Task Queue (for background jobs)
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

-- Dead Letter Queue
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

-- Recurring Schedule
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

INSERT INTO public.deployment_log (phase, status, message)
VALUES ('JOB_QUEUE', 'success', 'Job queue tables created');

-- ============================================================================
-- PHASE 5: AI AGENTS INFRASTRUCTURE
-- ============================================================================

-- Agent Roles
CREATE TABLE IF NOT EXISTS intel.agent_role (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata_schema jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- AI Agents
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

-- Agent Catalog
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

-- Execution Logs
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

-- Agent Message Queue
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

-- Agent Workflows
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

INSERT INTO public.deployment_log (phase, status, message)
VALUES ('AI_AGENTS', 'success', 'AI agent tables created');

-- ============================================================================
-- PHASE 6: CONNECTORS INFRASTRUCTURE
-- ============================================================================

-- Credential Vault
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

-- Sync Log
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

-- Webhook Log
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

-- Meta Ad Accounts
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

-- Meta Campaigns
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

-- TikTok Ad Accounts
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

-- TikTok Campaigns
CREATE TABLE IF NOT EXISTS connectors.tiktok_campaign (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ad_account_id uuid NOT NULL REFERENCES connectors.tiktok_ad_account(id) ON DELETE CASCADE,
  campaign_id text NOT NULL,
  name text NOT NULL,
  status text NOT NULL,
  objective text,
  budget numeric(12,2),
  spend numeric(12,2) NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  conversions int NOT NULL DEFAULT 0,
  ctr numeric(6,4),
  cpc numeric(12,4),
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, campaign_id)
);

-- Google Ad Accounts
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

-- Google Campaigns
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

-- Pinterest Ad Accounts
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

-- Pinterest Campaigns
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

-- Shopify Stores
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

-- Shopify Products
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

-- Shopify Orders
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

INSERT INTO public.deployment_log (phase, status, message)
VALUES ('CONNECTORS', 'success', 'Connector tables created for all platforms');

-- ============================================================================
-- PHASE 7: INDEXES
-- ============================================================================

-- Job Queue Indexes
CREATE INDEX idx_task_queue_tenant_status ON jobs.task_queue(tenant_id, status);
CREATE INDEX idx_task_queue_scheduled_for ON jobs.task_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_task_queue_idempotency ON jobs.task_queue(tenant_id, idempotency_key);

-- AI Agent Indexes
CREATE INDEX idx_ai_agent_tenant_enabled ON intel.ai_agent(tenant_id, is_enabled);
CREATE INDEX idx_agent_execution_log_tenant_agent ON intel.agent_execution_log(tenant_id, agent_id);
CREATE INDEX idx_agent_execution_log_created ON intel.agent_execution_log(created_at DESC);

-- Connector Indexes
CREATE INDEX idx_webhook_log_connector_event ON connectors.webhook_log(connector_type, event_id);
CREATE INDEX idx_webhook_log_processed ON connectors.webhook_log(processed, created_at DESC);
CREATE INDEX idx_meta_campaign_tenant_status ON connectors.meta_campaign(tenant_id, status);
CREATE INDEX idx_tiktok_campaign_tenant_status ON connectors.tiktok_campaign(tenant_id, status);
CREATE INDEX idx_google_campaign_tenant_status ON connectors.google_campaign(tenant_id, status);
CREATE INDEX idx_pinterest_campaign_tenant_status ON connectors.pinterest_campaign(tenant_id, status);
CREATE INDEX idx_shopify_order_tenant_date ON connectors.shopify_order(tenant_id, processed_at DESC);

-- Audit & Observability Indexes
CREATE INDEX idx_audit_event_log_tenant ON audit.event_log(tenant_id, created_at DESC);
CREATE INDEX idx_metrics_name_timestamp ON observability.metrics(metric_name, timestamp DESC);
CREATE INDEX idx_health_check_component ON observability.health_check(component, last_checked_at DESC);

INSERT INTO public.deployment_log (phase, status, message)
VALUES ('INDEXES', 'success', '16+ indexes created for performance');

-- ============================================================================
-- PHASE 8: ROW LEVEL SECURITY (Multi-tenant isolation)
-- ============================================================================

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

INSERT INTO public.deployment_log (phase, status, message)
VALUES ('RLS', 'success', 'Row Level Security policies enabled for multi-tenant isolation');

-- ============================================================================
-- PHASE 9: AUDIT LOGGING
-- ============================================================================

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

-- ============================================================================
-- PHASE 10: OBSERVABILITY
-- ============================================================================

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

INSERT INTO public.deployment_log (phase, status, message)
VALUES ('OBSERVABILITY', 'success', 'Observability tables created');

-- ============================================================================
-- PHASE 11: INITIAL DATA (Seeds)
-- ============================================================================

-- Default Plans
INSERT INTO ops.plan (code, name, price_cents, trial_days, limits, features, sort_order)
VALUES
  ('free', 'Free', 0, 14, 
    '{"agents": 1, "tasks_per_day": 10, "connectors": 1}'::jsonb,
    '["basic_agents", "limited_integrations"]'::jsonb,
    10),
  ('starter', 'Starter', 2999, 30,
    '{"agents": 5, "tasks_per_day": 100, "connectors": 3}'::jsonb,
    '["ai_agents", "multi_platform", "basic_support"]'::jsonb,
    20),
  ('pro', 'Professional', 9999, 30,
    '{"agents": 20, "tasks_per_day": 1000, "connectors": 10}'::jsonb,
    '["all_agents", "all_connectors", "priority_support", "custom_workflows"]'::jsonb,
    30),
  ('enterprise', 'Enterprise', 0, 60,
    '{"agents": -1, "tasks_per_day": -1, "connectors": -1}'::jsonb,
    '["unlimited", "dedicated_support", "sso", "custom_integration"]'::jsonb,
    40)
ON CONFLICT DO NOTHING;

-- Default Agent Roles
INSERT INTO intel.agent_role (code, name, description, capabilities)
VALUES
  ('content_creator', 'Content Creator', 'Generates and optimizes social media content', 
    '["text_generation", "image_analysis", "hashtag_optimization"]'::jsonb),
  ('data_analyst', 'Data Analyst', 'Analyzes campaign performance and metrics', 
    '["data_analysis", "trend_detection", "anomaly_detection"]'::jsonb),
  ('campaign_optimizer', 'Campaign Optimizer', 'Optimizes ad campaigns for better ROI', 
    '["bidding_optimization", "audience_targeting", "budget_allocation"]'::jsonb),
  ('customer_support', 'Customer Support', 'Handles customer inquiries and support', 
    '["chat_handling", "escalation", "sentiment_analysis"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Default Agent Catalog
INSERT INTO intel.agent_catalog (agent_name, role_code, display_name, description, system_prompt, 
                                  capabilities, sort_order, is_default)
VALUES
  ('content_writer', 'content_creator', 'Content Writer', 'Creates engaging social media content', 
    'You are a social media content expert. Create compelling, engaging posts optimized for each platform.',
    '["text_generation", "platform_optimization", "brand_voice"]'::jsonb, 10, true),
  ('performance_analyst', 'data_analyst', 'Performance Analyst', 'Analyzes ad performance and KPIs',
    'You are an experienced marketing analyst. Analyze performance data and provide actionable insights.',
    '["data_analysis", "kpi_tracking", "reporting"]'::jsonb, 20, true),
  ('bid_optimizer', 'campaign_optimizer', 'Bid Optimizer', 'Optimizes bidding strategies',
    'You are a campaign optimization expert. Recommend bidding adjustments to improve ROI.',
    '["bidding_optimization", "budget_allocation", "roas_improvement"]'::jsonb, 30, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.deployment_log (phase, status, message)
VALUES ('SEEDS', 'success', 'Default plans, roles, and agents initialized');

-- ============================================================================
-- PHASE 12: FINAL VALIDATION & LOGGING
-- ============================================================================

-- Count all tables created
WITH table_counts AS (
  SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'saas') as saas_tables,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'ops') as ops_tables,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'jobs') as jobs_tables,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'intel') as intel_tables,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'connectors') as connectors_tables,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'audit') as audit_tables,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'observability') as observability_tables
)
INSERT INTO public.deployment_log (phase, status, message)
SELECT 'VALIDATION', 'success', 
  'Deployment complete. Tables: ' || (saas_tables + ops_tables + jobs_tables + intel_tables + 
    connectors_tables + audit_tables + observability_tables)::text
FROM table_counts;

COMMIT;

-- ============================================================================
-- DEPLOYMENT VALIDATION QUERIES
-- ============================================================================

-- Run these queries to validate successful deployment:

-- 1. Check all schemas exist:
-- SELECT schema_name FROM information_schema.schemata 
-- WHERE schema_name IN ('saas','ops','jobs','intel','crm','audit','observability','connectors','ads');

-- 2. Count tables per schema:
-- SELECT table_schema, COUNT(*) as table_count 
-- FROM information_schema.tables 
-- WHERE table_schema IN ('saas','ops','jobs','intel','crm','audit','observability','connectors','ads')
-- GROUP BY table_schema ORDER BY table_schema;

-- 3. Verify RLS policies:
-- SELECT tablename, policyname FROM pg_policies;

-- 4. Check extensions:
-- SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto','citext','pg_trgm','uuid-ossp');

-- 5. Check deployment log:
-- SELECT * FROM public.deployment_log ORDER BY created_at;

-- 6. Verify plans created:
-- SELECT code, name, price_cents FROM ops.plan;

-- 7. Verify agent roles:
-- SELECT code, name FROM intel.agent_role;

-- 8. Verify agent catalog:
-- SELECT agent_name, display_name FROM intel.agent_catalog;

-- ============================================================================
-- ADDITIONAL SETUP (Optional but recommended)
-- ============================================================================

-- Create a test tenant for development:
-- DO $$ 
-- DECLARE
--   v_tenant_id uuid := '12345678-1234-5678-1234-567812345678';
-- BEGIN
--   INSERT INTO ops.tenant_config (tenant_id, company_name, timezone)
--   VALUES (v_tenant_id, 'Test Company', 'UTC');
--   
--   INSERT INTO ops.tenant_subscription (tenant_id, plan_code, trial_end_at)
--   VALUES (v_tenant_id, 'pro', now() + interval '30 days');
--   
--   RAISE NOTICE 'Test tenant % created successfully', v_tenant_id;
-- END $$;

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================
-- AEGIS v5.0 database is now ready for production use
-- Database: PostgreSQL 14+
-- Multi-tenant: ✓ RLS enabled
-- OAuth Ready: ✓ 
-- Connectors: Meta, TikTok, Google, Pinterest, Shopify
-- AI Agents: Ready
-- 
-- For questions, see: documentation/DEPLOYMENT.md
-- ============================================================================
