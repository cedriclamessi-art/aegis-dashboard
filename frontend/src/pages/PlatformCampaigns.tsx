import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { TrendingUp, TrendingDown, Zap, AlertCircle, BarChart3 } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status: 'active' | 'paused' | 'ended'
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  ctr: string
  cpc: string
  roi: number
}

export const PlatformCampaignsPage = () => {
  const { platform } = useParams<{ platform: string }>()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCampaigns = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/v1/campaigns/${platform}`)
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      } catch (error) {
        console.error('Error loading campaigns:', error)
      } finally {
        setLoading(false)
      }
    }

    if (platform) {
      loadCampaigns()
    }
  }, [platform])

  const getPlatformName = () => {
    const names: any = {
      tiktok: 'TikTok Ads',
      meta: 'Meta/Facebook',
      google: 'Google Ads',
    }
    return names[platform!] || 'Plateforme'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      case 'ended':
        return 'bg-red-500/20 text-red-400 border border-red-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400'
    }
  }

  return React.createElement('div',
    { className: 'min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white' },
    
    React.createElement('div', { className: 'max-w-7xl mx-auto px-8 py-12' },
      
      React.createElement('div', { className: 'mb-12 flex items-center justify-between' },
        React.createElement('div', {},
          React.createElement('h1', { className: 'text-4xl font-bold mb-2' }, `Campagnes ${getPlatformName()}`),
          React.createElement('p', { className: 'text-slate-300' }, `${campaigns.length} campagne(s) trouvée(s)`)
        ),
        React.createElement('a',
          { href: '/connected-accounts', className: 'px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors' },
          '← Retour'
        )
      ),

      loading ? React.createElement('div', { className: 'text-center py-12' },
        React.createElement(AlertCircle, { size: 48, className: 'text-slate-500 mx-auto mb-4 animate-spin' }),
        React.createElement('p', { className: 'text-slate-400' }, 'Chargement des campagnes...')
      ) : campaigns.length === 0 ? React.createElement('div', { className: 'text-center py-12' },
        React.createElement(Zap, { size: 48, className: 'text-slate-500 mx-auto mb-4' }),
        React.createElement('p', { className: 'text-slate-400' }, 'Aucune campagne trouvée')
      ) : React.createElement('div', { className: 'space-y-4' },
        campaigns.map((campaign) => {
          const spentPercent = (campaign.spent / campaign.budget) * 100
          const roi = campaign.roi

          return React.createElement('div',
            { key: campaign.id, className: 'glass-dark p-6 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-colors' },
            
            React.createElement('div', { className: 'flex items-start justify-between mb-4' },
              React.createElement('div', { className: 'flex-1' },
                React.createElement('h3', { className: 'text-xl font-semibold mb-1' }, campaign.name),
                React.createElement('p', { className: 'text-sm text-slate-400' }, campaign.id)
              ),
              React.createElement('span', { className: `px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(campaign.status)}` },
                campaign.status === 'active' ? '✓ Actif' : campaign.status === 'paused' ? '⏸ En pause' : '✕ Terminé'
              )
            ),

            React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-6 gap-4 mb-4' },
              [
                { label: 'Budget', value: `$${campaign.budget}`, icon: null },
                { label: 'Dépenses', value: `$${campaign.spent}`, icon: null },
                { label: 'Impressions', value: campaign.impressions, icon: null },
                { label: 'Clics', value: campaign.clicks, icon: null },
                { label: 'Conversions', value: campaign.conversions, icon: null },
                { label: 'ROI', value: `${roi}%`, icon: roi > 0 ? 'up' : 'down' },
              ].map((stat, idx) =>
                React.createElement('div', { key: idx, className: 'bg-slate-800/50 p-3 rounded-lg' },
                  React.createElement('p', { className: 'text-xs text-slate-400 mb-1' }, stat.label),
                  React.createElement('div', { className: 'flex items-center gap-1' },
                    React.createElement('p', { className: 'text-lg font-semibold' }, stat.value),
                    stat.icon === 'up' && React.createElement(TrendingUp, { size: 16, className: 'text-green-400' }),
                    stat.icon === 'down' && React.createElement(TrendingDown, { size: 16, className: 'text-red-400' })
                  )
                )
              )
            ),

            React.createElement('div', { className: 'mb-3' },
              React.createElement('div', { className: 'flex justify-between mb-1' },
                React.createElement('span', { className: 'text-xs text-slate-400' }, 'Budget utilisé'),
                React.createElement('span', { className: 'text-sm font-semibold text-cyan-400' }, `${spentPercent.toFixed(1)}%`)
              ),
              React.createElement('div', { className: 'w-full bg-slate-800 rounded-full h-2' },
                React.createElement('div',
                  { className: 'bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full', style: { width: `${Math.min(spentPercent, 100)}%` } }
                )
              )
            ),

            React.createElement('div', { className: 'grid grid-cols-3 md:grid-cols-3 gap-2 text-xs' },
              React.createElement('div', { className: 'bg-slate-800/50 p-2 rounded' },
                React.createElement('p', { className: 'text-slate-500' }, 'CTR'),
                React.createElement('p', { className: 'font-semibold' }, `${campaign.ctr}%`)
              ),
              React.createElement('div', { className: 'bg-slate-800/50 p-2 rounded' },
                React.createElement('p', { className: 'text-slate-500' }, 'CPC'),
                React.createElement('p', { className: 'font-semibold' }, `$${campaign.cpc}`)
              ),
              React.createElement('div', { className: 'bg-slate-800/50 p-2 rounded' },
                React.createElement('a',
                  { href: `/metrics/${campaign.id}`, className: 'flex items-center gap-1 text-cyan-400 hover:text-cyan-300' },
                  React.createElement(BarChart3, { size: 14 }),
                  'Détails'
                )
              )
            )
          )
        })
      )
    )
  )
}

export default PlatformCampaignsPage
