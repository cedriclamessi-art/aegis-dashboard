// AEGIS Engine - Opportunity Score
// Scores product/market opportunities to guide capital allocation

import { supabase } from '../lib/supabase';
import { scoreDecisionWithMemory } from './memory';

const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'default';

export interface OpportunityInput {
    product_name: string;
    product_category: string;
    estimated_margin: number;
    market_saturation: number;
    competition_level: number;
    trend_score: number;
    avg_order_value: number;
    capital_available: number;
    channel_ids: string[];
    metadata?: Record<string, unknown>;
}

export interface OpportunityScore {
    id?: string;
    tenant_id: string;
    product_name: string;
    product_category: string;
    raw_score: number;
    adjusted_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    recommended_allocation: number;
    max_allocation: number;
    verdict: 'go' | 'wait' | 'pass';
    reasoning: string[];
    memory_score: number;
    memory_recommendation: string;
    channels_scored: string[];
    metadata?: Record<string, unknown>;
    created_at?: string;
}

function getRiskLevel(score: number): OpportunityScore['risk_level'] {
    if (score >= 70) return 'low';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'high';
    return 'critical';
}

function getVerdict(score: number): OpportunityScore['verdict'] {
    if (score >= 65) return 'go';
    if (score >= 40) return 'wait';
    return 'pass';
}

function computeRawScore(input: OpportunityInput): { score: number; reasoning: string[] } {
    const r: string[] = [];
    let s = 0;
    const m = Math.min((input.estimated_margin / 100) * 30, 30);
    s += m; r.push(`Marge ${input.estimated_margin}% => +${m.toFixed(1)} pts`);
    const t = (input.trend_score / 100) * 25;
    s += t; r.push(`Tendance ${input.trend_score}/100 => +${t.toFixed(1)} pts`);
    const sp = (input.market_saturation / 100) * 20;
    s -= sp; r.push(`Saturation ${input.market_saturation}% => -${sp.toFixed(1)} pts`);
    const cp = (input.competition_level / 100) * 15;
    s -= cp; r.push(`Competition ${input.competition_level}% => -${cp.toFixed(1)} pts`);
    const a = Math.min((input.avg_order_value / 200) * 10, 10);
    s += a; r.push(`AOV ${input.avg_order_value}EUR => +${a.toFixed(1)} pts`);
    const cb = Math.min(input.channel_ids.length * 3, 10);
    s += cb; r.push(`${input.channel_ids.length} canaux => +${cb} pts`);
    if (input.capital_available >= input.avg_order_value * 3) {
          s += 5; r.push('Capital adequat => +5 pts');
    }
    return { score: Math.max(0, Math.min(100, Math.round(s))), reasoning: r };
}

function computeAllocation(score: number, capital: number, risk: OpportunityScore['risk_level']) {
    const mul: Record<string, number> = { low: 0.4, medium: 0.25, high: 0.1, critical: 0.05 };
    return {
          recommended: Math.round(capital * (score / 100) * mul[risk]),
          max: Math.round(capital * mul[risk] * 1.5),
    };
}

export async function scoreOpportunity(input: OpportunityInput): Promise<OpportunityScore> {
    const { score: rawScore, reasoning } = computeRawScore(input);
    const memCtx = {
          product_category: input.product_category,
          market_saturation: Math.round(input.market_saturation / 10) * 10,
          competition_level: Math.round(input.competition_level / 10) * 10,
    };
    const memory = await scoreDecisionWithMemory('allocation', memCtx);
    const adj = Math.round(rawScore * 0.7 + memory.score * 0.3);
    const risk = getRiskLevel(adj);
    const verdict = getVerdict(adj);
    const { recommended, max } = computeAllocation(adj, input.capital_available, risk);

  const result: OpportunityScore = {
        tenant_id: TENANT_ID,
        product_name: input.product_name,
        product_category: input.product_category,
        raw_score: rawScore,
        adjusted_score: adj,
        risk_level: risk,
        recommended_allocation: recommended,
        max_allocation: max,
        verdict,
        reasoning,
        memory_score: memory.score,
        memory_recommendation: memory.recommendation,
        channels_scored: input.channel_ids,
        metadata: input.metadata || {},
  };

  const { data, error } = await supabase
      .from('opportunity_scores')
      .insert(result)
      .select('id')
      .single();

  if (error) console.error('[AEGIS Opportunity] Store failed:', error.message);
    else if (data?.id) result.id = data.id;

  return result;
}

export async function getTopOpportunities(limit = 10): Promise<OpportunityScore[]> {
    const { data, error } = await supabase
      .from('opportunity_scores')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .in('verdict', ['go', 'wait'])
      .order('adjusted_score', { ascending: false })
      .limit(limit);
    if (error) { console.error('[AEGIS Opportunity] Fetch failed:', error.message); return []; }
    return (data as OpportunityScore[]) || [];
}

export async function getProductHistory(productName: string, limit = 20): Promise<OpportunityScore[]> {
    const { data, error } = await supabase
      .from('opportunity_scores')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .ilike('product_name', `%${productName}%`)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.error('[AEGIS Opportunity] History failed:', error.message); return []; }
    return (data as OpportunityScore[]) || [];
}
