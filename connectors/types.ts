export interface ConnectorCredential {
  id: string;
  tenantId: string;
  connectorType: 'meta' | 'tiktok' | 'google' | 'pinterest' | 'shopify';
  connectorName: string;
  credentialData: Record<string, any>;
  isActive: boolean;
  isValid: boolean;
  lastValidatedAt?: Date;
  expiresAt?: Date;
  refreshTokenEncrypted?: Buffer;
  scopes: string[];
  metadata: Record<string, any>;
}

export interface SyncLog {
  id: string;
  tenantId: string;
  connectorType: string;
  syncType: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  recordsSynced: number;
  recordsFailed: number;
  durationMs?: number;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
}

export interface WebhookLog {
  id: string;
  tenantId?: string;
  connectorType: string;
  eventType: string;
  eventId?: string;
  payload: Record<string, any>;
  signature?: string;
  verified: boolean;
  processed: boolean;
  processedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
}

export interface SyncResult {
  success: boolean;
  recordsSynced: number;
  recordsFailed: number;
  duration: number;
  nextSyncAt?: Date;
  errorMessage?: string;
}

export interface ConnectorAPI {
  connect(credentials: Record<string, any>): Promise<boolean>;
  disconnect(): Promise<void>;
  validateCredentials(): Promise<boolean>;
  syncData(syncType: string): Promise<SyncResult>;
  handleWebhook(event: Record<string, any>): Promise<void>;
  getStatus(): Promise<Record<string, any>>;
}
