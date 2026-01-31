import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import type { Agent } from '../types'
import { agentService } from '../services/api'

export const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgents()
  }, [])

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

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-emerald-500/20 text-emerald-400',
      inactive: 'bg-slate-500/20 text-slate-400',
      error: 'bg-red-500/20 text-red-400'
    }
    return colors[status as keyof typeof colors] || colors.inactive
  }

  return React.createElement('div',
    { className: 'space-y-6' },
    React.createElement('div',
      { className: 'flex items-center justify-between' },
      React.createElement('h1', { className: 'text-3xl font-bold gradient-text' }, 'Agents'),
      React.createElement('button',
        { className: 'flex items-center gap-2 px-4 py-2 bg-aegis-500 hover:bg-aegis-600 rounded-lg text-white font-medium transition-colors' },
        React.createElement(Plus, { size: 20 }),
        'New Agent'
      )
    ),

    React.createElement('div',
      { className: 'glass rounded-lg overflow-hidden' },
      React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full' },
          React.createElement('thead',
            { className: 'border-b border-slate-700' },
            React.createElement('tr',
              { className: 'bg-slate-800/50' },
              React.createElement('th', { className: 'px-6 py-3 text-left text-sm font-semibold text-slate-300' }, 'Name'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-sm font-semibold text-slate-300' }, 'Type'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-sm font-semibold text-slate-300' }, 'Status'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-sm font-semibold text-slate-300' }, 'Tasks'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-sm font-semibold text-slate-300' }, 'Success Rate'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-sm font-semibold text-slate-300' }, 'Actions')
            )
          ),
          React.createElement('tbody',
            { className: 'divide-y divide-slate-700' },
            loading ? React.createElement('tr', {},
              React.createElement('td', { colSpan: 6, className: 'px-6 py-4 text-center text-slate-400' }, 'Loading...')
            ) :
            agents.map(agent =>
              React.createElement('tr',
                { key: agent.id, className: 'hover:bg-slate-800/30 transition-colors' },
                React.createElement('td', { className: 'px-6 py-4 text-sm text-white' }, agent.name),
                React.createElement('td', { className: 'px-6 py-4 text-sm text-slate-400' }, agent.type),
                React.createElement('td', { className: 'px-6 py-4 text-sm' },
                  React.createElement('span', { className: `px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(agent.status)}` }, agent.status)
                ),
                React.createElement('td', { className: 'px-6 py-4 text-sm text-slate-300' }, agent.task_count),
                React.createElement('td', { className: 'px-6 py-4 text-sm text-slate-300' }, `${agent.success_rate}%`),
                React.createElement('td', { className: 'px-6 py-4 text-sm flex gap-2' },
                  React.createElement('button', { className: 'p-2 hover:bg-slate-700 rounded transition-colors' },
                    React.createElement(Edit2, { size: 16, className: 'text-slate-400' })
                  ),
                  React.createElement('button', { className: 'p-2 hover:bg-red-500/10 rounded transition-colors' },
                    React.createElement(Trash2, { size: 16, className: 'text-red-400' })
                  )
                )
              )
            )
          )
        )
      )
    )
  )
}
