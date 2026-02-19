import React, { useState, useEffect } from 'react'
import { Crown, Zap, CheckCircle, XCircle, PauseCircle } from 'lucide-react'
import type { Agent } from '../types'
import { agentService } from '../services/api'
import { mockAgents } from '../services/mockData'

interface AgentListProps {
  limit?: number
  showPremiumBadge?: boolean
}

// Traduit le statut technique en langage compréhensible
const getStatusLabel = (status: string) => {
  const labels: Record<string, { text: string; color: string; icon: any }> = {
    active:   { text: 'En marche ✅', color: 'text-emerald-400', icon: CheckCircle },
    inactive: { text: 'En pause ⏸️',   color: 'text-slate-400',   icon: PauseCircle },
    error:    { text: 'Erreur ⚠️',     color: 'text-red-400',     icon: XCircle },
  }
  return labels[status] || { text: status, color: 'text-slate-400', icon: PauseCircle }
}

// Traduit le rôle technique en description métier simple
const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    content_creation: 'Crée du contenu',
    optimization:     'Optimise les pubs',
    analytics:        'Analyse les données',
    intelligence:     'Intelligence marché',
    engagement:       'Gère l\'engagement',
    conversion:       'Améliore les ventes',
    inventory:        'Gère l\'inventaire',
    strategy:         'Stratégie globale',
    reporting:        'Génère des rapports',
    orchestration:    'Coordonne les agents',
    compliance:       'Vérifie la conformité',
    audit:            'Audit et contrôle',
    sentiment:        'Analyse l\'opinion',
    growth:           'Croissance',
    crisis:           'Gestion de crise',
  }
  return labels[role] || role.replace(/_/g, ' ')
}

const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    content_creation: 'bg-purple-500/20 text-purple-400',
    optimization: 'bg-blue-500/20 text-blue-400',
    analytics: 'bg-cyan-500/20 text-cyan-400',
    intelligence: 'bg-amber-500/20 text-amber-400',
    engagement: 'bg-pink-500/20 text-pink-400',
    conversion: 'bg-green-500/20 text-green-400',
    inventory: 'bg-orange-500/20 text-orange-400',
    strategy: 'bg-indigo-500/20 text-indigo-400',
    reporting: 'bg-teal-500/20 text-teal-400',
    orchestration: 'bg-violet-500/20 text-violet-400',
    compliance: 'bg-rose-500/20 text-rose-400',
    audit: 'bg-fuchsia-500/20 text-fuchsia-400',
    sentiment: 'bg-sky-500/20 text-sky-400',
    growth: 'bg-lime-500/20 text-lime-400',
    crisis: 'bg-red-500/20 text-red-400',
  }
  return colors[role] || 'bg-slate-500/20 text-slate-400'
}

export const AgentList = ({ limit = 8, showPremiumBadge = true }: AgentListProps) => {
  const [agents, setAgents] = useState<Agent[]>(mockAgents)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await agentService.getAll()
        if (data && data.length > 0) { setAgents(data) }
      } catch (error) {
        console.error('Failed to load agents, using mock data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAgents()
  }, [])

  if (loading) {
    return React.createElement('div', { className: 'glass rounded-lg p-6' },
      React.createElement('h2', { className: 'text-lg font-semibold text-white mb-2' }, '🤖 Mes robots IA'),
      React.createElement('p', { className: 'text-xs text-slate-500 mb-4' }, 'Ces assistants automatiques gèrent vos pubs à votre place'),
      React.createElement('div', { className: 'flex items-center justify-center py-8' },
        React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500' })
      )
    )
  }

  const displayAgents = agents.slice(0, limit)
  const activeCount = agents.filter(a => a.status === 'active').length

  return React.createElement('div', { className: 'glass rounded-lg p-6' },
    // En-tête avec explication
    React.createElement('div', { className: 'flex items-center justify-between mb-2' },
      React.createElement('h2', { className: 'text-lg font-semibold text-white' }, '🤖 Mes robots IA'),
      React.createElement('span', { 
        className: 'text-sm text-emerald-400 font-medium',
        title: 'Nombre de robots actuellement actifs sur ' + agents.length + ' au total'
      }, `${activeCount}/${agents.length} actifs`)
    ),
    React.createElement('p', { className: 'text-xs text-slate-500 mb-4' }, 
      'Ces assistants travaillent automatiquement pour optimiser vos publicités'
    ),

    // Liste des agents
    React.createElement('div', { className: 'space-y-2' },
      displayAgents.map(agent => {
        const statusInfo = getStatusLabel(agent.status)
        return React.createElement('div', { 
          key: agent.id, 
          className: 'flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer',
          title: `${agent.displayName} — ${getRoleLabel(agent.role)}`
        },
          React.createElement('div', { className: 'flex items-center gap-3 flex-1 min-w-0' },
            // Icône de rôle
            React.createElement('div', { className: `p-2 rounded-lg ${getRoleColor(agent.role)}` },
              React.createElement(Zap, { size: 16 })
            ),
            React.createElement('div', { className: 'min-w-0 flex-1' },
              // Nom + badge premium
              React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement('p', { className: 'font-medium text-white truncate text-sm' }, agent.displayName),
                showPremiumBadge && agent.isPremium && 
                  React.createElement(Crown, { size: 12, className: 'text-amber-400 flex-shrink-0', title: 'Agent Premium' })
              ),
              // Rôle en langage clair + statut
              React.createElement('div', { className: 'flex items-center gap-2 mt-0.5' },
                React.createElement('span', { className: `text-xs ${statusInfo.color}` }, statusInfo.text),
                React.createElement('span', { className: 'text-slate-600' }, '·'),
                React.createElement('span', { className: 'text-xs text-slate-500' }, getRoleLabel(agent.role))
              )
            )
          ),
          // Taux de réussite
          React.createElement('div', { 
            className: 'text-right flex-shrink-0 ml-4',
            title: `Taux de réussite : ${agent.success_rate}% sur ${agent.task_count.toLocaleString()} tâches effectuées`
          },
            React.createElement('p', { className: 'text-sm font-semibold text-white' }, `${agent.success_rate}%`),
            React.createElement('p', { className: 'text-xs text-slate-500' }, 'réussite')
          )
        )
      })
    ),

    // Lien "voir tout"
    agents.length > limit && React.createElement('div', { className: 'mt-4 text-center' },
      React.createElement('a', { 
        href: '/agents',
        className: 'text-sm text-cyan-400 hover:text-cyan-300 transition-colors'
      }, `Voir tous les ${agents.length} robots →`)
    )
  )
}
