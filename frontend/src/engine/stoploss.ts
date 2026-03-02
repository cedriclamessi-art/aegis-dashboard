// AEGIS Stop-Loss Engine
import { createClient } from '@supabase/supabase-js';

export interface StopLossConfig {
    allocation_id: string;
    channel_id: string;
    product_name: string;
    roas_threshold: number;
    max_spend: number;
    cpa_max?: number;
}

export interface ChannelMetrics {
    roas: number;
    spend: number;
    revenue: number;
    cpm: number;
    ctr: number;
    cpa: number;
}

export interface StopLossEvaluation {
    triggered: boolean;
    reason: string;
    recommended_action: string;
    metrics: ChannelMetrics;
}

export interface StopLossResult {
    allocation_id: string;
    triggered: boolean;
    verdict: 'ok' | 'warn' | 'stop';
    reason: string;
}

export async function evaluateStopLoss(
    config: StopLossConfig,
    metrics: ChannelMetrics
  ): Promise<StopLossEvaluation> {
    const triggered = metrics.roas < config.roas_threshold || metrics.spend >= config.max_spend;
    const reason = metrics.roas < config.roas_threshold
          ? 'ROAS ' + metrics.roas.toFixed(2) + ' below threshold ' + config.roas_threshold
          : 'Spend ' + metrics.spend + ' reached max ' + config.max_spend;
    return {
          triggered,
          reason: triggered ? reason : 'All metrics within thresholds',
          recommended_action: triggered ? 'pause_campaign' : 'none',
          metrics,
    };
}

export async function executeStopLoss(
    config: StopLossConfig,
    evaluation: StopLossEvaluation
  ): Promise<StopLossResult> {
    return {
          allocation_id: config.allocation_id,
          triggered: evaluation.triggered,
          verdict: evaluation.triggered ? 'stop' : 'ok',
          reason: evaluation.reason,
    };
}

export async function getStopLossHistory(tenantId: string): Promise<StopLossResult[]> {
    return [];
}

export async function getActiveStopLossAlerts(tenantId: string): Promise<StopLossResult[]> {
    return [];
}
