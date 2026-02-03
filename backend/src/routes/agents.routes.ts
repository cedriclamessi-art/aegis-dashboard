import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import {
  getAgents,
  getAgentActivity,
  getAgentStats,
  approveDecision,
  rejectDecision
} from '../controllers/agents.controller'

const router = Router()

router.use(authMiddleware)

router.get('/', getAgents)
router.get('/activity', getAgentActivity)
router.get('/stats', getAgentStats)
router.post('/decisions/:decisionId/approve', approveDecision)
router.post('/decisions/:decisionId/reject', rejectDecision)

export default router
