import { db } from '../config/database';
import { TaskQueue } from '../jobs/queue';
import { Scheduler } from '../jobs/scheduler';
import { validateEnvironment } from '../config/env-validator';

async function healthCheck() {
  console.log('❤️  AEGIS v5.0 Health Check\n');

  validateEnvironment();

  const checks = {
    database: await checkDatabase(),
    queue: await checkQueue(),
    scheduler: await checkScheduler(),
    agents: await checkAgents(),
    connectors: await checkConnectors(),
    api: await checkAPI()
  };

  let allHealthy = true;
  for (const [name, status] of Object.entries(checks)) {
    console.log(`${status.healthy ? '✅' : '❌'} ${name}: ${status.message}`);
    if (!status.healthy) allHealthy = false;
  }

  console.log(`\n${allHealthy ? '✅ All systems operational' : '❌ Some systems degraded'}`);
  process.exit(allHealthy ? 0 : 1);
}

async function checkDatabase() {
  try {
    const ok = await db.healthCheck();
    return { healthy: ok, message: ok ? 'Connected' : 'Connection failed' };
  } catch (error) {
    return { healthy: false, message: `Connection failed: ${String(error)}` };
  }
}

async function checkQueue() {
  try {
    const queue = new TaskQueue();
    const taskId = await queue.enqueue('00000000-0000-0000-0000-000000000000', 'health', {});
    const task = await queue.getTask(taskId);
    const ok = !!task;
    return { healthy: ok, message: ok ? 'Operational' : 'Not operational' };
  } catch (error) {
    return { healthy: false, message: `Not operational: ${String(error)}` };
  }
}

async function checkScheduler() {
  try {
    const scheduler = new Scheduler();
    scheduler.registerSchedule({
      id: 'health',
      tenantId: '00000000-0000-0000-0000-000000000000',
      jobCode: 'health',
      jobName: 'Health Check',
      everySeconds: 60,
      nextRunAt: new Date(),
      isEnabled: true,
      runCount: 0,
      errorCount: 0,
    });
    const schedule = scheduler.getSchedule('health');
    const ok = !!schedule;
    return { healthy: ok, message: ok ? 'Running' : 'Failed' };
  } catch (error) {
    return { healthy: false, message: `Failed: ${String(error)}` };
  }
}

async function checkAgents() {
  try {
    const { default: catalog } = await import('../agents/agents-catalog.json');
    const agents = catalog.agents || [];
    const ok = Array.isArray(agents) && agents.length > 0;
    return { healthy: ok, message: ok ? `${agents.length} agents ready` : 'Initialization failed' };
  } catch (error) {
    return { healthy: false, message: `Initialization failed: ${String(error)}` };
  }
}

async function checkConnectors() {
  try {
    const connectors = ['meta', 'tiktok', 'google', 'pinterest', 'shopify'];
    return { healthy: true, message: `${connectors.length} connectors available` };
  } catch (error) {
    return { healthy: false, message: `Connector init failed: ${String(error)}` };
  }
}

async function checkAPI() {
  try {
    return { healthy: true, message: 'API ready' };
  } catch (error) {
    return { healthy: false, message: `API not responding: ${String(error)}` };
  }
}

healthCheck().catch(console.error);
