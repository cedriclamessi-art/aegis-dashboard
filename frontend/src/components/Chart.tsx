import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { mockTaskChartData } from '../services/mockData'

// Composant graphique — affiche l'activité de vos robots sur 7 jours
export const TaskChart = () => {
  return (
    <div className='glass rounded-lg p-6'>
      {/* Titre clair avec explication */}
      <div className='mb-2'>
        <h2 className='text-lg font-semibold text-white'>📈 Activité des robots (7 derniers jours)</h2>
        <p className='text-xs text-slate-500 mt-1'>
          Chaque barre montre combien de tâches ont été <span className='text-emerald-400'>réussies</span>, <span className='text-amber-400'>en attente</span> ou <span className='text-red-400'>échouées</span>
        </p>
      </div>

      <div className='w-full h-72'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={mockTaskChartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.07)' />
            <XAxis 
              dataKey='day' 
              stroke='#64748b' 
              tick={{ fontSize: 12 }}
              label={{ value: 'Jour', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }}
            />
            <YAxis 
              stroke='#64748b' 
              tick={{ fontSize: 12 }}
              label={{ value: 'Tâches', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                border: '1px solid rgba(0,240,255,0.2)', 
                borderRadius: '0.75rem',
                fontSize: '13px'
              }}
              labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: 4 }}
              formatter={(value: any, name: string) => [
                `${value} tâches`,
                name
              ]}
            />
            <Legend 
              wrapperStyle={{ color: '#94a3b8', fontSize: 13, paddingTop: 12 }} 
            />
            {/* Barres avec couleurs intuitives et noms clairs */}
            <Bar dataKey='completed' fill='#10b981' name='✅ Réussies' radius={[3, 3, 0, 0]} />
            <Bar dataKey='pending'   fill='#f59e0b' name='⏳ En attente' radius={[3, 3, 0, 0]} />
            <Bar dataKey='failed'    fill='#ef4444' name='❌ Échouées' radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Légende explicative en bas */}
      <div className='mt-3 p-3 bg-slate-800/40 rounded-lg'>
        <p className='text-xs text-slate-500'>
          💡 <strong className='text-slate-400'>Comment lire ce graphique ?</strong> Plus les barres vertes sont hautes, mieux vos robots fonctionnent. Si vous voyez beaucoup de rouge, contactez le support.
        </p>
      </div>
    </div>
  )
}
