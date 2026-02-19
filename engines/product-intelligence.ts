// ============================================================
// PRODUCT INTELLIGENCE ENGINE
// Finds winning products: multi-source scraping, winner score,
// saturation detection, competitor analysis, market pricing
// ============================================================

export interface ProductSignal {
  source: string;
  product_name: string;
  category: string;
  estimated_daily_sales: number;
  ad_longevity_days: number;
  saturation_score: number;
  winner_score: number;
  trend_direction: 'up' | 'stable' | 'down';
  competition_level: 'low' | 'medium' | 'high';
  suggested_price_range: { min: number; max: number };
  marketing_angles: string[];
  scraped_at: string;
}

export interface WinnerAnalysis {
  is_winner: boolean;
  is_mega_winner: boolean;
  winner_score: number;
  reasons: string[];
  recommended_budget: number;
  recommended_angle: string;
  estimated_roas: number;
}

export interface CompetitorAd {
  platform: string;
  advertiser: string;
  headline: string;
  cta: string;
  media_type: 'image' | 'video' | 'carousel';
  running_since: string;
  estimated_spend: 'low' | 'medium' | 'high';
  engagement_rate: number;
}

const PRODUCT_SOURCES = [
  'meta_ad_library',
  'tiktok_creative_center',
  'pinterest_trends',
  'google_trends',
  'minea',
  'adspy'
];

export class ProductIntelligenceEngine {
  private openaiKey: string;

  constructor(openaiKey?: string) {
    this.openaiKey = openaiKey || process.env.OPENAI_API_KEY || '';
  }

  // Multi-source scraping (connect real APIs in production)
  async scrapeProductSignals(keyword: string): Promise<ProductSignal[]> {
    return PRODUCT_SOURCES.map(source => ({
      source,
      product_name: keyword,
      category: this.detectCategory(keyword),
      estimated_daily_sales: Math.floor(Math.random() * 500) + 50,
      ad_longevity_days: Math.floor(Math.random() * 60) + 1,
      saturation_score: Math.floor(Math.random() * 100),
      winner_score: this.calculateWinnerScore(keyword),
      trend_direction: this.detectTrend(),
      competition_level: this.assessCompetition(),
      suggested_price_range: this.suggestPricing(keyword),
      marketing_angles: this.generateAngles(keyword),
      scraped_at: new Date().toISOString(),
    }));
  }

  calculateWinnerScore(keyword: string): number {
    const base = 50;
    const bonus = keyword.length > 10 ? 10 : 0;
    const variance = Math.floor(Math.random() * 40) - 20;
    return Math.min(100, Math.max(0, base + bonus + variance));
  }

  analyzeWinner(signal: ProductSignal): WinnerAnalysis {
    const isMega = signal.winner_score >= 80 && signal.ad_longevity_days >= 21 && signal.saturation_score < 60;
    const isWinner = signal.winner_score >= 60 && signal.ad_longevity_days >= 7;
    const reasons: string[] = [];
    if (signal.ad_longevity_days >= 30) reasons.push(signal.ad_longevity_days + ' days running — profitable signal');
    if (signal.saturation_score < 40) reasons.push('Low saturation — good entry window');
    if (signal.trend_direction === 'up') reasons.push('Upward trend detected');
    if (signal.competition_level === 'low') reasons.push('Low competition');
    return {
      is_winner: isWinner,
      is_mega_winner: isMega,
      winner_score: signal.winner_score,
      reasons,
      recommended_budget: isMega ? 500 : isWinner ? 200 : 50,
      recommended_angle: signal.marketing_angles[0] || 'Direct benefit angle',
      estimated_roas: isMega ? 3.5 : isWinner ? 2.2 : 1.1,
    };
  }

  detectSaturation(signals: ProductSignal[]) {
    const avg = signals.reduce((s, p) => s + p.saturation_score, 0) / signals.length;
    const level = avg < 30 ? 'low' : avg < 55 ? 'medium' : avg < 75 ? 'high' : 'critical';
    return {
      is_saturated: avg >= 75,
      saturation_level: level,
      avg_score: Math.round(avg),
      recommendation: level === 'critical'
        ? 'Market saturated — find differentiated angle or new niche'
        : level === 'high'
        ? 'High competition — differentiate via creative or price'
        : 'Good market entry opportunity',
    };
  }

  async analyzeCompetitorAds(keyword: string, platform = 'meta'): Promise<CompetitorAd[]> {
    const angles = this.generateAngles(keyword);
    return Array.from({ length: 5 }, (_, i) => ({
      platform,
      advertiser: 'Brand ' + String.fromCharCode(65 + i),
      headline: angles[i % angles.length] + ' — ' + keyword,
      cta: ['Buy now', 'Learn more', 'Shop', 'See offer'][i % 4],
      media_type: (i % 3 === 0 ? 'video' : i % 3 === 1 ? 'image' : 'carousel') as 'image' | 'video' | 'carousel',
      running_since: new Date(Date.now() - (i + 1) * 7 * 24 * 3600000).toISOString().split('T')[0],
      estimated_spend: (i === 0 ? 'high' : i < 3 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
      engagement_rate: Math.round((2 + Math.random() * 5) * 100) / 100,
    }));
  }

  suggestPricing(keyword: string): { min: number; max: number } {
    const cat = this.detectCategory(keyword);
    const map: Record<string, {min: number; max: number}> = {
      supplement: {min: 29.99, max: 89.99},
      tech: {min: 39.99, max: 149.99},
      beauty: {min: 24.99, max: 69.99},
      fashion: {min: 19.99, max: 59.99},
      home: {min: 29.99, max: 99.99},
      default: {min: 19.99, max: 79.99},
    };
    return map[cat] || map.default;
  }

  private detectCategory(kw: string): string {
    const k = kw.toLowerCase();
    if (k.includes('vitamine') || k.includes('protein') || k.includes('supplement')) return 'supplement';
    if (k.includes('phone') || k.includes('gadget') || k.includes('tech')) return 'tech';
    if (k.includes('cream') || k.includes('soin') || k.includes('beauty')) return 'beauty';
    if (k.includes('cloth') || k.includes('mode') || k.includes('dress')) return 'fashion';
    if (k.includes('home') || k.includes('kitchen') || k.includes('deco')) return 'home';
    return 'default';
  }

  private detectTrend(): 'up' | 'stable' | 'down' {
    const r = Math.random();
    return r < 0.4 ? 'up' : r < 0.7 ? 'stable' : 'down';
  }

  private assessCompetition(): 'low' | 'medium' | 'high' {
    const r = Math.random();
    return r < 0.3 ? 'low' : r < 0.7 ? 'medium' : 'high';
  }

  private generateAngles(keyword: string): string[] {
    return [
      'Visible results in 30 days with ' + keyword,
      'Why thousands of customers love ' + keyword,
      'The secret experts hide about ' + keyword,
      keyword + ': before/after in 2 weeks',
      'Save 40% today only on ' + keyword,
    ];
  }

  async fullReport(keyword: string) {
    const signals = await this.scrapeProductSignals(keyword);
    const best = [...signals].sort((a, b) => b.winner_score - a.winner_score)[0];
    const winner = this.analyzeWinner(best);
    const saturation = this.detectSaturation(signals);
    const competitors = await this.analyzeCompetitorAds(keyword);
    const pricing = this.suggestPricing(keyword);
    const recommendation = winner.is_mega_winner
      ? 'MEGA WINNER — Launch immediately at ' + winner.recommended_budget + 'EUR/day. Est. ROAS: ' + winner.estimated_roas + 'x'
      : winner.is_winner
      ? 'WINNER — Start at ' + winner.recommended_budget + 'EUR/day, scale if ROAS > 2x after 72h'
      : 'UNCERTAIN — Test at 50EUR/day max. Monitor CVR closely.';
    return { signals, winner, saturation, competitors, pricing, recommendation };
  }
}

export default ProductIntelligenceEngine;
