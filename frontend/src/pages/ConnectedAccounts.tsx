import React, { useState, useEffect } from 'react'
import { Zap, Facebook, Chrome, Trash2, AlertCircle } from 'lucide-react'

interface ConnectedPlatform {
  id: string
  platform: 'tiktok' | 'meta' | 'google'
  platform_username: string
  platform_email?: string
  connected_at: string
}

export const ConnectedAccountsPage = () => {
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>([
    {
      id: '1',
      platform: 'tiktok',
      platform_username: 'tiktok_campaign_pro',
      connected_at: new Date().toISOString(),
    },
    {
      id: '2',
      platform: 'meta',
      platform_username: 'Meta Business Account',
      platform_email: 'admin@business.com',
      connected_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      platform: 'google',
      platform_username: 'Google Ads Account',
      platform_email: 'ads@company.com',
      connected_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ])

  useEffect(() => {
    // Charger les plateformes connectées depuis l'API
    const loadPlatforms = async () => {
      try {
        const res = await fetch('/api/v1/auth/oauth/platforms')
        const data = await res.json()
        if (data.length > 0) {
          setPlatforms(data)
        }
      } catch (error) {
        console.error('Error loading platforms:', error)
      }
    }

    loadPlatforms()
  }, [])

  const getPlatformInfo = (platform: string) => {
    const info: any = {
      tiktok: { icon: Zap, color: 'text-black', bg: 'bg-black', name: 'TikTok Ads' },
      meta: { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-600', name: 'Meta/Facebook' },
      google: { icon: Chrome, color: 'text-red-600', bg: 'bg-red-600', name: 'Google Ads' },
    }
    return info[platform]
  }

  const handleDisconnect = async (platformId: string, platform: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir déconnecter ${platform}?`)) return

    try {
      const res = await fetch(`/api/v1/auth/oauth/disconnect/${platform}`, {
        method: 'POST',
      })

      if (res.ok) {
        setPlatforms(platforms.filter((p) => p.id !== platformId))
      }
    } catch (error) {
      console.error('Error disconnecting:', error)
    }
  }

  return React.createElement('div',
    { className: 'min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white' },
    
    React.createElement('div', { className: 'max-w-4xl mx-auto px-8 py-12' },
      
      React.createElement('div', { className: 'mb-12' },
        React.createElement('h1', { className: 'text-4xl font-bold mb-2' }, 'Comptes Connectés'),
        React.createElement('p', { className: 'text-slate-300' }, `${platforms.length} plateforme(s) active(s)`)
      ),

      platforms.length === 0 ? React.createElement('div',
        { className: 'text-center py-12' },
        React.createElement(AlertCircle, { size: 48, className: 'text-slate-500 mx-auto mb-4' }),
        React.createElement('p', { className: 'text-slate-400 mb-6' }, 'Aucune plateforme connectée'),
        React.createElement('a',
          { href: '/connect-platforms', className: 'px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold inline-block' },
          'Connecter une plateforme'
        )
      ) : React.createElement('div',
        { className: 'space-y-4' },
        platforms.map((platform) => {
          const info = getPlatformInfo(platform.platform)
          const IconComponent = info.icon
          
          return React.createElement('div',
            { key: platform.id, className: 'glass-dark p-6 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-colors' },
            React.createElement('div', { className: 'flex items-center justify-between' },
              React.createElement('div', { className: 'flex items-center gap-4' },
                React.createElement('div', { className: `w-12 h-12 ${info.bg} rounded-lg flex items-center justify-center` },
                  React.createElement(IconComponent, { size: 24, className: 'text-white' })
                ),
                React.createElement('div', { className: 'flex-1' },
                  React.createElement('h3', { className: 'text-lg font-semibold' }, info.name),
                  React.createElement('p', { className: 'text-sm text-slate-400' }, platform.platform_username),
                  platform.platform_email && React.createElement('p', { className: 'text-sm text-slate-500' }, platform.platform_email)
                )
              ),
              React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement('span', { className: 'text-xs text-slate-500 px-3 py-1 bg-slate-800 rounded-full' },
                  `Connecté le ${new Date(platform.connected_at).toLocaleDateString('fr-FR')}`
                ),
                React.createElement('button',
                  { 
                    onClick: () => handleDisconnect(platform.id, platform.platform),
                    className: 'p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors'
                  },
                  React.createElement(Trash2, { size: 20 })
                )
              )
            ),
            React.createElement('div', { className: 'mt-4 flex gap-2' },
              React.createElement('a',
                { href: `/campaigns/${platform.platform}`, className: 'flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-center text-sm transition-colors' },
                'Voir les campagnes'
              ),
              React.createElement('a',
                { href: `/metrics/${platform.platform}`, className: 'flex-1 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-cyan-400 text-center text-sm transition-colors' },
                'Métriques'
              )
            )
          )
        })
      )
    )
  )
}

export default ConnectedAccountsPage
