// AEGIS — Governance Engine
// 3 modes: humain / semi-auto / full auto
// Journal complet des actions, validation obligatoire au-dela d'un seuil,
// blocage si anomalie, audit trail complet, historique des decisions

export type GovernanceMode = 'human' | 'semi_auto' | 'full_auto';

export type ActionCategory =
  | 'campaign_create' | 'campaign_pause' | 'campaign_kill'
  | 'budget_change' | 'budget_increase' | 'budget_decrease'
  | 'ad_create' | 'ad_kill' | 'ad_scale'
  | 'product_price_change' | 'product_create' | 'product_update'
  | 'bundle_create' | 'upsell_create'
  | 'risk_stop_loss' | 'risk_kill_switch' | 'risk_freeze'
  | 'data_delete' | 'data_export' | 'backup'
  | 'system_config' | 'mode_change';

export type ActionStatus = 'pending_approval' | 'approved' | 'rejected' | 'executed' | 'failed' | 'auto_executed' | 'blocked';

export interface GovernanceAction {
  id: string;
  category: ActionCategory;
  engine: string;
  description: string;
  estimatedImpact: string;
  financialImpact?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: ActionStatus;
  requestedAt: string;
  approvedAt?: string;
  executedAt?: string;
  rejectedAt?: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  payload: unknown;
  rollbackable: boolean;
  rollbackPayload?: unknown;
}

export interface ValidationRule {
  id: string;
  category: ActionCategory;
  mode: GovernanceMode;
  requiresApproval: boolean;
  thresholdAmount?: number;
  thresholdCurrency?: string;
  maxAutoExecutePerHour?: number;
  blockedInAnomalyMode: boolean;
  description: string;
}

export interface AuditEntry {
  id: string;
  actionId: string;
  event: 'requested' | 'approved' | 'rejected' | 'executed' | 'failed' | 'rolled_back' | 'blocked';
  actor: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
  sessionId?: string;
}

export interface GovernanceDecision {
  id: string;
  actionId: string;
  decision: 'approve' | 'reject' | 'defer' | 'modify';
  reason: string;
  conditions?: string;
  decidedBy: string;
  decidedAt: string;
  modifiedPayload?: unknown;
}

export interface AnomalyBlock {
  id: string;
  type: string;
  description: string;
  affectedEngines: string[];
  blockedAt: string;
  resolvedAt?: string;
  severity: 'warning' | 'critical';
}

export interface GovernanceConfig {
  mode: GovernanceMode;
  approvalThresholdEur: number;
  maxDailyAutoSpend: number;
  requireDoubleApprovalAboveEur: number;
  autoExecuteCategories: ActionCategory[];
  alwaysRequireApproval: ActionCategory[];
  anomalyBlockActive: boolean;
  notificationEmail?: string;
  slackWebhook?: string;
}

export interface GovernanceReport {
  period: string;
  totalActions: number;
  autoExecuted: number;
  approvedByHuman: number;
  rejected: number;
  blocked: number;
  failed: number;
  pendingApproval: number;
  avgApprovalTimeMinutes: number;
  topCategories: Array<{ category: ActionCategory; count: number }>;
  financialImpactTotal: number;
  anomalyBlocks: number;
}

export class GovernanceEngine {
  private config: GovernanceConfig;
  private actions: Map<string, GovernanceAction> = new Map();
  private auditTrail: AuditEntry[] = [];
  private decisions: GovernanceDecision[] = [];
  private anomalyBlocks: Map<string, AnomalyBlock> = new Map();
  private actionCountPerHour: Map<ActionCategory, number> = new Map();

  private readonly validationRules: ValidationRule[] = [
    // HUMAN MODE - tout necessite approbation
    { id: 'h_budget', category: 'budget_change', mode: 'human', requiresApproval: true, blockedInAnomalyMode: true, description: 'Tout changement budget necessite approbation' },
    { id: 'h_camp_create', category: 'campaign_create', mode: 'human', requiresApproval: true, blockedInAnomalyMode: true, description: 'Creation campagne necessite approbation' },
    { id: 'h_camp_kill', category: 'campaign_kill', mode: 'human', requiresApproval: true, blockedInAnomalyMode: false, description: 'Suppression campagne necessite approbation' },
    { id: 'h_price', category: 'product_price_change', mode: 'human', requiresApproval: true, blockedInAnomalyMode: false, description: 'Changement prix necessite approbation' },
    { id: 'h_risk', category: 'risk_stop_loss', mode: 'human', requiresApproval: false, blockedInAnomalyMode: false, description: 'Stop-loss execute sans approbation meme en mode humain' },
    { id: 'h_freeze', category: 'risk_freeze', mode: 'human', requiresApproval: false, blockedInAnomalyMode: false, description: 'Emergency freeze execute sans approbation' },
    // SEMI_AUTO MODE - seuil financier
    { id: 'sa_budget_high', category: 'budget_increase', mode: 'semi_auto', requiresApproval: true, thresholdAmount: 100, thresholdCurrency: 'EUR', blockedInAnomalyMode: true, description: 'Augmentation budget >100EUR necessite approbation' },
    { id: 'sa_camp_create', category: 'campaign_create', mode: 'semi_auto', requiresApproval: true, thresholdAmount: 200, thresholdCurrency: 'EUR', blockedInAnomalyMode: true, description: 'Campagne avec budget >200EUR/j necessite approbation' },
    { id: 'sa_price', category: 'product_price_change', mode: 'semi_auto', requiresApproval: false, blockedInAnomalyMode: false, description: 'Changement prix auto en semi-auto' },
    { id: 'sa_ad_kill', category: 'ad_kill', mode: 'semi_auto', requiresApproval: false, maxAutoExecutePerHour: 10, blockedInAnomalyMode: false, description: 'Kill ads auto jusqu 10/heure' },
    // FULL_AUTO MODE - execution automatique sauf anomalie
    { id: 'fa_all', category: 'budget_change', mode: 'full_auto', requiresApproval: false, blockedInAnomalyMode: true, description: 'Tout auto sauf en cas d anomalie' },
    { id: 'fa_risk_kill', category: 'risk_kill_switch', mode: 'full_auto', requiresApproval: false, blockedInAnomalyMode: false, description: 'Kill switch toujours auto' }
  ];

  constructor(config?: Partial<GovernanceConfig>) {
    this.config = {
      mode: 'semi_auto',
      approvalThresholdEur: 100,
      maxDailyAutoSpend: 500,
      requireDoubleApprovalAboveEur: 1000,
      autoExecuteCategories: ['ad_kill', 'risk_stop_loss', 'risk_freeze', 'backup', 'data_delete'],
      alwaysRequireApproval: ['system_config', 'mode_change', 'data_export'],
      anomalyBlockActive: false,
      ...config
    };
  }

  // REQUEST ACTION APPROVAL
  async requestAction(params: {
    category: ActionCategory;
    engine: string;
    description: string;
    payload: unknown;
    estimatedImpact: string;
    financialImpact?: number;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    rollbackable?: boolean;
    rollbackPayload?: unknown;
  }): Promise<{ actionId: string; status: ActionStatus; requiresApproval: boolean; reason: string }> {
    const action: GovernanceAction = {
      id: 'action_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      category: params.category,
      engine: params.engine,
      description: params.description,
      estimatedImpact: params.estimatedImpact,
      financialImpact: params.financialImpact,
      riskLevel: params.riskLevel || 'low',
      status: 'pending_approval',
      requestedAt: new Date().toISOString(),
      payload: params.payload,
      rollbackable: params.rollbackable || false,
      rollbackPayload: params.rollbackPayload
    };

    this.actions.set(action.id, action);
    this.addAuditEntry(action.id, 'requested', params.engine, 'Action requested: ' + params.description);

    // Check anomaly block
    if (this.config.anomalyBlockActive && !this.isExemptFromAnomalyBlock(params.category)) {
      action.status = 'blocked';
      this.addAuditEntry(action.id, 'blocked', 'governance', 'Anomaly block active - action blocked');
      return { actionId: action.id, status: 'blocked', requiresApproval: false, reason: 'ANOMALY BLOCK: Systeme en mode protection. Debloquer manuellement avant toute action.' };
    }

    // Evaluate if approval needed
    const evaluation = this.evaluateApprovalNeeded(action);

    if (!evaluation.requiresApproval) {
      action.status = 'auto_executed';
      action.executedAt = new Date().toISOString();
      this.addAuditEntry(action.id, 'executed', 'system_auto', 'Auto-executed: ' + evaluation.reason);
      return { actionId: action.id, status: 'auto_executed', requiresApproval: false, reason: evaluation.reason };
    }

    // Notify if configured
    await this.sendApprovalNotification(action);

    return { actionId: action.id, status: 'pending_approval', requiresApproval: true, reason: evaluation.reason };
  }

  private evaluateApprovalNeeded(action: GovernanceAction): { requiresApproval: boolean; reason: string } {
    // Always require for some categories
    if (this.config.alwaysRequireApproval.includes(action.category)) {
      return { requiresApproval: true, reason: 'Category ' + action.category + ' requires human approval' };
    }

    // Risk actions are always auto-executed
    if (action.category === 'risk_stop_loss' || action.category === 'risk_freeze' || action.category === 'risk_kill_switch') {
      return { requiresApproval: false, reason: 'Risk action - executed immediately regardless of mode' };
    }

    // Human mode: everything requires approval
    if (this.config.mode === 'human') {
      return { requiresApproval: true, reason: 'Mode humain - toute action necessite approbation' };
    }

    // Financial threshold check
    if (action.financialImpact && action.financialImpact > this.config.approvalThresholdEur) {
      return { requiresApproval: true, reason: 'Impact financier ' + action.financialImpact + '€ > seuil ' + this.config.approvalThresholdEur + '€' };
    }

    // Double approval for very high financial impact
    if (action.financialImpact && action.financialImpact > this.config.requireDoubleApprovalAboveEur) {
      return { requiresApproval: true, reason: 'Impact financier ' + action.financialImpact + '€ > seuil double approbation ' + this.config.requireDoubleApprovalAboveEur + '€' };
    }

    // Full auto: auto-execute
    if (this.config.mode === 'full_auto') {
      const hourlyCount = this.actionCountPerHour.get(action.category) || 0;
      const rule = this.validationRules.find(r => r.category === action.category && r.mode === 'full_auto');
      if (rule?.maxAutoExecutePerHour && hourlyCount >= rule.maxAutoExecutePerHour) {
        return { requiresApproval: true, reason: 'Limite horaire atteinte: ' + hourlyCount + '/' + rule.maxAutoExecutePerHour };
      }
      this.actionCountPerHour.set(action.category, hourlyCount + 1);
      return { requiresApproval: false, reason: 'Mode full_auto - execution automatique' };
    }

    // Semi-auto: check auto-execute list
    if (this.config.autoExecuteCategories.includes(action.category)) {
      return { requiresApproval: false, reason: 'Categorie ' + action.category + ' en liste auto-execution' };
    }

    return { requiresApproval: true, reason: 'Mode semi-auto - approbation requise' };
  }

  private isExemptFromAnomalyBlock(category: ActionCategory): boolean {
    return category === 'risk_stop_loss' || category === 'risk_kill_switch' || category === 'risk_freeze';
  }

  // APPROVE / REJECT
  approveAction(actionId: string, approvedBy: string = 'human_operator', conditions?: string): boolean {
    const action = this.actions.get(actionId);
    if (!action || action.status !== 'pending_approval') return false;

    action.status = 'approved';
    action.approvedAt = new Date().toISOString();
    action.approvedBy = approvedBy;

    const decision: GovernanceDecision = {
      id: 'dec_' + Date.now(),
      actionId, decision: 'approve',
      reason: 'Approved by ' + approvedBy + (conditions ? ' with conditions: ' + conditions : ''),
      conditions, decidedBy: approvedBy,
      decidedAt: new Date().toISOString()
    };
    this.decisions.push(decision);
    this.addAuditEntry(actionId, 'approved', approvedBy, 'Action approved' + (conditions ? ' with conditions: ' + conditions : ''));

    // Execute immediately after approval
    action.status = 'executed';
    action.executedAt = new Date().toISOString();
    this.addAuditEntry(actionId, 'executed', 'system', 'Action executed after approval');

    return true;
  }

  rejectAction(actionId: string, rejectedBy: string, reason: string): boolean {
    const action = this.actions.get(actionId);
    if (!action || action.status !== 'pending_approval') return false;

    action.status = 'rejected';
    action.rejectedAt = new Date().toISOString();
    action.rejectedBy = rejectedBy;
    action.rejectionReason = reason;

    const decision: GovernanceDecision = { id: 'dec_' + Date.now(), actionId, decision: 'reject', reason, decidedBy: rejectedBy, decidedAt: new Date().toISOString() };
    this.decisions.push(decision);
    this.addAuditEntry(actionId, 'rejected', rejectedBy, 'Rejected: ' + reason);
    return true;
  }

  // ROLLBACK
  async rollbackAction(actionId: string, requestedBy: string): Promise<boolean> {
    const action = this.actions.get(actionId);
    if (!action || !action.rollbackable || action.status !== 'executed') return false;

    try {
      await fetch('/api/governance/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, rollbackPayload: action.rollbackPayload })
      });
      this.addAuditEntry(actionId, 'rolled_back', requestedBy, 'Action rolled back successfully');
      return true;
    } catch (_) {
      return false;
    }
  }

  // ANOMALY BLOCK
  activateAnomalyBlock(type: string, description: string, affectedEngines: string[], severity: 'warning' | 'critical' = 'critical'): AnomalyBlock {
    const block: AnomalyBlock = {
      id: 'block_' + Date.now(),
      type, description, affectedEngines,
      blockedAt: new Date().toISOString(),
      severity
    };
    this.anomalyBlocks.set(block.id, block);
    this.config.anomalyBlockActive = true;
    this.addAuditEntry('system', 'blocked', 'governance', 'Anomaly block activated: ' + description);
    console.log('[Governance] ANOMALY BLOCK ACTIVATED:', description);
    return block;
  }

  resolveAnomalyBlock(blockId: string, resolvedBy: string): boolean {
    const block = this.anomalyBlocks.get(blockId);
    if (!block || block.resolvedAt) return false;
    block.resolvedAt = new Date().toISOString();
    const activeBlocks = Array.from(this.anomalyBlocks.values()).filter(b => !b.resolvedAt);
    if (activeBlocks.length === 0) this.config.anomalyBlockActive = false;
    this.addAuditEntry('system', 'approved', resolvedBy, 'Anomaly block resolved: ' + blockId);
    return true;
  }

  // MODE CHANGE
  async changeMode(newMode: GovernanceMode, changedBy: string, reason: string): Promise<boolean> {
    const oldMode = this.config.mode;
    const actionResult = await this.requestAction({
      category: 'mode_change',
      engine: 'governance',
      description: 'Changement mode gouvernance: ' + oldMode + ' -> ' + newMode,
      payload: { oldMode, newMode, reason },
      estimatedImpact: 'Modification du comportement de tous les moteurs AEGIS',
      riskLevel: newMode === 'full_auto' ? 'high' : 'medium',
      rollbackable: true,
      rollbackPayload: { mode: oldMode }
    });

    if (actionResult.status === 'auto_executed' || actionResult.status === 'approved') {
      this.config.mode = newMode;
      this.addAuditEntry(actionResult.actionId, 'executed', changedBy, 'Mode changed from ' + oldMode + ' to ' + newMode + '. Reason: ' + reason);
      return true;
    }
    return false;
  }

  // AUDIT TRAIL
  private addAuditEntry(actionId: string, event: AuditEntry['event'], actor: string, details: string): void {
    this.auditTrail.push({
      id: 'audit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      actionId, event, actor,
      timestamp: new Date().toISOString(),
      details
    });
  }

  private async sendApprovalNotification(action: GovernanceAction): Promise<void> {
    if (!this.config.slackWebhook && !this.config.notificationEmail) return;
    try {
      if (this.config.slackWebhook) {
        await fetch(this.config.slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: '[AEGIS] Action en attente d\'approbation',
            blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '*Action:* ' + action.description + '\n*Impact:* ' + action.estimatedImpact + '\n*Risque:* ' + action.riskLevel + '\n*ID:* ' + action.id } }]
          })
        });
      }
    } catch (_) {}
  }

  // REPORTING
  generateReport(period: '24h' | '7d' | '30d' = '24h'): GovernanceReport {
    const periodMs = period === '24h' ? 86400000 : period === '7d' ? 604800000 : 2592000000;
    const since = new Date(Date.now() - periodMs);
    const periodActions = Array.from(this.actions.values()).filter(a => new Date(a.requestedAt) > since);

    const categoryCount = new Map<ActionCategory, number>();
    periodActions.forEach(a => categoryCount.set(a.category, (categoryCount.get(a.category) || 0) + 1));
    const topCategories = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([category, count]) => ({ category, count }));

    const approvedByHuman = periodActions.filter(a => a.approvedBy && a.approvedBy !== 'system_auto').length;
    const avgApprovalTime = approvedByHuman > 0 ? periodActions.filter(a => a.approvedAt).reduce((sum, a) => sum + (new Date(a.approvedAt!).getTime() - new Date(a.requestedAt).getTime()), 0) / approvedByHuman / 60000 : 0;

    return {
      period,
      totalActions: periodActions.length,
      autoExecuted: periodActions.filter(a => a.status === 'auto_executed').length,
      approvedByHuman,
      rejected: periodActions.filter(a => a.status === 'rejected').length,
      blocked: periodActions.filter(a => a.status === 'blocked').length,
      failed: periodActions.filter(a => a.status === 'failed').length,
      pendingApproval: periodActions.filter(a => a.status === 'pending_approval').length,
      avgApprovalTimeMinutes: parseFloat(avgApprovalTime.toFixed(1)),
      topCategories,
      financialImpactTotal: periodActions.reduce((s, a) => s + (a.financialImpact || 0), 0),
      anomalyBlocks: Array.from(this.anomalyBlocks.values()).filter(b => new Date(b.blockedAt) > since).length
    };
  }

  // GETTERS
  getMode(): GovernanceMode { return this.config.mode; }
  getConfig(): GovernanceConfig { return { ...this.config }; }
  getPendingActions(): GovernanceAction[] { return Array.from(this.actions.values()).filter(a => a.status === 'pending_approval'); }
  getAuditTrail(limit = 100): AuditEntry[] { return this.auditTrail.slice(-limit); }
  getDecisionHistory(limit = 50): GovernanceDecision[] { return this.decisions.slice(-limit); }
  getActiveAnomalyBlocks(): AnomalyBlock[] { return Array.from(this.anomalyBlocks.values()).filter(b => !b.resolvedAt); }
  isAnomalyBlockActive(): boolean { return this.config.anomalyBlockActive; }

  updateConfig(updates: Partial<GovernanceConfig>): void {
    const actionId = 'config_' + Date.now();
    this.config = { ...this.config, ...updates };
    this.addAuditEntry(actionId, 'executed', 'operator', 'Config updated: ' + JSON.stringify(updates));
  }

  getStatus() {
    return {
      mode: this.config.mode,
      anomalyBlockActive: this.config.anomalyBlockActive,
      pendingApprovals: this.getPendingActions().length,
      totalActionsLogged: this.actions.size,
      totalAuditEntries: this.auditTrail.length,
      activeAnomalyBlocks: this.getActiveAnomalyBlocks().length,
      approvalThreshold: this.config.approvalThresholdEur
    };
  }
}

export const governanceEngine = new GovernanceEngine({
  mode: 'semi_auto',
  approvalThresholdEur: 100,
  maxDailyAutoSpend: 500,
  requireDoubleApprovalAboveEur: 1000
});
