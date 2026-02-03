import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import {
  getDashboardMetrics,
  getRevenueChart,
  getPlatformBreakdown,
  getCampaigns,
  getGoalProgress
} from '../controllers/metrics.controller'

const router = Router()

router.use(authMiddleware)

router.get('/dashboard', getDashboardMetrics)
router.get('/revenue-chart', getRevenueChart)
router.get('/platforms', getPlatformBreakdown)
router.get('/campaigns', getCampaigns)
router.get('/goal', getGoalProgress)

export default router
