import React, { useState, useEffect } from 'react';
import { Zap, Activity, CheckCircle, BarChart3 } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { AgentList } from '../components/AgentList';
import { TaskChart } from '../components/Chart';
import { dashboardService } from '../services/api';
export const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await dashboardService.getStats();
                setStats(data);
            }
            catch (error) {
                console.error('Failed to load stats:', error);
            }
        };
        loadStats();
    }, []);
    if (!stats) {
        return React.createElement('div', { className: 'text-center py-12' }, 'Chargement...');
    }
    return React.createElement('div', { className: 'space-y-6' }, React.createElement('div', { className: 'mb-8' }, React.createElement('h1', { className: 'text-3xl font-bold gradient-text mb-2' }, 'Tableau de bord'), React.createElement('p', { className: 'text-slate-400' }, 'Bienvenue dans votre centre de contrôle AEGIS')), React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' }, React.createElement(StatCard, {
        title: 'Total Agents',
        value: stats.total_agents,
        icon: React.createElement(Zap, { size: 24, className: 'text-white' }),
        color: 'blue',
        trend: 12
    }), React.createElement(StatCard, {
        title: 'Agents Actifs',
        value: stats.active_agents,
        icon: React.createElement(Activity, { size: 24, className: 'text-white' }),
        color: 'green',
        trend: 8
    }), React.createElement(StatCard, {
        title: 'Tâches Complétées',
        value: stats.total_tasks,
        icon: React.createElement(CheckCircle, { size: 24, className: 'text-white' }),
        color: 'purple',
        trend: 24
    }), React.createElement(StatCard, {
        title: 'Taux de Réussite',
        value: `${stats.success_rate}%`,
        icon: React.createElement(BarChart3, { size: 24, className: 'text-white' }),
        color: 'amber',
        trend: 3
    })), React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' }, React.createElement('div', { className: 'lg:col-span-2' }, React.createElement(TaskChart, {})), React.createElement(AgentList, {})));
};
