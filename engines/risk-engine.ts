// ============================================================
// RISK ENGINE — Logique Hedge Fund
// Stop-loss global/campagne/produit, kill switch, budget cap,
// drawdown max, emergency freeze, risk ratio
// ============================================================

export interface RiskConfig {
  // Limites globales
  max_daily_loss_eur: number;
  max_daily_spend_eur: number;
  min_roas: number;
  max_drawdown_percent: number;
  // Par campagne
  max_campaign_loss_eur: number;
  max_cpa_multiplier: number;   // ex: 2.0 = tuer si CPA dépasse 2x la cible
  // Par produit
  max_product_loss_eur: number;
  // Mode
  governance_mode: 'human' | 'semi_auto' | 'full_auto';
  validation_threshold_eur: number;  // validation humaine obligatoire au-dessus de ce montant
}

export interface CampaignMetrics {
  campaign_id: string;
  platform: string;
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  cpa_target: number;
  impressions: number;
  clicks: number;
  conversions: number;
  status: 'active' | 'paused' | 'killed';
}

export interface RiskAlert {
  level: 'info' | 'warning' | 'critical' | 'emergency';
  type: string;
  message: string;
  action_taken: string;
  campaign_id?: string;
  timestamp: string;
  requires_human_approval: boolean;
}

export interface RiskDecision {
  action: 'allow' | 'pause' | 'kill' | 'freeze_all' | 'request_approval';
  reason: string;
  campaign_id?: string;
  alert: RiskAlert;
  auto_executed: boolean;
}

export class RiskEngine {
  private config: RiskConfig;
  private dailySpend = 0;
  private dailyLoss = 0;
  private peakPortfolioValue = 0;
  private currentPortfolioValue = 0;
  private killSwitchActive = false;
  private frozenUntil: Date | null = null;
  private alerts: RiskAlert[] = [];
  private onAlert?: (alert: RiskAlert) => void;
  private onKillSwitch?: (reason: string) => void;

  // Phase configs (Financial Evolution Engine)
  static PHASE_CONFIGS = {
    phase1: { name: 'Phase 1 — 0 → 1M€', max_daily_loss: 150, max_daily_spend: 500, min_roas: 1.10, guard_count: 45 },
    phase2: { name: 'Phase 2 — 1M → 10M€', max_daily_loss: 500, max_daily_spend: 2000, min_roas: 1.20, guard_count: 70 },
    phase3: { name: 'Phase 3 — 10M → 100M€', max_daily_loss: 1500, max_daily_spend: 8000, min_roas: 1.30, guard_count: 100 },
  };

  constructor(config: RiskConfig, onAlert?: (alert: RiskAlert) => void, onKillSwitch?: (reason: string) => void) {
    this.config = config;
    this.onAlert = onAlert;
    this.onKillSwitch = onKillSwitch;
  }

  // ─── ÉVALUATION PRINCIPALE ───────────────────────────────────

  evaluateCampaign(metrics: CampaignMetrics): RiskDecision {
    // 1. Kill switch actif → tout bloquer
    if (this.killSwitchActive) {
      return this.makeDecision('freeze_all', 'Kill switch global actif', metrics.campaign_id, 'emergency', false);
    }

    // 2. Emergency freeze actif
    if (this.frozenUntil && new Date() < this.frozenUntil) {
      return this.makeDecision('freeze_all', 'Emergency freeze jusqu au ' + this.frozenUntil.toISOString(), metrics.campaign_id, 'emergency', false);
    }

    // 3. Stop-loss global journalier
    if (this.dailyLoss >= this.config.max_daily_loss_eur) {
      this.activateKillSwitch('Stop-loss global atteint : ' + this.dailyLoss + 'EUR perte journalière');
      return this.makeDecision('freeze_all', 'Stop-loss global déclenché', metrics.campaign_id, 'emergency', true);
    }

    // 4. Budget cap journalier
    if (this.dailySpend >= this.config.max_daily_spend_eur) {
      return this.makeDecision('pause', 'Budget journalier maximum atteint : ' + this.dailySpend + 'EUR', metrics.campaign_id, 'critical', true);
    }

    // 5. ROAS minimum non atteint (après phase de chauffe)
    if (metrics.conversions > 10 && metrics.roas < this.config.min_roas) {
      return this.makeDecision('kill', 'ROAS ' + metrics.roas.toFixed(2) + 'x inférieur au minimum ' + this.config.min_roas + 'x', metrics.campaign_id, 'critical', this.config.governance_mode === 'full_auto');
    }

    // 6. CPA trop élevé
    if (metrics.cpa > metrics.cpa_target * this.config.max_cpa_multiplier) {
      return this.makeDecision('pause', 'CPA ' + metrics.cpa.toFixed(2) + 'EUR dépasse ' + this.config.max_cpa_multiplier + 'x la cible', metrics.campaign_id, 'warning', this.config.governance_mode === 'full_auto');
    }

    // 7. Drawdown maximum
    const drawdown = this.peakPortfolioValue > 0 ? ((this.peakPortfolioValue - this.currentPortfolioValue) / this.peakPortfolioValue) * 100 : 0;
    if (drawdown >= this.config.max_drawdown_percent) {
      this.emergencyFreeze(60); // freeze 60 minutes
      return this.makeDecision('freeze_all', 'Drawdown maximum atteint : ' + drawdown.toFixed(1) + '%', metrics.campaign_id, 'emergency', true);
    }

    // ✅ Tout OK
    return {
      action: 'allow',
      reason: 'Métriques dans les limites acceptables',
      campaign_id: metrics.campaign_id,
      alert: { level: 'info', type: 'ok', message: 'Campaign running normally', action_taken: 'none', campaign_id: metrics.campaign_id, timestamp: new Date().toISOString(), requires_human_approval: false },
      auto_executed: true,
    };
  }

  // ─── STOP-LOSS ───────────────────────────────────────────────

  recordSpend(amount: number): void {
    this.dailySpend += amount;
  }

  recordLoss(amount: number): void {
    this.dailyLoss += amount;
    this.currentPortfolioValue -= amount;
  }

  recordProfit(amount: number): void {
    this.currentPortfolioValue += amount;
    if (this.currentPortfolioValue > this.peakPortfolioValue) {
      this.peakPortfolioValue = this.currentPortfolioValue;
    }
  }

  // ─── KILL SWITCH ─────────────────────────────────────────────

  activateKillSwitch(reason: string): void {
    this.killSwitchActive = true;
    const alert: RiskAlert = {
      level: 'emergency',
      type: 'kill_switch',
      message: 'KILL SWITCH ACTIVÉ — Toutes les campagnes stoppées',
      action_taken: reason,
      timestamp: new Date().toISOString(),
      requires_human_approval: true,
    };
    this.alerts.push(alert);
    this.onKillSwitch?.(reason);
    this.onAlert?.(alert);
  }

  deactivateKillSwitch(): void {
    this.killSwitchActive = false;
    this.dailySpend = 0;
    this.dailyLoss = 0;
  }

  emergencyFreeze(durationMinutes: number): void {
    this.frozenUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    const alert: RiskAlert = {
      level: 'emergency',
      type: 'emergency_freeze',
      message: 'Emergency freeze activé pour ' + durationMinutes + ' minutes',
      action_taken: 'Toutes décisions suspendues',
      timestamp: new Date().toISOString(),
      requires_human_approval: false,
    };
    this.alerts.push(alert);
    this.onAlert?.(alert);
  }

  // ─── CALCUL RISK RATIO ───────────────────────────────────────

  calculateRiskRatio(potentialProfit: number, potentialLoss: number): {
    ratio: number;
    recommendation: 'go' | 'caution' | 'abort';
    explanation: string;
  } {
    const ratio = potentialLoss > 0 ? potentialProfit / potentialLoss : 0;
    return {
      ratio: Math.round(ratio * 100) / 100,
      recommendation: ratio >= 2 ? 'go' : ratio >= 1 ? 'caution' : 'abort',
      explanation: ratio >= 2
        ? 'Risk/Reward favorable — potentiel gain ' + ratio + 'x supérieur au risque'
        : ratio >= 1
        ? 'Risk/Reward limite — à surveiller de près'
        : 'Risk/Reward défavorable — perte potentielle supérieure au gain',
    };
  }

  // ─── STATUS ──────────────────────────────────────────────────

  getStatus() {
    return {
      kill_switch_active: this.killSwitchActive,
      frozen: this.frozenUntil ? new Date() < this.frozenUntil : false,
      frozen_until: this.frozenUntil?.toISOString() || null,
      daily_spend: this.dailySpend,
      daily_loss: this.dailyLoss,
      spend_utilization_percent: (this.dailySpend / this.config.max_daily_spend_eur) * 100,
      loss_utilization_percent: (this.dailyLoss / this.config.max_daily_loss_eur) * 100,
      current_portfolio_value: this.currentPortfolioValue,
      peak_portfolio_value: this.peakPortfolioValue,
      drawdown_percent: this.peakPortfolioValue > 0 ? ((this.peakPortfolioValue - this.currentPortfolioValue) / this.peakPortfolioValue) * 100 : 0,
      recent_alerts: this.alerts.slice(-10),
      config: this.config,
    };
  }

  resetDailyCounters(): void {
    this.dailySpend = 0;
    this.dailyLoss = 0;
  }

  private makeDecision(action: RiskDecision['action'], reason: string, campaignId: string | undefined, level: RiskAlert['level'], autoExecuted: boolean): RiskDecision {
    const alert: RiskAlert = {
      level,
      type: action,
      message: reason,
      action_taken: action === 'kill' ? 'Campagne tuée' : action === 'pause' ? 'Campagne mise en pause' : action === 'freeze_all' ? 'Toutes campagnes gelées' : 'En attente approbation',
      campaign_id: campaignId,
      timestamp: new Date().toISOString(),
      requires_human_approval: !autoExecuted,
    };
    this.alerts.push(alert);
    this.onAlert?.(alert);
    return { action, reason, campaign_id: campaignId, alert, auto_executed: autoExecuted };
  }
}

export default RiskEngine;
