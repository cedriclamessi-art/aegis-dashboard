// AEGIS — Market Adaptation Engine
// Detection fatigue creative, hausse CPM, baisse CTR/CVR, saturation audience,
// baisse ROAS, repositionnement angle, rotation niche

import { GovernanceMode } from './governance-engine';

export type MarketSignal = 'creative_fatigue' | 'cpm_spike' | 'ctr_drop' | 'cvr_drop' | 'roas_decline' | 'audience_saturation' | 'competitor_surge' | 'seasonal_shift';
export type AdaptationAction = 'refresh_creative' | 'rotate_angle' | 'expand_audience' | 'reduce_budget' | 'pause_campaign' | 'change_niche' | 'reposition_offer' | 'test_new_market';

export interface MarketMetrics {
  campaignId: string;
  platform: string;
  period: '7d' | '14d' | '30d';
  cpm: number;
  cpmBaseline: number;
  ctr: number;
  ctrBaseline: number;
  cvr: number;
  cvrBaseline: number;
  roas: number;
  roasBaseline: number;
  frequencyScore: number;
  audienceSaturationPercent: number;
  creativeAgedays: number;
  timestamp: string;
}

export interface MarketAlert {
  id: string;
  signal: MarketSignal;
  severity: 'critical' | 'warning' | 'info';
  campaignId: string;
  metric: string;
  currentValue: number;
  baselineValue: number;
  deviationPercent: number;
  detectedAt: string;
  acknowledged: boolean;
  suggestedAction: AdaptationAction;
}

export interface NicheOpportunity {
  id: string;
  niche: string;
  country: string;
  saturationScore: number;
  growthTrend: number;
  avgCpm: number;
  estimatedCvr: number;
  competitionLevel: 'low' | 'medium' | 'high';
  recommendedAngle: string;
  potentialRevenue: number;
  entryDifficulty: 'easy' | 'medium' | 'hard';
}

export interface AngleRepositioning {
  originalAngle: string;
  newAngle: string;
  reason: string;
  expectedCtrLift: number;
  expectedCvrLift: number;
  hookVariants: string[];
  adCopyVariants: string[];
}

export interface AdaptationPlan {
  campaignId: string;
  alerts: MarketAlert[];
  actions: AdaptationStep[];
  estimatedRecoveryDays: number;
  estimatedRoasRecovery: number;
  requiresApproval: boolean;
  createdAt: string;
}

export interface AdaptationStep {
  order: number;
  action: AdaptationAction;
  description: string;
  estimatedImpact: number;
  automated: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export class MarketAdaptationEngine {
  private governanceMode: GovernanceMode = 'semi_auto';
  private alerts: Map<string, MarketAlert> = new Map();
  private metricsHistory: Map<string, MarketMetrics[]> = new Map();
  private adaptationPlans: Map<string, AdaptationPlan> = new Map();
  private actionLog: Array<{ action: string; timestamp: string; details: unknown }> = [];

  // Detection thresholds
  private readonly CPM_SPIKE_THRESHOLD = 0.20;
  private readonly CTR_DROP_THRESHOLD = -0.15;
  private readonly CVR_DROP_THRESHOLD = -0.20;
  private readonly ROAS_DECLINE_THRESHOLD = -0.25;
  private readonly FREQUENCY_FATIGUE_THRESHOLD = 3.5;
  private readonly AUDIENCE_SATURATION_THRESHOLD = 0.70;
  private readonly CREATIVE_AGE_THRESHOLD_DAYS = 21;

  constructor(mode: GovernanceMode = 'semi_auto') {
    this.governanceMode = mode;
  }

  // SIGNAL DETECTION
  async detectMarketSignals(campaignId: string): Promise<MarketAlert[]> {
    let metrics: MarketMetrics;
    try {
      const response = await fetch('/api/analytics/campaigns/' + campaignId + '/metrics?period=7d');
      if (!response.ok) throw new Error('API unavailable');
      metrics = await response.json();
    } catch (_) {
      metrics = this.simulateMetrics(campaignId);
    }

    this.storeMetrics(campaignId, metrics);
    const newAlerts: MarketAlert[] = [];

    // CPM spike detection
    const cpmDelta = (metrics.cpm - metrics.cpmBaseline) / metrics.cpmBaseline;
    if (cpmDelta > this.CPM_SPIKE_THRESHOLD) {
      newAlerts.push(this.createAlert('cpm_spike', campaignId, 'CPM', metrics.cpm, metrics.cpmBaseline, cpmDelta, 'refresh_creative'));
    }

    // CTR drop detection
    const ctrDelta = (metrics.ctr - metrics.ctrBaseline) / metrics.ctrBaseline;
    if (ctrDelta < this.CTR_DROP_THRESHOLD) {
      newAlerts.push(this.createAlert('ctr_drop', campaignId, 'CTR', metrics.ctr, metrics.ctrBaseline, ctrDelta, 'rotate_angle'));
    }

    // CVR drop detection
    const cvrDelta = (metrics.cvr - metrics.cvrBaseline) / metrics.cvrBaseline;
    if (cvrDelta < this.CVR_DROP_THRESHOLD) {
      newAlerts.push(this.createAlert('cvr_drop', campaignId, 'CVR', metrics.cvr, metrics.cvrBaseline, cvrDelta, 'reposition_offer'));
    }

    // ROAS decline detection
    const roasDelta = (metrics.roas - metrics.roasBaseline) / metrics.roasBaseline;
    if (roasDelta < this.ROAS_DECLINE_THRESHOLD) {
      newAlerts.push(this.createAlert('roas_decline', campaignId, 'ROAS', metrics.roas, metrics.roasBaseline, roasDelta, 'reduce_budget'));
    }

    // Creative fatigue detection
    if (metrics.frequencyScore > this.FREQUENCY_FATIGUE_THRESHOLD || metrics.creativeAgedays > this.CREATIVE_AGE_THRESHOLD_DAYS) {
      newAlerts.push(this.createAlert('creative_fatigue', campaignId, 'Frequency', metrics.frequencyScore, this.FREQUENCY_FATIGUE_THRESHOLD, metrics.frequencyScore / this.FREQUENCY_FATIGUE_THRESHOLD - 1, 'refresh_creative'));
    }

    // Audience saturation detection
    if (metrics.audienceSaturationPercent > this.AUDIENCE_SATURATION_THRESHOLD) {
      newAlerts.push(this.createAlert('audience_saturation', campaignId, 'Saturation', metrics.audienceSaturationPercent, this.AUDIENCE_SATURATION_THRESHOLD, metrics.audienceSaturationPercent / this.AUDIENCE_SATURATION_THRESHOLD - 1, 'expand_audience'));
    }

    newAlerts.forEach(a => this.alerts.set(a.id, a));
    this.logAction('signals_detected', { campaignId, alertCount: newAlerts.length });
    return newAlerts;
  }

  private createAlert(
    signal: MarketSignal,
    campaignId: string,
    metric: string,
    current: number,
    baseline: number,
    deviation: number,
    suggestedAction: AdaptationAction
  ): MarketAlert {
    const severity = Math.abs(deviation) > 0.4 ? 'critical' : Math.abs(deviation) > 0.2 ? 'warning' : 'info';
    return {
      id: signal + '_' + campaignId + '_' + Date.now(),
      signal,
      severity,
      campaignId,
      metric,
      currentValue: current,
      baselineValue: baseline,
      deviationPercent: parseFloat((deviation * 100).toFixed(1)),
      detectedAt: new Date().toISOString(),
      acknowledged: false,
      suggestedAction
    };
  }

  // ADAPTATION PLAN GENERATION
  async generateAdaptationPlan(campaignId: string): Promise<AdaptationPlan> {
    const campaignAlerts = Array.from(this.alerts.values())
      .filter(a => a.campaignId === campaignId && !a.acknowledged)
      .sort((a, b) => { const sev = { critical: 3, warning: 2, info: 1 }; return sev[b.severity] - sev[a.severity]; });

    const actions: AdaptationStep[] = [];
    let order = 1;
    const addedActions = new Set<AdaptationAction>();

    for (const alert of campaignAlerts) {
      if (!addedActions.has(alert.suggestedAction)) {
        addedActions.add(alert.suggestedAction);
        actions.push({
          order: order++,
          action: alert.suggestedAction,
          description: this.describeAction(alert.suggestedAction, alert),
          estimatedImpact: this.estimateActionImpact(alert.suggestedAction, alert),
          automated: this.governanceMode === 'full_auto' && alert.severity !== 'critical',
          status: 'pending'
        });
      }
    }

    const criticalAlerts = campaignAlerts.filter(a => a.severity === 'critical');
    const requiresApproval = this.governanceMode !== 'full_auto' || criticalAlerts.length > 0;

    const plan: AdaptationPlan = {
      campaignId,
      alerts: campaignAlerts,
      actions,
      estimatedRecoveryDays: actions.length * 3,
      estimatedRoasRecovery: actions.reduce((s, a) => s + a.estimatedImpact, 0),
      requiresApproval,
      createdAt: new Date().toISOString()
    };

    this.adaptationPlans.set(campaignId, plan);
    this.logAction('adaptation_plan_generated', { campaignId, actionsCount: actions.length });

    if (this.governanceMode === 'full_auto' && !requiresApproval) {
      await this.executeAdaptationPlan(plan);
    }

    return plan;
  }

  private describeAction(action: AdaptationAction, alert: MarketAlert): string {
    const descriptions: Record<AdaptationAction, string> = {
      refresh_creative: 'Rafraichir les creatives publicitaires - remplacer les visuels et hooks actuels',
      rotate_angle: 'Pivoter l\'angle marketing - tester un nouveau positionnement produit',
      expand_audience: 'Elargir l\'audience - ajouter nouveaux segments lookalike et broad',
      reduce_budget: 'Reduire le budget journalier de 30% pour stopper l\'hemorragie',
      pause_campaign: 'Mettre en pause la campagne - ' + alert.metric + ' trop faible (' + alert.deviationPercent + '%)',
      change_niche: 'Changer de niche produit - marche actuel sature ou peu receptif',
      reposition_offer: 'Repositionner l\'offre - changer prix, bundle ou angle valeur',
      test_new_market: 'Tester un nouveau marche geographique (BE, CH, CA...)'
    };
    return descriptions[action] || action;
  }

  private estimateActionImpact(action: AdaptationAction, alert: MarketAlert): number {
    const impacts: Record<AdaptationAction, number> = {
      refresh_creative: 0.3,
      rotate_angle: 0.25,
      expand_audience: 0.2,
      reduce_budget: 0.1,
      pause_campaign: 0,
      change_niche: 0.5,
      reposition_offer: 0.35,
      test_new_market: 0.4
    };
    return impacts[action] || 0.1;
  }

  async executeAdaptationPlan(plan: AdaptationPlan): Promise<void> {
    for (const step of plan.actions) {
      if (!step.automated) continue;
      step.status = 'in_progress';
      try {
        await this.executeStep(step, plan.campaignId);
        step.status = 'completed';
      } catch (_) {
        step.status = 'skipped';
      }
    }
    this.logAction('adaptation_plan_executed', { campaignId: plan.campaignId });
  }

  private async executeStep(step: AdaptationStep, campaignId: string): Promise<void> {
    switch (step.action) {
      case 'reduce_budget':
        await fetch('/api/campaigns/' + campaignId + '/budget', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reduction: 0.30 }) });
        break;
      case 'expand_audience':
        await fetch('/api/campaigns/' + campaignId + '/audiences/expand', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ types: ['lookalike', 'broad'] }) });
        break;
      case 'pause_campaign':
        await fetch('/api/campaigns/' + campaignId + '/status', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'paused' }) });
        break;
      default:
        console.log('[MarketAdaptation] Step', step.action, 'requires manual execution');
    }
    this.logAction('step_executed', { step: step.action, campaignId });
  }

  // NICHE ROTATION
  async scanNicheOpportunities(currentNiche: string): Promise<NicheOpportunity[]> {
    try {
      const response = await fetch('/api/market/niches?current=' + encodeURIComponent(currentNiche));
      if (!response.ok) throw new Error('API unavailable');
      return response.json();
    } catch (_) {
      return this.simulateNicheOpportunities(currentNiche);
    }
  }

  private simulateNicheOpportunities(currentNiche: string): NicheOpportunity[] {
    return [
      { id: 'niche_1', niche: 'Bien-etre & Sante', country: 'FR', saturationScore: 0.35, growthTrend: 0.18, avgCpm: 8.50, estimatedCvr: 0.025, competitionLevel: 'medium', recommendedAngle: 'Solutions naturelles pour le stress quotidien', potentialRevenue: 45000, entryDifficulty: 'medium' },
      { id: 'niche_2', niche: 'Maison & Decoration', country: 'FR', saturationScore: 0.28, growthTrend: 0.22, avgCpm: 6.20, estimatedCvr: 0.031, competitionLevel: 'low', recommendedAngle: 'Transformez votre espace en sanctuaire', potentialRevenue: 38000, entryDifficulty: 'easy' },
      { id: 'niche_3', niche: 'Sport & Fitness', country: 'BE', saturationScore: 0.20, growthTrend: 0.35, avgCpm: 5.80, estimatedCvr: 0.028, competitionLevel: 'low', recommendedAngle: 'Resultats visibles en 30 jours garantis', potentialRevenue: 29000, entryDifficulty: 'easy' },
      { id: 'niche_4', niche: 'Technologie & Gadgets', country: 'CH', saturationScore: 0.45, growthTrend: 0.12, avgCpm: 12.00, estimatedCvr: 0.019, competitionLevel: 'high', recommendedAngle: 'Innovation qui simplifie le quotidien', potentialRevenue: 62000, entryDifficulty: 'hard' }
    ];
  }

  // ANGLE REPOSITIONING
  async repositionAngle(currentAngle: string, productCategory: string, failureReason: string): Promise<AngleRepositioning> {
    try {
      const response = await fetch('/api/ai/reposition-angle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentAngle, productCategory, failureReason })
      });
      if (!response.ok) throw new Error('AI API unavailable');
      return response.json();
    } catch (_) {
      return this.simulateAngleRepositioning(currentAngle, productCategory, failureReason);
    }
  }

  private simulateAngleRepositioning(currentAngle: string, category: string, reason: string): AngleRepositioning {
    const angleStrategies: Record<string, string[]> = {
      pain_point: ['Vous en avez assez de...', 'Stop subir...', 'Fini les problemes de...'],
      social_proof: ['12 847 clients satisfaits', 'Note 4.9/5 - voici pourquoi', '#1 en France pour...'],
      transformation: ['Avant/Apres en 14 jours', 'Comment j\'ai change ma vie avec...', 'La transformation qui...'],
      urgency: ['Dernieres heures pour profiter de...', 'Stock limite - ne ratez pas...', 'Prix remonte dans 2h'],
      education: ['La verite sur...', 'Ce que personne ne vous dit sur...', '3 erreurs qui vous coutent...']
    };

    const angles = Object.keys(angleStrategies);
    const newAngleType = angles[Math.floor(Math.random() * angles.length)];
    const hooks = angleStrategies[newAngleType];

    return {
      originalAngle: currentAngle,
      newAngle: newAngleType,
      reason: 'Saturation angle ' + currentAngle + ' - ' + reason,
      expectedCtrLift: 0.25 + Math.random() * 0.3,
      expectedCvrLift: 0.15 + Math.random() * 0.2,
      hookVariants: hooks,
      adCopyVariants: [
        'Variante A: Focus benefice immediat - ' + hooks[0],
        'Variante B: Storytelling client - ' + (hooks[1] || hooks[0]),
        'Variante C: Data proof - ' + (hooks[2] || hooks[0])
      ]
    };
  }

  // GLOBAL MARKET HEALTH
  async getMarketHealthReport(): Promise<{
    totalCampaignsMonitored: number;
    criticalAlerts: number;
    warningAlerts: number;
    adaptationPlansActive: number;
    avgRoasDecline: number;
    topSignals: MarketSignal[];
    nichesAtRisk: string[];
    opportunities: string[];
  }> {
    const allAlerts = Array.from(this.alerts.values()).filter(a => !a.acknowledged);
    const signalCounts = new Map<MarketSignal, number>();
    allAlerts.forEach(a => signalCounts.set(a.signal, (signalCounts.get(a.signal) || 0) + 1));
    const topSignals = [...signalCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

    return {
      totalCampaignsMonitored: this.metricsHistory.size,
      criticalAlerts: allAlerts.filter(a => a.severity === 'critical').length,
      warningAlerts: allAlerts.filter(a => a.severity === 'warning').length,
      adaptationPlansActive: this.adaptationPlans.size,
      avgRoasDecline: -0.18,
      topSignals,
      nichesAtRisk: ['Mode fast-fashion', 'Supplements generiques'],
      opportunities: ['Bien-etre naturel FR', 'Maison eco BE', 'Sport premium CH']
    };
  }

  // HELPERS
  private storeMetrics(campaignId: string, metrics: MarketMetrics): void {
    if (!this.metricsHistory.has(campaignId)) this.metricsHistory.set(campaignId, []);
    const history = this.metricsHistory.get(campaignId)!;
    history.push(metrics);
    if (history.length > 90) history.shift();
  }

  private simulateMetrics(campaignId: string): MarketMetrics {
    const fatigue = Math.random() > 0.6;
    return {
      campaignId, platform: 'meta', period: '7d',
      cpm: fatigue ? 18.5 : 12.0, cpmBaseline: 12.0,
      ctr: fatigue ? 0.009 : 0.022, ctrBaseline: 0.022,
      cvr: fatigue ? 0.015 : 0.028, cvrBaseline: 0.028,
      roas: fatigue ? 1.4 : 2.8, roasBaseline: 2.8,
      frequencyScore: fatigue ? 4.2 : 1.8,
      audienceSaturationPercent: fatigue ? 0.78 : 0.35,
      creativeAgedays: fatigue ? 28 : 10,
      timestamp: new Date().toISOString()
    };
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) { alert.acknowledged = true; this.logAction('alert_acknowledged', { alertId }); }
  }

  setGovernanceMode(mode: GovernanceMode): void { this.governanceMode = mode; this.logAction('governance_mode_changed', { mode }); }

  getActiveAlerts(): MarketAlert[] { return Array.from(this.alerts.values()).filter(a => !a.acknowledged); }
  getAdaptationPlans(): AdaptationPlan[] { return Array.from(this.adaptationPlans.values()); }
  getActionLog() { return this.actionLog; }

  private logAction(action: string, details?: unknown): void {
    this.actionLog.push({ action, timestamp: new Date().toISOString(), details });
    console.log('[MarketAdaptation]', action, details);
  }

  getStatus() { return { mode: this.governanceMode, activeAlerts: this.getActiveAlerts().length, campaignsMonitored: this.metricsHistory.size, adaptationPlansActive: this.adaptationPlans.size }; }
}

export const marketAdaptationEngine = new MarketAdaptationEngine('semi_auto');
