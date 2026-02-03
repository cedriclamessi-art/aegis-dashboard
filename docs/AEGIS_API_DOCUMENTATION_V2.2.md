# 📚 AEGIS Media Buying v2.2 - Documentation API

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Tables](#tables)
4. [Fonctions](#fonctions)
5. [Vues](#vues)
6. [Exemples d'utilisation](#exemples-dutilisation)
7. [Optimisation & Performance](#optimisation--performance)
8. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

AEGIS Media Buying v2.2 est un système complet de gestion et d'optimisation des campagnes publicitaires multi-plateformes avec intelligence artificielle intégrée.

### Caractéristiques principales

- **Multi-tenant sécurisé** avec Row Level Security (RLS)
- **Partitionnement automatique** pour scalabilité
- **Optimisation IA** avec recommandations automatiques
- **Détection d'anomalies** en temps réel
- **Tests A/B** intégrés
- **Monitoring avancé** avec feedback loop
- **Performance optimisée** (< 50ms pour la plupart des requêtes)
- **Gestion multi-devises** avec conversion automatique
- **Rate limiting intelligent** pour APIs externes
- **Système d'alertes proactives** multi-canal
- **Audit trail complet** avec traçabilité utilisateur
- **Saisonnalité & événements** pour prédictions avancées

### Plateformes supportées

- Meta (Facebook & Instagram)
- TikTok
- Google Ads
- Pinterest
- Shopify
- Snapchat
- LinkedIn

---

## Architecture

### Schéma de base de données

```
ads (schema)
├── platforms (référence)
├── metrics_daily (partitionné par mois)
├── baselines (avec versioning)
├── campaign_performance
├── budget_allocation
├── optimization_recommendations
├── recommendation_feedback
├── ab_tests
├── anomalies
├── anomaly_false_positives
├── platform_configs
├── platform_configs_history
├── performance_benchmarks
├── optimization_history
├── system_metrics
├── api_usage_tracking (coûts API)
├── api_rate_limits (rate limiting)
├── alerts (notifications proactives)
├── alert_history (historique alertes)
├── alert_notifications_queue (file d'envoi)
├── currency_rates (taux de change)
├── seasonal_events (saisonnalité)
└── audit_log (traçabilité complète)
```

### Flux de données

```
1. Ingestion → metrics_daily (partitionné) → conversion devise automatique
2. Calcul → baselines (versionnées) → ajustement saisonnalité
3. Analyse → generate_recommendations() → vérification rate limits
4. Détection → detect_anomalies() → génération alertes
5. Action → recommendation_feedback → audit log
6. Apprentissage → optimization_history
7. Monitoring → api_usage_tracking → optimisation coûts
```

---

## Tables

### 1. platforms

Table de référence des plateformes publicitaires.

```sql
CREATE TABLE ads.platforms (
    code text PRIMARY KEY,
    name text NOT NULL,
    display_name text NOT NULL,
    api_endpoint text,
    config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);
```

### 2. metrics_daily

Métriques quotidiennes partitionnées par mois.

```sql
CREATE TABLE ads.metrics_daily (
    tenant_id uuid NOT NULL,
    platform text NOT NULL,
    level text NOT NULL,
    platform_id text NOT NULL,
    day date NOT NULL,
    
    spend decimal(12,2) DEFAULT 0,
    impressions bigint DEFAULT 0,
    clicks bigint DEFAULT 0,
    conversions integer DEFAULT 0,
    conversion_value decimal(12,2) DEFAULT 0,
    
    roas decimal(10,4) GENERATED ALWAYS AS (
        CASE WHEN spend > 0 THEN conversion_value / spend ELSE 0 END
    ) STORED,
    cpa decimal(10,2) GENERATED ALWAYS AS (
        CASE WHEN conversions > 0 THEN spend / conversions ELSE 0 END
    ) STORED,
    cpc decimal(10,4) GENERATED ALWAYS AS (
        CASE WHEN clicks > 0 THEN spend / clicks ELSE 0 END
    ) STORED,
    cpm decimal(10,4) GENERATED ALWAYS AS (
        CASE WHEN impressions > 0 THEN (spend / impressions) * 1000 ELSE 0 END
    ) STORED,
    ctr decimal(8,4) GENERATED ALWAYS AS (
        CASE WHEN impressions > 0 THEN (clicks::decimal / impressions) * 100 ELSE 0 END
    ) STORED,
    conversion_rate decimal(8,4) GENERATED ALWAYS AS (
        CASE WHEN clicks > 0 THEN (conversions::decimal / clicks) * 100 ELSE 0 END
    ) STORED,
    
    currency_code text DEFAULT 'USD',
    exchange_rate decimal(12,6) DEFAULT 1.0,
    spend_usd decimal(12,2),
    conversion_value_usd decimal(12,2),
    
    is_demo boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    
    PRIMARY KEY (tenant_id, platform, level, platform_id, day)
) PARTITION BY RANGE (day);

CREATE INDEX idx_metrics_daily_tenant ON ads.metrics_daily(tenant_id, day DESC);
CREATE INDEX idx_metrics_daily_platform ON ads.metrics_daily(platform, day DESC);
```

### 3. baselines

Références de performance versionnées.

```sql
CREATE TABLE ads.baselines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    platform text NOT NULL,
    level text NOT NULL,
    platform_id text NOT NULL,
    
    avg_spend decimal(12,2),
    avg_impressions decimal(12,2),
    avg_clicks decimal(12,2),
    avg_conversions decimal(10,2),
    avg_roas decimal(10,4),
    avg_cpa decimal(10,2),
    avg_ctr decimal(8,4),
    
    std_spend decimal(12,2),
    std_roas decimal(10,4),
    std_cpa decimal(10,2),
    
    sample_size integer DEFAULT 0,
    confidence_level decimal(5,2) DEFAULT 0.95,
    
    version integer DEFAULT 1,
    valid_from timestamptz DEFAULT now(),
    valid_until timestamptz DEFAULT (now() + interval '30 days'),
    
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_baselines_lookup ON ads.baselines(tenant_id, platform, platform_id, valid_until DESC);
```

### 4. api_usage_tracking

Suivi des coûts et de l'utilisation des APIs externes.

```sql
CREATE TABLE ads.api_usage_tracking (
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

CREATE INDEX idx_api_usage_tenant_period ON ads.api_usage_tracking(tenant_id, period_start DESC);
CREATE INDEX idx_api_usage_platform ON ads.api_usage_tracking(platform, period_start DESC);
```

### 5. api_rate_limits

Gestion intelligente des limites de taux.

```sql
CREATE TABLE ads.api_rate_limits (
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

CREATE INDEX idx_rate_limits_lookup ON ads.api_rate_limits(tenant_id, platform, is_throttled);
```

### 6. alerts

Système d'alertes proactives multi-canal.

```sql
CREATE TABLE ads.alerts (
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

CREATE INDEX idx_alerts_active ON ads.alerts(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX idx_alerts_type ON ads.alerts(alert_type, is_active);
```

### 7. alert_history

Historique des alertes déclenchées.

```sql
CREATE TABLE ads.alert_history (
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

CREATE INDEX idx_alert_history_alert ON ads.alert_history(alert_id, triggered_at DESC);
CREATE INDEX idx_alert_history_tenant ON ads.alert_history(tenant_id, triggered_at DESC);
```

### 8. alert_notifications_queue

File d'attente des notifications à envoyer.

```sql
CREATE TABLE ads.alert_notifications_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_type text NOT NULL,
    recipients text[],
    webhook_url text,
    webhook_method text DEFAULT 'POST',
    priority text DEFAULT 'normal',
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'sent', 'failed', 'expired')),
    attempts integer DEFAULT 0,
    last_attempt_at timestamptz,
    sent_at timestamptz,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_alert_notifications_status ON ads.alert_notifications_queue(status, created_at);
```

### 9. currency_rates

Taux de change historiques.

```sql
CREATE TABLE ads.currency_rates (
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

CREATE INDEX idx_currency_rates_lookup ON ads.currency_rates(from_currency, to_currency, valid_from DESC);
```

### 10. seasonal_events

Événements saisonniers et jours fériés.

```sql
CREATE TABLE ads.seasonal_events (
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

CREATE INDEX idx_seasonal_events_date ON ads.seasonal_events(event_date);
CREATE INDEX idx_seasonal_events_recurring ON ads.seasonal_events(is_recurring, event_type);
```

### 11. audit_log

Traçabilité complète de toutes les actions.

```sql
CREATE TABLE ads.audit_log (
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

CREATE INDEX idx_audit_log_tenant_time ON ads.audit_log(tenant_id, performed_at DESC);
CREATE INDEX idx_audit_log_user ON ads.audit_log(user_id, performed_at DESC);
CREATE INDEX idx_audit_log_resource ON ads.audit_log(resource_type, resource_id);
```

### 12. anomalies

Détection des anomalies de performance.

```sql
CREATE TABLE ads.anomalies (
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

CREATE INDEX idx_anomalies_tenant ON ads.anomalies(tenant_id, created_at DESC);
CREATE INDEX idx_anomalies_unresolved ON ads.anomalies(tenant_id, resolved) WHERE resolved = false;
```

### 13. budget_allocation

Allocation des budgets par campagne.

```sql
CREATE TABLE ads.budget_allocation (
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

CREATE INDEX idx_budget_allocation_tenant ON ads.budget_allocation(tenant_id, period_start);
```

---

## Fonctions

### 1. Helper Functions

```sql
-- Fibonacci pour backoff
CREATE OR REPLACE FUNCTION ads.fibonacci(n integer)
RETURNS integer AS $$
DECLARE
    a integer := 0;
    b integer := 1;
    temp integer;
BEGIN
    IF n <= 0 THEN RETURN 0; END IF;
    IF n = 1 THEN RETURN 1; END IF;
    
    FOR i IN 2..n LOOP
        temp := a + b;
        a := b;
        b := temp;
    END LOOP;
    
    RETURN b;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Diff JSON
CREATE OR REPLACE FUNCTION ads.jsonb_diff(
    old_json jsonb,
    new_json jsonb
) RETURNS jsonb AS $$
DECLARE
    result jsonb := '{}'::jsonb;
    key text;
BEGIN
    FOR key IN SELECT jsonb_object_keys(old_json) UNION SELECT jsonb_object_keys(new_json)
    LOOP
        IF old_json->key IS DISTINCT FROM new_json->key THEN
            result := result || jsonb_build_object(
                key, jsonb_build_object('old', old_json->key, 'new', new_json->key)
            );
        END IF;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Vérification heures actives
CREATE OR REPLACE FUNCTION ads.is_within_active_hours(
    p_active_hours jsonb,
    p_active_days integer[]
) RETURNS boolean AS $$
DECLARE
    v_current_hour integer;
    v_current_dow integer;
    v_start_hour integer;
    v_end_hour integer;
    v_tz text;
    v_now timestamptz;
BEGIN
    IF p_active_hours IS NULL THEN RETURN true; END IF;
    
    v_tz := COALESCE(p_active_hours->>'timezone', 'UTC');
    v_now := now() AT TIME ZONE v_tz;
    v_current_hour := EXTRACT(HOUR FROM v_now);
    v_current_dow := EXTRACT(ISODOW FROM v_now)::integer;
    
    IF p_active_days IS NOT NULL AND array_length(p_active_days, 1) > 0 THEN
        IF NOT (v_current_dow = ANY(p_active_days)) THEN RETURN false; END IF;
    END IF;
    
    IF p_active_hours->>'start' IS NOT NULL AND p_active_hours->>'end' IS NOT NULL THEN
        v_start_hour := SPLIT_PART(p_active_hours->>'start', ':', 1)::integer;
        v_end_hour := SPLIT_PART(p_active_hours->>'end', ':', 1)::integer;
        
        IF v_start_hour <= v_end_hour THEN
            RETURN v_current_hour >= v_start_hour AND v_current_hour < v_end_hour;
        ELSE
            RETURN v_current_hour >= v_start_hour OR v_current_hour < v_end_hour;
        END IF;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 2. Rate Limiting

```sql
-- Calcul backoff
CREATE OR REPLACE FUNCTION ads.calculate_backoff_seconds(
    p_attempt integer,
    p_strategy text DEFAULT 'exponential'
) RETURNS integer AS $$
BEGIN
    RETURN CASE p_strategy
        WHEN 'linear' THEN p_attempt * 5
        WHEN 'exponential' THEN POWER(2, p_attempt)::integer * 5
        WHEN 'fibonacci' THEN ads.fibonacci(p_attempt) * 5
        ELSE 5
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Vérification rate limit
CREATE OR REPLACE FUNCTION ads.check_rate_limit(
    p_tenant_id uuid,
    p_platform text,
    p_endpoint text
) RETURNS boolean AS $$
DECLARE
    v_limit record;
    v_can_proceed boolean := true;
BEGIN
    SELECT * INTO v_limit
    FROM ads.api_rate_limits
    WHERE tenant_id = p_tenant_id
        AND platform = p_platform
        AND p_endpoint LIKE REPLACE(endpoint_pattern, '*', '%')
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN RETURN true; END IF;
    
    IF v_limit.is_throttled THEN
        IF v_limit.throttled_until > now() THEN
            RETURN false;
        ELSE
            UPDATE ads.api_rate_limits
            SET is_throttled = false, throttled_until = NULL, current_minute_count = 0
            WHERE id = v_limit.id;
        END IF;
    END IF;
    
    IF (v_limit.requests_per_minute IS NOT NULL AND v_limit.current_minute_count >= v_limit.requests_per_minute) OR
       (v_limit.requests_per_hour IS NOT NULL AND v_limit.current_hour_count >= v_limit.requests_per_hour) OR
       (v_limit.requests_per_day IS NOT NULL AND v_limit.current_day_count >= v_limit.requests_per_day) THEN
        v_can_proceed := false;
    END IF;
    
    IF NOT v_can_proceed THEN
        UPDATE ads.api_rate_limits
        SET is_throttled = true,
            throttled_until = now() + (COALESCE(v_limit.retry_after_seconds, 60) || ' seconds')::interval
        WHERE id = v_limit.id;
    ELSE
        UPDATE ads.api_rate_limits
        SET current_minute_count = current_minute_count + 1,
            current_hour_count = current_hour_count + 1,
            current_day_count = current_day_count + 1,
            last_request_at = now(),
            updated_at = now()
        WHERE id = v_limit.id;
    END IF;
    
    RETURN v_can_proceed;
END;
$$ LANGUAGE plpgsql;
```

### 3. Currency Functions

```sql
-- Obtenir taux de change
CREATE OR REPLACE FUNCTION ads.get_exchange_rate(
    p_from_currency text,
    p_to_currency text DEFAULT 'USD',
    p_date date DEFAULT CURRENT_DATE
) RETURNS decimal AS $$
DECLARE
    v_rate decimal;
BEGIN
    IF p_from_currency = p_to_currency THEN RETURN 1.0; END IF;
    
    SELECT exchange_rate INTO v_rate
    FROM ads.currency_rates
    WHERE from_currency = p_from_currency
        AND to_currency = p_to_currency
        AND valid_from <= p_date
        AND (valid_until IS NULL OR valid_until >= p_date)
    ORDER BY valid_from DESC
    LIMIT 1;
    
    IF v_rate IS NULL THEN
        SELECT exchange_rate INTO v_rate
        FROM ads.currency_rates
        WHERE from_currency = p_from_currency AND to_currency = p_to_currency
        ORDER BY valid_from DESC
        LIMIT 1;
    END IF;
    
    RETURN COALESCE(v_rate, 1.0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Synchronisation taux
CREATE OR REPLACE FUNCTION ads.sync_exchange_rates()
RETURNS integer AS $$
DECLARE
    v_inserted integer := 0;
BEGIN
    INSERT INTO ads.currency_rates (from_currency, to_currency, exchange_rate, valid_from, source)
    VALUES 
        ('EUR', 'USD', 1.0854, CURRENT_DATE, 'sync'),
        ('GBP', 'USD', 1.2634, CURRENT_DATE, 'sync'),
        ('JPY', 'USD', 0.0067, CURRENT_DATE, 'sync'),
        ('CAD', 'USD', 0.7142, CURRENT_DATE, 'sync'),
        ('AUD', 'USD', 0.6389, CURRENT_DATE, 'sync'),
        ('CHF', 'USD', 1.1234, CURRENT_DATE, 'sync'),
        ('CNY', 'USD', 0.1389, CURRENT_DATE, 'sync'),
        ('INR', 'USD', 0.0120, CURRENT_DATE, 'sync'),
        ('BRL', 'USD', 0.1980, CURRENT_DATE, 'sync'),
        ('MXN', 'USD', 0.0580, CURRENT_DATE, 'sync')
    ON CONFLICT (from_currency, to_currency, valid_from) 
    DO UPDATE SET exchange_rate = EXCLUDED.exchange_rate, source = EXCLUDED.source;
    
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    RETURN v_inserted;
END;
$$ LANGUAGE plpgsql;
```

### 4. Alert Evaluation Functions

```sql
-- Évaluation alerte budget
CREATE OR REPLACE FUNCTION ads.eval_budget_alert(
    p_alert_id uuid,
    p_conditions jsonb
) RETURNS TABLE (should_trigger boolean, reason jsonb) AS $$
DECLARE
    v_tenant_id uuid;
    v_threshold decimal;
    v_current_spend decimal;
    v_budget decimal;
    v_percent decimal;
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM ads.alerts WHERE id = p_alert_id;
    v_threshold := (p_conditions->>'threshold')::decimal;
    
    SELECT COALESCE(SUM(spend_usd), 0), COALESCE(SUM(ba.allocated_budget), 0)
    INTO v_current_spend, v_budget
    FROM ads.metrics_daily md
    LEFT JOIN ads.budget_allocation ba ON md.platform_id = ba.campaign_id
    WHERE md.tenant_id = v_tenant_id AND md.day >= date_trunc('month', CURRENT_DATE);
    
    IF v_budget > 0 THEN
        v_percent := v_current_spend / v_budget;
        IF v_percent >= v_threshold THEN
            RETURN QUERY SELECT true, jsonb_build_object(
                'current_spend', v_current_spend, 'budget', v_budget,
                'percent_used', ROUND(v_percent * 100, 2), 'threshold', v_threshold * 100
            );
            RETURN;
        END IF;
    END IF;
    
    RETURN QUERY SELECT false, '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- Évaluation alerte anomalie
CREATE OR REPLACE FUNCTION ads.eval_anomaly_alert(
    p_alert_id uuid,
    p_conditions jsonb
) RETURNS TABLE (should_trigger boolean, reason jsonb) AS $$
DECLARE
    v_tenant_id uuid;
    v_severities text[];
    v_types text[];
    v_anomaly record;
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM ads.alerts WHERE id = p_alert_id;
    v_severities := ARRAY(SELECT jsonb_array_elements_text(p_conditions->'anomaly_severity'));
    v_types := ARRAY(SELECT jsonb_array_elements_text(p_conditions->'anomaly_types'));
    
    SELECT * INTO v_anomaly
    FROM ads.anomalies
    WHERE tenant_id = v_tenant_id
        AND created_at >= now() - INTERVAL '1 hour'
        AND (array_length(v_severities, 1) IS NULL OR severity = ANY(v_severities))
        AND (array_length(v_types, 1) IS NULL OR anomaly_type = ANY(v_types))
        AND NOT resolved
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF FOUND THEN
        RETURN QUERY SELECT true, jsonb_build_object(
            'anomaly_id', v_anomaly.id, 'anomaly_type', v_anomaly.anomaly_type,
            'severity', v_anomaly.severity, 'platform_id', v_anomaly.platform_id
        );
        RETURN;
    END IF;
    
    RETURN QUERY SELECT false, '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- Évaluation alerte performance
CREATE OR REPLACE FUNCTION ads.eval_performance_alert(
    p_alert_id uuid,
    p_conditions jsonb
) RETURNS TABLE (should_trigger boolean, reason jsonb) AS $$
DECLARE
    v_tenant_id uuid;
    v_metric text;
    v_operator text;
    v_threshold decimal;
    v_current_value decimal;
    v_baseline_value decimal;
    v_effective_threshold decimal;
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM ads.alerts WHERE id = p_alert_id;
    
    v_metric := p_conditions->>'metric';
    v_operator := p_conditions->>'operator';
    v_threshold := (p_conditions->>'threshold')::decimal;
    
    EXECUTE format('SELECT AVG(%I) FROM ads.metrics_daily WHERE tenant_id = $1 AND day = CURRENT_DATE', v_metric)
    INTO v_current_value USING v_tenant_id;
    
    IF COALESCE(p_conditions->>'threshold_type', 'absolute') = 'multiplier_of_baseline' THEN
        SELECT AVG(avg_roas) INTO v_baseline_value FROM ads.baselines WHERE tenant_id = v_tenant_id;
        v_effective_threshold := v_baseline_value * v_threshold;
    ELSE
        v_effective_threshold := v_threshold;
    END IF;
    
    IF v_current_value IS NOT NULL AND v_effective_threshold IS NOT NULL THEN
        IF (v_operator = '>' AND v_current_value > v_effective_threshold) OR
           (v_operator = '>=' AND v_current_value >= v_effective_threshold) OR
           (v_operator = '<' AND v_current_value < v_effective_threshold) OR
           (v_operator = '<=' AND v_current_value <= v_effective_threshold) THEN
            RETURN QUERY SELECT true, jsonb_build_object(
                'metric', v_metric, 'current_value', v_current_value, 'threshold', v_effective_threshold
            );
            RETURN;
        END IF;
    END IF;
    
    RETURN QUERY SELECT false, '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- Évaluation alerte saisonnière
CREATE OR REPLACE FUNCTION ads.eval_seasonal_alert(
    p_alert_id uuid,
    p_conditions jsonb
) RETURNS TABLE (should_trigger boolean, reason jsonb) AS $$
DECLARE
    v_event_name text;
    v_days_before integer;
    v_event record;
BEGIN
    v_event_name := p_conditions->>'event_name';
    v_days_before := (p_conditions->>'days_before')::integer;
    
    SELECT * INTO v_event
    FROM ads.seasonal_events
    WHERE event_name = v_event_name
        AND event_date = CURRENT_DATE + (v_days_before || ' days')::interval;
    
    IF FOUND THEN
        RETURN QUERY SELECT true, jsonb_build_object(
            'event_name', v_event.event_name, 'event_date', v_event.event_date,
            'days_until', v_days_before, 'impact_level', v_event.impact_level
        );
        RETURN;
    END IF;
    
    RETURN QUERY SELECT false, '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- Évaluation alerte quota API
CREATE OR REPLACE FUNCTION ads.eval_api_quota_alert(
    p_alert_id uuid,
    p_conditions jsonb
) RETURNS TABLE (should_trigger boolean, reason jsonb) AS $$
DECLARE
    v_tenant_id uuid;
    v_threshold decimal;
    v_platforms text[];
    v_usage record;
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM ads.alerts WHERE id = p_alert_id;
    v_threshold := (p_conditions->>'threshold')::decimal;
    v_platforms := ARRAY(SELECT jsonb_array_elements_text(p_conditions->'platforms'));
    
    SELECT platform, SUM(quota_used) as used, SUM(quota_limit) as total
    INTO v_usage
    FROM ads.api_usage_tracking
    WHERE tenant_id = v_tenant_id
        AND (array_length(v_platforms, 1) IS NULL OR platform = ANY(v_platforms))
        AND period_start >= date_trunc('day', CURRENT_DATE)
    GROUP BY platform
    HAVING SUM(quota_used)::decimal / NULLIF(SUM(quota_limit), 0) >= v_threshold
    LIMIT 1;
    
    IF FOUND THEN
        RETURN QUERY SELECT true, jsonb_build_object(
            'platform', v_usage.platform, 'quota_used', v_usage.used,
            'quota_limit', v_usage.total,
            'percent_used', ROUND((v_usage.used::decimal / v_usage.total) * 100, 2)
        );
        RETURN;
    END IF;
    
    RETURN QUERY SELECT false, '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;
```

### 5. Notification Functions

```sql
-- Envoi email
CREATE OR REPLACE FUNCTION ads.send_email_alert(p_channel jsonb, p_trigger_reason jsonb)
RETURNS jsonb AS $$
BEGIN
    INSERT INTO ads.alert_notifications_queue (channel_type, recipients, priority, payload, status, created_at)
    VALUES ('email', ARRAY(SELECT jsonb_array_elements_text(p_channel->'recipients')),
            COALESCE(p_channel->>'priority', 'normal'), p_trigger_reason, 'pending', now());
    RETURN jsonb_build_object('status', 'queued', 'queued_at', now());
END;
$$ LANGUAGE plpgsql;

-- Envoi Slack
CREATE OR REPLACE FUNCTION ads.send_slack_alert(p_channel jsonb, p_trigger_reason jsonb)
RETURNS jsonb AS $$
BEGIN
    INSERT INTO ads.alert_notifications_queue (channel_type, webhook_url, payload, status, created_at)
    VALUES ('slack', p_channel->>'webhook', jsonb_build_object(
        'channel', p_channel->>'channel',
        'text', format('Alert: %s', p_trigger_reason->>'anomaly_type'),
        'attachments', jsonb_build_array(jsonb_build_object('color', 'danger', 'fields', p_trigger_reason))
    ), 'pending', now());
    RETURN jsonb_build_object('status', 'queued', 'queued_at', now());
END;
$$ LANGUAGE plpgsql;

-- Envoi SMS
CREATE OR REPLACE FUNCTION ads.send_sms_alert(p_channel jsonb, p_trigger_reason jsonb)
RETURNS jsonb AS $$
BEGIN
    INSERT INTO ads.alert_notifications_queue (channel_type, recipients, payload, status, created_at)
    VALUES ('sms', ARRAY(SELECT jsonb_array_elements_text(p_channel->'numbers')),
            jsonb_build_object('message', format('AEGIS Alert: %s',
                COALESCE(p_trigger_reason->>'anomaly_type', p_trigger_reason->>'event_name', 'System Alert')
            )), 'pending', now());
    RETURN jsonb_build_object('status', 'queued', 'queued_at', now());
END;
$$ LANGUAGE plpgsql;

-- Envoi Webhook
CREATE OR REPLACE FUNCTION ads.send_webhook_alert(p_channel jsonb, p_trigger_reason jsonb)
RETURNS jsonb AS $$
BEGIN
    INSERT INTO ads.alert_notifications_queue (channel_type, webhook_url, webhook_method, payload, status, created_at)
    VALUES ('webhook', p_channel->>'url', COALESCE(p_channel->>'method', 'POST'), p_trigger_reason, 'pending', now());
    RETURN jsonb_build_object('status', 'queued', 'queued_at', now());
END;
$$ LANGUAGE plpgsql;
```

### 6. Alert System Functions

```sql
-- Évaluation des conditions
CREATE OR REPLACE FUNCTION ads.evaluate_alert_conditions(p_alert_id uuid, p_conditions jsonb)
RETURNS TABLE (should_trigger boolean, reason jsonb) AS $$
DECLARE
    v_alert_type text;
BEGIN
    SELECT alert_type INTO v_alert_type FROM ads.alerts WHERE id = p_alert_id;
    
    CASE v_alert_type
        WHEN 'budget_depleted' THEN RETURN QUERY SELECT * FROM ads.eval_budget_alert(p_alert_id, p_conditions);
        WHEN 'anomaly_critical' THEN RETURN QUERY SELECT * FROM ads.eval_anomaly_alert(p_alert_id, p_conditions);
        WHEN 'performance_drop' THEN RETURN QUERY SELECT * FROM ads.eval_performance_alert(p_alert_id, p_conditions);
        WHEN 'seasonal_event' THEN RETURN QUERY SELECT * FROM ads.eval_seasonal_alert(p_alert_id, p_conditions);
        WHEN 'api_quota' THEN RETURN QUERY SELECT * FROM ads.eval_api_quota_alert(p_alert_id, p_conditions);
        ELSE RETURN QUERY SELECT false, '{}'::jsonb;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Envoi notifications multi-canal
CREATE OR REPLACE FUNCTION ads.send_alert_notifications(p_alert_id uuid, p_channels jsonb, p_trigger_reason jsonb)
RETURNS jsonb AS $$
DECLARE
    v_channel jsonb;
    v_status jsonb := '{}'::jsonb;
    v_result jsonb;
BEGIN
    FOR v_channel IN SELECT * FROM jsonb_array_elements(p_channels)
    LOOP
        CASE v_channel->>'type'
            WHEN 'email' THEN v_result := ads.send_email_alert(v_channel, p_trigger_reason);
            WHEN 'slack' THEN v_result := ads.send_slack_alert(v_channel, p_trigger_reason);
            WHEN 'sms' THEN v_result := ads.send_sms_alert(v_channel, p_trigger_reason);
            WHEN 'webhook' THEN v_result := ads.send_webhook_alert(v_channel, p_trigger_reason);
            ELSE v_result := '{"status": "unsupported"}'::jsonb;
        END CASE;
        v_status := v_status || jsonb_build_object(v_channel->>'type', v_result);
    END LOOP;
    RETURN v_status;
END;
$$ LANGUAGE plpgsql;

-- Déclenchement des alertes
CREATE OR REPLACE FUNCTION ads.trigger_alerts(p_tenant_id uuid)
RETURNS integer AS $$
DECLARE
    v_alert record;
    v_triggered_count integer := 0;
    v_should_trigger boolean;
    v_trigger_reason jsonb;
BEGIN
    FOR v_alert IN SELECT * FROM ads.alerts WHERE tenant_id = p_tenant_id AND is_active = true
    LOOP
        IF NOT ads.is_within_active_hours(v_alert.active_hours, v_alert.active_days) THEN CONTINUE; END IF;
        
        IF v_alert.last_triggered_at IS NOT NULL THEN
            IF v_alert.last_triggered_at > now() - (v_alert.cooldown_minutes || ' minutes')::interval THEN CONTINUE; END IF;
        END IF;
        
        SELECT st.should_trigger, st.reason INTO v_should_trigger, v_trigger_reason
        FROM ads.evaluate_alert_conditions(v_alert.id, v_alert.conditions) st;
        
        IF v_should_trigger THEN
            PERFORM ads.send_alert_notifications(v_alert.id, v_alert.channels, v_trigger_reason);
            
            INSERT INTO ads.alert_history (alert_id, tenant_id, trigger_reason)
            VALUES (v_alert.id, p_tenant_id, v_trigger_reason);
            
            UPDATE ads.alerts
            SET last_triggered_at = now(), trigger_count = trigger_count + 1
            WHERE id = v_alert.id;
            
            v_triggered_count := v_triggered_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_triggered_count;
END;
$$ LANGUAGE plpgsql;
```

### 7. Audit Functions

```sql
CREATE OR REPLACE FUNCTION ads.log_audit(
    p_tenant_id uuid,
    p_user_id uuid,
    p_action text,
    p_resource_type text,
    p_resource_id uuid,
    p_old_values jsonb DEFAULT NULL,
    p_new_values jsonb DEFAULT NULL,
    p_context jsonb DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
    v_audit_id uuid;
    v_changes jsonb;
BEGIN
    IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
        v_changes := ads.jsonb_diff(p_old_values, p_new_values);
    END IF;
    
    INSERT INTO ads.audit_log (
        tenant_id, user_id, action, resource_type, resource_id,
        old_values, new_values, changes, user_email, user_ip, user_agent, action_source, status
    ) VALUES (
        p_tenant_id, p_user_id, p_action, p_resource_type, p_resource_id,
        p_old_values, p_new_values, v_changes,
        p_context->>'user_email', (p_context->>'user_ip')::inet, p_context->>'user_agent',
        COALESCE(p_context->>'source', 'api'), 'success'
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;
```

### 8. Seasonality Functions

```sql
-- Ajustement saisonnalité
CREATE OR REPLACE FUNCTION ads.adjust_for_seasonality(
    p_tenant_id uuid,
    p_date date DEFAULT CURRENT_DATE
) RETURNS TABLE (
    platform_id text,
    baseline_roas decimal,
    adjusted_roas decimal,
    adjustment_factor decimal,
    event_name text
) AS $$
BEGIN
    RETURN QUERY
    WITH active_events AS (
        SELECT se.event_name, se.estimated_conversion_multiplier
        FROM ads.seasonal_events se
        WHERE p_date BETWEEN se.event_date AND COALESCE(se.event_end_date, se.event_date)
        ORDER BY se.impact_level DESC NULLS LAST
        LIMIT 1
    )
    SELECT b.platform_id, b.avg_roas as baseline_roas,
           ROUND(b.avg_roas * COALESCE(ae.estimated_conversion_multiplier, 1.0), 2) as adjusted_roas,
           COALESCE(ae.estimated_conversion_multiplier, 1.0) as adjustment_factor,
           ae.event_name
    FROM ads.baselines b
    LEFT JOIN active_events ae ON true
    WHERE b.tenant_id = p_tenant_id
    ORDER BY b.platform_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Calcul impact saisonnier
CREATE OR REPLACE FUNCTION ads.calculate_seasonal_impact(
    p_tenant_id uuid,
    p_event_date date,
    p_event_name text
) RETURNS jsonb AS $$
DECLARE
    v_baseline_metrics jsonb;
    v_event_metrics jsonb;
    v_impact jsonb;
BEGIN
    SELECT jsonb_build_object('avg_spend', AVG(spend_usd), 'avg_conversions', AVG(conversions),
                              'avg_ctr', AVG(ctr), 'avg_cpc', AVG(cpc))
    INTO v_baseline_metrics
    FROM ads.metrics_daily
    WHERE tenant_id = p_tenant_id
        AND day BETWEEN p_event_date - INTERVAL '10 days' AND p_event_date - INTERVAL '4 days'
        AND is_demo = false;
    
    SELECT jsonb_build_object('avg_spend', AVG(spend_usd), 'avg_conversions', AVG(conversions),
                              'avg_ctr', AVG(ctr), 'avg_cpc', AVG(cpc))
    INTO v_event_metrics
    FROM ads.metrics_daily
    WHERE tenant_id = p_tenant_id AND day = p_event_date AND is_demo = false;
    
    v_impact := jsonb_build_object(
        'traffic_multiplier', ROUND((v_event_metrics->>'avg_spend')::numeric / NULLIF((v_baseline_metrics->>'avg_spend')::numeric, 0), 2),
        'conversion_multiplier', ROUND((v_event_metrics->>'avg_conversions')::numeric / NULLIF((v_baseline_metrics->>'avg_conversions')::numeric, 0), 2),
        'cpc_multiplier', ROUND((v_event_metrics->>'avg_cpc')::numeric / NULLIF((v_baseline_metrics->>'avg_cpc')::numeric, 0), 2)
    );
    
    UPDATE ads.seasonal_events
    SET estimated_traffic_multiplier = (v_impact->>'traffic_multiplier')::numeric,
        estimated_conversion_multiplier = (v_impact->>'conversion_multiplier')::numeric,
        estimated_cpc_multiplier = (v_impact->>'cpc_multiplier')::numeric
    WHERE event_name = p_event_name AND event_date = p_event_date;
    
    RETURN v_impact;
END;
$$ LANGUAGE plpgsql;
```

### 9. API Tracking

```sql
CREATE OR REPLACE FUNCTION ads.track_api_usage(
    p_tenant_id uuid,
    p_platform text,
    p_endpoint text,
    p_method text DEFAULT 'GET',
    p_response_time_ms integer DEFAULT NULL,
    p_was_successful boolean DEFAULT true,
    p_cost_usd decimal DEFAULT 0
) RETURNS void AS $$
DECLARE
    v_period_start timestamptz;
BEGIN
    v_period_start := date_trunc('hour', now());
    
    INSERT INTO ads.api_usage_tracking (
        tenant_id, platform, endpoint, method, calls_count, success_count, error_count,
        avg_response_time_ms, max_response_time_ms, cost_usd, period_start, period_end, granularity
    ) VALUES (
        p_tenant_id, p_platform, p_endpoint, p_method, 1,
        CASE WHEN p_was_successful THEN 1 ELSE 0 END,
        CASE WHEN p_was_successful THEN 0 ELSE 1 END,
        p_response_time_ms, p_response_time_ms, p_cost_usd,
        v_period_start, v_period_start + INTERVAL '1 hour', 'hourly'
    )
    ON CONFLICT (tenant_id, platform, endpoint, method, period_start) WHERE granularity = 'hourly'
    DO UPDATE SET
        calls_count = ads.api_usage_tracking.calls_count + 1,
        success_count = ads.api_usage_tracking.success_count + CASE WHEN p_was_successful THEN 1 ELSE 0 END,
        error_count = ads.api_usage_tracking.error_count + CASE WHEN p_was_successful THEN 0 ELSE 1 END,
        avg_response_time_ms = (ads.api_usage_tracking.avg_response_time_ms * ads.api_usage_tracking.calls_count + COALESCE(p_response_time_ms, 0)) / (ads.api_usage_tracking.calls_count + 1),
        max_response_time_ms = GREATEST(ads.api_usage_tracking.max_response_time_ms, p_response_time_ms),
        cost_usd = ads.api_usage_tracking.cost_usd + p_cost_usd;
END;
$$ LANGUAGE plpgsql;
```

### 10. Partitioning & Archiving

```sql
-- Création partitions metrics_daily
CREATE OR REPLACE FUNCTION ads.create_monthly_partitions(p_months_ahead integer DEFAULT 6)
RETURNS text AS $$
DECLARE
    v_start_date date;
    v_end_date date;
    v_partition_name text;
    v_count integer := 0;
BEGIN
    FOR i IN 0..p_months_ahead LOOP
        v_start_date := date_trunc('month', CURRENT_DATE + (i || ' months')::interval)::date;
        v_end_date := date_trunc('month', CURRENT_DATE + ((i + 1) || ' months')::interval)::date;
        v_partition_name := 'metrics_daily_' || to_char(v_start_date, 'YYYY_MM');
        
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'ads' AND tablename = v_partition_name) THEN
            BEGIN
                EXECUTE format('CREATE TABLE IF NOT EXISTS ads.%I PARTITION OF ads.metrics_daily FOR VALUES FROM (%L) TO (%L)',
                    v_partition_name, v_start_date, v_end_date);
                v_count := v_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Could not create partition %: %', v_partition_name, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    RETURN v_count || ' partitions created';
END;
$$ LANGUAGE plpgsql;

-- Archivage alertes
CREATE OR REPLACE FUNCTION ads.archive_old_alerts(p_retention_days integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
    v_archived integer;
BEGIN
    DELETE FROM ads.alert_history
    WHERE triggered_at < CURRENT_DATE - (p_retention_days || ' days')::interval;
    GET DIAGNOSTICS v_archived = ROW_COUNT;
    RETURN v_archived;
END;
$$ LANGUAGE plpgsql;
```

---

## Vues

```sql
-- Résumé coûts API
CREATE OR REPLACE VIEW ads.api_cost_summary AS
SELECT tenant_id, platform, DATE_TRUNC('day', period_start) as day,
       SUM(calls_count) as total_calls, SUM(success_count) as successful_calls,
       SUM(error_count) as failed_calls, AVG(avg_response_time_ms) as avg_latency_ms,
       SUM(cost_usd) as total_cost_usd,
       SUM(cost_usd) / NULLIF(SUM(calls_count), 0) as cost_per_call
FROM ads.api_usage_tracking
WHERE granularity = 'hourly'
GROUP BY tenant_id, platform, DATE_TRUNC('day', period_start);

-- Alertes actives avec contexte
CREATE OR REPLACE VIEW ads.active_alerts_with_context AS
SELECT a.*, COUNT(ah.id) as total_triggers, MAX(ah.triggered_at) as last_triggered,
       COUNT(ah.id) FILTER (WHERE ah.triggered_at >= CURRENT_DATE) as triggers_today,
       AVG(EXTRACT(EPOCH FROM (ah.acknowledged_at - ah.triggered_at)) / 60) as avg_acknowledgment_minutes
FROM ads.alerts a
LEFT JOIN ads.alert_history ah ON a.id = ah.alert_id
WHERE a.is_active = true
GROUP BY a.id;

-- Événements saisonniers à venir
CREATE OR REPLACE VIEW ads.upcoming_seasonal_events AS
SELECT se.*, se.event_date - CURRENT_DATE as days_until_event,
       CASE 
           WHEN se.event_date - CURRENT_DATE <= 3 THEN 'immediate_action'
           WHEN se.event_date - CURRENT_DATE <= 7 THEN 'prepare_now'
           WHEN se.event_date - CURRENT_DATE <= 14 THEN 'plan_ahead'
           ELSE 'monitor'
       END as urgency_level
FROM ads.seasonal_events se
WHERE se.event_date >= CURRENT_DATE AND se.event_date <= CURRENT_DATE + INTERVAL '90 days'
ORDER BY se.event_date;

-- Résumé audit trail
CREATE OR REPLACE VIEW ads.audit_trail_summary AS
SELECT tenant_id, user_email, action, resource_type, COUNT(*) as action_count,
       COUNT(*) FILTER (WHERE status = 'success') as successful_actions,
       COUNT(*) FILTER (WHERE status = 'failed') as failed_actions,
       MAX(performed_at) as last_action_at
FROM ads.audit_log
WHERE performed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY tenant_id, user_email, action, resource_type;
```

---

## Exemples d'utilisation

### Workflow complet

```sql
-- 1. Insérer métriques multi-devises
INSERT INTO ads.metrics_daily (tenant_id, platform, level, platform_id, day,
    spend, impressions, clicks, conversions, conversion_value, currency_code)
VALUES 
    ('tenant-uuid', 'meta', 'campaign', 'eu_campaign', CURRENT_DATE, 250.00, 35000, 1050, 35, 875.00, 'EUR'),
    ('tenant-uuid', 'tiktok', 'campaign', 'uk_campaign', CURRENT_DATE, 180.00, 28000, 840, 28, 560.00, 'GBP');

-- 2. Vérifier événements saisonniers
SELECT event_name, days_until_event, urgency_level, recommended_actions
FROM ads.upcoming_seasonal_events WHERE impact_level = 'extreme' LIMIT 3;

-- 3. Ajustements saisonniers
SELECT * FROM ads.adjust_for_seasonality('tenant-uuid');

-- 4. Déclencher alertes
SELECT ads.trigger_alerts('tenant-uuid');

-- 5. Consulter coûts API
SELECT platform, total_calls, total_cost_usd, cost_per_call, avg_latency_ms
FROM ads.api_cost_summary WHERE tenant_id = 'tenant-uuid' AND day >= CURRENT_DATE - INTERVAL '7 days';
```

### Configuration alertes

```sql
-- Alerte budget 90%
INSERT INTO ads.alerts (tenant_id, alert_name, alert_type, conditions, channels, applies_to_platforms)
VALUES ('tenant-uuid', 'Budget 90%', 'budget_depleted',
    '{"metric": "spend", "operator": ">=", "threshold": 0.90, "threshold_type": "percent_of_monthly_budget"}',
    '[{"type": "email", "recipients": ["finance@company.com"], "priority": "high"},
      {"type": "slack", "webhook": "https://hooks.slack.com/...", "channel": "#alerts"}]',
    ARRAY['meta', 'tiktok', 'google']);

-- Alerte anomalie critique
INSERT INTO ads.alerts (tenant_id, alert_name, alert_type, conditions, channels, cooldown_minutes)
VALUES ('tenant-uuid', 'CPA Spike Critical', 'anomaly_critical',
    '{"anomaly_severity": ["critical"], "anomaly_types": ["spike_cpa"]}',
    '[{"type": "email", "recipients": ["ops@company.com"], "priority": "urgent"},
      {"type": "sms", "numbers": ["+33612345678"]}]', 15);
```

---

## Optimisation & Performance

### Indexes recommandés

```sql
CREATE INDEX CONCURRENTLY idx_metrics_daily_perf ON ads.metrics_daily(tenant_id, platform, day DESC);
CREATE INDEX CONCURRENTLY idx_baselines_active ON ads.baselines(tenant_id, valid_until DESC) WHERE valid_until > now();
CREATE INDEX CONCURRENTLY idx_anomalies_active ON ads.anomalies(tenant_id, created_at DESC) WHERE NOT resolved;
```

### Jobs pg_cron

```sql
-- Sync taux quotidien
SELECT cron.schedule('sync-exchange-rates', '0 6 * * *', 'SELECT ads.sync_exchange_rates();');

-- Vérification alertes (5 min)
SELECT cron.schedule('check-alerts', '*/5 * * * *', 
    'SELECT ads.trigger_alerts(tenant_id) FROM saas.tenants WHERE is_active = true;');

-- Reset rate limit (minute/heure/jour)
SELECT cron.schedule('reset-minute', '* * * * *', 'UPDATE ads.api_rate_limits SET current_minute_count = 0;');
SELECT cron.schedule('reset-hour', '0 * * * *', 'UPDATE ads.api_rate_limits SET current_hour_count = 0;');
SELECT cron.schedule('reset-day', '0 0 * * *', 'UPDATE ads.api_rate_limits SET current_day_count = 0;');

-- Archivage mensuel
SELECT cron.schedule('archive-alerts', '0 2 1 * *', 'SELECT ads.archive_old_alerts(90);');
SELECT cron.schedule('create-partitions', '0 0 1 * *', 'SELECT ads.create_monthly_partitions(6);');
```

### Row Level Security

```sql
ALTER TABLE ads.metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_metrics ON ads.metrics_daily FOR ALL USING (tenant_id = saas.current_tenant_id());
CREATE POLICY rls_alerts ON ads.alerts FOR ALL USING (tenant_id = saas.current_tenant_id());
CREATE POLICY rls_audit ON ads.audit_log FOR ALL USING (tenant_id = saas.current_tenant_id());
```

---

## Troubleshooting

### Taux de change manquant

```sql
-- Diagnostic
SELECT DISTINCT currency_code FROM ads.metrics_daily
WHERE currency_code NOT IN (SELECT DISTINCT from_currency FROM ads.currency_rates WHERE to_currency = 'USD')
AND day >= CURRENT_DATE - INTERVAL '7 days';

-- Solution
INSERT INTO ads.currency_rates (from_currency, to_currency, exchange_rate, valid_from)
VALUES ('CHF', 'USD', 1.1234, CURRENT_DATE) ON CONFLICT DO NOTHING;
```

### Rate limit bloqué

```sql
-- Diagnostic
SELECT platform, endpoint_pattern, throttled_until FROM ads.api_rate_limits WHERE is_throttled = true;

-- Solution
UPDATE ads.api_rate_limits
SET is_throttled = false, throttled_until = NULL, current_minute_count = 0, current_hour_count = 0
WHERE platform = 'meta';
```

### Alertes en spam

```sql
-- Diagnostic
SELECT a.alert_name, COUNT(*) as triggers_last_hour
FROM ads.alert_history ah JOIN ads.alerts a ON ah.alert_id = a.id
WHERE ah.triggered_at >= now() - INTERVAL '1 hour'
GROUP BY a.id HAVING COUNT(*) > 5;

-- Solution
UPDATE ads.alerts SET cooldown_minutes = 60, max_alerts_per_day = 10 WHERE id = 'alert-id';
```

---

## Changelog

### v2.2 (2026-02-01)

**Nouvelles fonctionnalités:**
- Gestion multi-devises avec conversion automatique
- Rate limiting intelligent pour APIs externes
- Système d'alertes proactives multi-canal (email, Slack, SMS, webhook)
- Audit trail complet avec traçabilité
- Saisonnalité & événements pour prédictions
- Tracking coûts API

**Nouvelles tables:** api_usage_tracking, api_rate_limits, alerts, alert_history, alert_notifications_queue, currency_rates, seasonal_events, audit_log

**Nouvelles fonctions:** check_rate_limit, get_exchange_rate, trigger_alerts, log_audit, adjust_for_seasonality, track_api_usage, eval_*_alert, send_*_alert

---

**Production Ready**
