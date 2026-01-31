import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
const colorClasses = {
    blue: 'from-aegis-500 to-cyan-500',
    green: 'from-emerald-500 to-teal-500',
    purple: 'from-violet-500 to-purple-500',
    amber: 'from-amber-500 to-orange-500',
};
export const StatCard = (props) => {
    const { title, value, icon, trend, color = 'blue' } = props;
    return React.createElement('div', { className: 'glass rounded-lg p-6' }, React.createElement('div', { className: 'flex items-start justify-between' }, React.createElement('div', { className: 'flex-1' }, React.createElement('p', { className: 'text-sm text-slate-400 mb-2' }, title), React.createElement('div', { className: 'flex items-baseline gap-2' }, React.createElement('h3', { className: 'text-3xl font-bold text-white' }, value), trend !== undefined && React.createElement('span', { className: `flex items-center gap-1 text-sm ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}` }, React.createElement(trend >= 0 ? TrendingUp : TrendingDown, { size: 16 }), `${Math.abs(trend)}%`))), React.createElement('div', { className: `w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center` }, icon)));
};
