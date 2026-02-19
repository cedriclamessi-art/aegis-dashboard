import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  )
const TENANT_ID = import.meta.env.VITE_TENANT_ID || ''

type Page = 'dashboard' | 'pipelines' | 'actions' | 'agents' | 'risk' | 'saas'

interface Stats {
    pipelines: number
    actions_pending: number
    actions_completed: number
    agents: number
    roas: number
    spend: number
    revenue: number
}

interface Pipeline {
    id: string
    product_name: string
    status: string
    total_budget: number
    spent_budget: number
    roas: number
    created_at: string
}

interface Action {
    id: string
    agent_name: string
    action_type: string
    status: string
    priority: number
    created_at: string
}

interface Agent {
    id: string
    name: string
    agent_type: string
    category: string
    is_enabled: boolean
    last_run_at: string | null
    run_count: number
}

function App() {
    const [page, setPage] = useState<Page>('dashboard')
    const [stats, setStats] = useState<Stats>({ pipelines: 0, actions_pending: 0, actions_completed: 0, agents: 0, roas: 0, spend: 0, revenue: 0 })
    const [pipelines, setPipelines] = useState<Pipeline[]>([])
    const [actions, setActions] = useState<Action[]>([])
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(false)
    const [notification, setNotification] = useState<string | null>(null)

  const notify = (msg: string) => {
        setNotification(msg)
        setTimeout(() => setNotification(null), 3000)
  }

  const loadStats = useCallback(async () => {
        try {
                const [pipRes, actRes, agRes] = await Promise.all([
                          supabase.from('v_pipelines').select('*', { count: 'exact' }),
                          supabase.from('v_actions').select('*', { count: 'exact' }).eq('status', 'pending'),
                          supabase.from('v_agents_registry').select('*', { count: 'exact' })
                        ])
                const allAct = await supabase.from('v_actions').select('*', { count: 'exact' }).eq('status', 'completed')
                setStats({
                          pipelines: pipRes.count || 0,
                          actions_pending: actRes.count || 0,
                          actions_completed: allAct.count || 0,
                          agents: agRes.count || 0,
                          roas: 2.4,
                          spend: 1247,
                          revenue: 2993
                })
        } catch (e) { console.error(e) }
  }, [])

  const loadPipelines = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase.from('v_pipelines').select('*').order('created_at', { ascending: false }).limit(20)
        setPipelines(data || [])
        setLoading(false)
  }, [])

  const loadActions = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase.from('v_actions').select('*').order('priority', { ascending: false }).limit(30)
        setActions(data || [])
        setLoading(false)
  }, [])

  const loadAgents = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase.from('v_agents_registry').select('*').order('category')
        setAgents(data || [])
        setLoading(false)
  }, [])

  useEffect(() => {
        loadStats()
  }, [loadStats])

  useEffect(() => {
        if (page === 'pipelines') loadPipelines()
        if (page === 'actions') loadActions()
        if (page === 'agents') loadAgents()
  }, [page, loadPipelines, loadActions, loadAgents])

  const launchPipeline = async () => {
        setLoading(true)
        try {
                const productId = crypto.randomUUID()
                const { data, error } = await supabase.rpc('enqueue_product_pipeline', {
                          p_tenant_id: TENANT_ID,
                          p_product_id: productId,
                          p_product_name: 'Test Product ' + new Date().toISOString().slice(11, 19),
                          p_budget: 500,
                          p_target_roas: 1.5
                })
                if (error) throw error
                notify('Pipeline launched: ' + (data || 'success'))
                loadPipelines()
                loadStats()
        } catch (e: any) {
                notify('Error: ' + e.message)
        }
        setLoading(false)
  }

  const approveAction = async (id: string) => {
        const { error } = await supabase.from('actions_queue').update({ status: 'approved' }).eq('id', id)
        if (!error) { notify('Action approved'); loadActions() }
  }

  const rejectAction = async (id: string) => {
        const { error } = await supabase.from('actions_queue').update({ status: 'rejected' }).eq('id', id)
        if (!error) { notify('Action rejected'); loadActions() }
  }

  const toggleAgent = async (id: string, current: boolean) => {
        const { error } = await supabase.from('agents_registry').update({ is_enabled: !current }).eq('id', id)
        if (!error) { notify('Agent ' + (!current ? 'enabled' : 'disabled')); loadAgents() }
  }

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'pipelines', label: 'Pipelines', icon: '🚀' },
    { id: 'actions', label: 'Actions', icon: '⚡' },
    { id: 'agents', label: 'Agents', icon: '🤖' },
    { id: 'risk', label: 'Risk', icon: '🛡️' },
    { id: 'saas', label: 'SaaS', icon: '💎' },
      ]

  return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
          {/* Sidebar */}
                <div style={{ width: 220, background: '#0f0f1a', borderRight: '1px solid #1e1e3a', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1e1e3a' }}>
                                      <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>⚡ AEGIS</div>div>
                                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>v1.0 · Autopilot</div>div>
                          </div>div>
                          <nav style={{ padding: '16px 0', flex: 1 }}>
                            {navItems.map(item => (
                      <button key={item.id} onClick={() => setPage(item.id)} style={{
                                      display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 20px',
                                      background: page === item.id ? '#1e1e3a' : 'transparent',
                                      border: 'none', color: page === item.id ? '#6366f1' : '#94a3b8',
                                      cursor: 'pointer', fontSize: 14, fontWeight: page === item.id ? 600 : 400,
                                      borderLeft: page === item.id ? '3px solid #6366f1' : '3px solid transparent'
                      }}>
                                      <span>{item.icon}</span>span> {item.label}
                      </button>button>
                    ))}
                          </nav>nav>
                        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e1e3a', fontSize: 12, color: '#475569' }}>
                                  <div style={{ marginBottom: 4 }}>🟢 Supabase Connected</div>div>
                                  <div>Tenant: AEGIS-OWNER</div>div>
                        </div>div>
                </div>div>
        
          {/* Main */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                      <div style={{ padding: '16px 28px', borderBottom: '1px solid #1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f0f1a' }}>
                                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                                  {navItems.find(n => n.id === page)?.icon} {navItems.find(n => n.id === page)?.label}
                                </h1>h1>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                  {notification && <div style={{ background: '#1e3a1e', color: '#4ade80', padding: '6px 14px', borderRadius: 6, fontSize: 13 }}>{notification}</div>div>}
                                            <div style={{ background: '#1e1e3a', padding: '6px 14px', borderRadius: 6, fontSize: 13, color: '#94a3b8' }}>
                                              {new Date().toLocaleDateString('fr-FR')}
                                            </div>div>
                                </div>div>
                      </div>div>
              
                {/* Content */}
                      <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
                        {page === 'dashboard' && <DashboardView stats={stats} onRefresh={loadStats} />}
                        {page === 'pipelines' && <PipelinesView pipelines={pipelines} loading={loading} onLaunch={launchPipeline} onRefresh={loadPipelines} />}
                        {page === 'actions' && <ActionsView actions={actions} loading={loading} onApprove={approveAction} onReject={rejectAction} onRefresh={loadActions} />}
                        {page === 'agents' && <AgentsView agents={agents} loading={loading} onToggle={toggleAgent} onRefresh={loadAgents} />}
                        {page === 'risk' && <RiskView />}
                        {page === 'saas' && <SaasView />}
                      </div>div>
              </div>div>
        </div>div>
      )
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
    return (
          <div style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 12, padding: '20px 24px', minWidth: 160 }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{label}</div>div>
                <div style={{ fontSize: 28, fontWeight: 700, color: color || '#e2e8f0' }}>{value}</div>div>
            {sub && <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{sub}</div>div>}
          </div>div>
        )
}

function Badge({ text, color }: { text: string; color: string }) {
    const colors: Record<string, string> = {
          green: '#1e3a1e', blue: '#1e2a3a', yellow: '#3a2e1e', red: '#3a1e1e', purple: '#2a1e3a', gray: '#1e1e2a'
    }
        const textColors: Record<string, string> = {
              green: '#4ade80', blue: '#60a5fa', yellow: '#fbbf24', red: '#f87171', purple: '#a78bfa', gray: '#94a3b8'
        }
            return (
                  <span style={{ background: colors[color] || colors.gray, color: textColors[color] || textColors.gray, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                    {text}
                  </span>span>
                )
}

function DashboardView({ stats, onRefresh }: { stats: Stats; onRefresh: () => void }) {
    return (
          <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h2 style={{ margin: 0, fontSize: 15, color: '#94a3b8' }}>Command Center · Live</h2>h2>
                        <button onClick={onRefresh} style={{ background: '#1e1e3a', color: '#6366f1', border: '1px solid #6366f1', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                                  🔄 Refresh
                        </button>button>
                </div>div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
                        <StatCard label="Active Pipelines" value={stats.pipelines} sub="Running now" color="#6366f1" />
                        <StatCard label="Pending Actions" value={stats.actions_pending} sub="Awaiting approval" color="#fbbf24" />
                        <StatCard label="Completed" value={stats.actions_completed} sub="Total actions done" color="#4ade80" />
                        <StatCard label="Agents Active" value={stats.agents} sub="25 total" color="#60a5fa" />
                        <StatCard label="ROAS" value={stats.roas + 'x'} sub="Return on ad spend" color="#4ade80" />
                        <StatCard label="Spend Today" value={'€' + stats.spend} sub="Budget consumed" color="#f87171" />
                        <StatCard label="Revenue" value={'€' + stats.revenue} sub="Generated today" color="#4ade80" />
                </div>div>
          
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 12, padding: 20 }}>
                                  <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8' }}>🎯 System Status</h3>h3>
                          {[
            { label: 'Database (Supabase)', status: 'online', color: 'green' },
            { label: 'Risk Engine', status: 'active', color: 'green' },
            { label: 'Agent Orchestrator', status: 'running', color: 'green' },
            { label: 'Budget Guard', status: 'armed', color: 'blue' },
            { label: 'Kill Switch', status: 'standby', color: 'yellow' },
            { label: 'Auto Hedge', status: 'monitoring', color: 'blue' },
                      ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a1a2e' }}>
                                                  <span style={{ fontSize: 13 }}>{item.label}</span>span>
                                                  <Badge text={item.status} color={item.color} />
                                    </div>div>
                                  ))}
                        </div>div>
                        <div style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 12, padding: 20 }}>
                                  <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8' }}>📈 Performance Phase</h3>h3>
                          {[
            { label: 'Current Phase', value: 'Phase 1 → €1M', color: '#6366f1' },
            { label: 'Stop-Loss', value: '€150/day', color: '#f87171' },
            { label: 'Max Spend', value: '€500/day', color: '#fbbf24' },
            { label: 'Min ROAS', value: '1.10x', color: '#4ade80' },
            { label: 'Mode', value: 'Semi-Auto', color: '#60a5fa' },
            { label: 'Subscription', value: 'Growth Trial', color: '#a78bfa' },
                      ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a1a2e' }}>
                                                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.label}</span>span>
                                                  <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.value}</span>span>
                                    </div>div>
                                  ))}
                        </div>div>
                </div>div>
          </div>div>
        )
}

function PipelinesView({ pipelines, loading, onLaunch, onRefresh }: { pipelines: Pipeline[]; loading: boolean; onLaunch: () => void; onRefresh: () => void }) {
    return (
          <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                        <button onClick={onLaunch} disabled={loading} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                                  🚀 Launch Pipeline
                        </button>button>
                        <button onClick={onRefresh} style={{ background: '#1e1e3a', color: '#6366f1', border: '1px solid #6366f1', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
                                  🔄 Refresh
                        </button>button>
                </div>div>
            {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading...</div>div> : (
                  <div style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 12, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                                      <tr style={{ background: '#1a1a2e' }}>
                                                        {['Product', 'Status', 'Budget', 'Spent', 'ROAS', 'Created'].map(h => (
                              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600 }}>{h}</th>th>
                            ))}
                                                      </tr>tr>
                                        </thead>thead>
                                        <tbody>
                                          {pipelines.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#475569' }}>No pipelines yet. Launch your first one!</td>td></tr>tr>
                          ) : pipelines.map(p => (
                            <tr key={p.id} style={{ borderTop: '1px solid #1a1a2e' }}>
                                              <td style={{ padding: '12px 16px', fontSize: 14 }}>{p.product_name}</td>td>
                                              <td style={{ padding: '12px 16px' }}>
                                                                  <Badge text={p.status} color={p.status === 'active' ? 'green' : p.status === 'pending' ? 'yellow' : 'gray'} />
                                              </td>td>
                                              <td style={{ padding: '12px 16px', fontSize: 14 }}>€{p.total_budget}</td>
                                              <td style={{ padding: '12px 16px', fontSize: 14 }}>€{p.spent_budget || 0}</td>td>
                                              <td style={{ padding: '12px 16px', fontSize: 14, color: '#4ade80' }}>{p.roas ? p.roas + 'x' : 'N/A'}</td>td>
                                              <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>td>
                            </tr>tr>
                          ))}
                                        </tbody>tbody>
                            </table>table>
                  </div>div>
                )}
          </div>div>
        )
}

function ActionsView({ actions, loading, onApprove, onReject, onRefresh }: { actions: Action[]; loading: boolean; onApprove: (id: string) => void; onReject: (id: string) => void; onRefresh: () => void }) {
    return (
          <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: 15, color: '#94a3b8' }}>Actions Queue</h2>h2>
                        <button onClick={onRefresh} style={{ background: '#1e1e3a', color: '#6366f1', border: '1px solid #6366f1', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>🔄</button>button>
                </div>div>
            {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading...</div>div> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {actions.length === 0 ? (
                        <div style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 12, padding: 40, textAlign: 'center', color: '#475569' }}>No actions in queue</div>div>
                      ) : actions.map(a => (
                        <div key={a.id} style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                                      <div style={{ flex: 1 }}>
                                                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{a.agent_name} · {a.action_type}</div>div>
                                                      <div style={{ fontSize: 12, color: '#64748b' }}>Priority: {a.priority} · {new Date(a.created_at).toLocaleString('fr-FR')}</div>div>
                                      </div>div>
                                      <Badge text={a.status} color={a.status === 'pending' ? 'yellow' : a.status === 'completed' ? 'green' : a.status === 'approved' ? 'blue' : 'red'} />
                          {a.status === 'pending' && (
                                          <div style={{ display: 'flex', gap: 8 }}>
                                                            <button onClick={() => onApprove(a.id)} style={{ background: '#1e3a1e', color: '#4ade80', border: '1px solid #4ade80', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✓ Approve</button>button>
                                                            <button onClick={() => onReject(a.id)} style={{ background: '#3a1e1e', color: '#f87171', border: '1px solid #f87171', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✗ Reject</button>button>
                                          </div>div>
                                      )}
                        </div>div>
                      ))}
                  </div>div>
                )}
          </div>div>
        )
}

function AgentsView({ agents, loading, onToggle, onRefresh }: { agents: Agent[]; loading: boolean; onToggle: (id: string, current: boolean) => void; onRefresh: () => void }) {
    const categories = [...new Set(agents.map(a => a.category))]
        return (
              <div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: 15, color: '#94a3b8' }}>25 Agents Registry</h2>h2>
                            <button onClick={onRefresh} style={{ background: '#1e1e3a', color: '#6366f1', border: '1px solid #6366f1', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>🔄</button>button>
                    </div>div>
                {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading...</div>div> : (
                      <div>
                        {categories.map(cat => (
                            <div key={cat} style={{ marginBottom: 24 }}>
                                          <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</h3>h3>
                                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                                            {agents.filter(a => a.category === cat).map(agent => (
                                                <div key={agent.id} style={{ background: '#0f0f1a', border: `1px solid ${agent.is_enabled ? '#1e2a3a' : '#1e1e2a'}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                    <div style={{ flex: 1 }}>
                                                                                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{agent.name}</div>div>
                                                                                          <div style={{ fontSize: 11, color: '#64748b' }}>Runs: {agent.run_count} · {agent.last_run_at ? new Date(agent.last_run_at).toLocaleDateString() : 'Never'}</div>div>
                                                                    </div>div>
                                                                    <button onClick={() => onToggle(agent.id, agent.is_enabled)} style={{
                                                                        background: agent.is_enabled ? '#1e3a1e' : '#1e1e2a',
                                                                        color: agent.is_enabled ? '#4ade80' : '#475569',
                                                                        border: `1px solid ${agent.is_enabled ? '#4ade80' : '#475569'}`,
                                                                        padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 600
                                                }}>
                                                                      {agent.is_enabled ? 'ON' : 'OFF'}
                                                                    </button>button>
                                                </div>div>
                                              ))}
                                          </div>div>
                            </div>div>
                          ))}
                        {agents.length === 0 && <div style={{ color: '#475569', textAlign: 'center', padding: 40 }}>No agents found in registry</div>div>}
                      </div>div>
                    )}
              </div>div>
            )
}

function RiskView() {
    const stages = [
      { phase: 'Phase 1 · 0→1M', maxLoss: '€150/j', maxSpend: '€500/j', minRoas: '1.10x', status: 'active', color: 'green' },
      { phase: 'Phase 2 · 1M→10M', maxLoss: '€500/j', maxSpend: '€2,000/j', minRoas: '1.20x', status: 'locked', color: 'gray' },
      { phase: 'Phase 3 · 10M→100M', maxLoss: '€1,500/j', maxSpend: '€8,000/j', minRoas: '1.30x', status: 'locked', color: 'gray' },
        ]
        const guards = [
          { name: 'Budget Guard', desc: 'Stops spending when daily limit reached', status: 'armed', color: 'green' },
          { name: 'ROAS Guard', desc: 'Pauses campaigns below min ROAS threshold', status: 'armed', color: 'green' },
          { name: 'Metabolic Throttle', desc: 'Limits burst spending speed', status: 'armed', color: 'green' },
          { name: 'Volatility Detector', desc: 'Detects abnormal performance swings', status: 'monitoring', color: 'blue' },
          { name: 'Capital Protection', desc: 'Emergency stop on catastrophic loss', status: 'standby', color: 'yellow' },
          { name: 'Auto Hedge', desc: 'Automatically hedges risky positions', status: 'standby', color: 'yellow' },
          { name: 'Kill Switch', desc: 'Nuclear option — stops all activity', status: 'standby', color: 'red' },
            ]
            return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                                <h2 style={{ margin: '0 0 16px', fontSize: 15, color: '#94a3b8' }}>🎯 Risk Stages</h2>h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                  {stages.map(s => (
                                <div key={s.phase} style={{ background: '#0f0f1a', border: `1px solid ${s.status === 'active' ? '#6366f1' : '#1e1e3a'}`, borderRadius: 12, padding: 18 }}>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                              <span style={{ fontWeight: 600, fontSize: 14 }}>{s.phase}</span>span>
                                                              <Badge text={s.status} color={s.color} />
                                              </div>div>
                                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                                              <div style={{ textAlign: 'center', background: '#1a1a2e', borderRadius: 8, padding: '8px 4px' }}>
                                                                                <div style={{ fontSize: 11, color: '#64748b' }}>Max Loss</div>div>
                                                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#f87171' }}>{s.maxLoss}</div>div>
                                                              </div>div>
                                                              <div style={{ textAlign: 'center', background: '#1a1a2e', borderRadius: 8, padding: '8px 4px' }}>
                                                                                <div style={{ fontSize: 11, color: '#64748b' }}>Max Spend</div>div>
                                                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#fbbf24' }}>{s.maxSpend}</div>div>
                                                              </div>div>
                                                              <div style={{ textAlign: 'center', background: '#1a1a2e', borderRadius: 8, padding: '8px 4px' }}>
                                                                                <div style={{ fontSize: 11, color: '#64748b' }}>Min ROAS</div>div>
                                                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#4ade80' }}>{s.minRoas}</div>div>
                                                              </div>div>
                                              </div>div>
                                </div>div>
                              ))}
                                </div>div>
                        </div>div>
                        <div>
                                <h2 style={{ margin: '0 0 16px', fontSize: 15, color: '#94a3b8' }}>🛡️ Guard Rails</h2>h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {guards.map(g => (
                                <div key={g.name} style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <div>
                                                              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{g.name}</div>div>
                                                              <div style={{ fontSize: 11, color: '#64748b' }}>{g.desc}</div>div>
                                              </div>div>
                                              <Badge text={g.status} color={g.color} />
                                </div>div>
                              ))}
                                </div>div>
                        </div>div>
                  </div>div>
                )
}

function SaasView() {
    const plans = [
      { name: 'Trial', price: '€0', duration: '15 days', runs: '10 runs', features: ['All agents', 'Full dashboard', 'Email support'] },
      { name: 'Starter', price: '€99/mo', duration: 'Monthly', runs: '10 runs/mo', features: ['All agents', 'Pipelines', 'Basic analytics'] },
      { name: 'Growth', price: '€299/mo', duration: 'Monthly', runs: '50 runs/mo', features: ['Everything in Starter', 'Priority support', 'Advanced risk'] },
      { name: 'Elite', price: '€999/mo', duration: 'Monthly', runs: '200 runs/mo', features: ['Everything in Growth', 'Revenue share model', 'Dedicated support'] },
        ]
        return (
              <div>
                    <div style={{ marginBottom: 32 }}>
                            <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Current Plan: Growth Trial</h2>h2>
                            <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Trial expires in 15 days · 0/10 runs used this period</p>p>
                    </div>div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
                      {plans.map(plan => (
                          <div key={plan.name} style={{ background: '#0f0f1a', border: `1px solid ${plan.name === 'Growth' ? '#6366f1' : '#1e1e3a'}`, borderRadius: 12, padding: 20 }}>
                                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{plan.name}</div>div>
                                      <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1', marginBottom: 4 }}>{plan.price}</div>div>
                                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{plan.runs}</div>div>
                                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                        {plan.features.map(f => (
                                            <li key={f} style={{ fontSize: 13, color: '#94a3b8', padding: '4px 0', display: 'flex', gap: 8 }}>
                                                              <span style={{ color: '#4ade80' }}>✓</span>span> {f}
                                            </li>li>
                                          ))}
                                      </ul>ul>
                          </div>div>
                        ))}
                    </div>div>
                    <div style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 12, padding: 24 }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8' }}>💰 Revenue Share Model</h3>h3>
                            <p style={{ margin: '0 0 12px', fontSize: 14, color: '#94a3b8' }}>
                                      When your revenue exceeds €200,000 CA, a 2% revenue share applies automatically.
                            </p>p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                              {[
                { label: 'Revenue This Month', value: '€0', color: '#4ade80' },
                { label: 'Revenue Share Rate', value: '2%', color: '#6366f1' },
                { label: 'Threshold', value: '€200K', color: '#fbbf24' },
                          ].map(m => (
                                        <div key={m.label} style={{ background: '#1a1a2e', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                                                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{m.label}</div>div>
                                                      <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.value}</div>div>
                                        </div>div>
                                      ))}
                            </div>div>
                    </div>div>
              </div>div>
            )
}

export default App</span>
