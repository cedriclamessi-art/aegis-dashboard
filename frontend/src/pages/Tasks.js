import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { taskService } from '../services/api';
export const TasksPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadTasks();
    }, []);
    const loadTasks = async () => {
        try {
            const data = await taskService.getAll();
            setTasks(data);
        }
        catch (error) {
            console.error('Failed to load tasks:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getStatusBadge = (status) => {
        const colors = {
            pending: 'bg-yellow-500/20 text-yellow-400',
            running: 'bg-blue-500/20 text-blue-400',
            completed: 'bg-emerald-500/20 text-emerald-400',
            failed: 'bg-red-500/20 text-red-400'
        };
        return colors[status] || colors.pending;
    };
    return React.createElement('div', { className: 'space-y-6' }, React.createElement('div', { className: 'flex items-center justify-between' }, React.createElement('h1', { className: 'text-3xl font-bold gradient-text' }, 'Tâches'), React.createElement('button', { className: 'flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium transition-colors' }, React.createElement(Filter, { size: 20 }), 'Filter')), React.createElement('div', { className: 'glass rounded-lg overflow-hidden' }, React.createElement('div', { className: 'overflow-x-auto' }, React.createElement('table', { className: 'w-full' }, React.createElement('thead', { className: 'border-b border-slate-700' }, React.createElement('tr', { className: 'bg-slate-800/50' }, React.createElement('th', { className: 'px-6 py-3 text-left text-sm font-semibold text-slate-300' }, 'Task ID'), React.createElement('th', { className: 'px-6 py-3 text-left text-sm font-semibold text-slate-300' }, 'Status'), React.createElement('th', { className: 'px-6 py-3 text-left text-sm font-semibold text-slate-300' }, 'Created'), React.createElement('th', { className: 'px-6 py-3 text-left text-sm font-semibold text-slate-300' }, 'Updated'))), React.createElement('tbody', { className: 'divide-y divide-slate-700' }, loading ? React.createElement('tr', {}, React.createElement('td', { colSpan: 4, className: 'px-6 py-4 text-center text-slate-400' }, 'Loading...')) :
        tasks.slice(0, 10).map(task => React.createElement('tr', { key: task.id, className: 'hover:bg-slate-800/30 transition-colors' }, React.createElement('td', { className: 'px-6 py-4 text-sm font-mono text-slate-300' }, task.id.slice(0, 8)), React.createElement('td', { className: 'px-6 py-4 text-sm' }, React.createElement('span', { className: `px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}` }, task.status)), React.createElement('td', { className: 'px-6 py-4 text-sm text-slate-400' }, new Date(task.created_at).toLocaleDateString()), React.createElement('td', { className: 'px-6 py-4 text-sm text-slate-400' }, new Date(task.updated_at).toLocaleDateString()))))))));
};
