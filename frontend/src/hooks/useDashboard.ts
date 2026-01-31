import { useState, useEffect } from 'react'
import type { DashboardStats } from '../types'
import { dashboardService } from '../services/api'

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await dashboardService.getStats()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return { stats, loading, error }
}
