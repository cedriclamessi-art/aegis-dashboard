import axios from 'axios'
import type { Agent, Task, DashboardStats } from '../types'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const agentService = {
  getAll: async (): Promise<Agent[]> => {
    const { data } = await api.get('/agents')
    return data
  },
  
  getById: async (id: string): Promise<Agent> => {
    const { data } = await api.get(`/agents/${id}`)
    return data
  },
  
  create: async (agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<Agent> => {
    const { data } = await api.post('/agents', agent)
    return data
  },
  
  update: async (id: string, agent: Partial<Agent>): Promise<Agent> => {
    const { data } = await api.put(`/agents/${id}`, agent)
    return data
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/agents/${id}`)
  },
}

export const taskService = {
  getAll: async (agentId?: string): Promise<Task[]> => {
    const { data } = await api.get('/tasks', { params: { agent_id: agentId } })
    return data
  },
  
  getById: async (id: string): Promise<Task> => {
    const { data } = await api.get(`/tasks/${id}`)
    return data
  },
  
  create: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => {
    const { data } = await api.post('/tasks', task)
    return data
  },
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/stats')
    return data
  },
}
