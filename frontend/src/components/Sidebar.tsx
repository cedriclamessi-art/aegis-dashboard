import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Settings, 
  FileText, 
  LogOut, 
  Plug, 
  LayoutDashboard, 
  Bot, 
  LineChart, 
  Layers,
  Home
} from 'lucide-react'

// Chaque item a maintenant un label clair + une description simple
const navItems = [
  { 
    icon: LayoutDashboard, 
    label: '🏠 Accueil', 
    desc: 'Vue générale de vos résultats',
    href: '/dashboard' 
  },
  { 
    icon: Plug, 
    label: '🔗 Connecter mes pubs', 
    desc: 'Relier Meta, Google, TikTok',
    href: '/connect-platforms' 
  },
  { 
    icon: Layers, 
    label: '📢 Mes campagnes', 
    desc: 'Gérer mes publicités actives',
    href: '/connected-accounts' 
  },
  { 
    icon: Bot, 
    label: '🤖 Robots IA', 
    desc: 'Les assistants automatiques',
    href: '/agents' 
  },
  { 
    icon: LineChart, 
    label: '📊 Statistiques', 
    desc: 'Analyser mes performances',
    href: '/analytics' 
  },
  { 
    icon: Settings, 
    label: '⚙️ Paramètres', 
    desc: 'Configurer mon compte',
    href: '/settings' 
  },
]

export const Sidebar = () => {
  const location = useLocation()

  return React.createElement('aside', { 
    className: 'w-72 bg-[#0a0a0f]/90 backdrop-blur-xl border-r border-[#00f0ff]/10 flex flex-col h-screen sticky top-0' 
  },
    // En-tête avec logo et slogan simple
    React.createElement('div', { className: 'p-6 border-b border-[#00f0ff]/10' },
      React.createElement('div', { className: 'flex items-center gap-3 mb-1' },
        React.createElement('div', { className: 'w-8 h-8 bg-gradient-to-br from-[#00f0ff] to-[#ff6b00] rounded-lg flex items-center justify-center text-black font-bold text-sm' }, '⚡'),
        React.createElement('span', { className: 'text-lg font-bold text-white' }, 'AEGIS')
      ),
      React.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, 'Votre assistant pub IA')
    ),

    // Navigation principale
    React.createElement('nav', { className: 'flex-1 px-3 py-4 space-y-1 overflow-y-auto' },
      React.createElement('p', { className: 'text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 mb-3' }, 'Menu principal'),
      navItems.map(item => {
        const isActive = location.pathname === item.href
        return React.createElement(Link, { 
          key: item.href, 
          to: item.href, 
          className: `flex items-start gap-3 px-3 py-3 rounded-xl transition-all ${
            isActive 
              ? 'bg-[#00f0ff]/15 border border-[#00f0ff]/30' 
              : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
          }`
        },
          React.createElement('div', { className: 'flex-1 min-w-0' },
            React.createElement('span', { 
              className: `text-sm font-semibold block ${isActive ? 'text-[#00f0ff]' : 'text-white'}`
            }, item.label),
            React.createElement('span', { 
              className: 'text-xs text-slate-500 block mt-0.5 truncate'
            }, item.desc)
          )
        )
      })
    ),

    // Bas de sidebar
    React.createElement('div', { className: 'p-3 border-t border-[#00f0ff]/10 space-y-1' },
      React.createElement(Link, { 
        to: '/', 
        className: 'w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-[#00f0ff] rounded-xl hover:bg-[#00f0ff]/10 transition-colors' 
      },
        React.createElement('span', { className: 'text-sm' }, '🌐 Retour au site vitrine')
      ),
      React.createElement('button', { 
        className: 'w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors' 
      },
        React.createElement(LogOut, { size: 16 }),
        React.createElement('span', { className: 'text-sm' }, 'Se déconnecter')
      )
    )
  )
}
