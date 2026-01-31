import React from 'react'
import { Bell, Settings, User } from 'lucide-react'

export const Header = () => {
  return React.createElement('header', 
    { className: 'bg-slate-900/50 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-sm' },
    React.createElement('div',
      { className: 'flex items-center justify-between px-6 py-4' },
      React.createElement('div',
        { className: 'flex items-center gap-3' },
        React.createElement('div',
          { className: 'w-8 h-8 bg-gradient-to-br from-aegis-400 to-cyan-500 rounded-lg flex items-center justify-center' },
          React.createElement('span', { className: 'text-sm font-bold text-white' }, 'A')
        ),
        React.createElement('h1', { className: 'text-xl font-bold gradient-text' }, 'AEGIS MEDIA BAYING')
      ),
      React.createElement('div',
        { className: 'flex items-center gap-6' },
        React.createElement('button',
          { className: 'relative p-2 hover:bg-slate-800 rounded-lg transition-colors' },
          React.createElement(Bell, { size: 20, className: 'text-slate-400' }),
          React.createElement('span', { className: 'absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full' })
        ),
        React.createElement('button',
          { className: 'p-2 hover:bg-slate-800 rounded-lg transition-colors' },
          React.createElement(Settings, { size: 20, className: 'text-slate-400' })
        ),
        React.createElement('button',
          { className: 'flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors' },
          React.createElement(User, { size: 20, className: 'text-slate-400' }),
          React.createElement('span', { className: 'text-sm text-slate-300' }, 'Admin')
        )
      )
    )
  )
}
