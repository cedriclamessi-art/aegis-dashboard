import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes'
import metricsRoutes from './routes/metrics.routes'
import agentsRoutes from './routes/agents.routes'
import platformsRoutes from './routes/platforms.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(compression())
app.use(morgan('combined'))

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { error: 'Too many requests, please try again later' }
})
app.use('/api/', limiter)

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '3.0.0'
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/metrics', metricsRoutes)
app.use('/api/agents', agentsRoutes)
app.use('/api/platforms', platformsRoutes)

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  })
})

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     █████╗ ███████╗ ██████╗ ██╗███████╗              ║
║    ██╔══██╗██╔════╝██╔════╝ ██║██╔════╝              ║
║    ███████║█████╗  ██║  ███╗██║███████╗              ║
║    ██╔══██║██╔══╝  ██║   ██║██║╚════██║              ║
║    ██║  ██║███████╗╚██████╔╝██║███████║              ║
║    ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝              ║
║                                                       ║
║         MEDIA BUYING PLATFORM API v3.0                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
📊 Health check: http://localhost:${PORT}/health
📚 API Base: http://localhost:${PORT}/api

Endpoints:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me
  GET    /api/metrics/dashboard
  GET    /api/metrics/revenue-chart
  GET    /api/metrics/platforms
  GET    /api/metrics/campaigns
  GET    /api/metrics/goal
  GET    /api/agents
  GET    /api/agents/activity
  GET    /api/agents/stats
  GET    /api/platforms/connections
  GET    /api/platforms/oauth/:platform
  `)
})

export default app
