import React, { useState, useEffect } from 'react'
import { Zap, Activity, CheckCircle, BarChart3, HelpCircle } from 'lucide-react'
import { StatCard } from '../components/StatCard'
import { AgentList } from '../components/AgentList'
import { TaskChart } from '../components/Chart'
import type { DashboardStats } from '../types'
import { dashboardService } from '../services/api'
import { mockDashboardStats } from '../services/mockData'

// Composant d'info-bulle pour expliquer les termes techniques
const InfoTooltip = ({ text }: { text: string }) => 
  React.createElement('span', { 
    title: text, 
    className: 'ml-1 text-slate-500 cursor-help hover:text-slate-300 transition-colors inline-flex items-center'
  }, React.createElement(HelpCircle, { size: 13 }))

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>(mockDashboardStats)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await dashboardService.getStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to load stats:', error)
      }
    }
    loadStats()
  }, [])

  return React.createElement('div', { className: 'space-y-6' },

    // En-tête de bienvenue — clair et rassurant
    React.createElement('div', { className: 'mb-6' },
      React.createElement('h1', { className: 'text-3xl font-bold gradient-text mb-1' }, 
        '👋 Tableau de bord'
      ),
      React.createElement('p', { className: 'text-slate-400 text-sm' }, 
        'Voici un résumé de ce qui se passe sur votre compte AEGIS en ce moment'
      )
    ),

    // Bannière d'aide contextuelle
    React.createElement('div', { className: 'bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 flex items-start gap-3' },
      React.createElement('span', { className: 'text-2xl flex-shrink-0' }, '💡'),
      React.createElement('div', {},
        React.createElement('p', { className: 'text-sm text-slate-300 font-medium' }, 
          'Comment fonctionne ce tableau de bord ?'
        ),
        React.createElement('p', { className: 'text-xs text-slate-500 mt-0.5' }, 
          'Les 4 chiffres ci-dessous résument l\'activité de vos robots IA. Le graphique montre leur travail sur les 7 derniers jours. La liste à droite affiche leur état en temps réel.'
        )
      )
    ),

    // 4 cartes de stats avec titres simples et explications
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' },
      React.createElement(StatCard, { 
        title: '🤖 Robots configurés', 
        value: stats.total_agents, 
        icon: React.createElement(Zap, { size: 24, className: 'text-white' }), 
        color: 'blue', 
        trend: 12,
        subtitle: 'Nombre total d\'assistants IA'
      }),
      React.createElement(StatCard, { 
        title: '✅ Robots actifs', 
        value: stats.active_agents, 
        icon: React.createElement(Activity, { size: 24, className: 'text-white' }), 
        color: 'green', 
        trend: 8,
        subtitle: 'En train de travailler maintenant'
      }),
      React.createElement(StatCard, { 
        title: '📋 Tâches effectuées', 
        value: stats.total_tasks, 
        icon: React.createElement(CheckCircle, { size: 24, className: 'text-white' }), 
        color: 'purple', 
        trend: 24,
        subtitle: 'Actions réalisées au total'
      }),
      React.createElement(StatCard, { 
        title: '🎯 Taux de réussite', 
        value: `${stats.success_rate ?? 95}%`, 
        icon: React.createElement(BarChart3, { size: 24, className: 'text-white' }), 
        color: 'amber', 
        trend: 3,
        subtitle: 'Pourcentage de tâches réussies'
      })
    ),

    // Graphique + liste des robots
    React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
      React.createElement('div', { className: 'lg:col-span-2' },
        React.createElement(TaskChart, {})
      ),
      React.createElement(AgentList, {})
    )
  )
}
