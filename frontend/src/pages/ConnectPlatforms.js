import React from 'react';
import { TrendingUp, Chrome, Facebook, Zap } from 'lucide-react';
export const ConnectPlatformsPage = () => {
    const platforms = [
        {
            id: 'tiktok',
            name: 'TikTok Ads',
            icon: Zap,
            color: 'bg-black',
            borderColor: 'border-gray-800',
            description: 'Gérez vos campagnes TikTok en un clic',
            status: 'available',
            features: ['Création de campagnes', 'Suivi en temps réel', 'Optimisation budgétaire'],
        },
        {
            id: 'meta',
            name: 'Meta/Facebook',
            icon: Facebook,
            color: 'bg-blue-600',
            borderColor: 'border-blue-800',
            description: 'Connectez vos comptes Meta/Facebook',
            status: 'available',
            features: ['Gestion multi-comptes', 'Synchronisation automatique', 'Rapports détaillés'],
        },
        {
            id: 'google',
            name: 'Google Ads',
            icon: Chrome,
            color: 'bg-red-600',
            borderColor: 'border-red-800',
            description: 'Intégrez Google Ads facilement',
            status: 'available',
            features: ['Campagnes Google', 'Conversion tracking', 'Performance analytics'],
        },
    ];
    const handleConnect = (platformId) => {
        window.location.href = `/api/v1/auth/oauth/${platformId}/authorize`;
    };
    return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8' }, React.createElement('div', { className: 'max-w-6xl mx-auto' }, React.createElement('div', { className: 'mb-12' }, React.createElement('h1', { className: 'text-4xl font-bold mb-3 flex items-center gap-3' }, React.createElement(TrendingUp, { size: 40, className: 'text-cyan-400' }), 'Connectez vos Plateformes'), React.createElement('p', { className: 'text-slate-300 text-lg' }, 'Autorisez AEGIS à accéder à vos comptes publicitaires pour gérer automatiquement vos campagnes')), React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' }, platforms.map((platform) => React.createElement('div', {
        key: platform.id,
        className: `glass-dark p-8 rounded-lg border ${platform.borderColor} hover:shadow-2xl transition-all duration-300`
    }, React.createElement('div', { className: 'flex items-center gap-4 mb-6' }, React.createElement('div', { className: `w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center` }, React.createElement(platform.icon, { size: 24, className: 'text-white' })), React.createElement('h2', { className: 'text-2xl font-bold' }, platform.name)), React.createElement('p', { className: 'text-slate-300 mb-4' }, platform.description), React.createElement('div', { className: 'mb-6' }, React.createElement('p', { className: 'text-sm text-slate-400 mb-3 font-semibold' }, 'Fonctionnalités:'), React.createElement('ul', { className: 'space-y-2' }, platform.features.map((feature, idx) => React.createElement('li', { key: idx, className: 'flex items-center gap-2 text-sm text-slate-300' }, React.createElement('span', { className: 'w-1.5 h-1.5 bg-cyan-400 rounded-full' }), feature)))), React.createElement('button', {
        onClick: () => handleConnect(platform.id),
        className: 'w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg font-semibold transition-all text-white'
    }, `Connecter ${platform.name}`), React.createElement('p', { className: 'text-xs text-slate-500 mt-4 text-center' }, 'Pas de données persistantes • Données simulées pour la démo'))))));
};
export default ConnectPlatformsPage;
