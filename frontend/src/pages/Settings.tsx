import React from 'react'
import { Settings } from 'lucide-react'

export const SettingsPage = () => {
  return React.createElement('div',
    { className: 'space-y-6' },
    React.createElement('h1', { className: 'text-3xl font-bold gradient-text' }, 'Paramètres'),
    React.createElement('div', { className: 'glass rounded-lg p-12 text-center' },
      React.createElement(Settings, { size: 48, className: 'mx-auto text-slate-600 mb-4' }),
      React.createElement('p', { className: 'text-slate-400' }, 'Panneau de paramètres bientôt disponible...')
    )
  )
}
