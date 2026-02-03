import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Bot, TrendingUp, Shield, Zap,
  BarChart3, Target, DollarSign, Clock, Users, Globe, Play, Star,
  ChevronDown, Activity, Cpu, Database, Eye, Layers
} from 'lucide-react'

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
]

const useIntersectionObserver = (options = {}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.1, ...options })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

export const LandingPage = () => {
  const [savings, setSavings] = useState(0)
  const [clients, setClients] = useState(0)
  const [roas, setRoas] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  const heroRef = useIntersectionObserver()
  const featuresRef = useIntersectionObserver()
  const agentsRef = useIntersectionObserver()
  const pricingRef = useIntersectionObserver()

  const targetSavings = 2847000
  const targetClients = 1247
  const targetRoas = 3.8

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const duration = 2500
    const steps = 60
    let step = 0
    const interval = setInterval(() => {
      step++
      setSavings(Math.floor((targetSavings / steps) * step))
      setClients(Math.floor((targetClients / steps) * step))
      setRoas(Number(((targetRoas / steps) * step).toFixed(1)))
      if (step >= steps) clearInterval(interval)
    }, duration / steps)
    return () => clearInterval(interval)
  }, [])

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
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
    }
    return colors[color] || colors.cyan
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-hidden">
      <div className="cyber-scan-line" />
      
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0,240,255,0.06), transparent 40%)`
        }}
      />

      <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none" />

      <nav className="border-b border-[#00f0ff]/10 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00f0ff] to-[#ff6b00] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] group-hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-shadow">
                <Cpu className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold text-white">
                <span className="text-[#00f0ff]">AE</span>GIS
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-400 hover:text-[#00f0ff] transition-colors text-sm">Fonctionnalités</a>
              <a href="#agents" className="text-slate-400 hover:text-[#00f0ff] transition-colors text-sm">16 Agents</a>
              <a href="#pricing" className="text-slate-400 hover:text-[#00f0ff] transition-colors text-sm">Tarifs</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm hidden md:block">
                Connexion
              </Link>
              <Link 
                to="/dashboard" 
                className="cyber-button text-black text-sm"
              >
                Essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section ref={heroRef.ref} className="relative pt-20 pb-32">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#00f0ff]/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#ff6b00]/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#a855f7]/10 rounded-full blur-[200px]" />
        
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className={`text-center max-w-4xl mx-auto ${heroRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-full text-[#00f0ff] text-sm mb-8 animate-float">
              <div className="w-2 h-2 bg-[#00f0ff] rounded-full animate-pulse shadow-[0_0_10px_#00f0ff]" />
              16 agents IA actifs 24h/24
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight tracking-tight">
              <span className="block">Vos pubs</span>
              <span className="cyber-text">optimisées par l'IA</span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              AEGIS analyse vos campagnes <span className="text-[#00f0ff]">Meta</span>, <span className="text-[#ff6b00]">Google</span> et <span className="text-white">TikTok</span> en temps réel. 
              Réduisez vos coûts de <span className="text-[#00f0ff] font-mono font-bold">30%</span> automatiquement.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link 
                to="/dashboard" 
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#00f0ff] to-[#0891b2] text-black font-bold rounded-xl hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-all flex items-center justify-center gap-2"
              >
                Démarrer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 border border-[#ff6b00]/50 text-[#ff6b00] font-semibold rounded-xl hover:bg-[#ff6b00]/10 hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] transition-all flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Voir la démo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { value: savings, suffix: '€', label: 'économisés par nos clients', color: 'cyan', prefix: '' },
                { value: clients, suffix: '', label: 'entreprises actives', color: 'orange', prefix: '+' },
                { value: roas, suffix: 'x', label: 'ROAS moyen', color: 'purple', prefix: '' },
              ].map((stat, i) => (
                <div key={i} className={`text-center p-6 rounded-2xl bg-white/5 border border-white/10 stagger-${i + 1} ${heroRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                  <div className={`text-3xl sm:text-4xl md:text-5xl font-mono font-bold mb-2 ${
                    stat.color === 'cyan' ? 'text-[#00f0ff] text-glow-cyan' :
                    stat.color === 'orange' ? 'text-[#ff6b00] text-glow-orange' :
                    'text-[#a855f7]'
                  }`}>
                    {stat.prefix}{stat.value.toLocaleString('fr-FR')} {stat.suffix}
                  </div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-[#00f0ff]/50" />
        </div>
      </section>

      <section className="py-12 border-y border-[#00f0ff]/10 bg-black/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center gap-16 flex-wrap">
            {['Meta', 'Google', 'TikTok', 'Shopify', 'Stripe'].map((brand, i) => (
              <span 
                key={brand} 
                className="text-2xl font-bold text-white/20 hover:text-[#00f0ff]/50 transition-colors cursor-default"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" ref={featuresRef.ref} className="py-28 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className={`text-center mb-16 ${featuresRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <span className="text-[#00f0ff] text-sm font-mono mb-4 block">// FONCTIONNALITÉS</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Pourquoi choisir <span className="text-[#00f0ff]">AEGIS</span> ?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Bot, title: '16 Agents IA', desc: 'Chaque agent maîtrise un aspect de l\'optimisation', color: 'cyan' },
              { icon: TrendingUp, title: '+127% ROAS', desc: 'Résultats prouvés sur des milliers de campagnes', color: 'orange' },
              { icon: Shield, title: 'Sécurité totale', desc: 'Vos données restent privées et chiffrées', color: 'purple' },
              { icon: Zap, title: 'Temps réel', desc: 'Optimisation 24h/24, réaction en millisecondes', color: 'cyan' },
              { icon: Globe, title: 'Multi-plateforme', desc: 'Meta, Google, TikTok, Pinterest, Snapchat', color: 'orange' },
              { icon: BarChart3, title: 'Rapports intelligents', desc: 'Insights actionnables, alertes automatiques', color: 'purple' },
            ].map((feature, i) => {
              const colors = getColorClasses(feature.color)
              return (
                <div 
                  key={i} 
                  className={`cyber-card p-6 hover-lift group stagger-${i + 1} ${featuresRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                >
                  <div className={`w-14 h-14 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-4 group-hover:${colors.glow} transition-shadow`}>
                    <feature.icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="agents" ref={agentsRef.ref} className="py-28 bg-gradient-to-b from-transparent via-[#00f0ff]/5 to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className={`text-center mb-16 ${agentsRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <span className="text-[#ff6b00] text-sm font-mono mb-4 block">// INTELLIGENCE ARTIFICIELLE</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="text-[#00f0ff]">16</span> agents à votre service
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Chaque agent est spécialisé dans un domaine précis
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {agents.map((agent, i) => {
              const colors = getColorClasses(agent.color)
              return (
                <div 
                  key={i} 
                  className={`cyber-card p-4 hover-lift group ${agentsRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}>
                      <agent.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-sm mb-0.5 truncate">{agent.name}</h3>
                      <p className="text-slate-500 text-xs line-clamp-2">{agent.desc}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="status-dot active" />
                    <span className="text-xs text-emerald-400 font-mono">EN LIGNE</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="cyber-card p-8 md:p-12 gradient-border">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-[#a855f7] text-sm font-mono mb-4 block">// PROCESSUS</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
                  Comment ça <span className="text-[#00f0ff]">marche</span> ?
                </h2>
                <div className="space-y-6">
                  {[
                    { step: '01', title: 'Connectez vos comptes', desc: 'Meta, Google, TikTok en 2 clics', color: 'cyan' },
                    { step: '02', title: 'L\'IA analyse vos données', desc: 'Historique, tendances, opportunités', color: 'orange' },
                    { step: '03', title: 'Recevez des recommandations', desc: 'Actions concrètes pour améliorer', color: 'purple' },
                    { step: '04', title: 'Appliquez en 1 clic', desc: 'Ou laissez l\'IA faire automatiquement', color: 'cyan' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className={`w-12 h-12 rounded-xl ${
                        item.color === 'cyan' ? 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff]' :
                        item.color === 'orange' ? 'bg-[#ff6b00]/10 border-[#ff6b00]/30 text-[#ff6b00]' :
                        'bg-[#a855f7]/10 border-[#a855f7]/30 text-[#a855f7]'
                      } border flex items-center justify-center flex-shrink-0 font-mono font-bold text-sm group-hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-shadow`}>
                        {item.step}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                        <p className="text-slate-500 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-[#00f0ff]/5 to-[#ff6b00]/5 rounded-2xl border border-[#00f0ff]/20 flex items-center justify-center group cursor-pointer hover:border-[#00f0ff]/50 transition-colors">
                  <div className="w-20 h-20 bg-[#00f0ff]/20 rounded-full flex items-center justify-center group-hover:bg-[#00f0ff]/30 group-hover:shadow-[0_0_40px_rgba(0,240,255,0.4)] transition-all">
                    <Play className="w-8 h-8 text-[#00f0ff] ml-1" />
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#ff6b00]/20 rounded-full blur-2xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-28 bg-gradient-to-b from-transparent via-[#ff6b00]/5 to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[#00f0ff] text-sm font-mono mb-4 block">// TÉMOIGNAGES</span>
            <h2 className="text-4xl font-bold text-white">
              Ce que disent nos <span className="text-[#ff6b00]">clients</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Marie L.', role: 'Gérante E-commerce', text: 'ROAS passé de 2.1x à 4.3x en 3 semaines. Incroyable !', avatar: 'M' },
              { name: 'Thomas D.', role: 'Directeur Marketing', text: 'J\'économise 15h/semaine sur l\'optimisation de campagnes.', avatar: 'T' },
              { name: 'Sophie R.', role: 'Fondatrice Agence', text: 'Mes clients adorent les résultats. AEGIS est devenu indispensable.', avatar: 'S' },
            ].map((t, i) => (
              <div key={i} className="cyber-card p-6 hover-lift">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className="w-5 h-5 text-[#ff6b00] fill-[#ff6b00]" />
                  ))}
                </div>
                <p className="text-white mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#ff6b00] flex items-center justify-center text-black font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" ref={pricingRef.ref} className="py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className={`text-center mb-16 ${pricingRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <span className="text-[#a855f7] text-sm font-mono mb-4 block">// TARIFICATION</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tarifs <span className="text-[#00f0ff]">transparents</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
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
            ].map((plan, i) => (
              <div 
                key={i} 
                className={`cyber-card p-6 relative ${
                  plan.popular ? 'border-[#00f0ff]/50 shadow-[0_0_30px_rgba(0,240,255,0.2)]' : ''
                } ${pricingRef.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-[#00f0ff] text-black text-xs font-bold rounded-full">
                      POPULAIRE
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-slate-500 text-sm mb-4">{plan.desc}</p>
                <div className="mb-6">
                  {plan.price === 'Sur mesure' ? (
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                  ) : (
                    <>
                      <span className="text-5xl font-mono font-bold text-[#00f0ff]">{plan.price}</span>
                      <span className="text-slate-500">€/mois</span>
                    </>
                  )}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-[#00f0ff] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/dashboard"
                  className={`block text-center py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-[#00f0ff] text-black hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]'
                      : 'border border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative p-8 md:p-12 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff]/20 via-[#a855f7]/20 to-[#ff6b00]/20" />
            <div className="absolute inset-0 cyber-grid opacity-20" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f0ff]/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#ff6b00]/30 rounded-full blur-[80px]" />
            
            <div className="relative text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Prêt à <span className="text-[#00f0ff]">booster</span> vos campagnes ?
              </h2>
              <p className="text-slate-300 mb-8 max-w-xl mx-auto">
                Rejoignez plus de 1 200 entreprises qui utilisent AEGIS
              </p>
              <Link 
                to="/dashboard" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#00f0ff] text-black font-bold rounded-xl hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-all"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-slate-500 text-sm mt-4 font-mono">
                // Pas de carte bancaire requise
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#00f0ff]/10 py-12 bg-black/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#00f0ff] to-[#ff6b00] rounded-lg flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-black" />
                </div>
                <span className="font-bold text-white">AEGIS</span>
              </div>
              <p className="text-slate-500 text-sm">
                L'IA qui optimise vos pubs 24h/24.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Produit</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-[#00f0ff] transition-colors">Fonctionnalités</a></li>
                <li><a href="#agents" className="hover:text-[#00f0ff] transition-colors">Agents IA</a></li>
                <li><a href="#pricing" className="hover:text-[#00f0ff] transition-colors">Tarifs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Ressources</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-[#00f0ff] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#00f0ff] transition-colors">API</a></li>
                <li><a href="#" className="hover:text-[#00f0ff] transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-[#00f0ff] transition-colors">Support</a></li>
                <li><span className="font-mono text-[#00f0ff]/70">hello@aegis.ai</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm font-mono">© 2026 AEGIS // Tous droits réservés</p>
            <div className="flex items-center gap-2">
              <span className="status-dot active" />
              <span className="text-xs text-emerald-400 font-mono">TOUS SYSTÈMES OPÉRATIONNELS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
