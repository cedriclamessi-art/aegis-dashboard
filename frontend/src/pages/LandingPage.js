import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Bot, TrendingUp, Shield, Zap, BarChart3, Target, DollarSign, Clock, Users, Globe, Play, Star, ChevronDown, Activity, Cpu, Database, Eye, Layers } from 'lucide-react';
const agents = [
    { name: 'Optimiseur d\'Enchères', desc: 'Ajuste les enchères en temps réel', icon: DollarSign, color: 'cyan' },
    { name: 'Détecteur d\'Audiences', desc: 'Découvre les audiences rentables', icon: Users, color: 'orange' },
    { name: 'Gardien du Budget', desc: 'Protège contre le sur-dépense', icon: Shield, color: 'purple' },
    { name: 'Analyseur Créatif', desc: 'Évalue la performance des visuels', icon: Eye, color: 'cyan' },
    { name: 'Détecteur d\'Anomalies', desc: 'Détecte les problèmes avant impact', icon: Activity, color: 'orange' },
    { name: 'Maximiseur ROAS', desc: 'Optimise le retour sur investissement', icon: TrendingUp, color: 'cyan' },
    { name: 'Sync Multi-Plateforme', desc: 'Synchronise Meta, Google, TikTok', icon: Globe, color: 'purple' },
    { name: 'Prédicteur de Tendances', desc: 'Anticipe les tendances du marché', icon: Target, color: 'orange' },
    { name: 'Moteur de Tests A/B', desc: 'Automatise les tests créatifs', icon: Layers, color: 'cyan' },
    { name: 'Agent Horaire', desc: 'Optimise par heure et jour', icon: Clock, color: 'purple' },
    { name: 'Optimiseur Géo', desc: 'Cible les zones rentables', icon: Globe, color: 'orange' },
    { name: 'Créateur Lookalike', desc: 'Crée des audiences similaires', icon: Users, color: 'cyan' },
    { name: 'Moniteur de Fatigue', desc: 'Détecte l\'usure des créas', icon: Activity, color: 'orange' },
    { name: 'Analyste Attribution', desc: 'Analyse le parcours client', icon: Database, color: 'purple' },
    { name: 'Veilleur Concurrence', desc: 'Surveille la concurrence', icon: Eye, color: 'cyan' },
    { name: 'Générateur de Rapports', desc: 'Génère des rapports automatiques', icon: BarChart3, color: 'orange' },
];
const useIntersectionObserver = (options = {}) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.1, ...options });
        if (ref.current)
            observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return { ref, isVisible };
};
export const LandingPage = () => {
    const [savings, setSavings] = useState(0);
    const [clients, setClients] = useState(0);
    const [roas, setRoas] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const heroRef = useIntersectionObserver();
    const featuresRef = useIntersectionObserver();
    const agentsRef = useIntersectionObserver();
    const pricingRef = useIntersectionObserver();
    const targetSavings = 2847000;
    const targetClients = 1247;
    const targetRoas = 3.8;
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
    useEffect(() => {
        const duration = 2500;
        const steps = 60;
        let step = 0;
        const interval = setInterval(() => {
            step++;
            setSavings(Math.floor((targetSavings / steps) * step));
            setClients(Math.floor((targetClients / steps) * step));
            setRoas(Number(((targetRoas / steps) * step).toFixed(1)));
            if (step >= steps)
                clearInterval(interval);
        }, duration / steps);
        return () => clearInterval(interval);
    }, []);
    const getColorClasses = (color) => {
        const colors = {
            cyan: {
                bg: 'bg-[#00f0ff]/10',
                text: 'text-[#00f0ff]',
                border: 'border-[#00f0ff]/30',
                glow: 'shadow-[0_0_20px_rgba(0,240,255,0.3)]'
            },
            orange: {
                bg: 'bg-[#ff6b00]/10',
                text: 'text-[#ff6b00]',
                border: 'border-[#ff6b00]/30',
                glow: 'shadow-[0_0_20px_rgba(255,107,0,0.3)]'
            },
            purple: {
                bg: 'bg-[#a855f7]/10',
                text: 'text-[#a855f7]',
                border: 'border-[#a855f7]/30',
                glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]'
            },
        };
        return colors[color] || colors.cyan;
    };
    return (_jsxs("div", { className: "min-h-screen bg-[#0a0a0f] overflow-hidden", children: [_jsx("div", { className: "cyber-scan-line" }), _jsx("div", { className: "pointer-events-none fixed inset-0 z-0 transition-opacity duration-300", style: {
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0,240,255,0.06), transparent 40%)`
                } }), _jsx("div", { className: "fixed inset-0 cyber-grid opacity-30 pointer-events-none" }), _jsx("nav", { className: "border-b border-[#00f0ff]/10 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50", children: _jsx("div", { className: "max-w-6xl mx-auto px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3 group", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-[#00f0ff] to-[#ff6b00] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] group-hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-shadow", children: _jsx(Cpu, { className: "w-5 h-5 text-black" }) }), _jsxs("span", { className: "text-xl font-bold text-white", children: [_jsx("span", { className: "text-[#00f0ff]", children: "AE" }), "GIS"] })] }), _jsxs("div", { className: "hidden md:flex items-center gap-8", children: [_jsx("a", { href: "#features", className: "text-slate-400 hover:text-[#00f0ff] transition-colors text-sm", children: "Fonctionnalit\u00E9s" }), _jsx("a", { href: "#agents", className: "text-slate-400 hover:text-[#00f0ff] transition-colors text-sm", children: "16 Agents" }), _jsx("a", { href: "#pricing", className: "text-slate-400 hover:text-[#00f0ff] transition-colors text-sm", children: "Tarifs" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: "/dashboard", className: "text-slate-400 hover:text-white transition-colors text-sm hidden md:block", children: "Connexion" }), _jsx(Link, { to: "/dashboard", className: "cyber-button text-black text-sm", children: "Essai gratuit" })] })] }) }) }), _jsxs("section", { ref: heroRef.ref, className: "relative pt-20 pb-32", children: [_jsx("div", { className: "absolute top-20 left-1/4 w-96 h-96 bg-[#00f0ff]/20 rounded-full blur-[150px] animate-pulse" }), _jsx("div", { className: "absolute bottom-0 right-1/4 w-80 h-80 bg-[#ff6b00]/15 rounded-full blur-[120px] animate-pulse", style: { animationDelay: '1s' } }), _jsx("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#a855f7]/10 rounded-full blur-[200px]" }), _jsx("div", { className: "max-w-6xl mx-auto px-6 relative", children: _jsxs("div", { className: `text-center max-w-4xl mx-auto ${heroRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`, children: [_jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-full text-[#00f0ff] text-sm mb-8 animate-float", children: [_jsx("div", { className: "w-2 h-2 bg-[#00f0ff] rounded-full animate-pulse shadow-[0_0_10px_#00f0ff]" }), "16 agents IA actifs 24h/24"] }), _jsxs("h1", { className: "text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight tracking-tight", children: [_jsx("span", { className: "block", children: "Vos pubs" }), _jsx("span", { className: "cyber-text", children: "optimis\u00E9es par l'IA" })] }), _jsxs("p", { className: "text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed", children: ["AEGIS analyse vos campagnes ", _jsx("span", { className: "text-[#00f0ff]", children: "Meta" }), ", ", _jsx("span", { className: "text-[#ff6b00]", children: "Google" }), " et ", _jsx("span", { className: "text-white", children: "TikTok" }), " en temps r\u00E9el. R\u00E9duisez vos co\u00FBts de ", _jsx("span", { className: "text-[#00f0ff] font-mono font-bold", children: "30%" }), " automatiquement."] }), _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4 mb-20", children: [_jsxs(Link, { to: "/dashboard", className: "group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#00f0ff] to-[#0891b2] text-black font-bold rounded-xl hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-all flex items-center justify-center gap-2", children: ["D\u00E9marrer gratuitement", _jsx(ArrowRight, { className: "w-5 h-5 group-hover:translate-x-1 transition-transform" })] }), _jsxs("button", { className: "w-full sm:w-auto px-8 py-4 border border-[#ff6b00]/50 text-[#ff6b00] font-semibold rounded-xl hover:bg-[#ff6b00]/10 hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] transition-all flex items-center justify-center gap-2", children: [_jsx(Play, { className: "w-5 h-5" }), "Voir la d\u00E9mo"] })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto", children: [
                                        { value: savings, suffix: '€', label: 'économisés par nos clients', color: 'cyan', prefix: '' },
                                        { value: clients, suffix: '', label: 'entreprises actives', color: 'orange', prefix: '+' },
                                        { value: roas, suffix: 'x', label: 'ROAS moyen', color: 'purple', prefix: '' },
                                    ].map((stat, i) => (_jsxs("div", { className: `text-center p-6 rounded-2xl bg-white/5 border border-white/10 stagger-${i + 1} ${heroRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`, children: [_jsxs("div", { className: `text-3xl sm:text-4xl md:text-5xl font-mono font-bold mb-2 ${stat.color === 'cyan' ? 'text-[#00f0ff] text-glow-cyan' :
                                                    stat.color === 'orange' ? 'text-[#ff6b00] text-glow-orange' :
                                                        'text-[#a855f7]'}`, children: [stat.prefix, stat.value.toLocaleString('fr-FR'), " ", stat.suffix] }), _jsx("p", { className: "text-slate-400 text-sm", children: stat.label })] }, i))) })] }) }), _jsx("div", { className: "absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce", children: _jsx(ChevronDown, { className: "w-6 h-6 text-[#00f0ff]/50" }) })] }), _jsx("section", { className: "py-12 border-y border-[#00f0ff]/10 bg-black/30", children: _jsx("div", { className: "max-w-6xl mx-auto px-6", children: _jsx("div", { className: "flex items-center justify-center gap-16 flex-wrap", children: ['Meta', 'Google', 'TikTok', 'Shopify', 'Stripe'].map((brand, i) => (_jsx("span", { className: "text-2xl font-bold text-white/20 hover:text-[#00f0ff]/50 transition-colors cursor-default", style: { animationDelay: `${i * 0.1}s` }, children: brand }, brand))) }) }) }), _jsx("section", { id: "features", ref: featuresRef.ref, className: "py-28 relative", children: _jsxs("div", { className: "max-w-6xl mx-auto px-6", children: [_jsxs("div", { className: `text-center mb-16 ${featuresRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`, children: [_jsx("span", { className: "text-[#00f0ff] text-sm font-mono mb-4 block", children: "// FONCTIONNALIT\u00C9S" }), _jsxs("h2", { className: "text-4xl md:text-5xl font-bold text-white mb-4", children: ["Pourquoi choisir ", _jsx("span", { className: "text-[#00f0ff]", children: "AEGIS" }), " ?"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
                                { icon: Bot, title: '16 Agents IA', desc: 'Chaque agent maîtrise un aspect de l\'optimisation', color: 'cyan' },
                                { icon: TrendingUp, title: '+127% ROAS', desc: 'Résultats prouvés sur des milliers de campagnes', color: 'orange' },
                                { icon: Shield, title: 'Sécurité totale', desc: 'Vos données restent privées et chiffrées', color: 'purple' },
                                { icon: Zap, title: 'Temps réel', desc: 'Optimisation 24h/24, réaction en millisecondes', color: 'cyan' },
                                { icon: Globe, title: 'Multi-plateforme', desc: 'Meta, Google, TikTok, Pinterest, Snapchat', color: 'orange' },
                                { icon: BarChart3, title: 'Rapports intelligents', desc: 'Insights actionnables, alertes automatiques', color: 'purple' },
                            ].map((feature, i) => {
                                const colors = getColorClasses(feature.color);
                                return (_jsxs("div", { className: `cyber-card p-6 hover-lift group stagger-${i + 1} ${featuresRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`, children: [_jsx("div", { className: `w-14 h-14 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-4 group-hover:${colors.glow} transition-shadow`, children: _jsx(feature.icon, { className: `w-7 h-7 ${colors.text}` }) }), _jsx("h3", { className: "text-xl font-bold text-white mb-2", children: feature.title }), _jsx("p", { className: "text-slate-400 text-sm leading-relaxed", children: feature.desc })] }, i));
                            }) })] }) }), _jsx("section", { id: "agents", ref: agentsRef.ref, className: "py-28 bg-gradient-to-b from-transparent via-[#00f0ff]/5 to-transparent", children: _jsxs("div", { className: "max-w-6xl mx-auto px-6", children: [_jsxs("div", { className: `text-center mb-16 ${agentsRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`, children: [_jsx("span", { className: "text-[#ff6b00] text-sm font-mono mb-4 block", children: "// INTELLIGENCE ARTIFICIELLE" }), _jsxs("h2", { className: "text-4xl md:text-5xl font-bold text-white mb-4", children: [_jsx("span", { className: "text-[#00f0ff]", children: "16" }), " agents \u00E0 votre service"] }), _jsx("p", { className: "text-slate-400 max-w-2xl mx-auto", children: "Chaque agent est sp\u00E9cialis\u00E9 dans un domaine pr\u00E9cis" })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4", children: agents.map((agent, i) => {
                                const colors = getColorClasses(agent.color);
                                return (_jsxs("div", { className: `cyber-card p-4 hover-lift group ${agentsRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`, style: { animationDelay: `${i * 0.05}s` }, children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`, children: _jsx(agent.icon, { className: `w-5 h-5 ${colors.text}` }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("h3", { className: "font-semibold text-white text-sm mb-0.5 truncate", children: agent.name }), _jsx("p", { className: "text-slate-500 text-xs line-clamp-2", children: agent.desc })] })] }), _jsxs("div", { className: "mt-3 flex items-center gap-2", children: [_jsx("span", { className: "status-dot active" }), _jsx("span", { className: "text-xs text-emerald-400 font-mono", children: "EN LIGNE" })] })] }, i));
                            }) })] }) }), _jsx("section", { className: "py-28", children: _jsx("div", { className: "max-w-6xl mx-auto px-6", children: _jsx("div", { className: "cyber-card p-8 md:p-12 gradient-border", children: _jsxs("div", { className: "grid md:grid-cols-2 gap-12 items-center", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[#a855f7] text-sm font-mono mb-4 block", children: "// PROCESSUS" }), _jsxs("h2", { className: "text-3xl md:text-4xl font-bold text-white mb-8", children: ["Comment \u00E7a ", _jsx("span", { className: "text-[#00f0ff]", children: "marche" }), " ?"] }), _jsx("div", { className: "space-y-6", children: [
                                                { step: '01', title: 'Connectez vos comptes', desc: 'Meta, Google, TikTok en 2 clics', color: 'cyan' },
                                                { step: '02', title: 'L\'IA analyse vos données', desc: 'Historique, tendances, opportunités', color: 'orange' },
                                                { step: '03', title: 'Recevez des recommandations', desc: 'Actions concrètes pour améliorer', color: 'purple' },
                                                { step: '04', title: 'Appliquez en 1 clic', desc: 'Ou laissez l\'IA faire automatiquement', color: 'cyan' },
                                            ].map((item, i) => (_jsxs("div", { className: "flex gap-4 group", children: [_jsx("div", { className: `w-12 h-12 rounded-xl ${item.color === 'cyan' ? 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff]' :
                                                            item.color === 'orange' ? 'bg-[#ff6b00]/10 border-[#ff6b00]/30 text-[#ff6b00]' :
                                                                'bg-[#a855f7]/10 border-[#a855f7]/30 text-[#a855f7]'} border flex items-center justify-center flex-shrink-0 font-mono font-bold text-sm group-hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-shadow`, children: item.step }), _jsxs("div", { children: [_jsx("h3", { className: "text-white font-semibold mb-1", children: item.title }), _jsx("p", { className: "text-slate-500 text-sm", children: item.desc })] })] }, i))) })] }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "aspect-video bg-gradient-to-br from-[#00f0ff]/5 to-[#ff6b00]/5 rounded-2xl border border-[#00f0ff]/20 flex items-center justify-center group cursor-pointer hover:border-[#00f0ff]/50 transition-colors", children: _jsx("div", { className: "w-20 h-20 bg-[#00f0ff]/20 rounded-full flex items-center justify-center group-hover:bg-[#00f0ff]/30 group-hover:shadow-[0_0_40px_rgba(0,240,255,0.4)] transition-all", children: _jsx(Play, { className: "w-8 h-8 text-[#00f0ff] ml-1" }) }) }), _jsx("div", { className: "absolute -top-4 -right-4 w-24 h-24 bg-[#ff6b00]/20 rounded-full blur-2xl animate-pulse" })] })] }) }) }) }), _jsx("section", { className: "py-28 bg-gradient-to-b from-transparent via-[#ff6b00]/5 to-transparent", children: _jsxs("div", { className: "max-w-6xl mx-auto px-6", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("span", { className: "text-[#00f0ff] text-sm font-mono mb-4 block", children: "// T\u00C9MOIGNAGES" }), _jsxs("h2", { className: "text-4xl font-bold text-white", children: ["Ce que disent nos ", _jsx("span", { className: "text-[#ff6b00]", children: "clients" })] })] }), _jsx("div", { className: "grid md:grid-cols-3 gap-6", children: [
                                { name: 'Marie L.', role: 'Gérante E-commerce', text: 'ROAS passé de 2.1x à 4.3x en 3 semaines. Incroyable !', avatar: 'M' },
                                { name: 'Thomas D.', role: 'Directeur Marketing', text: 'J\'économise 15h/semaine sur l\'optimisation de campagnes.', avatar: 'T' },
                                { name: 'Sophie R.', role: 'Fondatrice Agence', text: 'Mes clients adorent les résultats. AEGIS est devenu indispensable.', avatar: 'S' },
                            ].map((t, i) => (_jsxs("div", { className: "cyber-card p-6 hover-lift", children: [_jsx("div", { className: "flex gap-1 mb-4", children: [1, 2, 3, 4, 5].map(star => (_jsx(Star, { className: "w-5 h-5 text-[#ff6b00] fill-[#ff6b00]" }, star))) }), _jsxs("p", { className: "text-white mb-6 leading-relaxed", children: ["\"", t.text, "\""] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#ff6b00] flex items-center justify-center text-black font-bold", children: t.avatar }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-semibold text-sm", children: t.name }), _jsx("p", { className: "text-slate-500 text-xs", children: t.role })] })] })] }, i))) })] }) }), _jsx("section", { id: "pricing", ref: pricingRef.ref, className: "py-28", children: _jsxs("div", { className: "max-w-6xl mx-auto px-6", children: [_jsxs("div", { className: `text-center mb-16 ${pricingRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`, children: [_jsx("span", { className: "text-[#a855f7] text-sm font-mono mb-4 block", children: "// TARIFICATION" }), _jsxs("h2", { className: "text-4xl md:text-5xl font-bold text-white mb-4", children: ["Tarifs ", _jsx("span", { className: "text-[#00f0ff]", children: "transparents" })] })] }), _jsx("div", { className: "grid md:grid-cols-3 gap-6 max-w-5xl mx-auto", children: [
                                {
                                    name: 'Découverte',
                                    price: '0',
                                    desc: 'Pour découvrir',
                                    features: ['1 compte pub', '3 agents IA', 'Rapports basiques'],
                                    color: 'default',
                                    cta: 'Commencer'
                                },
                                {
                                    name: 'Pro',
                                    price: '99',
                                    desc: 'Pour les PME',
                                    features: ['5 comptes pub', '16 agents IA', 'Optimisation auto', 'Support prioritaire', 'Accès API'],
                                    color: 'cyan',
                                    cta: 'Essai 14 jours',
                                    popular: true
                                },
                                {
                                    name: 'Entreprise',
                                    price: 'Sur mesure',
                                    desc: 'Pour les équipes',
                                    features: ['Comptes illimités', 'Agents personnalisés', 'Gestionnaire dédié', 'SLA garanti'],
                                    color: 'orange',
                                    cta: 'Nous contacter'
                                },
                            ].map((plan, i) => (_jsxs("div", { className: `cyber-card p-6 relative ${plan.popular ? 'border-[#00f0ff]/50 shadow-[0_0_30px_rgba(0,240,255,0.2)]' : ''} ${pricingRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`, style: { animationDelay: `${i * 0.1}s` }, children: [plan.popular && (_jsx("div", { className: "absolute -top-3 left-1/2 -translate-x-1/2", children: _jsx("span", { className: "px-3 py-1 bg-[#00f0ff] text-black text-xs font-bold rounded-full", children: "POPULAIRE" }) })), _jsx("h3", { className: "text-xl font-bold text-white mb-1", children: plan.name }), _jsx("p", { className: "text-slate-500 text-sm mb-4", children: plan.desc }), _jsx("div", { className: "mb-6", children: plan.price === 'Sur mesure' ? (_jsx("span", { className: "text-3xl font-bold text-white", children: plan.price })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-5xl font-mono font-bold text-[#00f0ff]", children: plan.price }), _jsx("span", { className: "text-slate-500", children: "\u20AC/mois" })] })) }), _jsx("ul", { className: "space-y-3 mb-6", children: plan.features.map((f, j) => (_jsxs("li", { className: "flex items-center gap-2 text-sm text-slate-300", children: [_jsx(Check, { className: "w-4 h-4 text-[#00f0ff] flex-shrink-0" }), f] }, j))) }), _jsx(Link, { to: "/dashboard", className: `block text-center py-3 rounded-xl font-semibold transition-all ${plan.popular
                                            ? 'bg-[#00f0ff] text-black hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]'
                                            : 'border border-white/20 text-white hover:bg-white/10'}`, children: plan.cta })] }, i))) })] }) }), _jsx("section", { className: "py-28", children: _jsx("div", { className: "max-w-4xl mx-auto px-6", children: _jsxs("div", { className: "relative p-8 md:p-12 rounded-3xl overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-[#00f0ff]/20 via-[#a855f7]/20 to-[#ff6b00]/20" }), _jsx("div", { className: "absolute inset-0 cyber-grid opacity-20" }), _jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-[#00f0ff]/30 rounded-full blur-[100px]" }), _jsx("div", { className: "absolute bottom-0 left-0 w-48 h-48 bg-[#ff6b00]/30 rounded-full blur-[80px]" }), _jsxs("div", { className: "relative text-center", children: [_jsxs("h2", { className: "text-3xl md:text-5xl font-bold text-white mb-4", children: ["Pr\u00EAt \u00E0 ", _jsx("span", { className: "text-[#00f0ff]", children: "booster" }), " vos campagnes ?"] }), _jsx("p", { className: "text-slate-300 mb-8 max-w-xl mx-auto", children: "Rejoignez plus de 1 200 entreprises qui utilisent AEGIS" }), _jsxs(Link, { to: "/dashboard", className: "inline-flex items-center gap-2 px-8 py-4 bg-[#00f0ff] text-black font-bold rounded-xl hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-all", children: ["Commencer gratuitement", _jsx(ArrowRight, { className: "w-5 h-5" })] }), _jsx("p", { className: "text-slate-500 text-sm mt-4 font-mono", children: "// Pas de carte bancaire requise" })] })] }) }) }), _jsx("footer", { className: "border-t border-[#00f0ff]/10 py-12 bg-black/30", children: _jsxs("div", { className: "max-w-6xl mx-auto px-6", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-8 mb-8", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("div", { className: "w-8 h-8 bg-gradient-to-br from-[#00f0ff] to-[#ff6b00] rounded-lg flex items-center justify-center", children: _jsx(Cpu, { className: "w-4 h-4 text-black" }) }), _jsx("span", { className: "font-bold text-white", children: "AEGIS" })] }), _jsx("p", { className: "text-slate-500 text-sm", children: "L'IA qui optimise vos pubs 24h/24." })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-white font-semibold mb-4 text-sm", children: "Produit" }), _jsxs("ul", { className: "space-y-2 text-sm text-slate-500", children: [_jsx("li", { children: _jsx("a", { href: "#features", className: "hover:text-[#00f0ff] transition-colors", children: "Fonctionnalit\u00E9s" }) }), _jsx("li", { children: _jsx("a", { href: "#agents", className: "hover:text-[#00f0ff] transition-colors", children: "Agents IA" }) }), _jsx("li", { children: _jsx("a", { href: "#pricing", className: "hover:text-[#00f0ff] transition-colors", children: "Tarifs" }) })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-white font-semibold mb-4 text-sm", children: "Ressources" }), _jsxs("ul", { className: "space-y-2 text-sm text-slate-500", children: [_jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-[#00f0ff] transition-colors", children: "Documentation" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-[#00f0ff] transition-colors", children: "API" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-[#00f0ff] transition-colors", children: "Blog" }) })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-white font-semibold mb-4 text-sm", children: "Contact" }), _jsxs("ul", { className: "space-y-2 text-sm text-slate-500", children: [_jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-[#00f0ff] transition-colors", children: "Support" }) }), _jsx("li", { children: _jsx("span", { className: "font-mono text-[#00f0ff]/70", children: "hello@aegis.ai" }) })] })] })] }), _jsxs("div", { className: "pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4", children: [_jsx("p", { className: "text-slate-500 text-sm font-mono", children: "\u00A9 2026 AEGIS // Tous droits r\u00E9serv\u00E9s" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "status-dot active" }), _jsx("span", { className: "text-xs text-emerald-400 font-mono", children: "TOUS SYST\u00C8MES OP\u00C9RATIONNELS" })] })] })] }) })] }));
};
export default LandingPage;
