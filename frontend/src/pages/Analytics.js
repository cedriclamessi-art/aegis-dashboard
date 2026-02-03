import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, BarChart3, Calendar, DollarSign, Filter, Globe, LineChart, RefreshCw, Target, TrendingUp, Zap, Bell, Clock } from 'lucide-react';
const PERFORMANCE_DATA = [
    { date: '26 Jan', spend: 4500, revenue: 15600, roas: 3.47 },
    { date: '27 Jan', spend: 5200, revenue: 18200, roas: 3.50 },
    { date: '28 Jan', spend: 4800, revenue: 16800, roas: 3.50 },
    { date: '29 Jan', spend: 6100, revenue: 21350, roas: 3.50 },
    { date: '30 Jan', spend: 5500, revenue: 19250, roas: 3.50 },
    { date: '31 Jan', spend: 7200, revenue: 26640, roas: 3.70 },
    { date: '1 Fév', spend: 6800, revenue: 25160, roas: 3.70 },
];
const PLATFORM_BREAKDOWN = [
    { name: 'Meta', spend: 45230, revenue: 156890, roas: 3.47, cpa: 12.34, conversions: 3667, share: 29 },
    { name: 'Google', spend: 67890, revenue: 234560, roas: 3.45, cpa: 11.89, conversions: 5710, share: 44 },
    { name: 'TikTok', spend: 28450, revenue: 98760, roas: 3.47, cpa: 14.23, conversions: 2000, share: 18 },
    { name: 'LinkedIn', spend: 12340, revenue: 45670, roas: 3.70, cpa: 18.56, conversions: 665, share: 9 },
];
const CURRENCY_DATA = [
    { code: 'USD', spend: 89450, revenue: 312400, percentage: 58, flag: '🇺🇸' },
    { code: 'EUR', spend: 34560, revenue: 119800, percentage: 22, flag: '🇪🇺' },
    { code: 'GBP', spend: 18900, revenue: 67200, percentage: 12, flag: '🇬🇧' },
    { code: 'CAD', spend: 11000, revenue: 36480, percentage: 8, flag: '🇨🇦' },
];
const ALERTS_HISTORY = [
    { id: 1, type: 'budget', severity: 'warning', message: 'Budget Meta campagne "Summer Sale" atteint 90%', time: '10:34', date: 'Aujourd\'hui', status: 'pending' },
    { id: 2, type: 'anomaly', severity: 'critical', message: 'CPA anormalement élevé sur Google (+45% vs baseline)', time: '09:12', date: 'Aujourd\'hui', status: 'resolved' },
    { id: 3, type: 'performance', severity: 'success', message: 'ROAS TikTok dépasse le seuil objectif de 3.5x', time: '08:45', date: 'Aujourd\'hui', status: 'acknowledged' },
    { id: 4, type: 'seasonal', severity: 'info', message: 'Soldes d\'hiver - Impact estimé +25% trafic', time: '00:00', date: 'Hier', status: 'pending' },
    { id: 5, type: 'api', severity: 'warning', message: 'Quota API Meta atteint 75%', time: '18:20', date: 'Hier', status: 'resolved' },
];
const SEASONAL_EVENTS = [
    { name: 'Saint Valentin', date: '14 Fév', daysUntil: 13, impact: 'high', multiplier: 2.2 },
    { name: 'Soldes Hiver Fin', date: '28 Fév', daysUntil: 27, impact: 'medium', multiplier: 1.5 },
    { name: 'Journée Femme', date: '8 Mars', daysUntil: 35, impact: 'medium', multiplier: 1.8 },
];
export const AnalyticsPage = () => {
    const [dateRange, setDateRange] = useState('7d');
    const totalSpend = PLATFORM_BREAKDOWN.reduce((a, p) => a + p.spend, 0);
    const totalRevenue = PLATFORM_BREAKDOWN.reduce((a, p) => a + p.revenue, 0);
    const avgRoas = totalRevenue / totalSpend;
    const totalConversions = PLATFORM_BREAKDOWN.reduce((a, p) => a + p.conversions, 0);
    return React.createElement('div', { className: 'min-h-screen bg-[var(--cyber-dark)] cyber-grid p-6' }, React.createElement('div', { className: 'max-w-[1600px] mx-auto space-y-6' }, React.createElement('div', { className: 'flex flex-col md:flex-row md:items-center justify-between gap-4' }, React.createElement('div', {}, React.createElement('h1', { className: 'text-3xl font-bold cyber-text' }, 'Analytics'), React.createElement('p', { className: 'text-slate-400 mt-1' }, 'Analyse détaillée des performances multi-plateformes')), React.createElement('div', { className: 'flex items-center gap-3' }, React.createElement('div', { className: 'flex items-center gap-2 cyber-card px-3 py-2' }, React.createElement(Calendar, { size: 16, className: 'text-cyan-400' }), React.createElement('select', {
        value: dateRange,
        onChange: (e) => setDateRange(e.target.value),
        className: 'bg-transparent text-white text-sm focus:outline-none cursor-pointer'
    }, React.createElement('option', { value: '7d' }, '7 derniers jours'), React.createElement('option', { value: '14d' }, '14 derniers jours'), React.createElement('option', { value: '30d' }, '30 derniers jours'), React.createElement('option', { value: '90d' }, '90 derniers jours'))), React.createElement('button', { className: 'cyber-card px-3 py-2 flex items-center gap-2 hover:border-cyan-400/50 transition-colors' }, React.createElement(Filter, { size: 16, className: 'text-cyan-400' }), React.createElement('span', { className: 'text-sm text-white' }, 'Filtres')), React.createElement('button', { className: 'cyber-card px-3 py-2 flex items-center gap-2 hover:border-cyan-400/50 transition-colors' }, React.createElement(RefreshCw, { size: 16, className: 'text-cyan-400' }), React.createElement('span', { className: 'text-sm text-white' }, 'Actualiser')))), React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' }, [
        { label: 'Dépenses totales', value: `${(totalSpend / 1000).toFixed(1)}K €`, change: 12.5, icon: DollarSign, color: 'cyan' },
        { label: 'Revenus totaux', value: `${(totalRevenue / 1000).toFixed(1)}K €`, change: 18.2, icon: TrendingUp, color: 'green' },
        { label: 'ROAS moyen', value: `${avgRoas.toFixed(2)}x`, change: 5.3, icon: Target, color: 'purple' },
        { label: 'Conversions', value: totalConversions.toLocaleString(), change: 22.1, icon: Zap, color: 'orange' },
    ].map((stat, idx) => React.createElement('div', { key: idx, className: 'cyber-card p-5' }, React.createElement('div', { className: 'flex items-start justify-between mb-3' }, React.createElement('div', {
        className: `p-2.5 rounded-lg ${stat.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
            stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
                stat.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-orange-500/20 text-orange-400'}`
    }, React.createElement(stat.icon, { size: 20 })), React.createElement('div', {
        className: `flex items-center gap-1 text-xs font-mono ${stat.change > 0 ? 'text-green-400' : 'text-red-400'}`
    }, React.createElement(stat.change > 0 ? ArrowUpRight : ArrowDownRight, { size: 14 }), `${stat.change}%`)), React.createElement('p', { className: 'text-xs text-slate-500 font-mono uppercase mb-1' }, stat.label), React.createElement('p', { className: 'text-2xl font-bold text-white' }, stat.value)))), React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' }, React.createElement('div', { className: 'lg:col-span-2 cyber-card p-6' }, React.createElement('div', { className: 'flex items-center justify-between mb-6' }, React.createElement('h2', { className: 'text-lg font-bold text-white flex items-center gap-2' }, React.createElement(LineChart, { size: 20, className: 'text-cyan-400' }), 'Tendance de performance'), React.createElement('div', { className: 'flex items-center gap-4 text-xs' }, React.createElement('div', { className: 'flex items-center gap-2' }, React.createElement('div', { className: 'w-3 h-3 rounded-full bg-cyan-400' }), React.createElement('span', { className: 'text-slate-400' }, 'Dépenses')), React.createElement('div', { className: 'flex items-center gap-2' }, React.createElement('div', { className: 'w-3 h-3 rounded-full bg-green-400' }), React.createElement('span', { className: 'text-slate-400' }, 'Revenus')))), React.createElement('div', { className: 'h-64 flex items-end justify-between gap-2' }, PERFORMANCE_DATA.map((day, idx) => React.createElement('div', { key: idx, className: 'flex-1 flex flex-col items-center gap-2' }, React.createElement('div', { className: 'w-full flex gap-1 items-end justify-center h-48' }, React.createElement('div', {
        className: 'w-3 bg-cyan-500/60 rounded-t',
        style: { height: `${(day.spend / 8000) * 100}%` }
    }), React.createElement('div', {
        className: 'w-3 bg-green-500/60 rounded-t',
        style: { height: `${(day.revenue / 30000) * 100}%` }
    })), React.createElement('span', { className: 'text-xs text-slate-500 font-mono' }, day.date))))), React.createElement('div', { className: 'cyber-card p-6' }, React.createElement('h2', { className: 'text-lg font-bold text-white flex items-center gap-2 mb-6' }, React.createElement(Globe, { size: 20, className: 'text-purple-400' }), 'Multi-Devises'), React.createElement('div', { className: 'space-y-4' }, CURRENCY_DATA.map(currency => React.createElement('div', { key: currency.code, className: 'space-y-2' }, React.createElement('div', { className: 'flex items-center justify-between' }, React.createElement('div', { className: 'flex items-center gap-2' }, React.createElement('span', {}, currency.flag), React.createElement('span', { className: 'text-white font-medium' }, currency.code)), React.createElement('span', { className: 'text-cyan-400 font-mono text-sm' }, `$${(currency.spend / 1000).toFixed(1)}K`)), React.createElement('div', { className: 'data-bar' }, React.createElement('div', {
        className: 'data-bar-fill',
        style: { width: `${currency.percentage}%` }
    })), React.createElement('p', { className: 'text-xs text-slate-500 text-right' }, `${currency.percentage}% du total`)))))), React.createElement('div', { className: 'cyber-card p-6' }, React.createElement('h2', { className: 'text-lg font-bold text-white flex items-center gap-2 mb-6' }, React.createElement(BarChart3, { size: 20, className: 'text-orange-400' }), 'Performance par Plateforme'), React.createElement('div', { className: 'overflow-x-auto' }, React.createElement('table', { className: 'w-full' }, React.createElement('thead', {}, React.createElement('tr', { className: 'text-left text-xs text-slate-500 font-mono uppercase' }, React.createElement('th', { className: 'pb-4 pr-6' }, 'Plateforme'), React.createElement('th', { className: 'pb-4 pr-6' }, 'Dépenses'), React.createElement('th', { className: 'pb-4 pr-6' }, 'Revenus'), React.createElement('th', { className: 'pb-4 pr-6' }, 'ROAS'), React.createElement('th', { className: 'pb-4 pr-6' }, 'CPA'), React.createElement('th', { className: 'pb-4 pr-6' }, 'Conversions'), React.createElement('th', { className: 'pb-4' }, 'Part'))), React.createElement('tbody', {}, PLATFORM_BREAKDOWN.map(platform => React.createElement('tr', { key: platform.name, className: 'border-t border-white/5 hover:bg-white/5 transition-colors' }, React.createElement('td', { className: 'py-4 pr-6' }, React.createElement('span', { className: 'text-white font-semibold' }, platform.name)), React.createElement('td', { className: 'py-4 pr-6 font-mono text-slate-300' }, `$${(platform.spend / 1000).toFixed(1)}K`), React.createElement('td', { className: 'py-4 pr-6 font-mono text-green-400' }, `$${(platform.revenue / 1000).toFixed(1)}K`), React.createElement('td', { className: 'py-4 pr-6 font-mono text-cyan-400 font-bold' }, `${platform.roas}x`), React.createElement('td', { className: 'py-4 pr-6 font-mono text-slate-300' }, `$${platform.cpa}`), React.createElement('td', { className: 'py-4 pr-6 font-mono text-slate-300' }, platform.conversions.toLocaleString()), React.createElement('td', { className: 'py-4' }, React.createElement('div', { className: 'flex items-center gap-2' }, React.createElement('div', { className: 'w-16 h-2 rounded-full bg-white/10 overflow-hidden' }, React.createElement('div', {
        className: 'h-full bg-gradient-to-r from-cyan-500 to-purple-500',
        style: { width: `${platform.share}%` }
    })), React.createElement('span', { className: 'text-xs text-slate-500 font-mono' }, `${platform.share}%`))))))))), React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' }, React.createElement('div', { className: 'cyber-card cyber-card-orange p-6' }, React.createElement('div', { className: 'flex items-center justify-between mb-6' }, React.createElement('h2', { className: 'text-lg font-bold text-white flex items-center gap-2' }, React.createElement(Bell, { size: 20, className: 'text-orange-400' }), 'Historique Alertes'), React.createElement('span', { className: 'text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded font-mono' }, `${ALERTS_HISTORY.filter(a => a.status === 'pending').length} en attente`)), React.createElement('div', { className: 'space-y-3 max-h-80 overflow-y-auto pr-2' }, ALERTS_HISTORY.map(alert => React.createElement('div', {
        key: alert.id,
        className: `p-4 rounded-lg border-l-2 ${alert.severity === 'critical' ? 'bg-red-500/10 border-red-500' :
            alert.severity === 'warning' ? 'bg-orange-500/10 border-orange-500' :
                alert.severity === 'success' ? 'bg-green-500/10 border-green-500' :
                    'bg-cyan-500/10 border-cyan-500'}`
    }, React.createElement('div', { className: 'flex items-start justify-between gap-4' }, React.createElement('div', { className: 'flex-1' }, React.createElement('p', { className: 'text-sm text-white mb-1' }, alert.message), React.createElement('div', { className: 'flex items-center gap-2 text-xs text-slate-500' }, React.createElement(Clock, { size: 12 }), React.createElement('span', {}, `${alert.date} à ${alert.time}`))), React.createElement('div', {
        className: `px-2 py-1 rounded text-xs font-mono ${alert.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
            alert.status === 'acknowledged' ? 'bg-cyan-500/20 text-cyan-400' :
                'bg-orange-500/20 text-orange-400'}`
    }, alert.status)))))), React.createElement('div', { className: 'cyber-card cyber-card-purple p-6' }, React.createElement('div', { className: 'flex items-center justify-between mb-6' }, React.createElement('h2', { className: 'text-lg font-bold text-white flex items-center gap-2' }, React.createElement(Calendar, { size: 20, className: 'text-purple-400' }), 'Événements Saisonniers'), React.createElement('span', { className: 'text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded font-mono' }, 'À venir')), React.createElement('div', { className: 'space-y-4' }, SEASONAL_EVENTS.map((event, idx) => React.createElement('div', {
        key: idx,
        className: 'p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors'
    }, React.createElement('div', { className: 'flex items-center justify-between mb-2' }, React.createElement('h3', { className: 'text-white font-semibold' }, event.name), React.createElement('span', {
        className: `px-2 py-1 rounded text-xs font-mono ${event.impact === 'high' ? 'bg-orange-500/20 text-orange-400' :
            'bg-cyan-500/20 text-cyan-400'}`
    }, event.impact)), React.createElement('div', { className: 'flex items-center justify-between text-sm' }, React.createElement('span', { className: 'text-slate-400' }, event.date), React.createElement('span', { className: 'text-purple-400 font-mono' }, `J-${event.daysUntil}`)), React.createElement('div', { className: 'mt-2 flex items-center gap-2' }, React.createElement(TrendingUp, { size: 14, className: 'text-green-400' }), React.createElement('span', { className: 'text-xs text-slate-500' }, `Impact estimé: x${event.multiplier} sur conversions`))))), React.createElement('div', { className: 'mt-4 pt-4 border-t border-white/10 text-center' }, React.createElement('p', { className: 'text-xs text-slate-500' }, 'Baselines ajustées automatiquement'))))));
};
