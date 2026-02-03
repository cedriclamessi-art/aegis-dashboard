import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Settings, FileText, LogOut, Plug, 
  LayoutDashboard, Bot, LineChart, Layers 
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Plug, label: 'Plateformes', href: '/connect-platforms' },
  { icon: Layers, label: 'Campagnes', href: '/connected-accounts' },
  { icon: Bot, label: 'Agents', href: '/agents' },
  { icon: FileText, label: 'Tâches', href: '/tasks' },
  { icon: LineChart, label: 'Analytics', href: '/analytics' },
  { icon: Settings, label: 'Paramètres', href: '/settings' },
]

export const Sidebar = () => {
  const location = useLocation()
  
  return React.createElement('aside',
    { className: 'w-64 bg-[#0a0a0f]/80 backdrop-blur-xl border-r border-[#00f0ff]/10 flex flex-col h-screen sticky top-0' },
    React.createElement('div', { className: 'p-6 border-b border-[#00f0ff]/10' },
      React.createElement('h2', { className: 'text-xs font-semibold text-[#00f0ff] uppercase tracking-wider font-mono' }, '// NAVIGATION')
    ),
    React.createElement('nav', { className: 'flex-1 px-4 py-6 space-y-1' },
      navItems.map(item => {
        const isActive = location.pathname === item.href
        return React.createElement(Link,
          {
            key: item.href,
            to: item.href,
            className: `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`
          },
          React.createElement(item.icon, { size: 20 }),
          React.createElement('span', { className: 'text-sm font-medium' }, item.label)
        )
      })
    ),
    React.createElement('div', { className: 'p-4 border-t border-[#00f0ff]/10' },
      React.createElement(Link,
        { to: '/', className: 'w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-[#00f0ff] rounded-lg hover:bg-[#00f0ff]/10 transition-colors mb-2' },
        React.createElement('span', { className: 'text-sm font-medium' }, 'Retour au site')
      ),
      React.createElement('button',
        { className: 'w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors' },
        React.createElement(LogOut, { size: 20 }),
        React.createElement('span', { className: 'text-sm font-medium' }, 'Déconnexion')
      )
    )
  )
}
