import express, { Request, Response } from 'express'

const router = express.Router()

// Mock data generators
const generateMockCampaigns = (platform: string) => {
  const campaigns = [
    {
      id: `${platform}_camp_001`,
      name: 'Summer Sale 2024',
      status: 'active',
      budget: 5000,
      spent: Math.floor(Math.random() * 5000),
      impressions: Math.floor(Math.random() * 500000),
      clicks: Math.floor(Math.random() * 50000),
      conversions: Math.floor(Math.random() * 5000),
      ctr: (Math.random() * 5).toFixed(2),
      cpc: (Math.random() * 5).toFixed(2),
      roi: Math.floor(Math.random() * 500),
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${platform}_camp_002`,
      name: 'Winter Campaign',
      status: 'active',
      budget: 3000,
      spent: Math.floor(Math.random() * 3000),
      impressions: Math.floor(Math.random() * 300000),
      clicks: Math.floor(Math.random() * 30000),
      conversions: Math.floor(Math.random() * 3000),
      ctr: (Math.random() * 4).toFixed(2),
      cpc: (Math.random() * 4).toFixed(2),
      roi: Math.floor(Math.random() * 400),
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${platform}_camp_003`,
      name: 'Flash Sale',
      status: 'paused',
      budget: 2000,
      spent: 1800,
      impressions: 150000,
      clicks: 3000,
      conversions: 250,
      ctr: '2.0',
      cpc: '0.60',
      roi: 350,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
  return campaigns
}

// GET /api/campaigns/tiktok
router.get('/tiktok', (req: Request, res: Response) => {
  res.json({
    platform: 'tiktok',
    campaigns: generateMockCampaigns('tiktok'),
  })
})

// GET /api/campaigns/meta
router.get('/meta', (req: Request, res: Response) => {
  res.json({
    platform: 'meta',
    campaigns: generateMockCampaigns('meta'),
  })
})

// GET /api/campaigns/google
router.get('/google', (req: Request, res: Response) => {
  res.json({
    platform: 'google',
    campaigns: generateMockCampaigns('google'),
  })
})

// GET /api/campaigns/:id
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const platform = id.split('_')[0]
  const campaigns = generateMockCampaigns(platform)
  const campaign = campaigns.find(c => c.id === id)

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' })
  }

  res.json(campaign)
})

export default router
