import express, { Request, Response } from 'express'

const router = express.Router()

const generateDailyMetrics = (days: number = 30) => {
  const metrics = []
  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    metrics.push({
      date: date.toISOString().split('T')[0],
      impressions: Math.floor(Math.random() * 500000) + 50000,
      clicks: Math.floor(Math.random() * 50000) + 5000,
      conversions: Math.floor(Math.random() * 5000) + 500,
      spend: Math.floor(Math.random() * 10000) + 1000,
      revenue: Math.floor(Math.random() * 50000) + 10000,
    })
  }
  return metrics
}

// GET /api/metrics/platform/:platform
router.get('/platform/:platform', (req: Request, res: Response) => {
  const { platform } = req.params
  const days = req.query.days ? parseInt(req.query.days as string) : 30

  res.json({
    platform,
    period: `last_${days}_days`,
    daily_data: generateDailyMetrics(days),
    summary: {
      total_impressions: Math.floor(Math.random() * 15000000) + 1000000,
      total_clicks: Math.floor(Math.random() * 1500000) + 100000,
      total_conversions: Math.floor(Math.random() * 150000) + 10000,
      total_spend: Math.floor(Math.random() * 500000) + 50000,
      total_revenue: Math.floor(Math.random() * 2000000) + 200000,
      avg_cpc: (Math.random() * 10).toFixed(2),
      avg_ctr: (Math.random() * 5).toFixed(2),
      roi: Math.floor(Math.random() * 500) + 100,
    },
  })
})

// GET /api/metrics/campaign/:campaignId
router.get('/campaign/:campaignId', (req: Request, res: Response) => {
  const { campaignId } = req.params

  res.json({
    campaign_id: campaignId,
    daily_data: generateDailyMetrics(30),
    summary: {
      impressions: Math.floor(Math.random() * 500000),
      clicks: Math.floor(Math.random() * 50000),
      conversions: Math.floor(Math.random() * 5000),
      spend: Math.floor(Math.random() * 50000),
      revenue: Math.floor(Math.random() * 200000),
      roi: Math.floor(Math.random() * 500),
    },
  })
})

// GET /api/metrics/summary
router.get('/summary', (req: Request, res: Response) => {
  res.json({
    platforms: {
      tiktok: {
        campaigns_count: 3,
        total_spend: Math.floor(Math.random() * 50000),
        total_conversions: Math.floor(Math.random() * 5000),
        roi: Math.floor(Math.random() * 400),
      },
      meta: {
        campaigns_count: 4,
        total_spend: Math.floor(Math.random() * 50000),
        total_conversions: Math.floor(Math.random() * 5000),
        roi: Math.floor(Math.random() * 400),
      },
      google: {
        campaigns_count: 2,
        total_spend: Math.floor(Math.random() * 50000),
        total_conversions: Math.floor(Math.random() * 5000),
        roi: Math.floor(Math.random() * 400),
      },
    },
    combined: {
      total_campaigns: 9,
      total_spend: Math.floor(Math.random() * 150000),
      total_conversions: Math.floor(Math.random() * 15000),
      avg_roi: Math.floor(Math.random() * 400),
    },
  })
})

export default router
