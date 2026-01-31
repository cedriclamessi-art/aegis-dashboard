import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Settings, Zap, FileText, LogOut, Plug } from 'lucide-react'

const navItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/' },
  { icon: Plug, label: 'Plateformes', href: '/connect-platforms' },
  { icon: Zap, label: 'Campagnes', href: '/connected-accounts' },
  { icon: BarChart3, label: 'Agents', href: '/agents' },
  { icon: FileText, label: 'Tasks', href: '/tasks' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export const Sidebar = () => {
  const location = useLocation()
  
  return React.createElement('aside',
    { className: 'w-64 bg-slate-900/80 border-r border-slate-800 flex flex-col h-screen sticky top-0' },
    React.createElement('div', { className: 'p-6 border-b border-slate-800' },
      React.createElement('h2', { className: 'text-sm font-semibold text-slate-400 uppercase tracking-wider' }, 'Navigation')
    ),
    React.createElement('nav', { className: 'flex-1 px-4 py-6 space-y-2' },
      navItems.map(item => 
        React.createElement(Link,
          {
            key: item.href,
            to: item.href,
            className: `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.href
                ? 'bg-cyan-500 text-white'
                : 'text-slate-400 hover:bg-slate-800'
            }`
          },
          React.createElement(item.icon, { size: 20 }),
          React.createElement('span', { className: 'text-sm font-medium' }, item.label)
        )
      )
    ),
    React.createElement('div', { className: 'p-4 border-t border-slate-800' },
      React.createElement('button',
        { className: 'w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors' },
        React.createElement(LogOut, { size: 20 }),
        React.createElement('span', { className: 'text-sm font-medium' }, 'Logout')
      )
    )
  )
}
