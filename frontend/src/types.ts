export type AgentStatus = 'active' | 'inactive' | 'error'
export type AgentRole = 
  | 'content_creation' 
  | 'optimization' 
  | 'analytics' 
  | 'intelligence' 
  | 'engagement' 
  | 'conversion' 
  | 'inventory' 
  | 'strategy' 
  | 'reporting' 
  | 'orchestration' 
  | 'compliance' 
  | 'audit' 
  | 'sentiment' 
  | 'growth' 
  | 'crisis'

export interface Agent {
  id: string
  name: string
  displayName: string
  description: string
  role: AgentRole
  status: AgentStatus
  capabilities: string[]
  dependencies: string[]
  isPremium: boolean
  isEnabled: boolean
  created_at: string
  updated_at: string
  task_count: number
  success_rate: number
  error_count: number
  avg_duration_ms: number | null
  last_execution_at: string | null
}

export interface AgentCatalogEntry {
  name: string
  role: AgentRole
  displayName: string
  description: string
  systemPrompt: string
  capabilities: string[]
  dependencies: string[]
  isPremium: boolean
  sortOrder: number
}

export interface Task {
  id: string
  agent_id: string
  agent_name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  priority: number
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
  result?: Record<string, unknown>
  error?: string
}

export interface DashboardStats {
  total_agents: number
  active_agents: number
  premium_agents: number
  total_tasks: number
  success_rate: number
  tasks_today: number
  tasks_this_week: number
  avg_response_time_ms: number
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  tenant_id: string
}

export interface AgentRoleInfo {
  code: string
  name: string
  description: string
}

export interface WorkflowStep {
  stepId: string
  agentName: string
  agentId?: string
  inputMapping: Record<string, string>
  outputMapping: Record<string, string>
  errorHandling: 'retry' | 'skip' | 'fail'
  maxRetries?: number
  timeout?: number
}

export interface Workflow {
  id: string
  tenant_id: string
  workflow_name: string
  description?: string
  trigger_type: 'manual' | 'scheduled' | 'event' | 'webhook'
  trigger_config: Record<string, unknown>
  steps: WorkflowStep[]
  is_enabled: boolean
  last_run_at?: string
  last_run_status?: string
  run_count: number
}
