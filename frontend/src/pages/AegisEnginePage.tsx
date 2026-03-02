import React from 'react';

const s = {
        page: { padding: 32, color: '#e2e8f0', background: '#07070f', minHeight: '100vh' },
        h1: { fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 },
        sub: { fontSize: 14, color: '#64748b', marginBottom: 32 },
        grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 } as React.CSSProperties,
        card: { background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 12, padding: 24 },
        ct: { fontSize: 14, fontWeight: 700, color: '#a78bfa', marginBottom: 16 },
        txt: { fontSize: 12, color: '#475569' },
};

export default function AegisEnginePage(): React.ReactElement {
        return React.createElement('div', { style: s.page },
                                       React.createElement('h1', { style: s.h1 }, 'AEGIS Engine'),
                                       React.createElement('p', { style: s.sub }, 'Capital vers profit net ajuste au risque. 4 lois. 0 emotion.'),
                                       React.createElement('div', { style: s.grid },
                                                                 React.createElement('div', { style: s.card },
                                                                                             React.createElement('div', { style: s.ct }, 'Score Opportunite'),
                                                                                             React.createElement('p', { style: s.txt }, 'Module de scoring produit. Connectez Supabase pour activer.')
                                                                                           ),
                                                                 React.createElement('div', { style: s.card },
                                                                                             React.createElement('div', { style: s.ct }, 'Stop-Loss Engine'),
                                                                                             React.createElement('p', { style: s.txt }, 'Stop-loss automatique. ROAS sous le seuil = pause immediate.')
                                                                                           )
                                                               ),
                                       React.createElement('div', { style: s.card },
                                                                 React.createElement('div', { style: s.ct }, 'Memoire Decisionnelle'),
                                                                 React.createElement('p', { style: s.txt }, 'AEGIS memorise chaque decision pour affiner les allocations futures.')
                                                               )
                                     );
}
