import { v4 as uuid } from 'uuid';

export interface Task {
  id: string;
  tenantId: string;
  taskType: string;
  payload: Record<string, any>;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying' | 'dead_letter' | 'canceled';
  retryCount: number;
  maxRetries: number;
  idempotencyKey?: string;
  scheduledFor: Date;
  visibleAt: Date;
  lockedUntil?: Date;
  lockedBy?: string;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  result?: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class TaskQueue {
  private tasks: Map<string, Task> = new Map();

  async enqueue(
    tenantId: string,
    taskType: string,
    payload: Record<string, any>,
    options: {
      priority?: number;
      scheduledFor?: Date;
      idempotencyKey?: string;
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    const id = uuid();
    const task: Task = {
      id,
      tenantId,
      taskType,
      payload,
      priority: options.priority || 5,
      status: 'pending',
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      idempotencyKey: options.idempotencyKey,
      scheduledFor: options.scheduledFor || new Date(),
      visibleAt: options.scheduledFor || new Date(),
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(id, task);
    return id;
  }

  async dequeue(tenantId: string): Promise<Task | null> {
    const now = new Date();
    for (const [, task] of this.tasks) {
      if (
        task.tenantId === tenantId &&
        task.status === 'pending' &&
        task.visibleAt <= now
      ) {
        task.status = 'running';
        task.lockedUntil = new Date(Date.now() + 60000);
        task.startedAt = now;
        return task;
      }
    }
    return null;
  }

  async complete(taskId: string, result: Record<string, any>): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();
      task.updatedAt = new Date();
    }
  }

  async fail(taskId: string, error: string, retry: boolean = true): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      if (retry && task.retryCount < task.maxRetries) {
        task.status = 'retrying';
        task.retryCount++;
        task.visibleAt = new Date(Date.now() + Math.pow(2, task.retryCount) * 1000);
      } else {
        task.status = task.retryCount >= task.maxRetries ? 'dead_letter' : 'failed';
      }
      task.errorMessage = error;
      task.updatedAt = new Date();
    }
  }

  async getTask(taskId: string): Promise<Task | undefined> {
    return this.tasks.get(taskId);
  }

  async listTasks(tenantId: string, status?: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      task => task.tenantId === tenantId && (!status || task.status === status)
    );
  }
}
