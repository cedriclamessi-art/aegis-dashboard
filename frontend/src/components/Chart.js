import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mockTaskChartData } from '../services/mockData';
export const TaskChart = () => {
    return (_jsxs("div", { className: 'glass rounded-lg p-6', children: [_jsx("h2", { className: 'text-lg font-semibold text-white mb-6', children: "Tasks Overview (7 days)" }), _jsx("div", { className: 'w-full h-96', children: _jsx(ResponsiveContainer, { width: '100%', height: '100%', children: _jsxs(BarChart, { data: mockTaskChartData, children: [_jsx(CartesianGrid, { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }), _jsx(XAxis, { dataKey: 'day', stroke: '#94a3b8' }), _jsx(YAxis, { stroke: '#94a3b8' }), _jsx(Tooltip, { contentStyle: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                    border: '1px solid rgba(148, 163, 184, 0.3)',
                                    borderRadius: '0.5rem'
                                }, labelStyle: { color: '#ffffff' } }), _jsx(Legend, { wrapperStyle: { color: '#e2e8f0' } }), _jsx(Bar, { dataKey: 'completed', fill: '#10b981', name: 'Completed' }), _jsx(Bar, { dataKey: 'pending', fill: '#f59e0b', name: 'Pending' }), _jsx(Bar, { dataKey: 'failed', fill: '#ef4444', name: 'Failed' })] }) }) })] }));
};
