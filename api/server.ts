import express from 'express';
import cors from 'cors';
import { validateEnvironment, env } from '../config/env-validator';
import { gracefulShutdown } from '../config/graceful-shutdown';
import {
  apiLimiter,
  authLimiter,
  corsOptions,
  helmetConfig,
  requestTimeout,
  sanitizeInput,
} from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import routes from './routes/index';

validateEnvironment();

const app = express();
const appVersion = process.env.APP_VERSION || '5.0.0';

app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
app.use(requestTimeout(30000));

app.use('/api/', apiLimiter);
app.use('/auth/', authLimiter);

// Optional Redis client
let redisClient: any = null;
const initRedis = async () => {
  if (env.redis.url) {
    try {
      const { createClient } = await import('redis');
      redisClient = createClient({ url: env.redis.url });
      redisClient.on('error', (err: Error) => {
        console.error('Redis client error:', err);
      });
      await redisClient.connect();
      console.log('✅ Redis connected');
      return true;
    } catch (error) {
      console.warn('⚠️  Redis connection failed, running in offline mode');
      return false;
    }
  } else {
    console.log('ℹ️  Redis not configured, running in offline mode');
    return false;
  }
};

// Optional Database initialization
let dbHealthy = false;
const initDatabase = async () => {
  if (env.database.url || (env.database.host && env.database.user)) {
    try {
      const { db } = await import('../config/database');
      const isHealthy = await db.healthCheck();
      if (isHealthy) {
        console.log('✅ Database connected');
        dbHealthy = true;
      } else {
        console.warn('⚠️  Database health check failed, running in offline mode');
      }
    } catch (error) {
      console.warn('⚠️  Database connection failed, running in offline mode');
    }
  } else {
    console.log('ℹ️  Database not configured, running in offline mode');
  }
};

app.get('/health', async (req, res) => {
  const redisHealthy = redisClient?.isOpen ?? false;

  const status = (!env.database.url && !env.redis.url) || (dbHealthy || redisHealthy) ? 'healthy' : 'degraded';
  const statusCode = status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: appVersion,
    mode: (!env.database.url && !env.redis.url) ? 'offline-demo' : 'online',
    services: {
      database: dbHealthy ? 'ok' : 'offline',
      redis: redisHealthy ? 'ok' : 'offline',
    },
  });
});

app.get('/metrics', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    env: env.app.nodeEnv,
    version: appVersion,
    mode: (!env.database.url && !env.redis.url) ? 'offline-demo' : 'online',
  });
});

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.app.port || 3000;

const startServer = async () => {
  try {
    // Initialize optional services
    await initRedis();
    await initDatabase();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
      console.log(`⚡ Status: http://localhost:${PORT}/api/v1/status`);
    });

    gracefulShutdown.registerServer(server);
    gracefulShutdown.onShutdown(async () => {
      if (redisClient?.isOpen) {
        await redisClient.quit();
      }
    });
    gracefulShutdown.init();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
