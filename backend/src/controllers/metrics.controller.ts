import { Response } from 'express'
import { query } from '../config/database'
import { AuthRequest } from '../middleware/auth'

export const getDashboardMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId

    const metricsResult = await query(`
      SELECT 
        COALESCE(SUM(spend), 0) as total_spend,
        COALESCE(SUM(conversion_value), 0) as total_revenue,
        COALESCE(SUM(conversions), 0) as total_conversions,
        COALESCE(SUM(clicks), 0) as total_clicks,
        COALESCE(SUM(impressions), 0) as total_impressions,
        CASE WHEN SUM(spend) > 0 THEN SUM(conversion_value) / SUM(spend) ELSE 0 END as roas,
        CASE WHEN SUM(impressions) > 0 THEN (SUM(clicks)::decimal / SUM(impressions)) * 100 ELSE 0 END as ctr
      FROM ads.metrics_daily
      WHERE tenant_id = $1 AND day >= CURRENT_DATE - 30
    `, [tenantId])

    const previousResult = await query(`
      SELECT 
        COALESCE(SUM(spend), 0) as total_spend,
        COALESCE(SUM(conversion_value), 0) as total_revenue,
        COALESCE(SUM(conversions), 0) as total_conversions
      FROM ads.metrics_daily
      WHERE tenant_id = $1 AND day >= CURRENT_DATE - 60 AND day < CURRENT_DATE - 30
    `, [tenantId])

    const current = metricsResult.rows[0]
    const previous = previousResult.rows[0]

    const calculateChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return ((curr - prev) / prev) * 100
    }

    res.json({
      revenue: {
        value: parseFloat(current.total_revenue) || 0,
        change: calculateChange(parseFloat(current.total_revenue), parseFloat(previous.total_revenue))
      },
      spend: {
        value: parseFloat(current.total_spend) || 0,
        change: calculateChange(parseFloat(current.total_spend), parseFloat(previous.total_spend))
      },
      roas: {
        value: parseFloat(current.roas) || 0,
        change: 0
      },
      conversions: {
        value: parseInt(current.total_conversions) || 0,
        change: calculateChange(parseInt(current.total_conversions), parseInt(previous.total_conversions))
      },
      ctr: {
        value: parseFloat(current.ctr) || 0,
        change: 0
      }
    })
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    res.status(500).json({ error: 'Failed to fetch metrics' })
  }
}

export const getRevenueChart = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId
    const days = parseInt(req.query.days as string) || 30

    const result = await query(`
      SELECT 
        day,
        SUM(spend) as spend,
        SUM(conversion_value) as revenue,
        SUM(conversions) as conversions
      FROM ads.metrics_daily
      WHERE tenant_id = $1 AND day >= CURRENT_DATE - $2
      GROUP BY day
      ORDER BY day ASC
    `, [tenantId, days])

    res.json(result.rows.map(row => ({
      date: row.day,
      revenue: parseFloat(row.revenue) || 0,
      spend: parseFloat(row.spend) || 0,
      conversions: parseInt(row.conversions) || 0
    })))
  } catch (error) {
    console.error('Revenue chart error:', error)
    res.status(500).json({ error: 'Failed to fetch chart data' })
  }
}

export const getPlatformBreakdown = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId

    const result = await query(`
      SELECT 
        platform,
        SUM(spend) as spend,
        SUM(conversion_value) as revenue,
        SUM(conversions) as conversions
      FROM ads.metrics_daily
      WHERE tenant_id = $1 AND day >= CURRENT_DATE - 30
      GROUP BY platform
      ORDER BY spend DESC
    `, [tenantId])

    const total = result.rows.reduce((acc, row) => acc + parseFloat(row.spend), 0)

    res.json(result.rows.map(row => ({
      platform: row.platform,
      spend: parseFloat(row.spend) || 0,
      revenue: parseFloat(row.revenue) || 0,
      conversions: parseInt(row.conversions) || 0,
      percentage: total > 0 ? (parseFloat(row.spend) / total) * 100 : 0
    })))
  } catch (error) {
    console.error('Platform breakdown error:', error)
    res.status(500).json({ error: 'Failed to fetch platform data' })
  }
}

export const getCampaigns = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId
    const platform = req.query.platform as string

    let platformQuery = ''
    const params: any[] = [tenantId]
    
    if (platform) {
      platformQuery = 'AND platform = $2'
      params.push(platform)
    }

    const result = await query(`
      SELECT 
        entity_id,
        platform,
        SUM(spend) as spend,
        SUM(conversion_value) as revenue,
        SUM(conversions) as conversions,
        CASE WHEN SUM(spend) > 0 THEN SUM(conversion_value) / SUM(spend) ELSE 0 END as roas
      FROM ads.metrics_daily
      WHERE tenant_id = $1 ${platformQuery} AND day >= CURRENT_DATE - 7
      GROUP BY entity_id, platform
      ORDER BY spend DESC
      LIMIT 20
    `, params)

    res.json(result.rows.map(row => ({
      id: row.entity_id,
      platform: row.platform,
      spend: parseFloat(row.spend) || 0,
      revenue: parseFloat(row.revenue) || 0,
      conversions: parseInt(row.conversions) || 0,
      roas: parseFloat(row.roas) || 0,
      status: 'active'
    })))
  } catch (error) {
    console.error('Campaigns error:', error)
    res.status(500).json({ error: 'Failed to fetch campaigns' })
  }
}

export const getGoalProgress = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId

    const currentMonth = await query(`
      SELECT COALESCE(SUM(conversion_value), 0) as revenue
      FROM ads.metrics_daily
      WHERE tenant_id = $1 
        AND day >= DATE_TRUNC('month', CURRENT_DATE)
    `, [tenantId])

    const target = 50000
    const current = parseFloat(currentMonth.rows[0].revenue) || 0
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const currentDay = new Date().getDate()
    const daysRemaining = daysInMonth - currentDay

    res.json({
      current,
      target,
      percentage: Math.min((current / target) * 100, 100),
      daysRemaining,
      dailyAverage: currentDay > 0 ? current / currentDay : 0,
      requiredDaily: daysRemaining > 0 ? (target - current) / daysRemaining : 0
    })
  } catch (error) {
    console.error('Goal progress error:', error)
    res.status(500).json({ error: 'Failed to fetch goal progress' })
  }
}
