// AEGIS Engine - Decision Memory
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
      (import.meta as any).env?.VITE_SUPABASE_URL || '',
      (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''
    );

const TENANT_ID = (import.meta as any).env?.VITE_TENANT_ID || 'AEGIS-OWNER';

export interface DecisionRecord {
      id?: string;
      tenant_id: string;
      decision_type: string;
      context: Record<string, unknown>;
      action_taken: string;
      capital_allocated: number;
      outcome?: string;
      roas_result?: number;
      created_at?: string;
}

export interface MemoryQuery {
      decision_type?: string;
      min_capital?: number;
      limit?: number;
}

export async function rememberDecision(
      type: string,
      context: Record<string, unknown>,
      action: string,
      capital: number
    ): Promise<string> {
      const record: DecisionRecord = {
              tenant_id: TENANT_ID,
              decision_type: type,
              context,
              action_taken: action,
              capital_allocated: capital,
      };
      const { data, error } = await supabase
        .from('decision_memory')
        .insert(record)
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      return data?.id || 'local-' + Date.now();
}

export async function resolveDecision(id: string): Promise<DecisionRecord | null> {
      const { data } = await supabase
        .from('decision_memory')
        .select('*')
        .eq('id', id)
        .single();
      return data;
}

export async function recallSimilarDecisions(query: MemoryQuery): Promise<DecisionRecord[]> {
      let q = supabase.from('decision_memory').select('*').eq('tenant_id', TENANT_ID);
      if (query.decision_type) q = q.eq('decision_type', query.decision_type);
      if (query.min_capital) q = q.gte('capital_allocated', query.min_capital);
      q = q.limit(query.limit || 10);
      const { data } = await q;
      return data || [];
}

export async function getDecisionWinRate(type: string): Promise<number> {
      const { data } = await supabase
        .from('decision_memory')
        .select('roas_result')
        .eq('tenant_id', TENANT_ID)
        .eq('decision_type', type)
        .not('roas_result', 'is', null);
      if (!data || data.length === 0) return 0;
      const wins = data.filter((d: any) => d.roas_result >= 2).length;
      return Math.round((wins / data.length) * 100);
}

export async function scoreDecisionWithMemory(
      type: string,
      capital: number
    ): Promise<{ score: number; recommendation: string }> {
      const winRate = await getDecisionWinRate(type);
      const score = Math.min(100, winRate + (capital > 500 ? 10 : 0));
      return {
              score,
              recommendation: score >= 60 ? 'go' : score >= 40 ? 'wait' : 'stop',
      };
}
