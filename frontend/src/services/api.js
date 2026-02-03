import axios from 'axios';
import { mockAgents, mockDashboardStats, mockTasks, mockTaskChartData } from "./mockData";
const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-swart-two-71.vercel.app';
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});
api.interceptors.request.use(config => {
    const token = localStorage.getItem('aegis_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
api.interceptors.response.use(response => response, error => {
    console.error('API Error:', error.message);
    if (error.response?.status === 401) {
        localStorage.removeItem('aegis_token');
    }
    return Promise.reject(error);
});
export const authService = {
    register: async (data) => {
        const { data: response } = await api.post('/api/auth/register', data);
        if (response.token) {
            localStorage.setItem('aegis_token', response.token);
        }
        return response;
    },
    login: async (email, password) => {
        const { data: response } = await api.post('/api/auth/login', { email, password });
        if (response.token) {
            localStorage.setItem('aegis_token', response.token);
        }
        return response;
    },
    logout: () => {
        localStorage.removeItem('aegis_token');
    },
    getMe: async () => {
        const { data } = await api.get('/api/auth/me');
        return data;
    },
    isAuthenticated: () => {
        return !!localStorage.getItem('aegis_token');
    }
};
export const metricsService = {
    getDashboard: async () => {
        try {
            const { data } = await api.get('/api/metrics/dashboard');
            return data;
        }
        catch {
            return {
                revenue: { value: 47892, change: 23.5 },
                spend: { value: 12450, change: -5.2 },
                roas: { value: 3.85, change: 12.8 },
                conversions: { value: 1247, change: 18.3 },
                ctr: { value: 3.8, change: -2.1 }
            };
        }
    },
    getRevenueChart: async (days = 30) => {
        try {
            const { data } = await api.get(`/api/metrics/revenue-chart?days=${days}`);
            return data;
        }
        catch {
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
            ];
        }
    },
    getPlatformBreakdown: async () => {
        try {
            const { data } = await api.get('/api/metrics/platforms');
            return data;
        }
        catch {
            return [
                { platform: 'Google Ads', spend: 5670, revenue: 24760, percentage: 45 },
                { platform: 'Meta Ads', spend: 4320, revenue: 17890, percentage: 35 },
                { platform: 'TikTok', spend: 2460, revenue: 9240, percentage: 20 }
            ];
        }
    },
    getCampaigns: async (platform) => {
        try {
            const query = platform ? `?platform=${platform}` : '';
            const { data } = await api.get(`/api/metrics/campaigns${query}`);
            return data;
        }
        catch {
            return [
                { id: '1', name: 'Summer Sale 2024', platform: 'Google Ads', status: 'active', spend: 4250, revenue: 18420, roas: 4.33, conversions: 342 },
                { id: '2', name: 'Brand Awareness', platform: 'Meta Ads', status: 'active', spend: 3180, revenue: 12650, roas: 3.98, conversions: 256 },
                { id: '3', name: 'Product Launch', platform: 'TikTok', status: 'active', spend: 2890, revenue: 9870, roas: 3.42, conversions: 189 },
                { id: '4', name: 'Retargeting Q1', platform: 'Google Ads', status: 'paused', spend: 1420, revenue: 6340, roas: 4.47, conversions: 124 }
            ];
        }
    },
    getGoalProgress: async () => {
        try {
            const { data } = await api.get('/api/metrics/goal');
            return data;
        }
        catch {
            return {
                current: 38450,
                target: 50000,
                percentage: 77,
                daysRemaining: 23,
                dailyAverage: 1672,
                requiredDaily: 1850
            };
        }
    }
};
export const aiAgentsService = {
    getAll: async () => {
        try {
            const { data } = await api.get('/api/agents');
            return data;
        }
        catch {
            return [
                { id: 'SENTINEL-A1', name: 'Stop-Loss Guardian', type: 'stoploss', platform: 'All', status: 'active', lastAction: 'Monitoring ROAS thresholds', decisionsToday: 12, savings: 234 },
                { id: 'GUARDIAN-B2', name: 'Scale Optimizer', type: 'scale', platform: 'All', status: 'active', lastAction: 'Identifying growth opportunities', decisionsToday: 8, savings: 189 },
                { id: 'PHANTOM-C3', name: 'Action Executor', type: 'executor', platform: 'All', status: 'active', lastAction: 'Executing approved decisions', decisionsToday: 5, savings: 156 },
                { id: 'CIPHER-D4', name: 'Google Ads Specialist', type: 'google', platform: 'Google Ads', status: 'active', lastAction: 'Optimizing keyword bids', decisionsToday: 12, savings: 312 },
                { id: 'NEXUS-E5', name: 'Meta Ads Specialist', type: 'meta', platform: 'Meta Ads', status: 'active', lastAction: 'Analyzing audience performance', decisionsToday: 8, savings: 278 }
            ];
        }
    },
    getActivity: async (limit = 20) => {
        try {
            const { data } = await api.get(`/api/agents/activity?limit=${limit}`);
            return data;
        }
        catch {
            return [
                { id: '1', action: 'Reduced CPC by 18% on underperforming keywords', platform: 'Google Ads', time: '00:03:22', impact: '+$234', type: 'optimization' },
                { id: '2', action: 'Discovered high-converting audience segment', platform: 'Meta Ads', time: '00:12:45', impact: '+15% CTR', type: 'insight' },
                { id: '3', action: 'Paused ad with declining performance', platform: 'TikTok', time: '00:28:18', impact: '+$89', type: 'optimization' },
                { id: '4', action: 'Budget approaching daily limit warning', platform: 'Google Ads', time: '00:45:33', impact: '87% USED', type: 'alert' }
            ];
        }
    },
    getStats: async () => {
        try {
            const { data } = await api.get('/api/agents/stats');
            return data;
        }
        catch {
            return {
                today: { total: 45, executed: 38, pending: 7, auto: 35 },
                weeklyTrend: [],
                totalSavings: 891,
                activeAgents: 5
            };
        }
    },
    approveDecision: async (decisionId) => {
        const { data } = await api.post(`/api/agents/decisions/${decisionId}/approve`);
        return data;
    },
    rejectDecision: async (decisionId) => {
        const { data } = await api.post(`/api/agents/decisions/${decisionId}/reject`);
        return data;
    }
};
export const platformsService = {
    getConnections: async () => {
        try {
            const { data } = await api.get('/api/platforms/connections');
            return data;
        }
        catch {
            return [];
        }
    },
    initiateOAuth: async (platform) => {
        const { data } = await api.get(`/api/platforms/oauth/${platform}`);
        return data;
    },
    disconnect: async (connectionId) => {
        const { data } = await api.post(`/api/platforms/connections/${connectionId}/disconnect`);
        return data;
    },
    sync: async (connectionId) => {
        const { data } = await api.post(`/api/platforms/connections/${connectionId}/sync`);
        return data;
    }
};
export const agentService = {
    getAll: async () => {
        try {
            const { data } = await api.get('/agents');
            return data;
        }
        catch {
            return mockAgents;
        }
    },
    getById: async (id) => {
        try {
            const { data } = await api.get(`/agents/${id}`);
            return data;
        }
        catch {
            const agent = mockAgents.find(a => a.id === id);
            if (!agent)
                throw new Error('Agent not found');
            return agent;
        }
    },
    getByName: async (name) => {
        try {
            const { data } = await api.get(`/agents/name/${name}`);
            return data;
        }
        catch {
            const agent = mockAgents.find(a => a.name === name);
            if (!agent)
                throw new Error('Agent not found');
            return agent;
        }
    },
    create: async (agent) => {
        const { data } = await api.post('/agents', agent);
        return data;
    },
    update: async (id, agent) => {
        const { data } = await api.put(`/agents/${id}`, agent);
        return data;
    },
    delete: async (id) => {
        await api.delete(`/agents/${id}`);
    },
    enable: async (id) => {
        const { data } = await api.post(`/agents/${id}/enable`);
        return data;
    },
    disable: async (id) => {
        const { data } = await api.post(`/agents/${id}/disable`);
        return data;
    },
    execute: async (id, payload) => {
        const { data } = await api.post(`/agents/${id}/execute`, { payload });
        return data;
    },
    getStats: async (id) => {
        try {
            const { data } = await api.get(`/agents/${id}/stats`);
            return data;
        }
        catch {
            const agent = mockAgents.find(a => a.id === id);
            if (!agent)
                throw new Error('Agent not found');
            return {
                task_count: agent.task_count,
                success_rate: agent.success_rate,
                error_count: agent.error_count,
                avg_duration_ms: agent.avg_duration_ms || 0,
            };
        }
    },
};
export const taskService = {
    getAll: async (agentId) => {
        try {
            const { data } = await api.get('/tasks', { params: { agent_id: agentId } });
            return data;
        }
        catch {
            if (agentId) {
                return mockTasks.filter(t => t.agent_id === agentId);
            }
            return mockTasks;
        }
    },
    getById: async (id) => {
        try {
            const { data } = await api.get(`/tasks/${id}`);
            return data;
        }
        catch {
            const task = mockTasks.find(t => t.id === id);
            if (!task)
                throw new Error('Task not found');
            return task;
        }
    },
    create: async (task) => {
        const { data } = await api.post('/tasks', task);
        return data;
    },
    cancel: async (id) => {
        const { data } = await api.post(`/tasks/${id}/cancel`);
        return data;
    },
    retry: async (id) => {
        const { data } = await api.post(`/tasks/${id}/retry`);
        return data;
    },
    getRecent: async (limit = 10) => {
        try {
            const { data } = await api.get('/tasks/recent', { params: { limit } });
            return data;
        }
        catch {
            return mockTasks.slice(0, limit);
        }
    },
};
export const dashboardService = {
    getStats: async () => {
        try {
            const { data } = await api.get('/stats');
            return data;
        }
        catch {
            return mockDashboardStats;
        }
    },
    getAgentPerformance: async () => {
        try {
            const { data } = await api.get('/stats/agent-performance');
            return data;
        }
        catch {
            return mockAgents
                .filter(a => a.status === 'active')
                .slice(0, 7)
                .map(a => ({
                name: a.displayName,
                tasks: a.task_count,
                success_rate: a.success_rate,
            }));
        }
    },
    getTaskChart: async (days = 7) => {
        try {
            const { data } = await api.get('/stats/task-chart', { params: { days } });
            return data;
        }
        catch {
            return mockTaskChartData;
        }
    },
};
export const workflowService = {
    getAll: async () => {
        const { data } = await api.get('/workflows');
        return data;
    },
    getById: async (id) => {
        const { data } = await api.get(`/workflows/${id}`);
        return data;
    },
    create: async (workflow) => {
        const { data } = await api.post('/workflows', workflow);
        return data;
    },
    update: async (id, workflow) => {
        const { data } = await api.put(`/workflows/${id}`, workflow);
        return data;
    },
    delete: async (id) => {
        await api.delete(`/workflows/${id}`);
    },
    execute: async (id, input) => {
        const { data } = await api.post(`/workflows/${id}/execute`, { input });
        return data;
    },
    enable: async (id) => {
        const { data } = await api.post(`/workflows/${id}/enable`);
        return data;
    },
    disable: async (id) => {
        const { data } = await api.post(`/workflows/${id}/disable`);
        return data;
    },
};
export default api;
