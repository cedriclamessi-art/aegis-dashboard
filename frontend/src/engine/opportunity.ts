// AEGIS Engine - Opportunity Score

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
}

export interface OpportunityScore {
      product_name: string;
      raw_score: number;
      adjusted_score: number;
      verdict: 'go' | 'wait' | 'stop';
      risk_level: 'low' | 'medium' | 'high';
      recommended_allocation: number;
      max_allocation: number;
      reasoning: string[];
}

export async function scoreOpportunity(input: OpportunityInput): Promise<OpportunityScore> {
      const marginScore = Math.min(100, input.estimated_margin * 1.2);
      const trendScore = input.trend_score;
      const saturationPenalty = input.market_saturation * 0.4;
      const competitionPenalty = input.competition_level * 0.3;
      const raw = (marginScore * 0.3 + trendScore * 0.4) - saturationPenalty * 0.2 - competitionPenalty * 0.1;
      const adjusted = Math.max(0, Math.min(100, Math.round(raw)));

  const verdict: 'go' | 'wait' | 'stop' = adjusted >= 65 ? 'go' : adjusted >= 40 ? 'wait' : 'stop';
      const risk_level: 'low' | 'medium' | 'high' = adjusted >= 65 ? 'low' : adjusted >= 40 ? 'medium' : 'high';
      const recommended_allocation = Math.round(input.capital_available * (adjusted / 100) * 0.3);
      const max_allocation = Math.round(input.capital_available * 0.5);

  const reasoning: string[] = [
          'Marge estimee: ' + input.estimated_margin + '%',
          'Tendance marche: ' + input.trend_score + '/100',
          'Saturation: ' + input.market_saturation + '/100',
          'Competitivite: ' + input.competition_level + '/100',
        ];

  return { product_name: input.product_name, raw_score: Math.round(raw), adjusted_score: adjusted, verdict, risk_level, recommended_allocation, max_allocation, reasoning };
}

export async function getTopOpportunities(tenantId: string): Promise<OpportunityScore[]> {
      return [];
}

export async function getProductHistory(productName: string): Promise<OpportunityScore[]> {
      return [];
}
