import React from 'react'
import { Settings, Mail, Phone, FileText, Shield } from 'lucide-react'

export const SettingsPage = () => {
  return React.createElement('div', { className: 'space-y-6' },

    // En-tête
    React.createElement('div', { className: 'mb-6' },
      React.createElement('h1', { className: 'text-3xl font-bold gradient-text mb-1' }, '⚙️ Paramètres'),
      React.createElement('p', { className: 'text-slate-400 text-sm' }, 
        'Gérez votre compte et vos préférences'
      )
    ),

    // Message d'aide pour le débutant
    React.createElement('div', { className: 'bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3' },
      React.createElement('span', { className: 'text-2xl flex-shrink-0' }, '🚧'),
      React.createElement('div', {},
        React.createElement('p', { className: 'text-sm text-slate-300 font-medium mb-1' }, 
          'Cette section est en cours de construction'
        ),
        React.createElement('p', { className: 'text-xs text-slate-500' }, 
          'Le panneau de paramètres complet sera disponible très prochainement. En attendant, voici les sections qui seront disponibles :'
        )
      )
    ),

    // Aperçu des sections à venir
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
      ...[
        { icon: '👤', title: 'Mon profil', desc: 'Modifier votre nom, email et mot de passe' },
        { icon: '🔔', title: 'Notifications', desc: 'Choisir quand et comment être alerté' },
        { icon: '💳', title: 'Abonnement', desc: 'Voir ou changer votre formule' },
        { icon: '🔗', title: 'Connexions', desc: 'Gérer vos comptes Meta, Google, TikTok' },
        { icon: '🛡️', title: 'Sécurité', desc: 'Mot de passe, authentification 2 facteurs' },
        { icon: '🤖', title: 'Comportement IA', desc: 'Définir les limites de vos robots' },
      ].map(item => 
        React.createElement('div', { 
          className: 'glass rounded-xl p-4 flex items-center gap-4 opacity-60 cursor-not-allowed',
          title: 'Bientôt disponible'
        },
          React.createElement('span', { className: 'text-2xl' }, item.icon),
          React.createElement('div', {},
            React.createElement('p', { className: 'font-semibold text-white text-sm' }, item.title),
            React.createElement('p', { className: 'text-xs text-slate-500' }, item.desc)
          ),
          React.createElement('span', { className: 'ml-auto text-xs text-slate-600 font-mono' }, 'Bientôt')
        )
      )
    ),

    // Contact support
    React.createElement('div', { className: 'glass rounded-xl p-5' },
      React.createElement('h2', { className: 'font-semibold text-white mb-3 flex items-center gap-2' },
        React.createElement('span', {}, '💬'),
        'Besoin d\'aide ?'
      ),
      React.createElement('p', { className: 'text-sm text-slate-400 mb-4' }, 
        'Notre équipe est disponible pour vous accompagner dans la configuration de votre compte.'
      ),
      React.createElement('div', { className: 'flex flex-wrap gap-3' },
        React.createElement('a', { 
          href: 'mailto:hello@aegis.ai',
          className: 'flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors'
        },
          React.createElement(Mail, { size: 16 }),
          'hello@aegis.ai'
        ),
        React.createElement('a', { 
          href: '#',
          className: 'flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 text-sm hover:bg-white/10 transition-colors'
        },
          React.createElement(FileText, { size: 16 }),
          'Voir la documentation'
        )
      )
    )
  )
}
