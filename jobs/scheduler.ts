export interface ScheduleConfig {
  id: string;
  tenantId: string;
  jobCode: string;
  jobName: string;
  everySeconds: number;
  nextRunAt: Date;
  lastRunAt?: Date;
  lastRunStatus?: string;
  isEnabled: boolean;
  runCount: number;
  errorCount: number;
}

export class Scheduler {
  private schedules: Map<string, ScheduleConfig> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  registerSchedule(config: ScheduleConfig): void {
    this.schedules.set(config.id, config);
  }

  async start(scheduleId: string, handler: () => Promise<void>): Promise<void> {
    const config = this.schedules.get(scheduleId);
    if (!config || !config.isEnabled) return;

    const interval = setInterval(async () => {
      try {
        await handler();
        config.lastRunStatus = 'success';
        config.lastRunAt = new Date();
        config.runCount++;
      } catch (error) {
        config.lastRunStatus = 'failed';
        config.errorCount++;
        console.error(`Schedule ${scheduleId} failed:`, error);
      }
      config.nextRunAt = new Date(Date.now() + config.everySeconds * 1000);
    }, config.everySeconds * 1000);

    this.intervals.set(scheduleId, interval);
  }

  async stop(scheduleId: string): Promise<void> {
    const interval = this.intervals.get(scheduleId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(scheduleId);
    }
  }

  async stopAll(): Promise<void> {
    for (const [, interval] of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }

  getSchedule(scheduleId: string): ScheduleConfig | undefined {
    return this.schedules.get(scheduleId);
  }
}
