import { Response } from 'express'
import { query } from '../config/database'
import { AuthRequest } from '../middleware/auth'

export const getAgents = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId

    const result = await query(`
      SELECT 
        cb.function_name,
        cb.is_open,
        cb.failure_count,
        cb.last_success_time,
        cb.last_failure_time,
        (SELECT COUNT(*) FROM ads.decisions WHERE rule = REPLACE(cb.function_name, 'autopilot_', '') AND decision_day = CURRENT_DATE) as decisions_today
      FROM ops.autopilot_circuit_breaker cb
      ORDER BY cb.function_name
    `, [])

    const agents = [
      {
        id: 'SENTINEL-A1',
        name: 'Stop-Loss Guardian',
        type: 'stoploss',
        platform: 'All',
        status: result.rows.find(r => r.function_name === 'autopilot_stoploss')?.is_open ? 'error' : 'active',
        lastAction: 'Monitoring ROAS thresholds',
        decisionsToday: result.rows.find(r => r.function_name === 'autopilot_stoploss')?.decisions_today || 0,
        savings: 234
      },
      {
        id: 'GUARDIAN-B2',
        name: 'Scale Optimizer',
        type: 'scale',
        platform: 'All',
        status: result.rows.find(r => r.function_name === 'autopilot_scale')?.is_open ? 'error' : 'active',
        lastAction: 'Identifying growth opportunities',
        decisionsToday: result.rows.find(r => r.function_name === 'autopilot_scale')?.decisions_today || 0,
        savings: 189
      },
      {
        id: 'PHANTOM-C3',
        name: 'Action Executor',
        type: 'executor',
        platform: 'All',
        status: result.rows.find(r => r.function_name === 'execute_pending_actions')?.is_open ? 'error' : 'active',
        lastAction: 'Executing approved decisions',
        decisionsToday: 0,
        savings: 156
      },
      {
        id: 'CIPHER-D4',
        name: 'Google Ads Specialist',
        type: 'google',
        platform: 'Google Ads',
        status: 'active',
        lastAction: 'Optimizing keyword bids',
        decisionsToday: 12,
        savings: 312
      },
      {
        id: 'NEXUS-E5',
        name: 'Meta Ads Specialist',
        type: 'meta',
        platform: 'Meta Ads',
        status: 'active',
        lastAction: 'Analyzing audience performance',
        decisionsToday: 8,
        savings: 278
      }
    ]

    res.json(agents)
  } catch (error) {
    console.error('Get agents error:', error)
    res.status(500).json({ error: 'Failed to fetch agents' })
  }
}

export const getAgentActivity = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId
    const limit = parseInt(req.query.limit as string) || 20

    const result = await query(`
      SELECT 
        d.decision_id,
        d.platform,
        d.level,
        d.entity_id,
        d.rule,
        d.decision_type,
        d.decision_action,
        d.reason,
        d.status,
        d.created_at,
        d.action_value
      FROM ads.decisions d
      WHERE d.tenant_id = $1
      ORDER BY d.created_at DESC
      LIMIT $2
    `, [tenantId, limit])

    const activities = result.rows.map(row => ({
      id: row.decision_id,
      action: row.reason || `${row.decision_action} on ${row.entity_id}`,
      platform: row.platform,
      time: row.created_at,
      impact: row.action_value ? `$${row.action_value}` : row.decision_action,
      type: row.rule === 'stop_loss' ? 'optimization' : row.rule === 'scale' ? 'insight' : 'alert',
      status: row.status
    }))

    res.json(activities)
  } catch (error) {
    console.error('Agent activity error:', error)
    res.status(500).json({ error: 'Failed to fetch activity' })
  }
}

export const getAgentStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId

    const todayStats = await query(`
      SELECT 
        COUNT(*) as total_decisions,
        COUNT(*) FILTER (WHERE status = 'executed') as executed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE mode = 'auto') as auto_decisions
      FROM ads.decisions
      WHERE tenant_id = $1 AND decision_day = CURRENT_DATE
    `, [tenantId])

    const weekStats = await query(`
      SELECT 
        decision_day,
        COUNT(*) as decisions,
        COUNT(*) FILTER (WHERE status = 'executed') as executed
      FROM ads.decisions
      WHERE tenant_id = $1 AND decision_day >= CURRENT_DATE - 7
      GROUP BY decision_day
      ORDER BY decision_day
    `, [tenantId])

    const savingsEstimate = await query(`
      SELECT COALESCE(SUM(action_value), 0) as total_savings
      FROM ads.decisions
      WHERE tenant_id = $1 
        AND decision_day >= CURRENT_DATE - 30
        AND status = 'executed'
        AND decision_type = 'stop_loss'
    `, [tenantId])

    res.json({
      today: {
        total: parseInt(todayStats.rows[0].total_decisions) || 0,
        executed: parseInt(todayStats.rows[0].executed) || 0,
        pending: parseInt(todayStats.rows[0].pending) || 0,
        auto: parseInt(todayStats.rows[0].auto_decisions) || 0
      },
      weeklyTrend: weekStats.rows.map(row => ({
        date: row.decision_day,
        decisions: parseInt(row.decisions),
        executed: parseInt(row.executed)
      })),
      totalSavings: parseFloat(savingsEstimate.rows[0].total_savings) || 0,
      activeAgents: 5
    })
  } catch (error) {
    console.error('Agent stats error:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
}

export const approveDecision = async (req: AuthRequest, res: Response) => {
  try {
    const { decisionId } = req.params
    const userId = req.user?.userId

    await query(`
      UPDATE ads.decisions 
      SET status = 'approved', executed_by = $2, executed_at = NOW()
      WHERE decision_id = $1
    `, [decisionId, userId])

    res.json({ success: true, message: 'Decision approved' })
  } catch (error) {
    console.error('Approve decision error:', error)
    res.status(500).json({ error: 'Failed to approve decision' })
  }
}

export const rejectDecision = async (req: AuthRequest, res: Response) => {
  try {
    const { decisionId } = req.params
    const userId = req.user?.userId

    await query(`
      UPDATE ads.decisions 
      SET status = 'rejected', executed_by = $2, executed_at = NOW()
      WHERE decision_id = $1
    `, [decisionId, userId])

    res.json({ success: true, message: 'Decision rejected' })
  } catch (error) {
    console.error('Reject decision error:', error)
    res.status(500).json({ error: 'Failed to reject decision' })
  }
}
