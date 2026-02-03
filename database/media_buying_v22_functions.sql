/* =============================================================================
   AEGIS Media Buying v2.2 - Fonctions Helper Manquantes
   PostgreSQL 14+ - Complément au schema.sql principal
   ============================================================================= */

BEGIN;

SET LOCAL search_path = ads, saas, public;

-- =============================================================================
-- 1) HELPER FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION ads.fibonacci(n integer)
RETURNS integer AS $$
DECLARE
    a integer := 0;
    b integer := 1;
    temp integer;
    i integer;
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
                key, jsonb_build_object(
                    'old', old_json->key,
                    'new', new_json->key
                )
            );
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

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
    IF p_active_hours IS NULL THEN
        RETURN true;
    END IF;
    
    v_tz := COALESCE(p_active_hours->>'timezone', 'UTC');
    v_now := now() AT TIME ZONE v_tz;
    v_current_hour := EXTRACT(HOUR FROM v_now);
    v_current_dow := EXTRACT(ISODOW FROM v_now)::integer;
    
    IF p_active_days IS NOT NULL AND array_length(p_active_days, 1) > 0 THEN
        IF NOT (v_current_dow = ANY(p_active_days)) THEN
            RETURN false;
        END IF;
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

-- =============================================================================
-- 2) RATE LIMITING
-- =============================================================================

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
    
    IF NOT FOUND THEN
        RETURN true;
    END IF;
    
    IF v_limit.is_throttled THEN
        IF v_limit.throttled_until > now() THEN
            RETURN false;
        ELSE
            UPDATE ads.api_rate_limits
            SET is_throttled = false,
                throttled_until = NULL,
                current_minute_count = 0
            WHERE id = v_limit.id;
        END IF;
    END IF;
    
    IF v_limit.requests_per_minute IS NOT NULL 
       AND v_limit.current_minute_count >= v_limit.requests_per_minute THEN
        v_can_proceed := false;
    END IF;
    
    IF v_limit.requests_per_hour IS NOT NULL 
       AND v_limit.current_hour_count >= v_limit.requests_per_hour THEN
        v_can_proceed := false;
    END IF;
    
    IF v_limit.requests_per_day IS NOT NULL 
       AND v_limit.current_day_count >= v_limit.requests_per_day THEN
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

-- =============================================================================
-- 3) CURRENCY FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION ads.get_exchange_rate(
    p_from_currency text,
    p_to_currency text DEFAULT 'USD',
    p_date date DEFAULT CURRENT_DATE
) RETURNS decimal AS $$
DECLARE
    v_rate decimal;
BEGIN
    IF p_from_currency = p_to_currency THEN
        RETURN 1.0;
    END IF;
    
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
        WHERE from_currency = p_from_currency
            AND to_currency = p_to_currency
        ORDER BY valid_from DESC
        LIMIT 1;
    END IF;
    
    IF v_rate IS NULL THEN
        RAISE WARNING 'Exchange rate not found for % -> % on %, using 1.0', 
            p_from_currency, p_to_currency, p_date;
        RETURN 1.0;
    END IF;
    
    RETURN v_rate;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- 4) ALERT EVALUATION FUNCTIONS
-- =============================================================================

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
    SELECT tenant_id INTO v_tenant_id 
    FROM ads.alerts WHERE id = p_alert_id;
    
    v_threshold := (p_conditions->>'threshold')::decimal;
    
    SELECT 
        COALESCE(SUM(spend_usd), 0),
        COALESCE(SUM(ba.allocated_budget), 0)
    INTO v_current_spend, v_budget
    FROM ads.metrics_daily md
    LEFT JOIN ads.budget_allocation ba ON md.platform_id = ba.campaign_id
    WHERE md.tenant_id = v_tenant_id
        AND md.day >= date_trunc('month', CURRENT_DATE);
    
    IF v_budget > 0 THEN
        v_percent := v_current_spend / v_budget;
        
        IF v_percent >= v_threshold THEN
            RETURN QUERY SELECT 
                true,
                jsonb_build_object(
                    'current_spend', v_current_spend,
                    'budget', v_budget,
                    'percent_used', ROUND(v_percent * 100, 2),
                    'threshold', v_threshold * 100
                );
            RETURN;
        END IF;
    END IF;
    
    RETURN QUERY SELECT false, '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

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
    SELECT tenant_id INTO v_tenant_id 
    FROM ads.alerts WHERE id = p_alert_id;
    
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
        RETURN QUERY SELECT 
            true,
            jsonb_build_object(
                'anomaly_id', v_anomaly.id,
                'anomaly_type', v_anomaly.anomaly_type,
                'severity', v_anomaly.severity,
                'platform_id', v_anomaly.platform_id,
                'detected_at', v_anomaly.created_at
            );
        RETURN;
    END IF;
    
    RETURN QUERY SELECT false, '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ads.eval_performance_alert(
    p_alert_id uuid,
    p_conditions jsonb
) RETURNS TABLE (should_trigger boolean, reason jsonb) AS $$
DECLARE
    v_tenant_id uuid;
    v_metric text;
    v_operator text;
    v_threshold decimal;
    v_threshold_type text;
    v_current_value decimal;
    v_baseline_value decimal;
    v_effective_threshold decimal;
BEGIN
    SELECT tenant_id INTO v_tenant_id 
    FROM ads.alerts WHERE id = p_alert_id;
    
    v_metric := p_conditions->>'metric';
    v_operator := p_conditions->>'operator';
    v_threshold := (p_conditions->>'threshold')::decimal;
    v_threshold_type := COALESCE(p_conditions->>'threshold_type', 'absolute');
    
    EXECUTE format(
        'SELECT AVG(%I) FROM ads.metrics_daily WHERE tenant_id = $1 AND day = CURRENT_DATE',
        v_metric
    ) INTO v_current_value USING v_tenant_id;
    
    IF v_threshold_type = 'multiplier_of_baseline' THEN
        SELECT AVG(CASE v_metric 
            WHEN 'cpa' THEN cpa 
            WHEN 'roas' THEN roas 
            WHEN 'ctr' THEN ctr 
            ELSE 0 
        END) INTO v_baseline_value
        FROM ads.baselines
        WHERE tenant_id = v_tenant_id;
        
        v_effective_threshold := v_baseline_value * v_threshold;
    ELSE
        v_effective_threshold := v_threshold;
    END IF;
    
    IF v_current_value IS NOT NULL AND v_effective_threshold IS NOT NULL THEN
        IF (v_operator = '>' AND v_current_value > v_effective_threshold) OR
           (v_operator = '>=' AND v_current_value >= v_effective_threshold) OR
           (v_operator = '<' AND v_current_value < v_effective_threshold) OR
           (v_operator = '<=' AND v_current_value <= v_effective_threshold) THEN
            RETURN QUERY SELECT 
                true,
                jsonb_build_object(
                    'metric', v_metric,
                    'current_value', v_current_value,
                    'threshold', v_effective_threshold,
                    'baseline', v_baseline_value
                );
            RETURN;
        END IF;
    END IF;
    
    RETURN QUERY SELECT false, '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

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
        RETURN QUERY SELECT 
            true,
            jsonb_build_object(
                'event_name', v_event.event_name,
                'event_date', v_event.event_date,
                'days_until', v_days_before,
                'impact_level', v_event.impact_level,
                'recommended_actions', v_event.recommended_actions
            );
        RETURN;
    END IF;
    
    RETURN QUERY SELECT false, '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

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
    SELECT tenant_id INTO v_tenant_id 
    FROM ads.alerts WHERE id = p_alert_id;
    
    v_threshold := (p_conditions->>'threshold')::decimal;
    v_platforms := ARRAY(SELECT jsonb_array_elements_text(p_conditions->'platforms'));
    
    SELECT 
        platform,
        SUM(quota_used) as used,
        SUM(quota_limit) as total
    INTO v_usage
    FROM ads.api_usage_tracking
    WHERE tenant_id = v_tenant_id
        AND (array_length(v_platforms, 1) IS NULL OR platform = ANY(v_platforms))
        AND period_start >= date_trunc('day', CURRENT_DATE)
    GROUP BY platform
    HAVING SUM(quota_used)::decimal / NULLIF(SUM(quota_limit), 0) >= v_threshold
    LIMIT 1;
    
    IF FOUND THEN
        RETURN QUERY SELECT 
            true,
            jsonb_build_object(
                'platform', v_usage.platform,
                'quota_used', v_usage.used,
                'quota_limit', v_usage.total,
                'percent_used', ROUND((v_usage.used::decimal / v_usage.total) * 100, 2)
            );
        RETURN;
    END IF;
    
    RETURN QUERY SELECT false, '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5) NOTIFICATION FUNCTIONS (Stubs - need external integration)
-- =============================================================================

CREATE OR REPLACE FUNCTION ads.send_email_alert(
    p_channel jsonb,
    p_trigger_reason jsonb
) RETURNS jsonb AS $$
DECLARE
    v_recipients text[];
    v_priority text;
BEGIN
    v_recipients := ARRAY(SELECT jsonb_array_elements_text(p_channel->'recipients'));
    v_priority := COALESCE(p_channel->>'priority', 'normal');
    
    INSERT INTO ads.alert_notifications_queue (
        channel_type,
        recipients,
        priority,
        payload,
        status,
        created_at
    ) VALUES (
        'email',
        v_recipients,
        v_priority,
        p_trigger_reason,
        'pending',
        now()
    );
    
    RETURN jsonb_build_object(
        'status', 'queued',
        'recipients', array_length(v_recipients, 1),
        'queued_at', now()
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ads.send_slack_alert(
    p_channel jsonb,
    p_trigger_reason jsonb
) RETURNS jsonb AS $$
BEGIN
    INSERT INTO ads.alert_notifications_queue (
        channel_type,
        webhook_url,
        payload,
        status,
        created_at
    ) VALUES (
        'slack',
        p_channel->>'webhook',
        jsonb_build_object(
            'channel', p_channel->>'channel',
            'text', format('Alert: %s', p_trigger_reason->>'anomaly_type'),
            'attachments', jsonb_build_array(
                jsonb_build_object(
                    'color', 'danger',
                    'fields', p_trigger_reason
                )
            )
        ),
        'pending',
        now()
    );
    
    RETURN jsonb_build_object('status', 'queued', 'queued_at', now());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ads.send_sms_alert(
    p_channel jsonb,
    p_trigger_reason jsonb
) RETURNS jsonb AS $$
DECLARE
    v_numbers text[];
BEGIN
    v_numbers := ARRAY(SELECT jsonb_array_elements_text(p_channel->'numbers'));
    
    INSERT INTO ads.alert_notifications_queue (
        channel_type,
        recipients,
        payload,
        status,
        created_at
    ) VALUES (
        'sms',
        v_numbers,
        jsonb_build_object(
            'message', format('AEGIS Alert: %s', 
                COALESCE(p_trigger_reason->>'anomaly_type', p_trigger_reason->>'event_name', 'System Alert')
            )
        ),
        'pending',
        now()
    );
    
    RETURN jsonb_build_object('status', 'queued', 'queued_at', now());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ads.send_webhook_alert(
    p_channel jsonb,
    p_trigger_reason jsonb
) RETURNS jsonb AS $$
BEGIN
    INSERT INTO ads.alert_notifications_queue (
        channel_type,
        webhook_url,
        webhook_method,
        payload,
        status,
        created_at
    ) VALUES (
        'webhook',
        p_channel->>'url',
        COALESCE(p_channel->>'method', 'POST'),
        p_trigger_reason,
        'pending',
        now()
    );
    
    RETURN jsonb_build_object('status', 'queued', 'queued_at', now());
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 6) ALERT SYSTEM FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION ads.evaluate_alert_conditions(
    p_alert_id uuid,
    p_conditions jsonb
) RETURNS TABLE (should_trigger boolean, reason jsonb) AS $$
DECLARE
    v_alert_type text;
BEGIN
    SELECT alert_type INTO v_alert_type
    FROM ads.alerts
    WHERE id = p_alert_id;
    
    CASE v_alert_type
        WHEN 'budget_depleted' THEN
            RETURN QUERY SELECT * FROM ads.eval_budget_alert(p_alert_id, p_conditions);
        WHEN 'anomaly_critical' THEN
            RETURN QUERY SELECT * FROM ads.eval_anomaly_alert(p_alert_id, p_conditions);
        WHEN 'performance_drop' THEN
            RETURN QUERY SELECT * FROM ads.eval_performance_alert(p_alert_id, p_conditions);
        WHEN 'seasonal_event' THEN
            RETURN QUERY SELECT * FROM ads.eval_seasonal_alert(p_alert_id, p_conditions);
        WHEN 'api_quota' THEN
            RETURN QUERY SELECT * FROM ads.eval_api_quota_alert(p_alert_id, p_conditions);
        ELSE
            RETURN QUERY SELECT false, '{}'::jsonb;
    END CASE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ads.send_alert_notifications(
    p_alert_id uuid,
    p_channels jsonb,
    p_trigger_reason jsonb
) RETURNS jsonb AS $$
DECLARE
    v_channel jsonb;
    v_status jsonb := '{}'::jsonb;
    v_result jsonb;
BEGIN
    FOR v_channel IN SELECT * FROM jsonb_array_elements(p_channels)
    LOOP
        CASE v_channel->>'type'
            WHEN 'email' THEN
                v_result := ads.send_email_alert(v_channel, p_trigger_reason);
            WHEN 'slack' THEN
                v_result := ads.send_slack_alert(v_channel, p_trigger_reason);
            WHEN 'sms' THEN
                v_result := ads.send_sms_alert(v_channel, p_trigger_reason);
            WHEN 'webhook' THEN
                v_result := ads.send_webhook_alert(v_channel, p_trigger_reason);
            ELSE
                v_result := '{"status": "unsupported"}'::jsonb;
        END CASE;
        
        v_status := v_status || jsonb_build_object(v_channel->>'type', v_result);
    END LOOP;
    
    RETURN v_status;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ads.trigger_alerts(
    p_tenant_id uuid
) RETURNS integer AS $$
DECLARE
    v_alert record;
    v_triggered_count integer := 0;
    v_should_trigger boolean;
    v_trigger_reason jsonb;
BEGIN
    FOR v_alert IN 
        SELECT * FROM ads.alerts
        WHERE tenant_id = p_tenant_id
            AND is_active = true
    LOOP
        IF NOT ads.is_within_active_hours(v_alert.active_hours, v_alert.active_days) THEN
            CONTINUE;
        END IF;
        
        IF v_alert.last_triggered_at IS NOT NULL THEN
            IF v_alert.last_triggered_at > now() - (v_alert.cooldown_minutes || ' minutes')::interval THEN
                CONTINUE;
            END IF;
        END IF;
        
        SELECT st.should_trigger, st.reason 
        INTO v_should_trigger, v_trigger_reason
        FROM ads.evaluate_alert_conditions(v_alert.id, v_alert.conditions) st;
        
        IF v_should_trigger THEN
            PERFORM ads.send_alert_notifications(v_alert.id, v_alert.channels, v_trigger_reason);
            
            INSERT INTO ads.alert_history (
                alert_id, tenant_id, trigger_reason
            ) VALUES (
                v_alert.id, p_tenant_id, v_trigger_reason
            );
            
            UPDATE ads.alerts
            SET last_triggered_at = now(),
                trigger_count = trigger_count + 1
            WHERE id = v_alert.id;
            
            v_triggered_count := v_triggered_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_triggered_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7) AUDIT FUNCTIONS
-- =============================================================================

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
        old_values, new_values, changes,
        user_email, user_ip, user_agent, action_source,
        status
    ) VALUES (
        p_tenant_id, p_user_id, p_action, p_resource_type, p_resource_id,
        p_old_values, p_new_values, v_changes,
        p_context->>'user_email',
        (p_context->>'user_ip')::inet,
        p_context->>'user_agent',
        COALESCE(p_context->>'source', 'api'),
        'success'
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8) SEASONALITY FUNCTIONS
-- =============================================================================

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
        SELECT 
            se.event_name,
            se.estimated_conversion_multiplier,
            se.estimated_cpc_multiplier
        FROM ads.seasonal_events se
        WHERE p_date BETWEEN se.event_date AND COALESCE(se.event_end_date, se.event_date)
        ORDER BY se.impact_level DESC NULLS LAST
        LIMIT 1
    )
    SELECT 
        b.platform_id,
        b.avg_roas as baseline_roas,
        ROUND(b.avg_roas * COALESCE(ae.estimated_conversion_multiplier, 1.0), 2) as adjusted_roas,
        COALESCE(ae.estimated_conversion_multiplier, 1.0) as adjustment_factor,
        ae.event_name
    FROM ads.baselines b
    LEFT JOIN active_events ae ON true
    WHERE b.tenant_id = p_tenant_id
    ORDER BY b.platform_id;
END;
$$ LANGUAGE plpgsql STABLE;

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
    SELECT jsonb_build_object(
        'avg_spend', AVG(spend_usd),
        'avg_conversions', AVG(conversions),
        'avg_ctr', AVG(ctr),
        'avg_cpc', AVG(cpc)
    ) INTO v_baseline_metrics
    FROM ads.metrics_daily
    WHERE tenant_id = p_tenant_id
        AND day BETWEEN p_event_date - INTERVAL '10 days' AND p_event_date - INTERVAL '4 days'
        AND is_demo = false;
    
    SELECT jsonb_build_object(
        'avg_spend', AVG(spend_usd),
        'avg_conversions', AVG(conversions),
        'avg_ctr', AVG(ctr),
        'avg_cpc', AVG(cpc)
    ) INTO v_event_metrics
    FROM ads.metrics_daily
    WHERE tenant_id = p_tenant_id
        AND day = p_event_date
        AND is_demo = false;
    
    v_impact := jsonb_build_object(
        'traffic_multiplier', 
            ROUND((v_event_metrics->>'avg_spend')::numeric / NULLIF((v_baseline_metrics->>'avg_spend')::numeric, 0), 2),
        'conversion_multiplier',
            ROUND((v_event_metrics->>'avg_conversions')::numeric / NULLIF((v_baseline_metrics->>'avg_conversions')::numeric, 0), 2),
        'cpc_multiplier',
            ROUND((v_event_metrics->>'avg_cpc')::numeric / NULLIF((v_baseline_metrics->>'avg_cpc')::numeric, 0), 2),
        'ctr_multiplier',
            ROUND((v_event_metrics->>'avg_ctr')::numeric / NULLIF((v_baseline_metrics->>'avg_ctr')::numeric, 0), 2)
    );
    
    UPDATE ads.seasonal_events
    SET estimated_traffic_multiplier = (v_impact->>'traffic_multiplier')::numeric,
        estimated_conversion_multiplier = (v_impact->>'conversion_multiplier')::numeric,
        estimated_cpc_multiplier = (v_impact->>'cpc_multiplier')::numeric
    WHERE event_name = p_event_name
        AND event_date = p_event_date;
    
    RETURN v_impact;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 9) API TRACKING
-- =============================================================================

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
        tenant_id, platform, endpoint, method,
        calls_count, success_count, error_count,
        avg_response_time_ms, max_response_time_ms,
        cost_usd, period_start, period_end, granularity
    ) VALUES (
        p_tenant_id, p_platform, p_endpoint, p_method,
        1,
        CASE WHEN p_was_successful THEN 1 ELSE 0 END,
        CASE WHEN p_was_successful THEN 0 ELSE 1 END,
        p_response_time_ms, p_response_time_ms,
        p_cost_usd, v_period_start, v_period_start + INTERVAL '1 hour', 'hourly'
    )
    ON CONFLICT (tenant_id, platform, endpoint, method, period_start) 
    WHERE granularity = 'hourly'
    DO UPDATE SET
        calls_count = ads.api_usage_tracking.calls_count + 1,
        success_count = ads.api_usage_tracking.success_count + 
            CASE WHEN p_was_successful THEN 1 ELSE 0 END,
        error_count = ads.api_usage_tracking.error_count + 
            CASE WHEN p_was_successful THEN 0 ELSE 1 END,
        avg_response_time_ms = (
            ads.api_usage_tracking.avg_response_time_ms * ads.api_usage_tracking.calls_count + 
            COALESCE(p_response_time_ms, 0)
        ) / (ads.api_usage_tracking.calls_count + 1),
        max_response_time_ms = GREATEST(
            ads.api_usage_tracking.max_response_time_ms, 
            p_response_time_ms
        ),
        cost_usd = ads.api_usage_tracking.cost_usd + p_cost_usd;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 10) NOTIFICATION QUEUE TABLE (pour les fonctions de notification)
-- =============================================================================

CREATE TABLE IF NOT EXISTS ads.alert_notifications_queue (
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

CREATE INDEX IF NOT EXISTS idx_alert_notifications_status 
    ON ads.alert_notifications_queue(status, created_at);

-- =============================================================================
-- 11) PARTITIONING HELPER
-- =============================================================================

CREATE OR REPLACE FUNCTION ads.create_monthly_partitions(
    p_months_ahead integer DEFAULT 6
) RETURNS text AS $$
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
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'ads' 
                AND tablename = v_partition_name
        ) THEN
            BEGIN
                EXECUTE format(
                    'CREATE TABLE IF NOT EXISTS ads.%I PARTITION OF ads.metrics_daily FOR VALUES FROM (%L) TO (%L)',
                    v_partition_name, v_start_date, v_end_date
                );
                v_count := v_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Could not create partition %: %', v_partition_name, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    RETURN v_count || ' partitions created for metrics_daily';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ads.create_audit_partitions(
    p_months_ahead integer DEFAULT 3
) RETURNS text AS $$
DECLARE
    v_start_date date;
    v_end_date date;
    v_partition_name text;
    v_count integer := 0;
BEGIN
    FOR i IN 0..p_months_ahead LOOP
        v_start_date := date_trunc('month', CURRENT_DATE + (i || ' months')::interval)::date;
        v_end_date := date_trunc('month', CURRENT_DATE + ((i + 1) || ' months')::interval)::date;
        v_partition_name := 'audit_log_' || to_char(v_start_date, 'YYYY_MM');
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'ads' 
                AND tablename = v_partition_name
        ) THEN
            BEGIN
                EXECUTE format(
                    'CREATE TABLE IF NOT EXISTS ads.%I PARTITION OF ads.audit_log FOR VALUES FROM (%L) TO (%L)',
                    v_partition_name, v_start_date, v_end_date
                );
                v_count := v_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Could not create partition %: %', v_partition_name, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    RETURN v_count || ' partitions created for audit_log';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 12) ARCHIVING FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION ads.archive_old_alerts(
    p_retention_days integer DEFAULT 90
) RETURNS integer AS $$
DECLARE
    v_archived integer;
BEGIN
    DELETE FROM ads.alert_history
    WHERE triggered_at < CURRENT_DATE - (p_retention_days || ' days')::interval;
    
    GET DIAGNOSTICS v_archived = ROW_COUNT;
    
    RETURN v_archived;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ads.sync_exchange_rates()
RETURNS integer AS $$
DECLARE
    v_inserted integer := 0;
BEGIN
    INSERT INTO ads.currency_rates (from_currency, to_currency, exchange_rate, valid_from, source)
    VALUES 
        ('EUR', 'USD', 1.0854, CURRENT_DATE, 'manual'),
        ('GBP', 'USD', 1.2634, CURRENT_DATE, 'manual'),
        ('JPY', 'USD', 0.0067, CURRENT_DATE, 'manual'),
        ('CAD', 'USD', 0.7142, CURRENT_DATE, 'manual'),
        ('AUD', 'USD', 0.6389, CURRENT_DATE, 'manual'),
        ('CHF', 'USD', 1.1234, CURRENT_DATE, 'manual'),
        ('CNY', 'USD', 0.1389, CURRENT_DATE, 'manual'),
        ('INR', 'USD', 0.0120, CURRENT_DATE, 'manual'),
        ('BRL', 'USD', 0.1980, CURRENT_DATE, 'manual'),
        ('MXN', 'USD', 0.0580, CURRENT_DATE, 'manual')
    ON CONFLICT (from_currency, to_currency, valid_from) 
    DO UPDATE SET exchange_rate = EXCLUDED.exchange_rate,
                  source = EXCLUDED.source;
    
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    
    RETURN v_inserted;
END;
$$ LANGUAGE plpgsql;

COMMIT;
