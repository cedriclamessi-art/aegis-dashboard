// AEGIS Engine - Decision Memory
// Persists past decisions to avoid repeating mistakes and amplify winners

import { supabase } from '../lib/supabase';

const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'default';

export interface DecisionRecord {
    id?: string;
    tenant_id: string;
    decision_type: 'allocation' | 'stoploss' | 'scaling' | 'creative' | 'channel';
    context_hash: string;
    context_summary: string;
    action_taken: string;
    outcome: 'win' | 'loss' | 'neutral' | 'pending';
    capital_in: number;
    capital_out: number;
    roi: number;
    confidence_score: number;
    metadata: Record<string, unknown>;
    created_at?: string;
    resolved_at?: string;
}

export interface MemoryQuery {
    decision_type?: DecisionRecord['decision_type'];
    min_roi?: number;
    outcome?: DecisionRecord['outcome'];
    limit?: number;
}

// Hash a decision context for deduplication
function hashContext(context: Record<string, unknown>): string {
    const str = JSON.stringify(context, Object.keys(context).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

// Store a new decision in memory
export async function rememberDecision(
    type: DecisionRecord['decision_type'],
    context: Record<string, unknown>,
    action: string,
    capitalIn: number,
    metadata: Record<string, unknown> = {}
  ): Promise<string | null> {
    const record: DecisionRecord = {
          tenant_id: TENANT_ID,
          decision_type: type,
          context_hash: hashContext(context),
          context_summary: JSON.stringify(context).slice(0, 500),
          action_taken: action,
          outcome: 'pending',
          capital_in: capitalIn,
          capital_out: 0,
          roi: 0,
          confidence_score: 0,
          metadata,
    };

  const { data, error } = await supabase
      .from('decision_memory')
      .insert(record)
      .select('id')
      .single();

  if (error) {
        console.error('[AEGIS Memory] Failed to store decision:', error.message);
        return null;
  }

  return data?.id || null;
}

// Resolve a pending decision with its outcome
export async function resolveDecision(
    decisionId: string,
    capitalOut: number,
    outcome: 'win' | 'loss' | 'neutral'
  ): Promise<boolean> {
    const roi = capitalOut > 0
      ? ((capitalOut - 0) / Math.max(capitalOut, 1)) * 100
          : 0;

  const { error } = await supabase
      .from('decision_memory')
      .update({
              capital_out: capitalOut,
              roi,
              outcome,
              resolved_at: new Date().toISOString(),
      })
      .eq('id', decisionId)
      .eq('tenant_id', TENANT_ID);

  if (error) {
        console.error('[AEGIS Memory] Failed to resolve decision:', error.message);
        return false;
  }

  return true;
}

// Recall similar past decisions based on context hash
export async function recallSimilarDecisions(
    context: Record<string, unknown>,
    type?: DecisionRecord['decision_type'],
    limit = 5
  ): Promise<DecisionRecord[]> {
    const hash = hashContext(context);

  let query = supabase
      .from('decision_memory')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('context_hash', hash)
      .neq('outcome', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

  if (type) {
        query = query.eq('decision_type', type);
  }

  const { data, error } = await query;

  if (error) {
        console.error('[AEGIS Memory] Recall failed:', error.message);
        return [];
  }

  return (data as DecisionRecord[]) || [];
}

// Get win rate for a specific decision type
export async function getDecisionWinRate(
    type: DecisionRecord['decision_type']
  ): Promise<{ winRate: number; totalDecisions: number; avgROI: number }> {
    const { data, error } = await supabase
      .from('decision_memory')
      .select('outcome, roi')
      .eq('tenant_id', TENANT_ID)
      .eq('decision_type', type)
      .neq('outcome', 'pending');

  if (error || !data || data.length === 0) {
        return { winRate: 0, totalDecisions: 0, avgROI: 0 };
  }

  const wins = data.filter((d) => d.outcome === 'win').length;
    const avgROI = data.reduce((sum, d) => sum + (d.roi || 0), 0) / data.length;

  return {
        winRate: (wins / data.length) * 100,
        totalDecisions: data.length,
        avgROI,
  };
}

// Score a new decision using historical memory
export async function scoreDecisionWithMemory(
    type: DecisionRecord['decision_type'],
    context: Record<string, unknown>
  ): Promise<{ score: number; recommendation: string; basedOnDecisions: number }> {
    const similar = await recallSimilarDecisions(context, type, 10);
    const stats = await getDecisionWinRate(type);

  if (similar.length === 0 && stats.totalDecisions === 0) {
        return {
                score: 50,
                recommendation: 'Aucune donnee historique. Commencer avec capital minimum.',
                basedOnDecisions: 0,
        };
  }

  const similarWins = similar.filter((d) => d.outcome === 'win').length;
    const similarWinRate = similar.length > 0 ? (similarWins / similar.length) * 100 : 50;

  // Weighted score: 60% similar context, 40% global type performance
  const score = Math.round(similarWinRate * 0.6 + stats.winRate * 0.4);

  let recommendation = '';
    if (score >= 70) {
          recommendation = `Historique favorable (${score}%). Allocation recommandee.`;
    } else if (score >= 40) {
          recommendation = `Historique neutre (${score}%). Allocation prudente conseille.`;
    } else {
          recommendation = `Historique negatif (${score}%). Eviter ou tester avec minimum.`;
    }

  return {
        score,
        recommendation,
        basedOnDecisions: similar.length + stats.totalDecisions,
  };
}
