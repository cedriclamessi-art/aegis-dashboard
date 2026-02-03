import React, { useState, useEffect } from 'react';
import { Crown, Zap } from 'lucide-react';
import { agentService } from '../services/api';
import { mockAgents } from '../services/mockData';
export const AgentList = ({ limit = 8, showPremiumBadge = true }) => {
    const [agents, setAgents] = useState(mockAgents);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadAgents = async () => {
            try {
                const data = await agentService.getAll();
                if (data && data.length > 0) {
                    setAgents(data);
                }
            }
            catch (error) {
                console.error('Failed to load agents, using mock data:', error);
            }
            finally {
                setLoading(false);
            }
        };
        loadAgents();
    }, []);
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/20 text-emerald-400';
            case 'inactive': return 'bg-slate-500/20 text-slate-400';
            case 'error': return 'bg-red-500/20 text-red-400';
            default: return 'bg-slate-500/20 text-slate-400';
        }
    };
    const getRoleColor = (role) => {
        const colors = {
            content_creation: 'bg-purple-500/20 text-purple-400',
            optimization: 'bg-blue-500/20 text-blue-400',
            analytics: 'bg-cyan-500/20 text-cyan-400',
            intelligence: 'bg-amber-500/20 text-amber-400',
            engagement: 'bg-pink-500/20 text-pink-400',
            conversion: 'bg-green-500/20 text-green-400',
            inventory: 'bg-orange-500/20 text-orange-400',
            strategy: 'bg-indigo-500/20 text-indigo-400',
            reporting: 'bg-teal-500/20 text-teal-400',
            orchestration: 'bg-violet-500/20 text-violet-400',
            compliance: 'bg-rose-500/20 text-rose-400',
            audit: 'bg-fuchsia-500/20 text-fuchsia-400',
            sentiment: 'bg-sky-500/20 text-sky-400',
            growth: 'bg-lime-500/20 text-lime-400',
            crisis: 'bg-red-500/20 text-red-400',
        };
        return colors[role] || 'bg-slate-500/20 text-slate-400';
    };
    if (loading) {
        return React.createElement('div', { className: 'glass rounded-lg p-6' }, React.createElement('h2', { className: 'text-lg font-semibold text-white mb-4' }, 'Active Agents'), React.createElement('div', { className: 'flex items-center justify-center py-8' }, React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-aegis-500' })));
    }
    const displayAgents = agents.slice(0, limit);
    return React.createElement('div', { className: 'glass rounded-lg p-6' }, React.createElement('div', { className: 'flex items-center justify-between mb-4' }, React.createElement('h2', { className: 'text-lg font-semibold text-white' }, 'Active Agents'), React.createElement('span', { className: 'text-sm text-slate-400' }, `${agents.filter(a => a.status === 'active').length}/${agents.length} active`)), React.createElement('div', { className: 'space-y-3' }, displayAgents.map(agent => React.createElement('div', {
        key: agent.id,
        className: 'flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer'
    }, React.createElement('div', { className: 'flex items-center gap-3 flex-1 min-w-0' }, React.createElement('div', { className: `p-2 rounded-lg ${getRoleColor(agent.role)}` }, React.createElement(Zap, { size: 16 })), React.createElement('div', { className: 'min-w-0 flex-1' }, React.createElement('div', { className: 'flex items-center gap-2' }, React.createElement('p', { className: 'font-medium text-white truncate' }, agent.displayName), showPremiumBadge && agent.isPremium && React.createElement(Crown, {
        size: 14,
        className: 'text-amber-400 flex-shrink-0'
    })), React.createElement('div', { className: 'flex items-center gap-2 mt-0.5' }, React.createElement('span', { className: `text-xs px-2 py-0.5 rounded-full ${getStatusColor(agent.status)}` }, agent.status), React.createElement('span', { className: 'text-xs text-slate-500' }, agent.role.replace('_', ' '))))), React.createElement('div', { className: 'text-right flex-shrink-0 ml-4' }, React.createElement('p', { className: 'text-sm font-semibold text-white' }, `${agent.success_rate}%`), React.createElement('p', { className: 'text-xs text-slate-400' }, `${agent.task_count.toLocaleString()} tasks`))))), agents.length > limit && React.createElement('div', { className: 'mt-4 text-center' }, React.createElement('button', { className: 'text-sm text-aegis-400 hover:text-aegis-300 transition-colors' }, `View all ${agents.length} agents`)));
};
