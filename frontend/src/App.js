import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardRefonte } from './pages/DashboardRefonte';
import { AgentsPage } from './pages/Agents';
import { TasksPage } from './pages/Tasks';
import { AnalyticsPage } from './pages/Analytics';
import { SettingsPage } from './pages/Settings';
import { ConnectPlatformsPage } from './pages/ConnectPlatforms';
import { ConnectedAccountsPage } from './pages/ConnectedAccounts';
import { PlatformCampaignsPage } from './pages/PlatformCampaigns';
function App() {
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const isFullPage = ['/connect-platforms', '/connected-accounts'].includes(location.pathname) ||
        location.pathname.startsWith('/campaigns/');
    if (isHomePage) {
        return React.createElement(DashboardRefonte, {});
    }
    if (isFullPage) {
        return React.createElement(Routes, {}, React.createElement(Route, { path: '/connect-platforms', element: React.createElement(ConnectPlatformsPage) }), React.createElement(Route, { path: '/connected-accounts', element: React.createElement(ConnectedAccountsPage) }), React.createElement(Route, { path: '/campaigns/:platform', element: React.createElement(PlatformCampaignsPage) }));
    }
    return React.createElement('div', { className: 'flex flex-col h-screen bg-black' }, React.createElement(Header, {}), React.createElement('div', { className: 'flex flex-1 overflow-hidden' }, React.createElement(Sidebar, {}), React.createElement('main', { className: 'flex-1 overflow-auto' }, React.createElement('div', { className: 'p-8' }, React.createElement(Routes, {}, React.createElement(Route, { path: '/agents', element: React.createElement(AgentsPage) }), React.createElement(Route, { path: '/tasks', element: React.createElement(TasksPage) }), React.createElement(Route, { path: '/analytics', element: React.createElement(AnalyticsPage) }), React.createElement(Route, { path: '/settings', element: React.createElement(SettingsPage) }))))));
}
export default App;
