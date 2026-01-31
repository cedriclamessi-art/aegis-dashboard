export interface AgentConfig {
  id: string;
  tenantId: string;
  agentName: string;
  roleCode: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isProduction: boolean;
  isEnabled: boolean;
  config: Record<string, any>;
  executionCount: number;
  successCount: number;
  errorCount: number;
  totalTokensUsed: number;
  avgDurationMs: number | null;
  lastExecutionAt: Date | null;
}

export interface AgentExecutionInput {
  taskId?: string;
  workflowId?: string;
  payload: Record<string, any>;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface AgentExecutionResult {
  executionId: string;
  agentId: string;
  status: 'success' | 'error' | 'timeout' | 'canceled';
  input: Record<string, any>;
  output?: Record<string, any>;
  tokensUsed: number;
  durationMs: number;
  errorMessage?: string;
  errorCode?: string;
  timestamp: Date;
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  messageType: string;
  priority: number;
  payload: Record<string, any>;
  status: 'pending' | 'delivered' | 'failed' | 'expired';
  createdAt: Date;
}

export interface WorkflowStep {
  stepId: string;
  agentName: string;
  agentId?: string;
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
  errorHandling: 'retry' | 'skip' | 'fail';
  maxRetries?: number;
  timeout?: number;
}

export interface WorkflowConfig {
  id: string;
  tenantId: string;
  workflowName: string;
  description?: string;
  triggerType: 'manual' | 'scheduled' | 'event' | 'webhook';
  triggerConfig: Record<string, any>;
  steps: WorkflowStep[];
  isEnabled: boolean;
  lastRunAt?: Date;
  lastRunStatus?: string;
  runCount: number;
}
