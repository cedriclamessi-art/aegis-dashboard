import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { mockTaskChartData } from '../services/mockData'

export const TaskChart = () => {
  return (
    <div className='glass rounded-lg p-6'>
      <h2 className='text-lg font-semibold text-white mb-6'>Tasks Overview (7 days)</h2>
      <div className='w-full h-96'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={mockTaskChartData}>
            <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.1)' />
            <XAxis dataKey='day' stroke='#94a3b8' />
            <YAxis stroke='#94a3b8' />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '0.5rem'
              }}
              labelStyle={{ color: '#ffffff' }}
            />
            <Legend wrapperStyle={{ color: '#e2e8f0' }} />
            <Bar dataKey='completed' fill='#10b981' name='Completed' />
            <Bar dataKey='pending' fill='#f59e0b' name='Pending' />
            <Bar dataKey='failed' fill='#ef4444' name='Failed' />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
