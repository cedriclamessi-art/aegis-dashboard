// AEGIS — Media Buying Engine
// Creation campagnes Meta/Google/TikTok, scaling horizontal/vertical,
// kill auto ads perdantes, duplication ads gagnantes, rotation creatives, CBO/ABO logic

import { GovernanceMode } from './governance-engine';
import { RiskEngine } from './risk-engine';

export type Platform = 'meta' | 'google' | 'tiktok' | 'snapchat' | 'pinterest';
export type ScalingStrategy = 'horizontal' | 'vertical' | 'cbo' | 'abo';
export type CampaignObjective = 'conversions' | 'traffic' | 'awareness' | 'catalog_sales' | 'lead_generation';
export type AdStatus = 'active' | 'paused' | 'killed' | 'learning' | 'winning' | 'mega_winner';

export interface Campaign {
  id: string;
  platform: Platform;
  name: string;
  objective: CampaignObjective;
  dailyBudget: number;
  totalSpend: number;
  roas: number;
  cpa: number;
  ctr: number;
  cpm: number;
  conversions: number;
  revenue: number;
  status: 'active' | 'paused' | 'killed';
  createdAt: string;
  adSets: AdSet[];
  scalingStrategy: ScalingStrategy;
}

export interface AdSet {
  id: string;
  campaignId: string;
  name: string;
  audience: Audience;
  dailyBudget: number;
  spend: number;
  roas: number;
  cpa: number;
  ctr: number;
  conversions: number;
  status: 'active' | 'paused' | 'killed';
  ads: Ad[];
}

export interface Ad {
  id: string;
  adSetId: string;
  name: string;
  creativeId: string;
  headline: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  ctr: number;
  cpc: number;
  cpm: number;
  spend: number;
  conversions: number;
  roas: number;
  status: AdStatus;
  score: number;
  createdAt: string;
  lastUpdated: string;
}

export interface Audience {
  id: string;
  name: string;
  type: 'lookalike' | 'interest' | 'custom' | 'broad' | 'retargeting';
  size: number;
  countries: string[];
  ageMin: number;
  ageMax: number;
  interests?: string[];
  sourceAudience?: string;
}

export interface ScalingAction {
  type: 'increase_budget' | 'duplicate_adset' | 'duplicate_ad' | 'new_audience' | 'creative_rotation';
  targetId: string;
  targetType: 'campaign' | 'adset' | 'ad';
  multiplier?: number;
  newBudget?: number;
  reason: string;
  estimatedRoasImpact: number;
  approved: boolean;
  executedAt?: string;
}

export interface MediaBuyingReport {
  timestamp: string;
  totalActiveAds: number;
  totalKilledAds: number;
  totalWinningAds: number;
  totalMegaWinners: number;
  totalSpend: number;
  totalRevenue: number;
  avgRoas: number;
  avgCpa: number;
  scalingActionsExecuted: number;
  scalingActionsPending: number;
  budgetAllocations: Record<Platform, number>;
  topPerformingAds: Ad[];
  recommendedActions: ScalingAction[];
}

export class MediaBuyingEngine {
  private governanceMode: GovernanceMode = 'semi_auto';
  private campaigns: Map<string, Campaign> = new Map();
  private scalingQueue: ScalingAction[] = [];
  private actionLog: Array<{ action: string; timestamp: string; platform: Platform; details: unknown }> = [];
  private riskEngine?: RiskEngine;

  // Thresholds
  private readonly KILL_ROAS_THRESHOLD = 0.8;
  private readonly KILL_SPEND_THRESHOLD = 50;
  private readonly WINNING_ROAS_THRESHOLD = 2.5;
  private readonly MEGA_WINNER_ROAS_THRESHOLD = 4.0;
  private readonly SCALE_UP_ROAS_THRESHOLD = 3.0;
  private readonly MAX_BUDGET_INCREASE_PERCENT = 0.30;
  private readonly CBO_MIN_ADSETS = 3;

  constructor(mode: GovernanceMode = 'semi_auto', riskEngine?: RiskEngine) {
    this.governanceMode = mode;
    this.riskEngine = riskEngine;
  }

  // CAMPAIGN CREATION
  async createCampaign(config: {
    platform: Platform;
    name: string;
    objective: CampaignObjective;
    dailyBudget: number;
    scalingStrategy: ScalingStrategy;
    audiences: Audience[];
    creativeIds: string[];
  }): Promise<Campaign | null> {
    if (this.governanceMode === 'human') {
      this.logAction('campaign_creation_pending_approval', config.platform, config);
      return null;
    }

    try {
      let campaignId: string;
      if (config.platform === 'meta') {
        campaignId = await this.createMetaCampaign(config);
      } else if (config.platform === 'google') {
        campaignId = await this.createGoogleCampaign(config);
      } else if (config.platform === 'tiktok') {
        campaignId = await this.createTikTokCampaign(config);
      } else {
        campaignId = 'sim_' + config.platform + '_' + Date.now();
      }

      const campaign: Campaign = {
        id: campaignId,
        platform: config.platform,
        name: config.name,
        objective: config.objective,
        dailyBudget: config.dailyBudget,
        totalSpend: 0,
        roas: 0,
        cpa: 0,
        ctr: 0,
        cpm: 0,
        conversions: 0,
        revenue: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        adSets: [],
        scalingStrategy: config.scalingStrategy
      };

      this.campaigns.set(campaign.id, campaign);
      this.logAction('campaign_created', config.platform, { campaignId, name: config.name });
      return campaign;
    } catch (_) {
      return this.simulateCampaignCreation(config);
    }
  }

  private async createMetaCampaign(config: Record<string, unknown>): Promise<string> {
    const response = await fetch('/api/meta/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: config.name,
        objective: config.objective,
        daily_budget: (config.dailyBudget as number) * 100,
        status: 'ACTIVE'
      })
    });
    const data = await response.json();
    return data.id;
  }

  private async createGoogleCampaign(config: Record<string, unknown>): Promise<string> {
    const response = await fetch('/api/google-ads/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignName: config.name, budget: config.dailyBudget, biddingStrategy: 'TARGET_ROAS' })
    });
    const data = await response.json();
    return data.resourceName;
  }

  private async createTikTokCampaign(config: Record<string, unknown>): Promise<string> {
    const response = await fetch('/api/tiktok/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_name: config.name, objective_type: 'CONVERSIONS', budget: config.dailyBudget })
    });
    const data = await response.json();
    return data.campaign_id;
  }

  // AUTO KILL LOSING ADS
  async runAutoKillLosers(): Promise<{ killed: string[]; paused: string[] }> {
    const killed: string[] = [];
    const paused: string[] = [];

    for (const campaign of this.campaigns.values()) {
      for (const adSet of campaign.adSets) {
        for (const ad of adSet.ads) {
          if (ad.status !== 'active') continue;
          const shouldKill = ad.spend >= this.KILL_SPEND_THRESHOLD && ad.roas < this.KILL_ROAS_THRESHOLD;
          const shouldPause = ad.spend >= this.KILL_SPEND_THRESHOLD * 0.5 && ad.roas < this.KILL_ROAS_THRESHOLD * 1.2 && ad.ctr < 0.01;

          if (shouldKill) {
            const requiresApproval = this.governanceMode === 'human' || (this.governanceMode === 'semi_auto' && ad.spend > 200);
            if (requiresApproval) {
              this.scalingQueue.push({ type: 'duplicate_ad', targetId: ad.id, targetType: 'ad', reason: 'kill_loser_pending_approval', estimatedRoasImpact: 0.2, approved: false });
            } else {
              await this.killAd(ad, campaign.platform);
              killed.push(ad.id);
            }
          } else if (shouldPause) {
            ad.status = 'paused';
            paused.push(ad.id);
            this.logAction('ad_paused_low_performance', campaign.platform, { adId: ad.id, roas: ad.roas, ctr: ad.ctr });
          }
        }
      }
    }

    return { killed, paused };
  }

  private async killAd(ad: Ad, platform: Platform): Promise<void> {
    ad.status = 'killed';
    try {
      if (platform === 'meta') {
        await fetch('/api/meta/ads/' + ad.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PAUSED' }) });
      } else if (platform === 'google') {
        await fetch('/api/google-ads/ads/' + ad.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PAUSED' }) });
      } else if (platform === 'tiktok') {
        await fetch('/api/tiktok/ads/' + ad.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation_status: 'DISABLE' }) });
      }
    } catch (_) { console.log('[MediaBuying] Kill ad simulation:', ad.id); }
    this.logAction('ad_killed', platform, { adId: ad.id, roas: ad.roas, spend: ad.spend });
  }

  // DUPLICATE WINNING ADS
  async duplicateWinners(): Promise<{ duplicated: string[]; megaWinners: string[] }> {
    const duplicated: string[] = [];
    const megaWinners: string[] = [];

    for (const campaign of this.campaigns.values()) {
      for (const adSet of campaign.adSets) {
        for (const ad of adSet.ads) {
          if (ad.roas >= this.MEGA_WINNER_ROAS_THRESHOLD && ad.status === 'active') {
            ad.status = 'mega_winner';
            megaWinners.push(ad.id);
            if (this.governanceMode !== 'human') {
              await this.duplicateAdToNewAudiences(ad, campaign);
            }
          } else if (ad.roas >= this.WINNING_ROAS_THRESHOLD && ad.status === 'active') {
            ad.status = 'winning';
            if (this.governanceMode === 'full_auto') {
              await this.scaleAdVertically(ad, campaign);
              duplicated.push(ad.id);
            } else {
              this.scalingQueue.push({
                type: 'duplicate_ad', targetId: ad.id, targetType: 'ad',
                reason: 'winner_scale_up_roas_' + ad.roas.toFixed(2),
                estimatedRoasImpact: ad.roas * 0.8,
                approved: false
              });
            }
          }
        }
      }
    }

    return { duplicated, megaWinners };
  }

  private async duplicateAdToNewAudiences(ad: Ad, campaign: Campaign): Promise<void> {
    const newAudiences: Audience[] = [
      { id: 'lal_' + Date.now(), name: 'LAL 1% ' + ad.name, type: 'lookalike', size: 2000000, countries: ['FR', 'BE', 'CH'], ageMin: 18, ageMax: 55 },
      { id: 'lal2_' + Date.now(), name: 'LAL 2% ' + ad.name, type: 'lookalike', size: 4000000, countries: ['FR', 'BE', 'CH'], ageMin: 18, ageMax: 55 },
      { id: 'broad_' + Date.now(), name: 'Broad ' + ad.name, type: 'broad', size: 10000000, countries: ['FR'], ageMin: 25, ageMax: 45 }
    ];

    for (const audience of newAudiences) {
      try {
        await fetch('/api/' + campaign.platform + '/adsets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: campaign.id, audience, adId: ad.id, budget: campaign.dailyBudget * 0.3 })
        });
      } catch (_) {}
    }
    this.logAction('mega_winner_duplicated', campaign.platform, { adId: ad.id, newAudiences: newAudiences.length });
  }

  private async scaleAdVertically(ad: Ad, campaign: Campaign): Promise<void> {
    const adSet = campaign.adSets.find(s => s.id === ad.adSetId);
    if (!adSet) return;
    const newBudget = adSet.dailyBudget * (1 + this.MAX_BUDGET_INCREASE_PERCENT);
    adSet.dailyBudget = newBudget;
    try {
      await fetch('/api/' + campaign.platform + '/adsets/' + adSet.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_budget: newBudget * 100 })
      });
    } catch (_) {}
    this.logAction('ad_scaled_vertical', campaign.platform, { adId: ad.id, newBudget });
  }

  // BUDGET ALLOCATION
  async allocateBudget(totalDailyBudget: number): Promise<Record<Platform, number>> {
    const allocation: Record<Platform, number> = { meta: 0, google: 0, tiktok: 0, snapchat: 0, pinterest: 0 };
    const activeCampaignsByPlatform = new Map<Platform, { roas: number; spend: number }[]>();

    for (const campaign of this.campaigns.values()) {
      if (campaign.status !== 'active') continue;
      if (!activeCampaignsByPlatform.has(campaign.platform)) activeCampaignsByPlatform.set(campaign.platform, []);
      activeCampaignsByPlatform.get(campaign.platform)!.push({ roas: campaign.roas, spend: campaign.totalSpend });
    }

    let totalWeight = 0;
    const weights = new Map<Platform, number>();
    for (const [platform, campaigns] of activeCampaignsByPlatform.entries()) {
      const avgRoas = campaigns.reduce((s, c) => s + c.roas, 0) / campaigns.length;
      const weight = Math.max(avgRoas, 0.1);
      weights.set(platform, weight);
      totalWeight += weight;
    }

    for (const [platform, weight] of weights.entries()) {
      allocation[platform] = Math.round((weight / totalWeight) * totalDailyBudget * 100) / 100;
    }

    this.logAction('budget_allocated', 'meta', { total: totalDailyBudget, allocation });
    return allocation;
  }

  // SCALING HORIZONTAL / VERTICAL
  async scaleHorizontal(campaignId: string, newAudienceTypes: Audience['type'][]): Promise<AdSet[]> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return [];
    if (this.governanceMode === 'human') { this.logAction('horizontal_scale_pending', campaign.platform, { campaignId }); return []; }

    const newAdSets: AdSet[] = [];
    for (const audienceType of newAudienceTypes) {
      const newAdSet: AdSet = {
        id: 'adset_' + Date.now() + '_' + audienceType,
        campaignId,
        name: campaign.name + ' - ' + audienceType,
        audience: { id: 'aud_' + Date.now(), name: audienceType + ' audience', type: audienceType, size: 2000000, countries: ['FR'], ageMin: 18, ageMax: 55 },
        dailyBudget: campaign.dailyBudget * 0.25,
        spend: 0, roas: 0, cpa: 0, ctr: 0, conversions: 0,
        status: 'active',
        ads: []
      };
      campaign.adSets.push(newAdSet);
      newAdSets.push(newAdSet);
    }
    this.logAction('horizontal_scale_executed', campaign.platform, { campaignId, newAdSets: newAdSets.length });
    return newAdSets;
  }

  // CBO / ABO LOGIC
  async optimizeCBOStructure(campaignId: string): Promise<{ switched: boolean; reason: string }> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return { switched: false, reason: 'Campaign not found' };

    if (campaign.scalingStrategy === 'abo' && campaign.adSets.length >= this.CBO_MIN_ADSETS) {
      const avgRoas = campaign.adSets.reduce((s, a) => s + a.roas, 0) / campaign.adSets.length;
      const variance = campaign.adSets.reduce((s, a) => s + Math.pow(a.roas - avgRoas, 2), 0) / campaign.adSets.length;

      if (variance > 1.5) {
        if (this.governanceMode !== 'human') {
          campaign.scalingStrategy = 'cbo';
          this.logAction('switched_abo_to_cbo', campaign.platform, { campaignId, variance, avgRoas });
          return { switched: true, reason: 'High variance (' + variance.toFixed(2) + ') - CBO will optimize budget allocation automatically' };
        }
      }
    }

    return { switched: false, reason: 'CBO switch not needed or requires approval' };
  }

  // CREATIVE ROTATION
  async rotateCreatives(adSetId: string): Promise<{ activated: string[]; deactivated: string[] }> {
    const campaign = Array.from(this.campaigns.values()).find(c => c.adSets.some(a => a.id === adSetId));
    if (!campaign) return { activated: [], deactivated: [] };
    const adSet = campaign.adSets.find(a => a.id === adSetId);
    if (!adSet) return { activated: [], deactivated: [] };

    const ads = adSet.ads.filter(a => a.status === 'active' || a.status === 'paused');
    const sorted = [...ads].sort((a, b) => b.score - a.score);
    const topAds = sorted.slice(0, 3);
    const bottomAds = sorted.slice(3);

    topAds.forEach(a => { a.status = 'active'; });
    bottomAds.forEach(a => { if (a.status === 'active') a.status = 'paused'; });

    this.logAction('creatives_rotated', campaign.platform, { adSetId, activated: topAds.length, deactivated: bottomAds.length });
    return { activated: topAds.map(a => a.id), deactivated: bottomAds.map(a => a.id) };
  }

  // SYNC CAMPAIGN METRICS
  async syncMetrics(): Promise<void> {
    for (const campaign of this.campaigns.values()) {
      try {
        const response = await fetch('/api/' + campaign.platform + '/campaigns/' + campaign.id + '/metrics');
        if (response.ok) {
          const metrics = await response.json();
          campaign.roas = metrics.roas || 0;
          campaign.cpa = metrics.cpa || 0;
          campaign.ctr = metrics.ctr || 0;
          campaign.cpm = metrics.cpm || 0;
          campaign.totalSpend = metrics.spend || 0;
          campaign.revenue = metrics.revenue || 0;
          campaign.conversions = metrics.conversions || 0;
        }
      } catch (_) {
        this.applySimulatedMetrics(campaign);
      }
    }
  }

  private applySimulatedMetrics(campaign: Campaign): void {
    const baseRoas = 1.5 + Math.random() * 3;
    campaign.roas = parseFloat(baseRoas.toFixed(2));
    campaign.cpa = parseFloat((15 + Math.random() * 35).toFixed(2));
    campaign.ctr = parseFloat((0.01 + Math.random() * 0.04).toFixed(4));
    campaign.cpm = parseFloat((5 + Math.random() * 20).toFixed(2));
    campaign.totalSpend += campaign.dailyBudget * (0.8 + Math.random() * 0.4);
    campaign.revenue = campaign.totalSpend * campaign.roas;
    campaign.conversions = Math.round(campaign.totalSpend / campaign.cpa);
  }

  // REPORTING
  async generateReport(): Promise<MediaBuyingReport> {
    await this.syncMetrics();
    const allAds: Ad[] = [];
    let totalSpend = 0;
    let totalRevenue = 0;
    const budgetAllocations: Record<Platform, number> = { meta: 0, google: 0, tiktok: 0, snapchat: 0, pinterest: 0 };

    for (const campaign of this.campaigns.values()) {
      totalSpend += campaign.totalSpend;
      totalRevenue += campaign.revenue;
      budgetAllocations[campaign.platform] += campaign.dailyBudget;
      for (const adSet of campaign.adSets) {
        allAds.push(...adSet.ads);
      }
    }

    const activeAds = allAds.filter(a => a.status === 'active');
    const killedAds = allAds.filter(a => a.status === 'killed');
    const winningAds = allAds.filter(a => a.status === 'winning');
    const megaWinners = allAds.filter(a => a.status === 'mega_winner');
    const topAds = [...winningAds, ...megaWinners].sort((a, b) => b.roas - a.roas).slice(0, 5);

    return {
      timestamp: new Date().toISOString(),
      totalActiveAds: activeAds.length,
      totalKilledAds: killedAds.length,
      totalWinningAds: winningAds.length,
      totalMegaWinners: megaWinners.length,
      totalSpend,
      totalRevenue,
      avgRoas: totalSpend > 0 ? parseFloat((totalRevenue / totalSpend).toFixed(2)) : 0,
      avgCpa: allAds.length > 0 ? parseFloat((totalSpend / Math.max(allAds.reduce((s, a) => s + a.conversions, 0), 1)).toFixed(2)) : 0,
      scalingActionsExecuted: this.actionLog.filter(l => l.action.includes('scale')).length,
      scalingActionsPending: this.scalingQueue.filter(a => !a.approved).length,
      budgetAllocations,
      topPerformingAds: topAds,
      recommendedActions: this.scalingQueue.filter(a => !a.approved).slice(0, 5)
    };
  }

  // SIMULATION
  private simulateCampaignCreation(config: Record<string, unknown>): Campaign {
    return {
      id: 'sim_' + Date.now(),
      platform: config.platform as Platform,
      name: config.name as string,
      objective: config.objective as CampaignObjective,
      dailyBudget: config.dailyBudget as number,
      totalSpend: 0, roas: 0, cpa: 0, ctr: 0, cpm: 0, conversions: 0, revenue: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      adSets: [],
      scalingStrategy: config.scalingStrategy as ScalingStrategy
    };
  }

  // GOVERNANCE
  setGovernanceMode(mode: GovernanceMode): void { this.governanceMode = mode; this.logAction('governance_mode_changed', 'meta', { mode }); }

  getPendingApprovals(): ScalingAction[] { return this.scalingQueue.filter(a => !a.approved); }

  approveScalingAction(actionIndex: number): void {
    if (actionIndex < this.scalingQueue.length) {
      this.scalingQueue[actionIndex].approved = true;
      this.scalingQueue[actionIndex].executedAt = new Date().toISOString();
      this.logAction('scaling_action_approved', 'meta', { actionIndex });
    }
  }

  private logAction(action: string, platform: Platform, details?: unknown): void {
    this.actionLog.push({ action, timestamp: new Date().toISOString(), platform, details });
    console.log('[MediaBuying]', action, details);
  }

  getCampaigns(): Campaign[] { return Array.from(this.campaigns.values()); }
  getActionLog() { return this.actionLog; }
  getStatus() { return { mode: this.governanceMode, totalCampaigns: this.campaigns.size, pendingApprovals: this.scalingQueue.filter(a => !a.approved).length, totalActionsLogged: this.actionLog.length }; }
}

export const mediaBuyingEngine = new MediaBuyingEngine('semi_auto');
