import React, { useState, useEffect } from 'react'
import { 
  Plus, Trash2, Edit2, Crown, Search, Zap,
  Activity, Play, Pause, Bot, Sparkles,
  Clock, Target, TrendingUp, BarChart3
} from 'lucide-react'
import type { Agent } from '../types'
import { agentService } from '../services/api'
import { mockAgents } from '../services/mockData'

type FilterStatus = 'all' | 'active' | 'inactive' | 'error'
type FilterPremium = 'all' | 'premium' | 'free'

export const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>(mockAgents)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPremium, setFilterPremium] = useState<FilterPremium>('all')
  const [filterRole] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const data = await agentService.getAll()
      if (data && data.length > 0) {
        setAgents(data)
      }
    } catch (error) {
      console.error('Failed to load agents, using mock data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus
    const matchesPremium = 
      filterPremium === 'all' || 
      (filterPremium === 'premium' && agent.isPremium) ||
      (filterPremium === 'free' && !agent.isPremium)
    const matchesRole = filterRole === 'all' || agent.role === filterRole

    return matchesSearch && matchesStatus && matchesPremium && matchesRole
  })

  const getRoleColor = (role: string) => {
    const colors: Record<string, { bg: string, text: string, border: string }> = {
      content_creation: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
      optimization: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
      analytics: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
      intelligence: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
      engagement: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
      conversion: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
      inventory: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
      strategy: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
      reporting: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
      orchestration: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
      compliance: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
      audit: { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
      sentiment: { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/30' },
      growth: { bg: 'bg-lime-500/20', text: 'text-lime-400', border: 'border-lime-500/30' },
      crisis: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    }
    return colors[role] || { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatLastExecution = (date: string | null) => {
    if (!date) return 'Jamais'
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'À l\'instant'
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${Math.floor(hours / 24)}j`
  }

  const activeCount = agents.filter(a => a.status === 'active').length
  const premiumCount = agents.filter(a => a.isPremium).length
  const totalTasks = agents.reduce((sum, a) => sum + a.task_count, 0)
  const avgSuccess = Math.round(agents.reduce((sum, a) => sum + a.success_rate, 0) / agents.length)

  return React.createElement('div', { className: 'min-h-screen bg-[var(--cyber-dark)] cyber-grid p-6' },
    React.createElement('div', { className: 'max-w-[1600px] mx-auto space-y-6' },
    
      React.createElement('div', { className: 'flex flex-col md:flex-row md:items-center justify-between gap-4' },
        React.createElement('div', {},
          React.createElement('h1', { className: 'text-3xl font-bold cyber-text flex items-center gap-3' },
            React.createElement(Bot, { size: 32, className: 'text-cyan-400' }),
            'Agents IA'
          ),
          React.createElement('p', { className: 'text-slate-400 mt-1' }, 
            `${agents.length} agents configurés, ${activeCount} actifs`
          )
        ),
        React.createElement('button', { className: 'cyber-button flex items-center gap-2' },
          React.createElement(Plus, { size: 20 }),
          'Nouvel Agent'
        )
      ),

      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
        [
          { label: 'Total Agents', value: agents.length, icon: Bot, color: 'cyan' },
          { label: 'Agents Actifs', value: activeCount, icon: Activity, color: 'green' },
          { label: 'Tâches Totales', value: totalTasks.toLocaleString(), icon: Target, color: 'purple' },
          { label: 'Taux Succès Moyen', value: `${avgSuccess}%`, icon: TrendingUp, color: 'orange' },
        ].map((stat, idx) =>
          React.createElement('div', { key: idx, className: 'cyber-card p-4' },
            React.createElement('div', { className: 'flex items-center gap-3' },
              React.createElement('div', {
                className: `p-2.5 rounded-lg ${
                  stat.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                  stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
                  stat.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-orange-500/20 text-orange-400'
                }`
              },
                React.createElement(stat.icon, { size: 20 })
              ),
              React.createElement('div', {},
                React.createElement('p', { className: 'text-xs text-slate-500 font-mono uppercase' }, stat.label),
                React.createElement('p', { className: 'text-xl font-bold text-white' }, stat.value)
              )
            )
          )
        )
      ),

      React.createElement('div', { className: 'cyber-card p-4' },
        React.createElement('div', { className: 'flex flex-wrap items-center gap-4' },
          React.createElement('div', { className: 'relative flex-1 min-w-[200px]' },
            React.createElement(Search, { 
              size: 18, 
              className: 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-500' 
            }),
            React.createElement('input', {
              type: 'text',
              placeholder: 'Rechercher agents...',
              value: searchQuery,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
              className: 'w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors'
            })
          ),
          React.createElement('select', {
            value: filterStatus,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value as FilterStatus),
            className: 'px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer'
          },
            React.createElement('option', { value: 'all' }, 'Tous Status'),
            React.createElement('option', { value: 'active' }, 'Actifs'),
            React.createElement('option', { value: 'inactive' }, 'Inactifs'),
            React.createElement('option', { value: 'error' }, 'Erreur')
          ),
          React.createElement('select', {
            value: filterPremium,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setFilterPremium(e.target.value as FilterPremium),
            className: 'px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer'
          },
            React.createElement('option', { value: 'all' }, 'Tous Plans'),
            React.createElement('option', { value: 'premium' }, 'Premium'),
            React.createElement('option', { value: 'free' }, 'Gratuit')
          ),
          React.createElement('button', {
            onClick: () => setViewMode(viewMode === 'grid' ? 'table' : 'grid'),
            className: 'px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-cyan-400 hover:border-cyan-500/50 transition-colors flex items-center gap-2'
          },
            React.createElement(viewMode === 'grid' ? BarChart3 : Sparkles, { size: 16 }),
            viewMode === 'grid' ? 'Tableau' : 'Grille'
          )
        )
      ),

      loading ? React.createElement('div', { className: 'cyber-card p-12 text-center' },
        React.createElement('div', { className: 'inline-block animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent' })
      ) :
      filteredAgents.length === 0 ? React.createElement('div', { className: 'cyber-card p-12 text-center' },
        React.createElement(Bot, { size: 48, className: 'mx-auto text-slate-600 mb-4' }),
        React.createElement('p', { className: 'text-slate-400' }, 'Aucun agent trouvé')
      ) :

      viewMode === 'grid' ?
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' },
        filteredAgents.map(agent => {
          const roleColor = getRoleColor(agent.role)
          return React.createElement('div', {
            key: agent.id,
            className: 'cyber-card p-5 hover-lift group'
          },
            React.createElement('div', { className: 'flex items-start justify-between mb-4' },
              React.createElement('div', { className: `p-3 rounded-lg ${roleColor.bg} ${roleColor.text}` },
                React.createElement(Zap, { size: 22 })
              ),
              React.createElement('div', { className: 'flex items-center gap-2' },
                agent.isPremium && React.createElement('div', { 
                  className: 'p-1 rounded bg-amber-500/20',
                  title: 'Premium'
                },
                  React.createElement(Crown, { size: 14, className: 'text-amber-400' })
                ),
                React.createElement('div', {
                  className: `status-dot ${
                    agent.status === 'active' ? 'active' :
                    agent.status === 'error' ? 'error' : 'warning'
                  }`
                })
              )
            ),
            React.createElement('h3', { className: 'text-white font-semibold mb-1' }, agent.displayName),
            React.createElement('p', { className: 'text-xs text-slate-500 mb-4 line-clamp-2' }, agent.description),
            React.createElement('div', { className: 'space-y-3' },
              React.createElement('div', { className: 'flex items-center justify-between text-sm' },
                React.createElement('span', { className: 'text-slate-500' }, 'Tâches'),
                React.createElement('span', { className: 'text-white font-mono' }, agent.task_count.toLocaleString())
              ),
              React.createElement('div', { className: 'flex items-center justify-between text-sm' },
                React.createElement('span', { className: 'text-slate-500' }, 'Succès'),
                React.createElement('div', { className: 'flex items-center gap-2' },
                  React.createElement('div', { className: 'w-16 h-1.5 rounded-full bg-white/10 overflow-hidden' },
                    React.createElement('div', {
                      className: `h-full rounded-full ${
                        agent.success_rate >= 95 ? 'bg-green-500' :
                        agent.success_rate >= 85 ? 'bg-amber-500' : 'bg-red-500'
                      }`,
                      style: { width: `${agent.success_rate}%` }
                    })
                  ),
                  React.createElement('span', { className: 'text-white font-mono' }, `${agent.success_rate}%`)
                )
              ),
              React.createElement('div', { className: 'flex items-center justify-between text-sm' },
                React.createElement('span', { className: 'text-slate-500' }, 'Durée moy.'),
                React.createElement('span', { className: 'text-cyan-400 font-mono' }, formatDuration(agent.avg_duration_ms))
              )
            ),
            React.createElement('div', { className: 'mt-4 pt-4 border-t border-white/5 flex items-center justify-between' },
              React.createElement('span', { className: 'text-xs text-slate-500 flex items-center gap-1' },
                React.createElement(Clock, { size: 12 }),
                formatLastExecution(agent.last_execution_at)
              ),
              React.createElement('div', { className: 'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity' },
                React.createElement('button', { 
                  className: 'p-1.5 rounded hover:bg-white/10 transition-colors',
                  title: agent.status === 'active' ? 'Pause' : 'Start'
                },
                  agent.status === 'active' 
                    ? React.createElement(Pause, { size: 14, className: 'text-slate-400' })
                    : React.createElement(Play, { size: 14, className: 'text-green-400' })
                ),
                React.createElement('button', { 
                  className: 'p-1.5 rounded hover:bg-white/10 transition-colors',
                  title: 'Edit'
                },
                  React.createElement(Edit2, { size: 14, className: 'text-slate-400' })
                )
              )
            )
          )
        })
      ) :

      React.createElement('div', { className: 'cyber-card overflow-hidden' },
        React.createElement('div', { className: 'overflow-x-auto' },
          React.createElement('table', { className: 'w-full' },
            React.createElement('thead', {},
              React.createElement('tr', { className: 'border-b border-white/10' },
                ['Agent', 'Rôle', 'Statut', 'Tâches', 'Succès', 'Durée moy.', 'Dernière exec.', 'Actions'].map(h =>
                  React.createElement('th', { key: h, className: 'px-6 py-4 text-left text-xs font-mono text-slate-500 uppercase' }, h)
                )
              )
            ),
            React.createElement('tbody', {},
              filteredAgents.map(agent => {
                const roleColor = getRoleColor(agent.role)
                return React.createElement('tr', {
                  key: agent.id,
                  className: 'border-b border-white/5 hover:bg-white/5 transition-colors'
                },
                  React.createElement('td', { className: 'px-6 py-4' },
                    React.createElement('div', { className: 'flex items-center gap-3' },
                      React.createElement('div', { className: `p-2 rounded-lg ${roleColor.bg} ${roleColor.text}` },
                        React.createElement(Zap, { size: 16 })
                      ),
                      React.createElement('div', {},
                        React.createElement('div', { className: 'flex items-center gap-2' },
                          React.createElement('span', { className: 'text-white font-medium' }, agent.displayName),
                          agent.isPremium && React.createElement(Crown, { size: 12, className: 'text-amber-400' })
                        ),
                        React.createElement('p', { className: 'text-xs text-slate-500 truncate max-w-[200px]' }, agent.description)
                      )
                    )
                  ),
                  React.createElement('td', { className: 'px-6 py-4' },
                    React.createElement('span', { className: `text-xs px-2 py-1 rounded border ${roleColor.bg} ${roleColor.text} ${roleColor.border}` },
                      agent.role.replace('_', ' ')
                    )
                  ),
                  React.createElement('td', { className: 'px-6 py-4' },
                    React.createElement('div', { className: 'flex items-center gap-2' },
                      React.createElement('div', {
                        className: `status-dot ${
                          agent.status === 'active' ? 'active' :
                          agent.status === 'error' ? 'error' : 'warning'
                        }`
                      }),
                      React.createElement('span', { className: 'text-sm text-white' }, agent.status)
                    )
                  ),
                  React.createElement('td', { className: 'px-6 py-4 font-mono text-slate-300' }, agent.task_count.toLocaleString()),
                  React.createElement('td', { className: 'px-6 py-4' },
                    React.createElement('div', { className: 'flex items-center gap-2' },
                      React.createElement('div', { className: 'w-12 h-1.5 rounded-full bg-white/10 overflow-hidden' },
                        React.createElement('div', {
                          className: `h-full rounded-full ${agent.success_rate >= 95 ? 'bg-green-500' : agent.success_rate >= 85 ? 'bg-amber-500' : 'bg-red-500'}`,
                          style: { width: `${agent.success_rate}%` }
                        })
                      ),
                      React.createElement('span', { className: 'text-sm text-slate-300 font-mono' }, `${agent.success_rate}%`)
                    )
                  ),
                  React.createElement('td', { className: 'px-6 py-4 font-mono text-cyan-400' }, formatDuration(agent.avg_duration_ms)),
                  React.createElement('td', { className: 'px-6 py-4 text-sm text-slate-500' }, formatLastExecution(agent.last_execution_at)),
                  React.createElement('td', { className: 'px-6 py-4' },
                    React.createElement('div', { className: 'flex items-center gap-1' },
                      React.createElement('button', { className: 'p-2 rounded hover:bg-white/10 transition-colors' },
                        agent.status === 'active'
                          ? React.createElement(Pause, { size: 14, className: 'text-slate-400' })
                          : React.createElement(Play, { size: 14, className: 'text-green-400' })
                      ),
                      React.createElement('button', { className: 'p-2 rounded hover:bg-white/10 transition-colors' },
                        React.createElement(Edit2, { size: 14, className: 'text-slate-400' })
                      ),
                      React.createElement('button', { className: 'p-2 rounded hover:bg-red-500/10 transition-colors' },
                        React.createElement(Trash2, { size: 14, className: 'text-red-400' })
                      )
                    )
                  )
                )
              })
            )
          )
        )
      ),

      React.createElement('div', { className: 'cyber-card p-4' },
        React.createElement('div', { className: 'flex items-center justify-between text-sm' },
          React.createElement('span', { className: 'text-slate-500' }, 
            `Affichage ${filteredAgents.length} sur ${agents.length} agents`
          ),
          React.createElement('div', { className: 'flex items-center gap-6' },
            React.createElement('div', { className: 'flex items-center gap-2' },
              React.createElement('div', { className: 'status-dot active' }),
              React.createElement('span', { className: 'text-slate-400' }, `${activeCount} Actifs`)
            ),
            React.createElement('div', { className: 'flex items-center gap-2' },
              React.createElement(Crown, { size: 14, className: 'text-amber-400' }),
              React.createElement('span', { className: 'text-slate-400' }, `${premiumCount} Premium`)
            )
          )
        )
      )
    )
  )
}
