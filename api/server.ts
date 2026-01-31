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
import { db } from '../config/database';
import { createClient } from 'redis';

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

const redisClient = createClient({ url: env.redis.url });
redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

app.get('/health', async (req, res) => {
  const dbHealthy = await db.healthCheck();
  const redisHealthy = redisClient.isOpen;

  const status = dbHealthy && redisHealthy ? 'healthy' : 'unhealthy';
  const statusCode = status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: appVersion,
    services: {
      database: dbHealthy ? 'ok' : 'down',
      redis: redisHealthy ? 'ok' : 'down',
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
  });
});

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.app.port || 3000;

const startServer = async () => {
  try {
    await redisClient.connect();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    gracefulShutdown.registerServer(server);
    gracefulShutdown.onShutdown(async () => {
      if (redisClient.isOpen) {
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