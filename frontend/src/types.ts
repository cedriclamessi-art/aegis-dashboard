export interface Agent {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive' | 'error'
  created_at: string
  updated_at: string
  task_count: number
  success_rate: number
}

export interface Task {
  id: string
  agent_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  result?: string
  error?: string
}

export interface DashboardStats {
  total_agents: number
  active_agents: number
  total_tasks: number
  success_rate: number
  tasks_today: number
}

export interface User {
  id: string
  email: string
  name: string
  role: string
}
