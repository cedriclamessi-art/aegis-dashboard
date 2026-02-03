import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, ChevronRight, Settings, TrendingUp, Zap, Bot, BarChart3, Globe, Target, Shield, Bell, Search, Menu, Activity, DollarSign, Users, Eye, PieChart, ArrowRight, Plus, Calendar, Cpu, X, Crosshair, Layers, Database, Wifi, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';
const revenueData = [
    { name: 'Jan', revenue: 4200, spend: 1200 },
    { name: 'Feb', revenue: 3800, spend: 1100 },
    { name: 'Mar', revenue: 4500, spend: 1300 },
    { name: 'Apr', revenue: 5200, spend: 1400 },
    { name: 'May', revenue: 4800, spend: 1250 },
    { name: 'Jun', revenue: 5500, spend: 1500 },
    { name: 'Jul', revenue: 6200, spend: 1600 },
    { name: 'Aug', revenue: 5800, spend: 1450 },
    { name: 'Sep', revenue: 6500, spend: 1700 },
    { name: 'Oct', revenue: 7200, spend: 1800 },
    { name: 'Nov', revenue: 6800, spend: 1650 },
    { name: 'Dec', revenue: 7500, spend: 1900 }
];
const platformPieData = [
    { name: 'Google Ads', value: 45, color: '#00f0ff' },
    { name: 'Meta Ads', value: 35, color: '#a855f7' },
    { name: 'TikTok', value: 20, color: '#ff6b00' }
];
const Particles = () => {
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 8 + Math.random() * 8,
        size: 1 + Math.random() * 2
    }));
    return (_jsx("div", { className: "fixed inset-0 pointer-events-none overflow-hidden z-0", children: particles.map(p => (_jsx("div", { className: "absolute rounded-full bg-[#00f0ff] opacity-40", style: {
                left: `${p.left}%`,
                bottom: '-10px',
                width: `${p.size}px`,
                height: `${p.size}px`,
                boxShadow: '0 0 6px #00f0ff',
                animation: `particle-rise ${p.duration}s ease-out infinite`,
                animationDelay: `${p.delay}s`
            } }, p.id))) }));
};
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const duration = 2000;
        const steps = 50;
        let step = 0;
        const interval = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 4);
            setDisplay(value * eased);
            if (step >= steps)
                clearInterval(interval);
        }, duration / steps);
        return () => clearInterval(interval);
    }, [value]);
    return _jsxs("span", { className: "data-value", children: [prefix, decimals > 0 ? display.toFixed(decimals) : Math.floor(display).toLocaleString(), suffix] });
};
const CircularProgress = ({ value, size = 140, strokeWidth = 8, color = 'cyan' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const [offset, setOffset] = useState(circumference);
    useEffect(() => {
        const timer = setTimeout(() => {
            setOffset(circumference - (value / 100) * circumference);
        }, 300);
        return () => clearTimeout(timer);
    }, [value, circumference]);
    const colors = {
        cyan: ['#00f0ff', '#0891b2'],
        orange: ['#ff6b00', '#facc15'],
        purple: ['#a855f7', '#ec4899'],
        green: ['#22c55e', '#4ade80']
    };
    const gradientId = `cyber-progress-${color}-${Math.random().toString(36).substr(2, 9)}`;
    const colorSet = colors[color] || colors.cyan;
    return (_jsxs("div", { className: "relative", style: { width: size, height: size }, children: [_jsxs("svg", { width: size, height: size, className: "transform -rotate-90", children: [_jsx("defs", { children: _jsxs("linearGradient", { id: gradientId, x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [_jsx("stop", { offset: "0%", stopColor: colorSet[0] }), _jsx("stop", { offset: "100%", stopColor: colorSet[1] })] }) }), _jsx("circle", { cx: size / 2, cy: size / 2, r: radius, strokeWidth: strokeWidth, stroke: "rgba(0, 240, 255, 0.1)", fill: "none" }), _jsx("circle", { cx: size / 2, cy: size / 2, r: radius, strokeWidth: strokeWidth, stroke: `url(#${gradientId})`, fill: "none", strokeLinecap: "round", strokeDasharray: circumference, strokeDashoffset: offset, style: { transition: 'stroke-dashoffset 2s ease-out', filter: `drop-shadow(0 0 8px ${colorSet[0]})` } })] }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [_jsxs("span", { className: "text-4xl font-cyber font-bold text-white neon-text", children: [value, "%"] }), _jsx("span", { className: "text-xs font-mono text-slate-500 mt-1", children: "COMPLETE" })] })] }));
};
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (_jsxs("div", { className: "cyber-card p-3 border-[#00f0ff]/30", children: [_jsx("p", { className: "font-mono text-[#00f0ff] text-sm mb-2", children: label }), payload.map((entry, index) => (_jsxs("p", { className: "text-sm", style: { color: entry.color }, children: [entry.name, ": ", _jsxs("span", { className: "font-mono font-bold", children: ["$", entry.value.toLocaleString()] })] }, index)))] }));
    }
    return null;
};
export const DashboardCyber = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: '1', type: 'success', title: 'Optimization Complete', message: 'AI reduced CPC by 18% on Google Ads', time: '2 min ago', read: false },
        { id: '2', type: 'warning', title: 'Budget Alert', message: 'Meta Ads budget at 87% capacity', time: '15 min ago', read: false },
        { id: '3', type: 'info', title: 'New Audience Found', message: 'High-converting segment discovered', time: '1 hour ago', read: true }
    ]);
    const [liveAgentLogs, setLiveAgentLogs] = useState([
        { id: 1, agent: 'SENTINEL-A1', action: 'Analyzing bid performance...', status: 'processing' },
        { id: 2, agent: 'GUARDIAN-B2', action: 'Audience optimization complete', status: 'success' },
        { id: 3, agent: 'PHANTOM-C3', action: 'Testing creative variant #4', status: 'processing' }
    ]);
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    useEffect(() => {
        const logInterval = setInterval(() => {
            const actions = [
                'Analyzing bid performance...',
                'Optimizing audience targeting...',
                'Testing new creative...',
                'Adjusting budget allocation...',
                'Monitoring conversion rates...',
                'Scanning for anomalies...'
            ];
            const agents = ['SENTINEL-A1', 'GUARDIAN-B2', 'PHANTOM-C3', 'CIPHER-D4', 'NEXUS-E5'];
            setLiveAgentLogs(prev => {
                const newLog = {
                    id: Date.now(),
                    agent: agents[Math.floor(Math.random() * agents.length)],
                    action: actions[Math.floor(Math.random() * actions.length)],
                    status: Math.random() > 0.3 ? 'processing' : 'success'
                };
                return [newLog, ...prev.slice(0, 4)];
            });
        }, 3000);
        return () => clearInterval(logInterval);
    }, []);
    const formatTime = (date) => date.toLocaleTimeString('en-US', { hour12: false });
    const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const unreadCount = notifications.filter(n => !n.read).length;
    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };
    const metrics = [
        { title: 'TOTAL REVENUE', value: 47892, change: 23.5, icon: DollarSign, color: 'cyan' },
        { title: 'AD SPEND', value: 12450, change: -5.2, icon: TrendingUp, color: 'orange' },
        { title: 'ROAS', value: 3.85, change: 12.8, icon: PieChart, color: 'purple', isDecimal: true },
        { title: 'CONVERSIONS', value: 1247, change: 18.3, icon: Users, color: 'green' }
    ];
    const campaigns = [
        { id: '1', name: 'Summer Sale 2024', platform: 'Google Ads', status: 'active', spend: 4250, revenue: 18420, roas: 4.33 },
        { id: '2', name: 'Brand Awareness', platform: 'Meta Ads', status: 'active', spend: 3180, revenue: 12650, roas: 3.98 },
        { id: '3', name: 'Product Launch', platform: 'TikTok', status: 'active', spend: 2890, revenue: 9870, roas: 3.42 },
        { id: '4', name: 'Retargeting Q1', platform: 'Google Ads', status: 'paused', spend: 1420, revenue: 6340, roas: 4.47 }
    ];
    const activities = [
        { id: '1', action: 'Reduced CPC by 18% on underperforming keywords', platform: 'Google Ads', time: '00:03:22', impact: '+$234', type: 'optimization' },
        { id: '2', action: 'Discovered high-converting audience segment', platform: 'Meta Ads', time: '00:12:45', impact: '+15% CTR', type: 'insight' },
        { id: '3', action: 'Paused ad with declining performance', platform: 'TikTok', time: '00:28:18', impact: '+$89', type: 'optimization' },
        { id: '4', action: 'Budget approaching daily limit warning', platform: 'Google Ads', time: '00:45:33', impact: '87% USED', type: 'alert' }
    ];
    return (_jsxs("div", { className: "min-h-screen cyber-bg", children: [_jsx("div", { className: "scan-line" }), _jsx(Particles, {}), _jsxs("aside", { className: `fixed left-0 top-0 h-full bg-[#080810]/95 backdrop-blur-xl border-r border-[#00f0ff]/10 z-40 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`, children: [_jsx("div", { className: "p-6", children: _jsxs(Link, { to: "/", className: "flex items-center gap-3 group", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-11 h-11 bg-gradient-to-br from-[#00f0ff] to-[#a855f7] rounded-lg flex items-center justify-center animate-float", children: _jsx(Shield, { className: "w-6 h-6 text-black" }) }), _jsx("div", { className: "absolute -inset-1 bg-gradient-to-br from-[#00f0ff] to-[#a855f7] rounded-lg blur-lg opacity-40 group-hover:opacity-70 transition-opacity -z-10" })] }), sidebarOpen && (_jsxs("div", { className: "animate-fade-in-up", children: [_jsxs("h1", { className: "text-xl font-cyber font-bold tracking-wider", children: [_jsx("span", { className: "neon-text", children: "AE" }), _jsx("span", { className: "text-white", children: "GIS" })] }), _jsx("p", { className: "text-[10px] text-[#00f0ff]/50 font-mono tracking-[0.2em]", children: "MEDIA BUYING v3.0" })] }))] }) }), _jsx("nav", { className: "px-3 space-y-1", children: [
                            { icon: BarChart3, label: 'Dashboard', href: '/dashboard', active: true },
                            { icon: Globe, label: 'Platforms', href: '/connect-platforms' },
                            { icon: Target, label: 'Campaigns', href: '/connected-accounts' },
                            { icon: Bot, label: 'AI Agents', href: '/agents' },
                            { icon: TrendingUp, label: 'Analytics', href: '/analytics' },
                            { icon: Settings, label: 'Settings', href: '/settings' }
                        ].map((item, i) => (_jsxs(Link, { to: item.href, className: `sidebar-item ${item.active ? 'active' : ''}`, children: [_jsx(item.icon, { className: "w-5 h-5" }), sidebarOpen && _jsx("span", { className: "font-medium", children: item.label })] }, i))) }), sidebarOpen && (_jsx("div", { className: "absolute bottom-0 left-0 right-0 p-4", children: _jsxs("div", { className: "cyber-card p-4 border-[#00f0ff]/30", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("div", { className: "icon-box icon-box-cyan w-8 h-8", children: _jsx(Cpu, { className: "w-4 h-4" }) }), _jsxs("div", { children: [_jsx("span", { className: "text-sm font-semibold text-white", children: "AI SYSTEM" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "status-dot active" }), _jsx("span", { className: "text-xs font-mono text-emerald-400", children: "ONLINE" })] })] })] }), _jsx("div", { className: "space-y-1 text-xs font-mono", children: liveAgentLogs.slice(0, 2).map(log => (_jsxs("div", { className: "flex items-center gap-2 text-slate-400 truncate", children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full ${log.status === 'processing' ? 'bg-[#00f0ff] animate-pulse' : 'bg-emerald-400'}` }), _jsxs("span", { className: "truncate", children: [log.agent, ": ", log.action] })] }, log.id))) })] }) }))] }), _jsxs("div", { className: `transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`, children: [_jsx("header", { className: "sticky top-0 bg-[#080810]/90 backdrop-blur-xl border-b border-[#00f0ff]/10 z-30", children: _jsxs("div", { className: "flex items-center justify-between px-8 py-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: () => setSidebarOpen(!sidebarOpen), className: "p-2 hover:bg-[#00f0ff]/10 rounded-lg transition-colors border border-transparent hover:border-[#00f0ff]/20", children: _jsx(Menu, { className: "w-5 h-5 text-[#00f0ff]" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-cyber font-bold text-white tracking-wide", children: "COMMAND CENTER" }), _jsx("p", { className: "text-xs font-mono text-slate-500", children: "Real-time performance monitoring" })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "hidden lg:flex items-center gap-3 px-4 py-2 cyber-card", children: [_jsx(Activity, { className: "w-4 h-4 text-[#00f0ff]" }), _jsx("span", { className: "text-xs font-mono text-slate-400", children: "SYS:" }), _jsx("span", { className: "text-xs font-mono text-emerald-400", children: "OPTIMAL" }), _jsx("div", { className: "w-px h-4 bg-[#00f0ff]/20" }), _jsx(Shield, { className: "w-4 h-4 text-emerald-400" }), _jsx("span", { className: "text-xs font-mono text-slate-400", children: "THREAT:" }), _jsx("span", { className: "text-xs font-mono text-emerald-400", children: "LOW" })] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" }), _jsx("input", { type: "text", placeholder: "Search...", className: "cyber-input pl-10 pr-4 py-2 text-sm w-48" })] }), _jsxs("div", { className: "text-right font-mono hidden sm:block", children: [_jsx("div", { className: "text-sm text-[#00f0ff] font-cyber tracking-wider animate-flicker", children: formatTime(currentTime) }), _jsx("div", { className: "text-xs text-slate-500", children: formatDate(currentTime) })] }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setShowNotifications(!showNotifications), className: "p-2.5 cyber-card hover:border-[#00f0ff]/40 transition-all relative", children: [_jsx(Bell, { className: "w-5 h-5 text-slate-400" }), unreadCount > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 w-5 h-5 bg-[#ff6b00] rounded-full text-xs font-bold text-black flex items-center justify-center animate-glow", children: unreadCount }))] }), showNotifications && (_jsxs("div", { className: "absolute right-0 top-full mt-2 w-80 cyber-card border-[#00f0ff]/30 animate-fade-in-up z-50", children: [_jsxs("div", { className: "p-4 border-b border-white/5 flex items-center justify-between", children: [_jsx("span", { className: "font-cyber text-white", children: "NOTIFICATIONS" }), _jsx("button", { onClick: () => setShowNotifications(false), className: "p-1 hover:bg-white/10 rounded", children: _jsx(X, { className: "w-4 h-4 text-slate-400" }) })] }), _jsx("div", { className: "max-h-80 overflow-y-auto", children: notifications.map(notif => (_jsx("div", { onClick: () => markAsRead(notif.id), className: `p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!notif.read ? 'bg-[#00f0ff]/5' : ''}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `icon-box w-8 h-8 ${notif.type === 'success' ? 'icon-box-green' :
                                                                                notif.type === 'warning' ? 'icon-box-orange' : 'icon-box-cyan'}`, children: notif.type === 'success' ? _jsx(CheckCircle, { className: "w-4 h-4" }) :
                                                                                notif.type === 'warning' ? _jsx(AlertTriangle, { className: "w-4 h-4" }) :
                                                                                    _jsx(Eye, { className: "w-4 h-4" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-white", children: notif.title }), _jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: notif.message }), _jsx("p", { className: "text-xs font-mono text-slate-500 mt-1", children: notif.time })] }), !notif.read && _jsx("span", { className: "w-2 h-2 bg-[#00f0ff] rounded-full" })] }) }, notif.id))) })] }))] })] })] }) }), _jsxs("main", { className: "p-4 md:p-8 space-y-6 relative z-10", children: [_jsx("section", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: metrics.map((metric, i) => (_jsxs("div", { className: `cyber-card cyber-card-${metric.color} p-4 md:p-6 hover-lift animate-fade-in-up stagger-${i + 1}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("div", { className: `icon-box icon-box-${metric.color} w-10 h-10 md:w-12 md:h-12`, children: _jsx(metric.icon, { className: "w-5 h-5 md:w-6 md:h-6" }) }), _jsxs("div", { className: `cyber-badge ${metric.change >= 0 ? 'cyber-badge-green' : 'cyber-badge-red'}`, children: [metric.change >= 0 ? _jsx(ArrowUpRight, { className: "w-3 h-3 mr-1" }) : _jsx(ArrowDownRight, { className: "w-3 h-3 mr-1" }), Math.abs(metric.change), "%"] })] }), _jsx("div", { className: `text-2xl md:text-3xl font-cyber font-bold mb-1 ${metric.color === 'cyan' ? 'neon-text' :
                                                metric.color === 'orange' ? 'neon-text-orange' :
                                                    metric.color === 'purple' ? 'neon-text-purple' : 'neon-text-green'}`, children: metric.isDecimal ? (_jsx(AnimatedNumber, { value: metric.value, suffix: "x", decimals: 2 })) : (_jsx(AnimatedNumber, { value: metric.value, prefix: metric.title.includes('REVENUE') || metric.title.includes('SPEND') ? '$' : '' })) }), _jsx("p", { className: "text-xs font-mono text-slate-500 tracking-wider", children: metric.title })] }, metric.title))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("section", { className: "lg:col-span-2 cyber-card p-6 animate-fade-in-up stagger-2", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "icon-box icon-box-cyan w-10 h-10", children: _jsx(BarChart3, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-cyber text-lg text-white tracking-wide", children: "REVENUE vs SPEND" }), _jsx("p", { className: "text-xs font-mono text-slate-500", children: "Interactive performance chart" })] })] }), _jsxs("button", { className: "px-4 py-2 text-xs font-mono cyber-card hover:border-[#00f0ff]/40 flex items-center gap-2", children: [_jsx(Calendar, { className: "w-4 h-4 text-[#00f0ff]" }), _jsx("span", { className: "text-slate-400", children: "2024" })] })] }), _jsx("div", { className: "h-72", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: revenueData, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "colorRevenue", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#00f0ff", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#00f0ff", stopOpacity: 0 })] }), _jsxs("linearGradient", { id: "colorSpend", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#ff6b00", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#ff6b00", stopOpacity: 0 })] })] }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(0,240,255,0.1)" }), _jsx(XAxis, { dataKey: "name", stroke: "#64748b", fontSize: 12, tickLine: false }), _jsx(YAxis, { stroke: "#64748b", fontSize: 12, tickLine: false, tickFormatter: (v) => `$${v / 1000}k` }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}) }), _jsx(Area, { type: "monotone", dataKey: "revenue", stroke: "#00f0ff", strokeWidth: 2, fill: "url(#colorRevenue)", name: "Revenue" }), _jsx(Area, { type: "monotone", dataKey: "spend", stroke: "#ff6b00", strokeWidth: 2, fill: "url(#colorSpend)", name: "Spend" })] }) }) }), _jsxs("div", { className: "flex items-center justify-center gap-6 mt-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-[#00f0ff]" }), _jsx("span", { className: "text-xs font-mono text-slate-400", children: "REVENUE" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-[#ff6b00]" }), _jsx("span", { className: "text-xs font-mono text-slate-400", children: "AD SPEND" })] })] })] }), _jsxs("section", { className: "cyber-card p-6 animate-fade-in-up stagger-3", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "icon-box icon-box-green w-10 h-10", children: _jsx(Target, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-cyber text-lg text-white tracking-wide", children: "OBJECTIVE" }), _jsx("p", { className: "text-xs font-mono text-slate-500", children: "Monthly target" })] })] }), _jsx("div", { className: "flex justify-center mb-6", children: _jsx(CircularProgress, { value: 77, size: 160, strokeWidth: 10, color: "cyan" }) }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5", children: [_jsx("span", { className: "text-sm text-slate-400", children: "Current" }), _jsx("span", { className: "font-mono text-white", children: "$38,450" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 bg-[#00f0ff]/5 rounded-lg border border-[#00f0ff]/20", children: [_jsx("span", { className: "text-sm text-[#00f0ff]", children: "Target" }), _jsx("span", { className: "font-mono text-[#00f0ff]", children: "$50,000" })] })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("section", { className: "lg:col-span-2 cyber-card animate-fade-in-up stagger-3", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-white/5", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "icon-box icon-box-orange w-10 h-10", children: _jsx(Crosshair, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-cyber text-lg text-white tracking-wide", children: "CAMPAIGNS" }), _jsx("p", { className: "text-xs font-mono text-slate-500", children: "Performance metrics" })] })] }), _jsxs(Link, { to: "/connected-accounts", className: "cyber-button text-xs", children: [_jsx(Plus, { className: "w-4 h-4 mr-1" }), "NEW"] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-xs font-mono text-slate-500 border-b border-white/5", children: [_jsx("th", { className: "p-4", children: "CAMPAIGN" }), _jsx("th", { className: "p-4", children: "STATUS" }), _jsx("th", { className: "p-4", children: "SPEND" }), _jsx("th", { className: "p-4", children: "REVENUE" }), _jsx("th", { className: "p-4", children: "ROAS" })] }) }), _jsx("tbody", { children: campaigns.map((campaign, i) => (_jsxs("tr", { className: `table-row animate-slide-in-left stagger-${i + 1}`, children: [_jsxs("td", { className: "p-4", children: [_jsx("p", { className: "font-medium text-white", children: campaign.name }), _jsx("p", { className: "text-xs font-mono text-slate-500", children: campaign.platform })] }), _jsx("td", { className: "p-4", children: _jsxs("span", { className: `cyber-badge ${campaign.status === 'active' ? 'cyber-badge-green' : 'cyber-badge-orange'}`, children: [_jsx("span", { className: `status-dot mr-2 ${campaign.status === 'active' ? 'active' : 'warning'}` }), campaign.status] }) }), _jsxs("td", { className: "p-4 font-mono text-white", children: ["$", campaign.spend.toLocaleString()] }), _jsxs("td", { className: "p-4 font-mono text-[#00f0ff]", children: ["$", campaign.revenue.toLocaleString()] }), _jsx("td", { className: "p-4", children: _jsxs("span", { className: `font-mono font-semibold ${campaign.roas >= 4 ? 'neon-text-green' : 'neon-text'}`, children: [campaign.roas, "x"] }) })] }, campaign.id))) })] }) })] }), _jsxs("section", { className: "cyber-card cyber-card-purple p-6 animate-fade-in-up stagger-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "icon-box icon-box-purple w-10 h-10", children: _jsx(Layers, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-cyber text-lg text-white tracking-wide", children: "PLATFORMS" }), _jsx("p", { className: "text-xs font-mono text-slate-500", children: "Spend distribution" })] })] }), _jsx("div", { className: "h-48 mb-4", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsx(RechartsPie, { children: _jsx(Pie, { data: platformPieData, cx: "50%", cy: "50%", innerRadius: 50, outerRadius: 70, paddingAngle: 5, dataKey: "value", children: platformPieData.map((entry, index) => (_jsx(Cell, { fill: entry.color, stroke: "transparent" }, `cell-${index}`))) }) }) }) }), _jsx("div", { className: "space-y-2", children: platformPieData.map((platform) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: platform.color } }), _jsx("span", { className: "text-sm text-slate-400", children: platform.name })] }), _jsxs("span", { className: "text-sm font-mono", style: { color: platform.color }, children: [platform.value, "%"] })] }, platform.name))) })] })] }), _jsxs("section", { className: "cyber-card animate-fade-in-up stagger-5", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-white/5", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "icon-box icon-box-cyan w-10 h-10", children: _jsx(Bot, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-cyber text-lg text-white tracking-wide", children: "AI AGENT ACTIVITY" }), _jsx("p", { className: "text-xs font-mono text-slate-500", children: "Real-time optimization log" })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded", children: [_jsx("span", { className: "w-2 h-2 bg-red-500 rounded-full animate-pulse" }), _jsx("span", { className: "text-xs font-mono text-red-400", children: "LIVE" })] }), _jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5 cyber-card", children: [_jsx("span", { className: "status-dot active" }), _jsx("span", { className: "text-xs font-mono text-emerald-400", children: "5 AGENTS" })] })] })] }), _jsx("div", { className: "divide-y divide-white/5", children: activities.map((activity, i) => (_jsxs("div", { className: `flex items-center gap-4 p-4 hover:bg-white/5 transition-colors animate-slide-in-left stagger-${i + 1}`, children: [_jsx("div", { className: `icon-box w-10 h-10 ${activity.type === 'optimization' ? 'icon-box-cyan' :
                                                        activity.type === 'insight' ? 'icon-box-purple' : 'icon-box-orange'}`, children: activity.type === 'optimization' ? _jsx(Zap, { className: "w-5 h-5" }) :
                                                        activity.type === 'insight' ? _jsx(Eye, { className: "w-5 h-5" }) : _jsx(Activity, { className: "w-5 h-5" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-white", children: activity.action }), _jsxs("p", { className: "text-xs font-mono text-slate-500", children: [activity.platform, " \u2022 ", activity.time] })] }), _jsx("div", { className: `cyber-badge ${activity.type === 'optimization' ? 'cyber-badge-green' :
                                                        activity.type === 'insight' ? 'cyber-badge-purple' : 'cyber-badge-orange'}`, children: activity.impact })] }, activity.id))) }), _jsx("div", { className: "p-4 border-t border-white/5", children: _jsxs(Link, { to: "/agents", className: "flex items-center justify-center gap-2 text-sm font-mono text-[#00f0ff] hover:text-[#00f0ff]/80 transition-colors", children: ["VIEW ALL ACTIVITY", _jsx(ChevronRight, { className: "w-4 h-4" })] }) })] }), _jsx("section", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
                                    { href: '/connect-platforms', icon: Globe, title: 'PLATFORMS', desc: 'Connect ad accounts', color: 'cyan' },
                                    { href: '/connected-accounts', icon: Target, title: 'CAMPAIGNS', desc: 'Manage advertisements', color: 'orange' },
                                    { href: '/analytics', icon: BarChart3, title: 'ANALYTICS', desc: 'Deep performance insights', color: 'purple' }
                                ].map((item, i) => (_jsxs(Link, { to: item.href, className: `cyber-card cyber-card-${item.color} p-6 hover-lift animate-scale-in stagger-${i + 1} group`, children: [_jsx("div", { className: `icon-box icon-box-${item.color} w-12 h-12 mb-4`, children: _jsx(item.icon, { className: "w-6 h-6" }) }), _jsx("h3", { className: "font-cyber text-lg text-white mb-1 tracking-wide", children: item.title }), _jsx("p", { className: "text-sm text-slate-400 mb-4", children: item.desc }), _jsxs("span", { className: `flex items-center gap-1 text-sm font-mono ${item.color === 'cyan' ? 'text-[#00f0ff]' : item.color === 'orange' ? 'text-[#ff6b00]' : 'text-[#a855f7]'} opacity-0 group-hover:opacity-100 transition-opacity`, children: ["ACCESS ", _jsx(ArrowRight, { className: "w-4 h-4" })] })] }, i))) })] }), _jsx("footer", { className: "border-t border-[#00f0ff]/10 py-6 px-8", children: _jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-6 text-xs font-mono text-slate-500", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Database, { className: "w-4 h-4 text-[#00f0ff]" }), _jsxs("span", { children: ["DATA: ", _jsx("span", { className: "text-emerald-400", children: "SYNCED" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Wifi, { className: "w-4 h-4 text-[#00f0ff]" }), _jsxs("span", { children: ["LATENCY: ", _jsx("span", { className: "text-emerald-400", children: "24ms" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Lock, { className: "w-4 h-4 text-[#00f0ff]" }), _jsxs("span", { children: ["STATUS: ", _jsx("span", { className: "text-emerald-400", children: "ENCRYPTED" })] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xs font-mono text-slate-500", children: "AEGIS MEDIA BUYING" }), _jsx("span", { className: "text-[#00f0ff]", children: "|" }), _jsx("span", { className: "text-xs font-cyber text-[#00f0ff] animate-flicker", children: "v3.0" })] })] }) })] })] }));
};
export default DashboardCyber;
