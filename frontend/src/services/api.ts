import type { Agent, Task, DashboardStats, Workflow } from '../types'
import { mockAgents, mockDashboardStats, mockTasks, mockTaskChartData } from "./mockData"

const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-swart-two-71.vercel.app'

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('aegis_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = 'Bearer ' + token
  }
  const res = await fetch(API_BASE + path, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('aegis_token')
  }
  if (!res.ok) {
    throw new Error('API error ' + res.status)
  }
  return res.json() as Promise<T>
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export const authService = {
  register: async (data: { email: string; password: string; name: string; tenantName: string }) => {
    const response = await apiPost<{ token?: string }>('/api/auth/register', data)
    if (response.token) {
      localStorage.setItem('aegis_token', response.token)
    }
    return response
  },
  login: async (email: string, password: string) => {
    const response = await apiPost<{ token?: string }>('/api/auth/login', { email, password })
    if (response.token) {
      localStorage.setItem('aegis_token', response.token)
    }
    return response
  },
  logout: () => {
    localStorage.removeItem('aegis_token')
  },
  getMe: async () => {
    return apiFetch<unknown>('/api/auth/me')
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('aegis_token')
  }
}

export const metricsService = {
  getDashboard: async () => {
    try {
      return await apiFetch<unknown>('/api/metrics/dashboard')
    } catch {
      return {
        revenue: { value: 47892, change: 23.5 },
        spend: { value: 12450, change: -5.2 },
        roas: { value: 3.85, change: 12.8 },
        conversions: { value: 1247, change: 18.3 },
        ctr: { value: 3.8, change: -2.1 }
      }
    }
  },
  getRevenueChart: async (days: number = 30) => {
    try {
      return await apiFetch<unknown>('/api/metrics/revenue-chart?days=' + days)
    } catch {
      return [
        { date: '2024-01', revenue: 4200, spend: 1200 },
        { date: '2024-02', revenue: 3800, spend: 1100 },
        { date: '2024-03', revenue: 4500, spend: 1300 },
        { date: '2024-04', revenue: 5200, spend: 1400 },
        { date: '2024-05', revenue: 4800, spend: 1250 },
        { date: '2024-06', revenue: 5500, spend: 1500 },
        { date: '2024-07', revenue: 6200, spend: 1600 },
        { date: '2024-08', revenue: 5800, spend: 1450 },
        { date: '2024-09', revenue: 6500, spend: 1700 },
        { date: '2024-10', revenue: 7200, spend: 1800 },
        { date: '2024-11', revenue: 6800, spend: 1650 },
        { date: '2024-12', revenue: 7500, spend: 1900 }
      ]
    }
  },
  getPlatformBreakdown: async () => {
    try {
      return await apiFetch<unknown>('/api/metrics/platforms')
    } catch {
      return [
        { platform: 'Google Ads', spend: 5670, revenue: 24760, percentage: 45 },
        { platform: 'Meta Ads', spend: 4320, revenue: 17890, percentage: 35 },
        { platform: 'TikTok', spend: 2460, revenue: 9240, percentage: 20 }
      ]
    }
  },
  getCampaigns: async (platform?: string) => {
    try {
      const query = platform ? '?platform=' + platform : ''
      return await apiFetch<unknown>('/api/metrics/campaigns' + query)
    } catch {
      return [
        { id: '1', name: 'Summer Sale 2024', platform: 'Google Ads', status: 'active', spend: 4250, revenue: 18420, roas: 4.33, conversions: 342 },
        { id: '2', name: 'Brand Awareness', platform: 'Meta Ads', status: 'active', spend: 3180, revenue: 12650, roas: 3.98, conversions: 256 },
        { id: '3', name: 'Product Launch', platform: 'TikTok', status: 'active', spend: 2890, revenue: 9870, roas: 3.42, conversions: 189 },
        { id: '4', name: 'Retargeting Q1', platform: 'Google Ads', status: 'paused', spend: 1420, revenue: 6340, roas: 4.47, conversions: 124 }
      ]
    }
  },
  getGoalProgress: async () => {
    try {
      return await apiFetch<unknown>('/api/metrics/goal')
    } catch {
      return { current: 38450, target: 50000, percentage: 77, daysRemaining: 23, dailyAverage: 1672, requiredDaily: 1850 }
    }
  }
}

export const aiAgentsService = {
  getAll: async () => {
    try {
      return await apiFetch<unknown>('/api/agents')
    } catch {
      return [
        { id: 'SENTINEL-A1', name: 'Stop-Loss Guardian', type: 'stoploss', platform: 'All', status: 'active', lastAction: 'Monitoring ROAS thresholds', decisionsToday: 12, savings: 234 },
        { id: 'GUARDIAN-B2', name: 'Scale Optimizer', type: 'scale', platform: 'All', status: 'active', lastAction: 'Identifying growth opportunities', decisionsToday: 8, savings: 189 },
        { id: 'PHANTOM-C3', name: 'Action Executor', type: 'executor', platform: 'All', status: 'active', lastAction: 'Executing approved decisions', decisionsToday: 5, savings: 156 },
        { id: 'CIPHER-D4', name: 'Google Ads Specialist', type: 'google', platform: 'Google Ads', status: 'active', lastAction: 'Optimizing keyword bids', decisionsToday: 12, savings: 312 },
        { id: 'NEXUS-E5', name: 'Meta Ads Specialist', type: 'meta', platform: 'Meta Ads', status: 'active', lastAction: 'Analyzing audience performance', decisionsToday: 8, savings: 278 }
      ]
    }
  },
  getActivity: async (limit: number = 20) => {
    try {
      return await apiFetch<unknown>('/api/agents/activity?limit=' + limit)
    } catch {
      return [
        { id: '1', action: 'Reduced CPC by 18% on underperforming keywords', platform: 'Google Ads', time: '00:03:22', impact: '+$234', type: 'optimization' },
        { id: '2', action: 'Discovered high-converting audience segment', platform: 'Meta Ads', time: '00:12:45', impact: '+15% CTR', type: 'insight' },
        { id: '3', action: 'Paused ad with declining performance', platform: 'TikTok', time: '00:28:18', impact: '+$89', type: 'optimization' },
        { id: '4', action: 'Budget approaching daily limit warning', platform: 'Google Ads', time: '00:45:33', impact: '87% USED', type: 'alert' }
      ]
    }
  },
  getStats: async () => {
    try {
      return await apiFetch<unknown>('/api/agents/stats')
    } catch {
      return { today: { total: 45, executed: 38, pending: 7, auto: 35 }, weeklyTrend: [], totalSavings: 891, activeAgents: 5 }
    }
  },
  approveDecision: async (decisionId: string) => {
    return apiPost<unknown>('/api/agents/decisions/' + decisionId + '/approve')
  },
  rejectDecision: async (decisionId: string) => {
    return apiPost<unknown>('/api/agents/decisions/' + decisionId + '/reject')
  }
}

export const platformsService = {
  getConnections: async () => {
    try {
      return await apiFetch<unknown>('/api/platforms/connections')
    } catch {
      return []
    }
  },
  initiateOAuth: async (platform: string) => {
    return apiFetch<unknown>('/api/platforms/oauth/' + platform)
  },
  disconnect: async (connectionId: string) => {
    return apiPost<unknown>('/api/platforms/connections/' + connectionId + '/disconnect')
  },
  sync: async (connectionId: string) => {
    return apiPost<unknown>('/api/platforms/connections/' + connectionId + '/sync')
  }
}

export const agentService = {
  getAll: async (): Promise<Agent[]> => {
    try {
      return await apiFetch<Agent[]>('/agents')
    } catch {
      return mockAgents
    }
  },
  getById: async (id: string): Promise<Agent> => {
    try {
      return await apiFetch<Agent>('/agents/' + id)
    } catch {
      const agent = mockAgents.find(a => a.id === id)
      if (!agent) throw new Error('Agent not found')
      return agent
    }
  },
  getByName: async (name: string): Promise<Agent> => {
    try {
      return await apiFetch<Agent>('/agents/name/' + name)
    } catch {
      const agent = mockAgents.find(a => a.name === name)
      if (!agent) throw new Error('Agent not found')
      return agent
    }
  },
  create: async (agent: Partial<Agent>): Promise<Agent> => {
    return apiPost<Agent>('/agents', agent)
  },
  update: async (id: string, agent: Partial<Agent>): Promise<Agent> => {
    return apiFetch<Agent>('/agents/' + id, { method: 'PUT', body: JSON.stringify(agent) })
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch<void>('/agents/' + id, { method: 'DELETE' })
  },
  enable: async (id: string): Promise<Agent> => {
    return apiPost<Agent>('/agents/' + id + '/enable')
  },
  disable: async (id: string): Promise<Agent> => {
    return apiPost<Agent>('/agents/' + id + '/disable')
  },
  execute: async (id: string, payload: Record<string, unknown>): Promise<{ executionId: string }> => {
    return apiPost<{ executionId: string }>('/agents/' + id + '/execute', { payload })
  },
  getStats: async (id: string): Promise<{ task_count: number; success_rate: number; error_count: number; avg_duration_ms: number }> => {
    try {
      return await apiFetch<{ task_count: number; success_rate: number; error_count: number; avg_duration_ms: number }>('/agents/' + id + '/stats')
    } catch {
      const agent = mockAgents.find(a => a.id === id)
      if (!agent) throw new Error('Agent not found')
      return {
        task_count: agent.task_count,
        success_rate: agent.success_rate,
        error_count: agent.error_count,
        avg_duration_ms: agent.avg_duration_ms || 0,
      }
    }
  },
}

export const taskService = {
  getAll: async (agentId?: string): Promise<Task[]> => {
    try {
      const query = agentId ? '?agent_id=' + agentId : ''
      return await apiFetch<Task[]>('/tasks' + query)
    } catch {
      if (agentId) {
        return mockTasks.filter(t => t.agent_id === agentId)
      }
      return mockTasks
    }
  },
  getById: async (id: string): Promise<Task> => {
    try {
      return await apiFetch<Task>('/tasks/' + id)
    } catch {
      const task = mockTasks.find(t => t.id === id)
      if (!task) throw new Error('Task not found')
      return task
    }
  },
  create: async (task: Partial<Task>): Promise<Task> => {
    return apiPost<Task>('/tasks', task)
  },
  cancel: async (id: string): Promise<Task> => {
    return apiPost<Task>('/tasks/' + id + '/cancel')
  },
  retry: async (id: string): Promise<Task> => {
    return apiPost<Task>('/tasks/' + id + '/retry')
  },
  getRecent: async (limit: number = 10): Promise<Task[]> => {
    try {
      return await apiFetch<Task[]>('/tasks/recent?limit=' + limit)
    } catch {
      return mockTasks.slice(0, limit)
    }
  },
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      return await apiFetch<DashboardStats>('/stats')
    } catch {
      return mockDashboardStats
    }
  },
  getAgentPerformance: async (): Promise<Array<{ name: string; tasks: number; success_rate: number }>> => {
    try {
      return await apiFetch<Array<{ name: string; tasks: number; success_rate: number }>>('/stats/agent-performance')
    } catch {
      return mockAgents
        .filter(a => a.status === 'active')
        .slice(0, 7)
        .map(a => ({
          name: a.displayName,
          tasks: a.task_count,
          success_rate: a.success_rate,
        }))
    }
  },
  getTaskChart: async (days: number = 7): Promise<Array<{ day: string; completed: number; failed: number; pending: number }>> => {
    try {
      return await apiFetch<Array<{ day: string; completed: number; failed: number; pending: number }>>('/stats/task-chart?days=' + days)
    } catch {
      return mockTaskChartData
    }
  },
}

export const workflowService = {
  getAll: async (): Promise<Workflow[]> => {
    return apiFetch<Workflow[]>('/workflows')
  },
  getById: async (id: string): Promise<Workflow> => {
    return apiFetch<Workflow>('/workflows/' + id)
  },
  create: async (workflow: Partial<Workflow>): Promise<Workflow> => {
    return apiPost<Workflow>('/workflows', workflow)
  },
  update: async (id: string, workflow: Partial<Workflow>): Promise<Workflow> => {
    return apiFetch<Workflow>('/workflows/' + id, { method: 'PUT', body: JSON.stringify(workflow) })
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch<void>('/workflows/' + id, { method: 'DELETE' })
  },
  execute: async (id: string, input?: Record<string, unknown>): Promise<{ runId: string }> => {
    return apiPost<{ runId: string }>('/workflows/' + id + '/execute', { input })
  },
  enable: async (id: string): Promise<Workflow> => {
    return apiPost<Workflow>('/workflows/' + id + '/enable')
  },
  disable: async (id: string): Promise<Workflow> => {
    return apiPost<Workflow>('/workflows/' + id + '/disable')
  },
}

export default apiFetch
