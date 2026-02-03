import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight, ArrowDownRight, ChevronRight, Settings, TrendingUp, Zap,
  Bot, BarChart3, Globe, Target, Shield, Bell, Search, Menu,
  Activity, DollarSign, Users, Eye, PieChart, ArrowRight, Plus,
  Calendar, Cpu, X,
  Crosshair, Layers, Database, Wifi, Lock, CheckCircle, AlertTriangle
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell
} from 'recharts'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info'
  title: string
  message: string
  time: string
  read: boolean
}

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
]

const platformPieData = [
  { name: 'Google Ads', value: 45, color: '#00f0ff' },
  { name: 'Meta Ads', value: 35, color: '#a855f7' },
  { name: 'TikTok', value: 20, color: '#ff6b00' }
]

const Particles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 8 + Math.random() * 8,
    size: 1 + Math.random() * 2
  }))

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#00f0ff] opacity-40"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            boxShadow: '0 0 6px #00f0ff',
            animation: `particle-rise ${p.duration}s ease-out infinite`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
    </div>
  )
}

const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const [display, setDisplay] = useState(0)
  
  useEffect(() => {
    const duration = 2000
    const steps = 50
    let step = 0
    const interval = setInterval(() => {
      step++
      const progress = step / steps
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplay(value * eased)
      if (step >= steps) clearInterval(interval)
    }, duration / steps)
    return () => clearInterval(interval)
  }, [value])

  return <span className="data-value">{prefix}{decimals > 0 ? display.toFixed(decimals) : Math.floor(display).toLocaleString()}{suffix}</span>
}

const CircularProgress = ({ value, size = 140, strokeWidth = 8, color = 'cyan' }: { value: number, size?: number, strokeWidth?: number, color?: string }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (value / 100) * circumference)
    }, 300)
    return () => clearTimeout(timer)
  }, [value, circumference])

  const colors: Record<string, string[]> = {
    cyan: ['#00f0ff', '#0891b2'],
    orange: ['#ff6b00', '#facc15'],
    purple: ['#a855f7', '#ec4899'],
    green: ['#22c55e', '#4ade80']
  }

  const gradientId = `cyber-progress-${color}-${Math.random().toString(36).substr(2, 9)}`
  const colorSet = colors[color] || colors.cyan

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorSet[0]} />
            <stop offset="100%" stopColor={colorSet[1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} stroke="rgba(0, 240, 255, 0.1)" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
          stroke={`url(#${gradientId})`} fill="none" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 2s ease-out', filter: `drop-shadow(0 0 8px ${colorSet[0]})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-cyber font-bold text-white neon-text">{value}%</span>
        <span className="text-xs font-mono text-slate-500 mt-1">COMPLETE</span>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="cyber-card p-3 border-[#00f0ff]/30">
        <p className="font-mono text-[#00f0ff] text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-mono font-bold">${entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export const DashboardCyber = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', type: 'success', title: 'Optimization Complete', message: 'AI reduced CPC by 18% on Google Ads', time: '2 min ago', read: false },
    { id: '2', type: 'warning', title: 'Budget Alert', message: 'Meta Ads budget at 87% capacity', time: '15 min ago', read: false },
    { id: '3', type: 'info', title: 'New Audience Found', message: 'High-converting segment discovered', time: '1 hour ago', read: true }
  ])
  const [liveAgentLogs, setLiveAgentLogs] = useState([
    { id: 1, agent: 'SENTINEL-A1', action: 'Analyzing bid performance...', status: 'processing' },
    { id: 2, agent: 'GUARDIAN-B2', action: 'Audience optimization complete', status: 'success' },
    { id: 3, agent: 'PHANTOM-C3', action: 'Testing creative variant #4', status: 'processing' }
  ])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const logInterval = setInterval(() => {
      const actions = [
        'Analyzing bid performance...',
        'Optimizing audience targeting...',
        'Testing new creative...',
        'Adjusting budget allocation...',
        'Monitoring conversion rates...',
        'Scanning for anomalies...'
      ]
      const agents = ['SENTINEL-A1', 'GUARDIAN-B2', 'PHANTOM-C3', 'CIPHER-D4', 'NEXUS-E5']
      setLiveAgentLogs(prev => {
        const newLog = {
          id: Date.now(),
          agent: agents[Math.floor(Math.random() * agents.length)],
          action: actions[Math.floor(Math.random() * actions.length)],
          status: Math.random() > 0.3 ? 'processing' : 'success'
        }
        return [newLog, ...prev.slice(0, 4)]
      })
    }, 3000)
    return () => clearInterval(logInterval)
  }, [])

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour12: false })
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const metrics = [
    { title: 'TOTAL REVENUE', value: 47892, change: 23.5, icon: DollarSign, color: 'cyan' as const },
    { title: 'AD SPEND', value: 12450, change: -5.2, icon: TrendingUp, color: 'orange' as const },
    { title: 'ROAS', value: 3.85, change: 12.8, icon: PieChart, color: 'purple' as const, isDecimal: true },
    { title: 'CONVERSIONS', value: 1247, change: 18.3, icon: Users, color: 'green' as const }
  ]

  const campaigns = [
    { id: '1', name: 'Summer Sale 2024', platform: 'Google Ads', status: 'active' as const, spend: 4250, revenue: 18420, roas: 4.33 },
    { id: '2', name: 'Brand Awareness', platform: 'Meta Ads', status: 'active' as const, spend: 3180, revenue: 12650, roas: 3.98 },
    { id: '3', name: 'Product Launch', platform: 'TikTok', status: 'active' as const, spend: 2890, revenue: 9870, roas: 3.42 },
    { id: '4', name: 'Retargeting Q1', platform: 'Google Ads', status: 'paused' as const, spend: 1420, revenue: 6340, roas: 4.47 }
  ]

  const activities = [
    { id: '1', action: 'Reduced CPC by 18% on underperforming keywords', platform: 'Google Ads', time: '00:03:22', impact: '+$234', type: 'optimization' as const },
    { id: '2', action: 'Discovered high-converting audience segment', platform: 'Meta Ads', time: '00:12:45', impact: '+15% CTR', type: 'insight' as const },
    { id: '3', action: 'Paused ad with declining performance', platform: 'TikTok', time: '00:28:18', impact: '+$89', type: 'optimization' as const },
    { id: '4', action: 'Budget approaching daily limit warning', platform: 'Google Ads', time: '00:45:33', impact: '87% USED', type: 'alert' as const }
  ]

  return (
    <div className="min-h-screen cyber-bg">
      <div className="scan-line" />
      <Particles />

      <aside className={`fixed left-0 top-0 h-full bg-[#080810]/95 backdrop-blur-xl border-r border-[#00f0ff]/10 z-40 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-[#00f0ff] to-[#a855f7] rounded-lg flex items-center justify-center animate-float">
                <Shield className="w-6 h-6 text-black" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-[#00f0ff] to-[#a855f7] rounded-lg blur-lg opacity-40 group-hover:opacity-70 transition-opacity -z-10" />
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in-up">
                <h1 className="text-xl font-cyber font-bold tracking-wider">
                  <span className="neon-text">AE</span><span className="text-white">GIS</span>
                </h1>
                <p className="text-[10px] text-[#00f0ff]/50 font-mono tracking-[0.2em]">MEDIA BUYING v3.0</p>
              </div>
            )}
          </Link>
        </div>

        <nav className="px-3 space-y-1">
          {[
            { icon: BarChart3, label: 'Dashboard', href: '/dashboard', active: true },
            { icon: Globe, label: 'Platforms', href: '/connect-platforms' },
            { icon: Target, label: 'Campaigns', href: '/connected-accounts' },
            { icon: Bot, label: 'AI Agents', href: '/agents' },
            { icon: TrendingUp, label: 'Analytics', href: '/analytics' },
            { icon: Settings, label: 'Settings', href: '/settings' }
          ].map((item, i) => (
            <Link key={i} to={item.href} className={`sidebar-item ${item.active ? 'active' : ''}`}>
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="cyber-card p-4 border-[#00f0ff]/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="icon-box icon-box-cyan w-8 h-8"><Cpu className="w-4 h-4" /></div>
                <div>
                  <span className="text-sm font-semibold text-white">AI SYSTEM</span>
                  <div className="flex items-center gap-1">
                    <span className="status-dot active" />
                    <span className="text-xs font-mono text-emerald-400">ONLINE</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-xs font-mono">
                {liveAgentLogs.slice(0, 2).map(log => (
                  <div key={log.id} className="flex items-center gap-2 text-slate-400 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'processing' ? 'bg-[#00f0ff] animate-pulse' : 'bg-emerald-400'}`} />
                    <span className="truncate">{log.agent}: {log.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="sticky top-0 bg-[#080810]/90 backdrop-blur-xl border-b border-[#00f0ff]/10 z-30">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#00f0ff]/10 rounded-lg transition-colors border border-transparent hover:border-[#00f0ff]/20">
                <Menu className="w-5 h-5 text-[#00f0ff]" />
              </button>
              <div>
                <h2 className="text-xl font-cyber font-bold text-white tracking-wide">COMMAND CENTER</h2>
                <p className="text-xs font-mono text-slate-500">Real-time performance monitoring</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 cyber-card">
                <Activity className="w-4 h-4 text-[#00f0ff]" />
                <span className="text-xs font-mono text-slate-400">SYS:</span>
                <span className="text-xs font-mono text-emerald-400">OPTIMAL</span>
                <div className="w-px h-4 bg-[#00f0ff]/20" />
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-slate-400">THREAT:</span>
                <span className="text-xs font-mono text-emerald-400">LOW</span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search..." className="cyber-input pl-10 pr-4 py-2 text-sm w-48" />
              </div>

              <div className="text-right font-mono hidden sm:block">
                <div className="text-sm text-[#00f0ff] font-cyber tracking-wider animate-flicker">{formatTime(currentTime)}</div>
                <div className="text-xs text-slate-500">{formatDate(currentTime)}</div>
              </div>

              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2.5 cyber-card hover:border-[#00f0ff]/40 transition-all relative">
                  <Bell className="w-5 h-5 text-slate-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff6b00] rounded-full text-xs font-bold text-black flex items-center justify-center animate-glow">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 cyber-card border-[#00f0ff]/30 animate-fade-in-up z-50">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <span className="font-cyber text-white">NOTIFICATIONS</span>
                      <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-white/10 rounded">
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!notif.read ? 'bg-[#00f0ff]/5' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`icon-box w-8 h-8 ${
                              notif.type === 'success' ? 'icon-box-green' :
                              notif.type === 'warning' ? 'icon-box-orange' : 'icon-box-cyan'
                            }`}>
                              {notif.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                               notif.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                               <Eye className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{notif.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{notif.message}</p>
                              <p className="text-xs font-mono text-slate-500 mt-1">{notif.time}</p>
                            </div>
                            {!notif.read && <span className="w-2 h-2 bg-[#00f0ff] rounded-full" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 space-y-6 relative z-10">
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, i) => (
              <div key={metric.title} className={`cyber-card cyber-card-${metric.color} p-4 md:p-6 hover-lift animate-fade-in-up stagger-${i + 1}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`icon-box icon-box-${metric.color} w-10 h-10 md:w-12 md:h-12`}>
                    <metric.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className={`cyber-badge ${metric.change >= 0 ? 'cyber-badge-green' : 'cyber-badge-red'}`}>
                    {metric.change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <div className={`text-2xl md:text-3xl font-cyber font-bold mb-1 ${
                  metric.color === 'cyan' ? 'neon-text' :
                  metric.color === 'orange' ? 'neon-text-orange' :
                  metric.color === 'purple' ? 'neon-text-purple' : 'neon-text-green'
                }`}>
                  {metric.isDecimal ? (
                    <AnimatedNumber value={metric.value} suffix="x" decimals={2} />
                  ) : (
                    <AnimatedNumber value={metric.value} prefix={metric.title.includes('REVENUE') || metric.title.includes('SPEND') ? '$' : ''} />
                  )}
                </div>
                <p className="text-xs font-mono text-slate-500 tracking-wider">{metric.title}</p>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 cyber-card p-6 animate-fade-in-up stagger-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="icon-box icon-box-cyan w-10 h-10"><BarChart3 className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-cyber text-lg text-white tracking-wide">REVENUE vs SPEND</h3>
                    <p className="text-xs font-mono text-slate-500">Interactive performance chart</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-xs font-mono cyber-card hover:border-[#00f0ff]/40 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#00f0ff]" /><span className="text-slate-400">2024</span>
                </button>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,240,255,0.1)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#00f0ff" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue" />
                    <Area type="monotone" dataKey="spend" stroke="#ff6b00" strokeWidth={2} fill="url(#colorSpend)" name="Spend" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#00f0ff]" />
                  <span className="text-xs font-mono text-slate-400">REVENUE</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff6b00]" />
                  <span className="text-xs font-mono text-slate-400">AD SPEND</span>
                </div>
              </div>
            </section>

            <section className="cyber-card p-6 animate-fade-in-up stagger-3">
              <div className="flex items-center gap-3 mb-6">
                <div className="icon-box icon-box-green w-10 h-10"><Target className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-cyber text-lg text-white tracking-wide">OBJECTIVE</h3>
                  <p className="text-xs font-mono text-slate-500">Monthly target</p>
                </div>
              </div>
              <div className="flex justify-center mb-6">
                <CircularProgress value={77} size={160} strokeWidth={10} color="cyan" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-sm text-slate-400">Current</span>
                  <span className="font-mono text-white">$38,450</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#00f0ff]/5 rounded-lg border border-[#00f0ff]/20">
                  <span className="text-sm text-[#00f0ff]">Target</span>
                  <span className="font-mono text-[#00f0ff]">$50,000</span>
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 cyber-card animate-fade-in-up stagger-3">
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="icon-box icon-box-orange w-10 h-10"><Crosshair className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-cyber text-lg text-white tracking-wide">CAMPAIGNS</h3>
                    <p className="text-xs font-mono text-slate-500">Performance metrics</p>
                  </div>
                </div>
                <Link to="/connected-accounts" className="cyber-button text-xs"><Plus className="w-4 h-4 mr-1" />NEW</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-mono text-slate-500 border-b border-white/5">
                      <th className="p-4">CAMPAIGN</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4">SPEND</th>
                      <th className="p-4">REVENUE</th>
                      <th className="p-4">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign, i) => (
                      <tr key={campaign.id} className={`table-row animate-slide-in-left stagger-${i + 1}`}>
                        <td className="p-4">
                          <p className="font-medium text-white">{campaign.name}</p>
                          <p className="text-xs font-mono text-slate-500">{campaign.platform}</p>
                        </td>
                        <td className="p-4">
                          <span className={`cyber-badge ${campaign.status === 'active' ? 'cyber-badge-green' : 'cyber-badge-orange'}`}>
                            <span className={`status-dot mr-2 ${campaign.status === 'active' ? 'active' : 'warning'}`} />
                            {campaign.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-white">${campaign.spend.toLocaleString()}</td>
                        <td className="p-4 font-mono text-[#00f0ff]">${campaign.revenue.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`font-mono font-semibold ${campaign.roas >= 4 ? 'neon-text-green' : 'neon-text'}`}>{campaign.roas}x</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="cyber-card cyber-card-purple p-6 animate-fade-in-up stagger-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="icon-box icon-box-purple w-10 h-10"><Layers className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-cyber text-lg text-white tracking-wide">PLATFORMS</h3>
                  <p className="text-xs font-mono text-slate-500">Spend distribution</p>
                </div>
              </div>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={platformPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {platformPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {platformPieData.map((platform) => (
                  <div key={platform.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }} />
                      <span className="text-sm text-slate-400">{platform.name}</span>
                    </div>
                    <span className="text-sm font-mono" style={{ color: platform.color }}>{platform.value}%</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="cyber-card animate-fade-in-up stagger-5">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="icon-box icon-box-cyan w-10 h-10"><Bot className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-cyber text-lg text-white tracking-wide">AI AGENT ACTIVITY</h3>
                  <p className="text-xs font-mono text-slate-500">Real-time optimization log</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-mono text-red-400">LIVE</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 cyber-card">
                  <span className="status-dot active" />
                  <span className="text-xs font-mono text-emerald-400">5 AGENTS</span>
                </div>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {activities.map((activity, i) => (
                <div key={activity.id} className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors animate-slide-in-left stagger-${i + 1}`}>
                  <div className={`icon-box w-10 h-10 ${
                    activity.type === 'optimization' ? 'icon-box-cyan' :
                    activity.type === 'insight' ? 'icon-box-purple' : 'icon-box-orange'
                  }`}>
                    {activity.type === 'optimization' ? <Zap className="w-5 h-5" /> :
                     activity.type === 'insight' ? <Eye className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{activity.action}</p>
                    <p className="text-xs font-mono text-slate-500">{activity.platform} • {activity.time}</p>
                  </div>
                  <div className={`cyber-badge ${
                    activity.type === 'optimization' ? 'cyber-badge-green' :
                    activity.type === 'insight' ? 'cyber-badge-purple' : 'cyber-badge-orange'
                  }`}>{activity.impact}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/5">
              <Link to="/agents" className="flex items-center justify-center gap-2 text-sm font-mono text-[#00f0ff] hover:text-[#00f0ff]/80 transition-colors">
                VIEW ALL ACTIVITY<ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: '/connect-platforms', icon: Globe, title: 'PLATFORMS', desc: 'Connect ad accounts', color: 'cyan' },
              { href: '/connected-accounts', icon: Target, title: 'CAMPAIGNS', desc: 'Manage advertisements', color: 'orange' },
              { href: '/analytics', icon: BarChart3, title: 'ANALYTICS', desc: 'Deep performance insights', color: 'purple' }
            ].map((item, i) => (
              <Link key={i} to={item.href} className={`cyber-card cyber-card-${item.color} p-6 hover-lift animate-scale-in stagger-${i + 1} group`}>
                <div className={`icon-box icon-box-${item.color} w-12 h-12 mb-4`}><item.icon className="w-6 h-6" /></div>
                <h3 className="font-cyber text-lg text-white mb-1 tracking-wide">{item.title}</h3>
                <p className="text-sm text-slate-400 mb-4">{item.desc}</p>
                <span className={`flex items-center gap-1 text-sm font-mono ${
                  item.color === 'cyan' ? 'text-[#00f0ff]' : item.color === 'orange' ? 'text-[#ff6b00]' : 'text-[#a855f7]'
                } opacity-0 group-hover:opacity-100 transition-opacity`}>ACCESS <ArrowRight className="w-4 h-4" /></span>
              </Link>
            ))}
          </section>
        </main>

        <footer className="border-t border-[#00f0ff]/10 py-6 px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs font-mono text-slate-500">
              <div className="flex items-center gap-2"><Database className="w-4 h-4 text-[#00f0ff]" /><span>DATA: <span className="text-emerald-400">SYNCED</span></span></div>
              <div className="flex items-center gap-2"><Wifi className="w-4 h-4 text-[#00f0ff]" /><span>LATENCY: <span className="text-emerald-400">24ms</span></span></div>
              <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-[#00f0ff]" /><span>STATUS: <span className="text-emerald-400">ENCRYPTED</span></span></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-500">AEGIS MEDIA BUYING</span>
              <span className="text-[#00f0ff]">|</span>
              <span className="text-xs font-cyber text-[#00f0ff] animate-flicker">v3.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default DashboardCyber
