// AEGIS — API Real Service
// Connecteur frontend vers les moteurs AEGIS
// Remplace mockData.ts avec des appels API reels (avec fallback simulation)

// ============================================================
// TYPES
// ============================================================

export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'actif' | 'en_pause' | 'erreur' | 'initialisation';
  engine: string;
  tasksCompleted: number;
  tasksTotal: number;
  lastAction: string;
  performance: number;
  uptime: number;
}

export interface DashboardMetrics {
  revenue: { value: number; change: number; period: string };
  roas: { value: number; change: number; trend: 'up' | 'down' | 'stable' };
  activeCampaigns: { count: number; budgetTotal: number };
  adSpend: { today: number; week: number; month: number };
  conversions: { today: number; week: number; cvr: number };
  topProducts: ProductPerformance[];
  alerts: DashboardAlert[];
  governanceMode: string;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

export interface ProductPerformance {
  id: string;
  name: string;
  revenue: number;
  roas: number;
  units: number;
  trend: 'up' | 'down' | 'stable';
  winnerScore: number;
  phase: 'test' | 'winner' | 'mega_winner' | 'declining';
}

export interface DashboardAlert {
  id: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  engine: string;
  message: string;
  action?: string;
  timestamp: string;
}

export interface AnalyticsData {
  period: string;
  revenue: number[];
  spend: number[];
  roas: number[];
  conversions: number[];
  labels: string[];
  platforms: PlatformStats[];
  funnelData: FunnelData;
}

export interface PlatformStats {
  platform: string;
  spend: number;
  revenue: number;
  roas: number;
  conversions: number;
  cpa: number;
  ctr: number;
  color: string;
}

export interface FunnelData {
  impressions: number;
  clicks: number;
  addToCart: number;
  checkoutStarted: number;
  purchased: number;
  ctr: number;
  cvr: number;
  aov: number;
}

export interface RiskStatus {
  globalRisk: 'safe' | 'caution' | 'danger' | 'frozen';
  drawdownPercent: number;
  stopLossStatus: 'inactive' | 'monitoring' | 'triggered';
  emergencyFreezeActive: boolean;
  dailyPnL: number;
  weeklyPnL: number;
  riskRatio: number;
  activeSafeGuards: number;
}

export interface GovernanceStatus {
  mode: 'human' | 'semi_auto' | 'full_auto';
  pendingApprovals: number;
  anomalyBlockActive: boolean;
  totalActionsToday: number;
  autoExecutedToday: number;
  rejectedToday: number;
  approvalThreshold: number;
}

// ============================================================
// API BASE
// ============================================================

const API_BASE = process.env.REACT_APP_API_URL || '/api';

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(API_BASE + endpoint, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options
    });
    if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    return response.json();
  } catch (error) {
    console.warn('[AEGIS API] Fallback simulation for', endpoint, ':', error);
    throw error;
  }
}

// ============================================================
// AGENTS SERVICE
// ============================================================

export const agentsService = {
  async getAll(): Promise<AgentStatus[]> {
    try {
      return await apiCall<AgentStatus[]>('/agents/status');
    } catch (_) {
      return simulateAgents();
    }
  },

  async getById(id: string): Promise<AgentStatus> {
    try {
      return await apiCall<AgentStatus>('/agents/' + id);
    } catch (_) {
      return simulateAgents().find(a => a.id === id) || simulateAgents()[0];
    }
  },

  async pauseAgent(id: string): Promise<void> {
    await apiCall('/agents/' + id + '/pause', { method: 'POST' });
  },

  async resumeAgent(id: string): Promise<void> {
    await apiCall('/agents/' + id + '/resume', { method: 'POST' });
  }
};

// ============================================================
// DASHBOARD SERVICE
// ============================================================

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      return await apiCall<DashboardMetrics>('/dashboard/metrics');
    } catch (_) {
      return simulateDashboardMetrics();
    }
  },

  async getAlerts(): Promise<DashboardAlert[]> {
    try {
      return await apiCall<DashboardAlert[]>('/dashboard/alerts');
    } catch (_) {
      return simulateAlerts();
    }
  }
};

// ============================================================
// ANALYTICS SERVICE
// ============================================================

export const analyticsService = {
  async getAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsData> {
    try {
      return await apiCall<AnalyticsData>('/analytics?period=' + period);
    } catch (_) {
      return simulateAnalytics(period);
    }
  },

  async getPlatformStats(): Promise<PlatformStats[]> {
    try {
      return await apiCall<PlatformStats[]>('/analytics/platforms');
    } catch (_) {
      return simulatePlatformStats();
    }
  },

  async getFunnelData(productId?: string): Promise<FunnelData> {
    const url = '/analytics/funnel' + (productId ? '?productId=' + productId : '');
    try {
      return await apiCall<FunnelData>(url);
    } catch (_) {
      return simulateFunnelData();
    }
  }
};

// ============================================================
// RISK SERVICE
// ============================================================

export const riskService = {
  async getStatus(): Promise<RiskStatus> {
    try {
      return await apiCall<RiskStatus>('/risk/status');
    } catch (_) {
      return simulateRiskStatus();
    }
  },

  async triggerEmergencyFreeze(): Promise<void> {
    await apiCall('/risk/emergency-freeze', { method: 'POST' });
  },

  async releaseFreeze(reason: string): Promise<void> {
    await apiCall('/risk/release-freeze', { method: 'POST', body: JSON.stringify({ reason }) });
  }
};

// ============================================================
// GOVERNANCE SERVICE
// ============================================================

export const governanceService = {
  async getStatus(): Promise<GovernanceStatus> {
    try {
      return await apiCall<GovernanceStatus>('/governance/status');
    } catch (_) {
      return simulateGovernanceStatus();
    }
  },

  async getPendingApprovals(): Promise<unknown[]> {
    try {
      return await apiCall<unknown[]>('/governance/pending');
    } catch (_) {
      return [];
    }
  },

  async approveAction(actionId: string): Promise<void> {
    await apiCall('/governance/actions/' + actionId + '/approve', { method: 'POST' });
  },

  async rejectAction(actionId: string, reason: string): Promise<void> {
    await apiCall('/governance/actions/' + actionId + '/reject', { method: 'POST', body: JSON.stringify({ reason }) });
  },

  async changeMode(mode: 'human' | 'semi_auto' | 'full_auto', reason: string): Promise<void> {
    await apiCall('/governance/mode', { method: 'PUT', body: JSON.stringify({ mode, reason }) });
  }
};

// ============================================================
// FINANCIAL EVOLUTION SERVICE
// ============================================================

export const financialService = {
  async getPhaseStatus(): Promise<unknown> {
    try {
      return await apiCall('/financial/phase/status');
    } catch (_) {
      return simulatePhaseStatus();
    }
  },

  async getGuards(phase?: string): Promise<unknown[]> {
    const url = '/financial/guards' + (phase ? '?phase=' + phase : '');
    try {
      return await apiCall<unknown[]>(url);
    } catch (_) {
      return [];
    }
  }
};

// ============================================================
// HEALTH SERVICE
// ============================================================

export const healthService = {
  async getSystemHealth(): Promise<unknown> {
    try {
      return await apiCall('/health/system');
    } catch (_) {
      return simulateSystemHealth();
    }
  },

  async getPixelStatus(): Promise<unknown[]> {
    try {
      return await apiCall<unknown[]>('/health/pixels');
    } catch (_) {
      return [];
    }
  }
};

// ============================================================
// SIMULATION FALLBACKS
// ============================================================

function simulateAgents(): AgentStatus[] {
  return [
    { id: 'agent_shopify', name: 'Store Connector', role: 'Synchronisation Shopify', status: 'actif', engine: 'shopify-bidirectional', tasksCompleted: 247, tasksTotal: 250, lastAction: 'Sync produits - il y a 2min', performance: 98, uptime: 99.9 },
    { id: 'agent_intelligence', name: 'Product Intelligence', role: 'Analyse produits & winners', status: 'actif', engine: 'product-intelligence', tasksCompleted: 89, tasksTotal: 95, lastAction: 'Score winner calcule - il y a 5min', performance: 94, uptime: 99.5 },
    { id: 'agent_creative', name: 'Creative Engine', role: 'Generation creatives & hooks', status: 'actif', engine: 'creative-engine', tasksCompleted: 156, tasksTotal: 160, lastAction: 'Hook genere pour Meta - il y a 1min', performance: 97, uptime: 98.8 },
    { id: 'agent_funnel', name: 'Funnel Optimizer', role: 'Optimisation pages & bundles', status: 'actif', engine: 'funnel-engine', tasksCompleted: 42, tasksTotal: 45, lastAction: 'Bundle cree - il y a 10min', performance: 93, uptime: 99.2 },
    { id: 'agent_media', name: 'Media Buying', role: 'Gestion campagnes pub', status: 'actif', engine: 'media-buying-engine', tasksCompleted: 312, tasksTotal: 315, lastAction: '3 ads tuees (ROAS faible) - il y a 30sec', performance: 99, uptime: 99.8 },
    { id: 'agent_risk', name: 'Risk Manager', role: 'Protection hedge fund', status: 'actif', engine: 'risk-engine', tasksCompleted: 1247, tasksTotal: 1247, lastAction: 'Monitoring continu - OK', performance: 100, uptime: 100 },
    { id: 'agent_market', name: 'Market Adaptation', role: 'Detection fatigue & rotation', status: 'actif', engine: 'market-adaptation-engine', tasksCompleted: 67, tasksTotal: 70, lastAction: 'CPM +18% detecte - alerte envoyee', performance: 96, uptime: 99.1 },
    { id: 'agent_health', name: 'Health Monitor', role: 'Surveillance & auto-reparation', status: 'actif', engine: 'health-engine', tasksCompleted: 4823, tasksTotal: 4823, lastAction: 'Pixels verifies - il y a 5min', performance: 100, uptime: 99.99 },
    { id: 'agent_governance', name: 'Governance', role: 'Controle & validation', status: 'actif', engine: 'governance-engine', tasksCompleted: 189, tasksTotal: 190, lastAction: 'Approbation en attente x2', performance: 99, uptime: 100 },
    { id: 'agent_financial', name: 'Financial Evolution', role: 'Garde-fous & phases', status: 'actif', engine: 'financial-evolution-engine', tasksCompleted: 45, tasksTotal: 45, lastAction: 'Phase 1 - 45 garde-fous actifs', performance: 100, uptime: 100 }
  ];
}

function simulateDashboardMetrics(): DashboardMetrics {
  const today = new Date().toLocaleDateString('fr-FR');
  return {
    revenue: { value: 28450, change: 12.5, period: 'aujourd\'hui' },
    roas: { value: 3.2, change: 0.4, trend: 'up' },
    activeCampaigns: { count: 12, budgetTotal: 850 },
    adSpend: { today: 850, week: 5200, month: 21000 },
    conversions: { today: 247, week: 1580, cvr: 0.028 },
    topProducts: [
      { id: 'prod_1', name: 'Produit Star #1', revenue: 12400, roas: 4.8, units: 248, trend: 'up', winnerScore: 92, phase: 'mega_winner' },
      { id: 'prod_2', name: 'Produit Winner #2', revenue: 8900, roas: 3.1, units: 178, trend: 'up', winnerScore: 78, phase: 'winner' },
      { id: 'prod_3', name: 'Produit Test #3', revenue: 3200, roas: 2.1, units: 64, trend: 'stable', winnerScore: 52, phase: 'test' }
    ],
    alerts: simulateAlerts(),
    governanceMode: 'semi_auto',
    systemHealth: 'healthy'
  };
}

function simulateAlerts(): DashboardAlert[] {
  return [
    { id: 'alert_1', type: 'success', engine: 'media-buying', message: 'Mega winner detecte - ROAS 4.8x sur Ad#247', timestamp: new Date(Date.now() - 300000).toISOString() },
    { id: 'alert_2', type: 'warning', engine: 'market-adaptation', message: 'CPM +18% sur Meta FR - fatigue creative possible', action: 'Voir recommandations', timestamp: new Date(Date.now() - 900000).toISOString() },
    { id: 'alert_3', type: 'info', engine: 'governance', message: '2 actions en attente d\'approbation (>100EUR)', action: 'Approuver', timestamp: new Date(Date.now() - 1200000).toISOString() },
    { id: 'alert_4', type: 'success', engine: 'funnel', message: 'Bundle cree - +22% AOV estime', timestamp: new Date(Date.now() - 1800000).toISOString() }
  ];
}

function simulateAnalytics(period: string): AnalyticsData {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const labels: string[] = [];
  const revenue: number[] = [];
  const spend: number[] = [];
  const roas: number[] = [];
  const conversions: number[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
    const dailySpend = 500 + Math.random() * 400;
    const dailyRoas = 2.5 + Math.random() * 2;
    spend.push(parseFloat(dailySpend.toFixed(2)));
    revenue.push(parseFloat((dailySpend * dailyRoas).toFixed(2)));
    roas.push(parseFloat(dailyRoas.toFixed(2)));
    conversions.push(Math.round(dailySpend / 20 * (0.8 + Math.random() * 0.4)));
  }

  return { period, revenue, spend, roas, conversions, labels, platforms: simulatePlatformStats(), funnelData: simulateFunnelData() };
}

function simulatePlatformStats(): PlatformStats[] {
  return [
    { platform: 'Meta', spend: 12400, revenue: 39680, roas: 3.2, conversions: 620, cpa: 20, ctr: 0.022, color: '#1877F2' },
    { platform: 'Google', spend: 5800, revenue: 16820, roas: 2.9, conversions: 290, cpa: 20, ctr: 0.031, color: '#4285F4' },
    { platform: 'TikTok', spend: 2800, revenue: 9520, roas: 3.4, conversions: 140, cpa: 20, ctr: 0.018, color: '#010101' }
  ];
}

function simulateFunnelData(): FunnelData {
  return { impressions: 125000, clicks: 2750, addToCart: 826, checkoutStarted: 413, purchased: 207, ctr: 0.022, cvr: 0.028, aov: 52.80 };
}

function simulateRiskStatus(): RiskStatus {
  return { globalRisk: 'safe', drawdownPercent: 4.2, stopLossStatus: 'monitoring', emergencyFreezeActive: false, dailyPnL: 3250, weeklyPnL: 19800, riskRatio: 3.8, activeSafeGuards: 45 };
}

function simulateGovernanceStatus(): GovernanceStatus {
  return { mode: 'semi_auto', pendingApprovals: 2, anomalyBlockActive: false, totalActionsToday: 87, autoExecutedToday: 74, rejectedToday: 1, approvalThreshold: 100 };
}

function simulatePhaseStatus() {
  return { phase: 'phase1', phaseName: 'Lancement (0 → 1M€)', guardTotal: 45, guardsActive: 45, guardsTriggered: 2, hedgeEnabled: false, maxDailyBudget: 500, currentRevenue: 28450 };
}

function simulateSystemHealth() {
  return {
    overallStatus: 'healthy', uptime: 99.8, pendingRetries: 0, dataInconsistencies: 1, pixelIssues: 0,
    services: [
      { service: 'shopify', status: 'healthy', latencyMs: 245, uptime: 99.9 },
      { service: 'meta_ads', status: 'healthy', latencyMs: 380, uptime: 99.7 },
      { service: 'google_ads', status: 'healthy', latencyMs: 290, uptime: 99.8 },
      { service: 'tiktok_ads', status: 'healthy', latencyMs: 420, uptime: 99.5 },
      { service: 'openai', status: 'healthy', latencyMs: 850, uptime: 98.9 },
      { service: 'database', status: 'healthy', latencyMs: 12, uptime: 99.99 },
      { service: 'pixel_tracker', status: 'healthy', latencyMs: 180, uptime: 99.8 }
    ]
  };
}

// Export API real comme remplacement de mockData
export default {
  agents: agentsService,
  dashboard: dashboardService,
  analytics: analyticsService,
  risk: riskService,
  governance: governanceService,
  financial: financialService,
  health: healthService
};
