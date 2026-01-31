import { Router } from 'express'
import oauthRoutes from './auth/oauth'
import campaignsRoutes from './campaigns'
import metricsRoutes from './metrics'

const router = Router()

router.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

// OAuth routes
router.use('/auth/oauth', oauthRoutes)

// Campaigns routes
router.use('/campaigns', campaignsRoutes)

// Metrics routes
router.use('/metrics', metricsRoutes)

export default router
