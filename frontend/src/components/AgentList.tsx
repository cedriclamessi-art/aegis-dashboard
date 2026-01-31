import React, { useState, useEffect } from 'react'
import { Activity, AlertCircle, CheckCircle } from 'lucide-react'
import type { Agent } from '../types'
import { agentService } from '../services/api'

export const AgentList = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await agentService.getAll()
        setAgents(data)
      } catch (error) {
        console.error('Failed to load agents:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAgents()
  }, [])

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return React.createElement(CheckCircle, { size: 16, className: 'text-emerald-400' })
      case 'inactive': return React.createElement(Activity, { size: 16, className: 'text-slate-400' })
      case 'error': return React.createElement(AlertCircle, { size: 16, className: 'text-red-400' })
      default: return null
    }
  }

  return React.createElement('div',
    { className: 'glass rounded-lg p-6' },
    React.createElement('h2', { className: 'text-lg font-semibold text-white mb-4' }, 'Active Agents'),
    loading ? React.createElement('p', { className: 'text-slate-400' }, 'Loading...') :
    React.createElement('div', { className: 'space-y-3' },
      agents.slice(0, 5).map(agent =>
        React.createElement('div',
          { key: agent.id, className: 'flex items-center justify-between p-3 bg-slate-800/50 rounded-lg' },
          React.createElement('div', { className: 'flex items-center gap-3' },
            getStatusIcon(agent.status),
            React.createElement('div',
              {},
              React.createElement('p', { className: 'font-medium text-white' }, agent.name),
              React.createElement('p', { className: 'text-xs text-slate-400' }, agent.type)
            )
          ),
          React.createElement('div', { className: 'text-right' },
            React.createElement('p', { className: 'text-sm font-semibold text-white' }, `${agent.success_rate}%`),
            React.createElement('p', { className: 'text-xs text-slate-400' }, `${agent.task_count} tasks`)
          )
        )
      )
    )
  )
}
