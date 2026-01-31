import axios from 'axios';
const API_BASE = '/api';
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});
export const agentService = {
    getAll: async () => {
        const { data } = await api.get('/agents');
        return data;
    },
    getById: async (id) => {
        const { data } = await api.get(`/agents/${id}`);
        return data;
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
};
export const taskService = {
    getAll: async (agentId) => {
        const { data } = await api.get('/tasks', { params: { agent_id: agentId } });
        return data;
    },
    getById: async (id) => {
        const { data } = await api.get(`/tasks/${id}`);
        return data;
    },
    create: async (task) => {
        const { data } = await api.post('/tasks', task);
        return data;
    },
};
export const dashboardService = {
    getStats: async () => {
        const { data } = await api.get('/stats');
        return data;
    },
};
