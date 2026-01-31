import React from 'react'
import { BarChart3 } from 'lucide-react'

export const AnalyticsPage = () => {
  return React.createElement('div',
    { className: 'space-y-6' },
    React.createElement('h1', { className: 'text-3xl font-bold gradient-text' }, 'Analytiques'),
    React.createElement('div', { className: 'glass rounded-lg p-12 text-center' },
      React.createElement(BarChart3, { size: 48, className: 'mx-auto text-slate-600 mb-4' }),
      React.createElement('p', { className: 'text-slate-400' }, 'Analytiques avancées bientôt disponibles...')
    )
  )
}
