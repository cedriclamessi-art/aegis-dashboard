import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import {
  getConnections,
  initiateOAuth,
  handleOAuthCallback,
  disconnectPlatform,
  syncPlatform
} from '../controllers/platforms.controller'

const router = Router()

router.get('/connections', authMiddleware, getConnections)
router.get('/oauth/:platform', authMiddleware, initiateOAuth)
router.get('/oauth/:platform/callback', handleOAuthCallback)
router.post('/connections/:connectionId/disconnect', authMiddleware, disconnectPlatform)
router.post('/connections/:connectionId/sync', authMiddleware, syncPlatform)

export default router
