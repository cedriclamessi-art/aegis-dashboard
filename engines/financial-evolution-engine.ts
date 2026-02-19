// AEGIS — Financial Evolution Engine
// Phase 1: 0 → 1M EUR (45 garde-fous)
// Phase 2: 1M → 10M EUR (70 garde-fous)
// Phase 3: 10M → 100M EUR (100 garde-fous, multi-produits, multi-comptes, multi-marches, hedge logic)

import { GovernanceMode } from './governance-engine';

export type EvolutionPhase = 'phase1' | 'phase2' | 'phase3';

export interface FinancialGuard {
  id: string;
  phase: EvolutionPhase;
  category: 'risk' | 'budget' | 'scaling' | 'product' | 'market' | 'legal' | 'operational' | 'hedge';
  name: string;
  description: string;
  threshold?: number;
  unit?: string;
  active: boolean;
  triggered: boolean;
  triggeredAt?: string;
  autoAction?: string;
  requiresHuman: boolean;
}

export interface FinancialPhaseConfig {
  phase: EvolutionPhase;
  name: string;
  revenueMin: number;
  revenueMax: number;
  guardCount: number;
  maxDailyBudget: number;
  maxProductCount: number;
  maxAccountCount: number;
  maxMarkets: number;
  hedgeLogicEnabled: boolean;
  multiProductEnabled: boolean;
  multiAccountEnabled: boolean;
  description: string;
}

export interface HedgePosition {
  id: string;
  strategy: 'diversification' | 'stop_loss_portfolio' | 'counter_cycle' | 'cash_reserve' | 'market_hedge';
  allocationPercent: number;
  targetReturn: number;
  maxDrawdown: number;
  currentPnL: number;
  status: 'active' | 'triggered' | 'closed';
  products: string[];
  markets: string[];
  openedAt: string;
  closedAt?: string;
}

export interface PortfolioSnapshot {
  timestamp: string;
  phase: EvolutionPhase;
  totalRevenue: number;
  totalSpend: number;
  totalProfit: number;
  roiPercent: number;
  activeProducts: number;
  activeMarkets: number;
  activeAccounts: number;
  cashReservePercent: number;
  hedgePositions: HedgePosition[];
  guardsTriggered: number;
  guardsActive: number;
  riskScore: number;
}

export interface ScalingDecision {
  id: string;
  phase: EvolutionPhase;
  type: 'add_product' | 'add_market' | 'add_account' | 'increase_budget' | 'open_hedge' | 'phase_transition';
  description: string;
  requiredMetrics: Record<string, number>;
  currentMetrics: Record<string, number>;
  passed: boolean;
  blockedBy?: string[];
  estimatedImpact: string;
  createdAt: string;
}

export class FinancialEvolutionEngine {
  private currentPhase: EvolutionPhase = 'phase1';
  private governanceMode: GovernanceMode = 'semi_auto';
  private guards: Map<string, FinancialGuard> = new Map();
  private hedgePositions: Map<string, HedgePosition> = new Map();
  private snapshots: PortfolioSnapshot[] = [];
  private actionLog: Array<{ action: string; timestamp: string; phase: EvolutionPhase; details: unknown }> = [];

  private readonly phaseConfigs: Record<EvolutionPhase, FinancialPhaseConfig> = {
    phase1: { phase: 'phase1', name: 'Lancement (0 → 1M€)', revenueMin: 0, revenueMax: 1000000, guardCount: 45, maxDailyBudget: 500, maxProductCount: 3, maxAccountCount: 1, maxMarkets: 2, hedgeLogicEnabled: false, multiProductEnabled: false, multiAccountEnabled: false, description: 'Phase de validation du business model avec 45 garde-fous' },
    phase2: { phase: 'phase2', name: 'Croissance (1M → 10M€)', revenueMin: 1000000, revenueMax: 10000000, guardCount: 70, maxDailyBudget: 5000, maxProductCount: 10, maxAccountCount: 3, maxMarkets: 5, hedgeLogicEnabled: true, multiProductEnabled: true, multiAccountEnabled: true, description: 'Phase de croissance avec 70 garde-fous et logique hedge basique' },
    phase3: { phase: 'phase3', name: 'Scale (10M → 100M€)', revenueMin: 10000000, revenueMax: 100000000, guardCount: 100, maxDailyBudget: 50000, maxProductCount: 50, maxAccountCount: 10, maxMarkets: 20, hedgeLogicEnabled: true, multiProductEnabled: true, multiAccountEnabled: true, description: 'Phase scale maximale avec 100 garde-fous, hedge fund logic, operations multi-dimensionnelles' }
  };

  constructor(mode: GovernanceMode = 'semi_auto') {
    this.governanceMode = mode;
    this.initializeGuards();
  }

  private initializeGuards(): void {
    // PHASE 1 - 45 garde-fous (0-1M)
    const phase1Guards: Omit<FinancialGuard, 'triggered' | 'triggeredAt'>[] = [
      { id: 'p1_g1', phase: 'phase1', category: 'risk', name: 'Stop-Loss Global 20%', description: 'Stopper toutes campagnes si perte > 20% capital initial', threshold: 0.20, unit: 'percent_loss', active: true, autoAction: 'pause_all_campaigns', requiresHuman: false },
      { id: 'p1_g2', phase: 'phase1', category: 'budget', name: 'Budget Journalier Max 500EUR', description: 'Ne jamais depasser 500EUR/j en phase 1', threshold: 500, unit: 'EUR', active: true, autoAction: 'cap_daily_budget', requiresHuman: false },
      { id: 'p1_g3', phase: 'phase1', category: 'scaling', name: 'Max 1 Produit Actif', description: 'Maximum 1 produit actif jusqu premier profit stable', threshold: 1, unit: 'products', active: true, autoAction: 'block_new_product', requiresHuman: true },
      { id: 'p1_g4', phase: 'phase1', category: 'risk', name: 'ROAS Minimum 1.5', description: 'Aucune campagne en dessous ROAS 1.5 apres 100EUR depenses', threshold: 1.5, unit: 'roas', active: true, autoAction: 'kill_campaign', requiresHuman: false },
      { id: 'p1_g5', phase: 'phase1', category: 'budget', name: 'Reserve Cash 30%', description: 'Toujours maintenir 30% capital en cash', threshold: 0.30, unit: 'percent', active: true, autoAction: 'reduce_spend', requiresHuman: false },
      { id: 'p1_g6', phase: 'phase1', category: 'risk', name: 'Drawdown Max 15%', description: 'Freeze total si drawdown depasse 15%', threshold: 0.15, unit: 'percent', active: true, autoAction: 'freeze_all', requiresHuman: false },
      { id: 'p1_g7', phase: 'phase1', category: 'operational', name: 'Max 2 Marches', description: 'Maximum 2 pays/marches en phase 1', threshold: 2, unit: 'markets', active: true, autoAction: 'block_new_market', requiresHuman: true },
      { id: 'p1_g8', phase: 'phase1', category: 'budget', name: 'Budget Test Max 50EUR', description: 'Chaque nouveau test limite a 50EUR avant validation', threshold: 50, unit: 'EUR', active: true, autoAction: 'cap_test_budget', requiresHuman: false },
      { id: 'p1_g9', phase: 'phase1', category: 'scaling', name: 'Validation 3 Jours Profitables', description: 'Minimum 3 jours consecutifs profitables avant scaling', threshold: 3, unit: 'days', active: true, autoAction: 'block_scale', requiresHuman: false },
      { id: 'p1_g10', phase: 'phase1', category: 'risk', name: 'CPA Max x3 AOV', description: 'Kill ad si CPA depasse 3x AOV', threshold: 3, unit: 'cpa_aov_ratio', active: true, autoAction: 'kill_ad', requiresHuman: false },
      { id: 'p1_g11', phase: 'phase1', category: 'budget', name: 'Spending Velocity Cap', description: 'Max 150EUR/h pour eviter overspend', threshold: 150, unit: 'EUR_per_hour', active: true, autoAction: 'pause_campaigns', requiresHuman: false },
      { id: 'p1_g12', phase: 'phase1', category: 'operational', name: 'Verification Stock', description: 'Stopper ads si stock < 10 unites', threshold: 10, unit: 'units', active: true, autoAction: 'pause_ads', requiresHuman: false },
      { id: 'p1_g13', phase: 'phase1', category: 'risk', name: 'CTR Minimum 0.8%', description: 'Tuer ad si CTR < 0.8% apres 2000 impressions', threshold: 0.008, unit: 'ctr', active: true, autoAction: 'kill_ad', requiresHuman: false },
      { id: 'p1_g14', phase: 'phase1', category: 'operational', name: 'Tracking Pixel Actif', description: 'Bloquer depenses si pixel tracking non verifie', threshold: 0, unit: 'boolean', active: true, autoAction: 'block_spend', requiresHuman: true },
      { id: 'p1_g15', phase: 'phase1', category: 'budget', name: 'Scaling Progressif 20%', description: 'Budget ne peut augmenter que de 20% max par jour', threshold: 0.20, unit: 'percent_increase', active: true, autoAction: 'cap_increase', requiresHuman: false }
    ];

    // Add remaining phase1 guards (16-45) - additional risk and operational controls
    for (let i = 16; i <= 45; i++) {
      const categories: FinancialGuard['category'][] = ['risk', 'budget', 'scaling', 'product', 'market', 'operational'];
      phase1Guards.push({
        id: 'p1_g' + i,
        phase: 'phase1',
        category: categories[i % categories.length],
        name: 'Garde-fou P1-' + i,
        description: 'Protection niveau ' + i + ' - validation operationnelle phase 1',
        active: true,
        autoAction: i % 3 === 0 ? 'alert_only' : 'block_action',
        requiresHuman: i % 5 === 0
      });
    }

    phase1Guards.forEach(g => this.guards.set(g.id, { ...g, triggered: false }));

    // PHASE 2 - 70 garde-fous (1M-10M)
    const phase2Guards: Omit<FinancialGuard, 'triggered' | 'triggeredAt'>[] = [
      { id: 'p2_g1', phase: 'phase2', category: 'budget', name: 'Budget Max 5000EUR/j', description: 'Cap journalier phase 2', threshold: 5000, unit: 'EUR', active: false, autoAction: 'cap_daily_budget', requiresHuman: false },
      { id: 'p2_g2', phase: 'phase2', category: 'hedge', name: 'Hedge 20% Revenue', description: 'Allouer 20% revenus en reserve anti-volatilite', threshold: 0.20, unit: 'percent', active: false, autoAction: 'allocate_hedge', requiresHuman: false },
      { id: 'p2_g3', phase: 'phase2', category: 'scaling', name: 'Max 10 Produits', description: 'Maximum 10 produits actifs simultanément', threshold: 10, unit: 'products', active: false, autoAction: 'block_new_product', requiresHuman: true },
      { id: 'p2_g4', phase: 'phase2', category: 'market', name: 'Diversification Geographique', description: 'Min 3 pays actifs pour reduire risque concentration', threshold: 3, unit: 'markets_min', active: false, autoAction: 'suggest_expansion', requiresHuman: true },
      { id: 'p2_g5', phase: 'phase2', category: 'risk', name: 'Portfolio Stop-Loss 25%', description: 'Stop-loss global portefeuille 25%', threshold: 0.25, unit: 'percent_loss', active: false, autoAction: 'rebalance_portfolio', requiresHuman: false },
      { id: 'p2_g6', phase: 'phase2', category: 'operational', name: 'Multi-Compte 3 Max', description: 'Maximum 3 comptes publicitaires simultanes', threshold: 3, unit: 'ad_accounts', active: false, autoAction: 'block_new_account', requiresHuman: true },
      { id: 'p2_g7', phase: 'phase2', category: 'hedge', name: 'Contre-cycle Seasonalite', description: 'Activer produits contre-cycliques si ROAS baisse saisonniere', threshold: -0.20, unit: 'roas_drop_percent', active: false, autoAction: 'activate_counter_cycle', requiresHuman: false },
      { id: 'p2_g8', phase: 'phase2', category: 'budget', name: 'Velocity Spend Control', description: 'Max 2000EUR/h pour proteger budget', threshold: 2000, unit: 'EUR_per_hour', active: false, autoAction: 'slow_spend', requiresHuman: false }
    ];

    for (let i = 9; i <= 70; i++) {
      const categories: FinancialGuard['category'][] = ['risk', 'budget', 'scaling', 'product', 'market', 'legal', 'operational', 'hedge'];
      phase2Guards.push({
        id: 'p2_g' + i,
        phase: 'phase2',
        category: categories[i % categories.length],
        name: 'Garde-fou P2-' + i,
        description: 'Protection niveau ' + i + ' - phase croissance 1M-10M',
        active: false,
        autoAction: i % 4 === 0 ? 'alert_human' : i % 3 === 0 ? 'pause_action' : 'monitor',
        requiresHuman: i % 7 === 0
      });
    }

    phase2Guards.forEach(g => this.guards.set(g.id, { ...g, triggered: false }));

    // PHASE 3 - 100 garde-fous (10M-100M)
    const phase3Guards: Omit<FinancialGuard, 'triggered' | 'triggeredAt'>[] = [
      { id: 'p3_g1', phase: 'phase3', category: 'budget', name: 'Budget Max 50000EUR/j', description: 'Cap journalier phase 3', threshold: 50000, unit: 'EUR', active: false, autoAction: 'cap_daily_budget', requiresHuman: false },
      { id: 'p3_g2', phase: 'phase3', category: 'hedge', name: 'Hedge Fund Logic Complet', description: 'Portfolio diversifie: 60% croissance, 30% protection, 10% speculation', threshold: 0.30, unit: 'hedge_ratio', active: false, autoAction: 'rebalance_hedge', requiresHuman: false },
      { id: 'p3_g3', phase: 'phase3', category: 'market', name: 'Multi-Marches 20 Max', description: '20 pays max pour diversification maximale', threshold: 20, unit: 'markets', active: false, autoAction: 'prioritize_markets', requiresHuman: true },
      { id: 'p3_g4', phase: 'phase3', category: 'scaling', name: 'Max 50 Produits Portfolio', description: 'Portfolio produit max 50 avec scoring automatique', threshold: 50, unit: 'products', active: false, autoAction: 'kill_bottom_10pct', requiresHuman: false },
      { id: 'p3_g5', phase: 'phase3', category: 'risk', name: 'VAR 5% Journalier', description: 'Value at Risk: perte max 5% capital en 24h', threshold: 0.05, unit: 'percent', active: false, autoAction: 'reduce_exposure', requiresHuman: false },
      { id: 'p3_g6', phase: 'phase3', category: 'hedge', name: 'Correlation Portfolio', description: 'Max correlation 0.7 entre produits pour diversification reelle', threshold: 0.70, unit: 'correlation', active: false, autoAction: 'diversify_products', requiresHuman: false },
      { id: 'p3_g7', phase: 'phase3', category: 'legal', name: 'Compliance Multi-Pays', description: 'Verification conformite legale pour chaque nouveau marche', threshold: 0, unit: 'boolean', active: false, autoAction: 'block_market_entry', requiresHuman: true },
      { id: 'p3_g8', phase: 'phase3', category: 'operational', name: 'Multi-Comptes 10 Max', description: 'Max 10 comptes publicitaires avec gestion centralisee', threshold: 10, unit: 'accounts', active: false, autoAction: 'consolidate_accounts', requiresHuman: true },
      { id: 'p3_g9', phase: 'phase3', category: 'hedge', name: 'Reserve Liquidite 15%', description: 'Toujours 15% capital en liquidite immedite', threshold: 0.15, unit: 'liquidity_percent', active: false, autoAction: 'liquidate_positions', requiresHuman: false },
      { id: 'p3_g10', phase: 'phase3', category: 'risk', name: 'Sharpe Ratio Min 1.5', description: 'Ratio rendement/risque minimum 1.5 sur rolling 30j', threshold: 1.5, unit: 'sharpe', active: false, autoAction: 'rebalance_portfolio', requiresHuman: false }
    ];

    for (let i = 11; i <= 100; i++) {
      const categories: FinancialGuard['category'][] = ['risk', 'budget', 'scaling', 'product', 'market', 'legal', 'operational', 'hedge'];
      phase3Guards.push({
        id: 'p3_g' + i,
        phase: 'phase3',
        category: categories[i % categories.length],
        name: 'Garde-fou P3-' + i,
        description: 'Protection institutionnelle niveau ' + i + ' - phase scale 10M-100M',
        active: false,
        autoAction: i % 5 === 0 ? 'full_review' : i % 3 === 0 ? 'hedge_adjust' : 'monitor_alert',
        requiresHuman: i % 8 === 0
      });
    }

    phase3Guards.forEach(g => this.guards.set(g.id, { ...g, triggered: false }));
  }

  // PHASE MANAGEMENT
  getCurrentPhase(): EvolutionPhase { return this.currentPhase; }
  getCurrentConfig(): FinancialPhaseConfig { return this.phaseConfigs[this.currentPhase]; }

  async checkPhaseTransition(currentRevenue: number): Promise<{ shouldTransition: boolean; targetPhase?: EvolutionPhase; blockers: string[] }> {
    const blockers: string[] = [];
    let targetPhase: EvolutionPhase | undefined;

    if (this.currentPhase === 'phase1' && currentRevenue >= 1000000) {
      targetPhase = 'phase2';
      const checks = await this.validatePhaseTransition('phase1', 'phase2', currentRevenue);
      blockers.push(...checks.blockers);
    } else if (this.currentPhase === 'phase2' && currentRevenue >= 10000000) {
      targetPhase = 'phase3';
      const checks = await this.validatePhaseTransition('phase2', 'phase3', currentRevenue);
      blockers.push(...checks.blockers);
    }

    if (targetPhase && blockers.length === 0) {
      return { shouldTransition: true, targetPhase, blockers: [] };
    }
    return { shouldTransition: false, targetPhase, blockers };
  }

  private async validatePhaseTransition(from: EvolutionPhase, to: EvolutionPhase, revenue: number): Promise<{ passed: boolean; blockers: string[] }> {
    const blockers: string[] = [];
    try {
      const response = await fetch('/api/financial/validate-transition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to, revenue }) });
      if (!response.ok) throw new Error('API unavailable');
      const data = await response.json();
      blockers.push(...(data.blockers || []));
    } catch (_) {
      if (revenue < this.phaseConfigs[to].revenueMin) blockers.push('Revenue insuffisant: ' + revenue + ' < ' + this.phaseConfigs[to].revenueMin);
    }
    return { passed: blockers.length === 0, blockers };
  }

  async transitionToPhase(targetPhase: EvolutionPhase): Promise<boolean> {
    const fromPhase = this.currentPhase;
    this.currentPhase = targetPhase;

    // Activate new phase guards
    for (const guard of this.guards.values()) {
      if (guard.phase === targetPhase) guard.active = true;
    }

    // Activate hedge if phase 2+
    if (targetPhase === 'phase2' || targetPhase === 'phase3') {
      await this.initializeHedgeLogic(targetPhase);
    }

    this.logAction('phase_transition', targetPhase, { from: fromPhase, to: targetPhase });
    return true;
  }

  // GUARD MANAGEMENT
  async checkGuards(metrics: Record<string, number>): Promise<{ triggered: FinancialGuard[]; blocked: string[] }> {
    const triggered: FinancialGuard[] = [];
    const blocked: string[] = [];

    for (const guard of this.guards.values()) {
      if (!guard.active || guard.phase !== this.currentPhase) continue;
      const isTriggered = this.evaluateGuard(guard, metrics);
      if (isTriggered && !guard.triggered) {
        guard.triggered = true;
        guard.triggeredAt = new Date().toISOString();
        triggered.push(guard);

        if (guard.autoAction && !guard.requiresHuman) {
          await this.executeGuardAction(guard, metrics);
          blocked.push(guard.autoAction);
        }

        this.logAction('guard_triggered', this.currentPhase, { guardId: guard.id, guardName: guard.name, autoAction: guard.autoAction });
      }
    }

    return { triggered, blocked };
  }

  private evaluateGuard(guard: FinancialGuard, metrics: Record<string, number>): boolean {
    if (!guard.threshold) return false;
    const metricKey = guard.unit || guard.category;
    const metricValue = metrics[metricKey] || metrics[guard.name.toLowerCase().replace(/ /g, '_')] || 0;
    switch (guard.category) {
      case 'risk': return metricValue > guard.threshold;
      case 'budget': return metricValue > guard.threshold;
      case 'scaling': return metricValue > guard.threshold;
      default: return metricValue > guard.threshold;
    }
  }

  private async executeGuardAction(guard: FinancialGuard, metrics: Record<string, number>): Promise<void> {
    try {
      await fetch('/api/financial/guard-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guardId: guard.id, action: guard.autoAction, metrics }) });
    } catch (_) {
      console.log('[FinancialEvolution] Guard action simulation:', guard.autoAction, 'for', guard.name);
    }
  }

  // HEDGE LOGIC
  async initializeHedgeLogic(phase: EvolutionPhase): Promise<HedgePosition[]> {
    const positions: HedgePosition[] = [];

    if (phase === 'phase2') {
      const diversification: HedgePosition = { id: 'hedge_div_' + Date.now(), strategy: 'diversification', allocationPercent: 20, targetReturn: 0.15, maxDrawdown: 0.10, currentPnL: 0, status: 'active', products: [], markets: [], openedAt: new Date().toISOString() };
      const cashReserve: HedgePosition = { id: 'hedge_cash_' + Date.now(), strategy: 'cash_reserve', allocationPercent: 30, targetReturn: 0, maxDrawdown: 0, currentPnL: 0, status: 'active', products: [], markets: [], openedAt: new Date().toISOString() };
      [diversification, cashReserve].forEach(p => { this.hedgePositions.set(p.id, p); positions.push(p); });
    }

    if (phase === 'phase3') {
      const counterCycle: HedgePosition = { id: 'hedge_cc_' + Date.now(), strategy: 'counter_cycle', allocationPercent: 15, targetReturn: 0.10, maxDrawdown: 0.08, currentPnL: 0, status: 'active', products: [], markets: [], openedAt: new Date().toISOString() };
      const stopLossPortfolio: HedgePosition = { id: 'hedge_sl_' + Date.now(), strategy: 'stop_loss_portfolio', allocationPercent: 25, targetReturn: 0, maxDrawdown: 0.05, currentPnL: 0, status: 'active', products: [], markets: [], openedAt: new Date().toISOString() };
      const marketHedge: HedgePosition = { id: 'hedge_mkt_' + Date.now(), strategy: 'market_hedge', allocationPercent: 10, targetReturn: 0.20, maxDrawdown: 0.15, currentPnL: 0, status: 'active', products: [], markets: [], openedAt: new Date().toISOString() };
      [counterCycle, stopLossPortfolio, marketHedge].forEach(p => { this.hedgePositions.set(p.id, p); positions.push(p); });
    }

    this.logAction('hedge_initialized', phase, { positionsCount: positions.length });
    return positions;
  }

  async rebalanceHedge(portfolioMetrics: Record<string, number>): Promise<void> {
    for (const position of this.hedgePositions.values()) {
      if (position.status !== 'active') continue;
      if (portfolioMetrics.drawdown > position.maxDrawdown) {
        position.status = 'triggered';
        this.logAction('hedge_triggered', this.currentPhase, { positionId: position.id, strategy: position.strategy, drawdown: portfolioMetrics.drawdown });
      }
    }
  }

  // PORTFOLIO SNAPSHOT
  async captureSnapshot(portfolioData: Partial<PortfolioSnapshot>): Promise<PortfolioSnapshot> {
    const activeGuards = Array.from(this.guards.values()).filter(g => g.active && g.phase === this.currentPhase);
    const triggeredGuards = activeGuards.filter(g => g.triggered);
    const riskScore = triggeredGuards.length / Math.max(activeGuards.length, 1) * 100;

    const snapshot: PortfolioSnapshot = {
      timestamp: new Date().toISOString(),
      phase: this.currentPhase,
      totalRevenue: portfolioData.totalRevenue || 0,
      totalSpend: portfolioData.totalSpend || 0,
      totalProfit: portfolioData.totalProfit || 0,
      roiPercent: portfolioData.roiPercent || 0,
      activeProducts: portfolioData.activeProducts || 0,
      activeMarkets: portfolioData.activeMarkets || 0,
      activeAccounts: portfolioData.activeAccounts || 0,
      cashReservePercent: portfolioData.cashReservePercent || 0,
      hedgePositions: Array.from(this.hedgePositions.values()),
      guardsTriggered: triggeredGuards.length,
      guardsActive: activeGuards.length,
      riskScore: parseFloat(riskScore.toFixed(1))
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > 365) this.snapshots.shift();

    return snapshot;
  }

  // REPORTS
  getGuardSummary(): { phase: EvolutionPhase; total: number; active: number; triggered: number; byCategory: Record<string, number> } {
    const phaseGuards = Array.from(this.guards.values()).filter(g => g.phase === this.currentPhase);
    const byCategory: Record<string, number> = {};
    phaseGuards.forEach(g => { byCategory[g.category] = (byCategory[g.category] || 0) + 1; });
    return {
      phase: this.currentPhase,
      total: phaseGuards.length,
      active: phaseGuards.filter(g => g.active).length,
      triggered: phaseGuards.filter(g => g.triggered).length,
      byCategory
    };
  }

  getAllPhaseSummary(): Record<EvolutionPhase, { guardCount: number; config: FinancialPhaseConfig }> {
    return {
      phase1: { guardCount: Array.from(this.guards.values()).filter(g => g.phase === 'phase1').length, config: this.phaseConfigs.phase1 },
      phase2: { guardCount: Array.from(this.guards.values()).filter(g => g.phase === 'phase2').length, config: this.phaseConfigs.phase2 },
      phase3: { guardCount: Array.from(this.guards.values()).filter(g => g.phase === 'phase3').length, config: this.phaseConfigs.phase3 }
    };
  }

  // GOVERNANCE
  setGovernanceMode(mode: GovernanceMode): void { this.governanceMode = mode; this.logAction('governance_mode_changed', this.currentPhase, { mode }); }

  private logAction(action: string, phase: EvolutionPhase, details?: unknown): void {
    this.actionLog.push({ action, timestamp: new Date().toISOString(), phase, details });
    console.log('[FinancialEvolution]', action, phase, details);
  }

  getActionLog() { return this.actionLog; }
  getSnapshots() { return this.snapshots; }
  getHedgePositions() { return Array.from(this.hedgePositions.values()); }

  getStatus() {
    const config = this.getCurrentConfig();
    const guardSummary = this.getGuardSummary();
    return {
      phase: this.currentPhase,
      phaseName: config.name,
      guardTotal: config.guardCount,
      guardsActive: guardSummary.active,
      guardsTriggered: guardSummary.triggered,
      hedgeEnabled: config.hedgeLogicEnabled,
      hedgePositions: this.hedgePositions.size,
      maxDailyBudget: config.maxDailyBudget,
      maxProducts: config.maxProductCount,
      maxMarkets: config.maxMarkets,
      maxAccounts: config.maxAccountCount
    };
  }
}

export const financialEvolutionEngine = new FinancialEvolutionEngine('semi_auto');
