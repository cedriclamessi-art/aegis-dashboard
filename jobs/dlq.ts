import { v4 as uuid } from 'uuid';

export interface DeadLetterMessage {
  id: string;
  tenantId: string;
  taskId?: string;
  taskType: string;
  payload: Record<string, any>;
  reason: string;
  errorMessage?: string;
  retryCount?: number;
  meta: Record<string, any>;
  replayed: boolean;
  replayedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class DeadLetterQueue {
  private messages: Map<string, DeadLetterMessage> = new Map();

  async add(
    tenantId: string,
    taskType: string,
    payload: Record<string, any>,
    reason: string,
    errorMessage?: string
  ): Promise<string> {
    const id = uuid();
    const message: DeadLetterMessage = {
      id,
      tenantId,
      taskType,
      payload,
      reason,
      errorMessage,
      meta: {},
      replayed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.messages.set(id, message);
    return id;
  }

  async replay(messageId: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.replayed = true;
      message.replayedAt = new Date();
      message.updatedAt = new Date();
    }
  }

  async getMessage(messageId: string): Promise<DeadLetterMessage | undefined> {
    return this.messages.get(messageId);
  }

  async listMessages(tenantId: string): Promise<DeadLetterMessage[]> {
    return Array.from(this.messages.values()).filter(m => m.tenantId === tenantId);
  }

  async getUnreplayed(tenantId: string): Promise<DeadLetterMessage[]> {
    return Array.from(this.messages.values()).filter(m => m.tenantId === tenantId && !m.replayed);
  }
}
