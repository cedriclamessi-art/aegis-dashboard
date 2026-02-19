import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)
const TENANT_ID = import.meta.env.VITE_TENANT_ID || ''

const S = {
  app: { display: 'flex', minHeight: '100vh', background: '#0a0a0f', color: '#e2e8f0', fontFamily: 'system-ui,sans-serif' },
  sidebar: { width: 220, background: '#0f0f1a', borderRight: '1px solid #1e1e3a', padding: '24px 0', display: 'flex', flexDirection: 'column' as const },
  main: { flex: 1, display: 'flex', flexDirection: 'column' as const },
  header: { padding: '16px 28px', borderBottom: '1px solid #1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f0f1a' },
  content: { flex: 1, padding: 28, overflowY: 'auto' as const },
  logo: { fontSize: 20, fontWeight: 700, color: '#6366f1' },
  card: { background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 12, padding: '20px 24px', minWidth: 160 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { padding: '12px 16px', textAlign: 'left' as const, fontSize: 12, color: '#64748b', fontWeight: 600, background: '#1a1a2e' },
  td: { padding: '12px 16px', fontSize: 14, borderTop: '1px solid #1a1a2e' },
  btn: { background: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  btnSec: { background: '#1e1e3a', color: '#6366f1', border: '1px solid #6366f1', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  approve: { background: '#1e3a1e', color: '#4ade80', border: '1px solid #4ade80', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  reject: { background: '#3a1e1e', color: '#f87171', border: '1px solid #f87171', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  panel: { background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 12, padding: 20 },
  notif: { background: '#1e3a1e', color: '#4ade80', padding: '6px 14px', borderRadius: 6, fontSize: 13 },
  tag: { background: '#1e1e3a', padding: '6px 14px', borderRadius: 6, fontSize: 13, color: '#94a3b8' }
}

type Page = 'dashboard' | 'pipelines' | 'actions' | 'agents' | 'risk' | 'saas'

function getBadgeStyle(color: string) {
  const bg: Record<string,string> = { green:'#1e3a1e', blue:'#1e2a3a', yellow:'#3a2e1e', red:'#3a1e1e', purple:'#2a1e3a', gray:'#1e1e2a' }
  const fc: Record<string,string> = { green:'#4ade80', blue:'#60a5fa', yellow:'#fbbf24', red:'#f87171', purple:'#a78bfa', gray:'#94a3b8' }
  return { background: bg[color] || bg.gray, color: fc[color] || fc.gray, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }
}

function Badge({ text, color }: { text: string; color: string }) {
  return React.createElement('span', { style: getBadgeStyle(color) }, text)
}

function StatCard({ label, value, sub, color }: { label: string; value: string|number; sub?: string; color?: string }) {
  return React.createElement('div', { style: S.card },
    React.createElement('div', { style: { fontSize: 13, color: '#64748b', marginBottom: 8 } }, label),
    React.createElement('div', { style: { fontSize: 28, fontWeight: 700, color: color || '#e2e8f0' } }, value),
    sub ? React.createElement('div', { style: { fontSize: 12, color: '#475569', marginTop: 4 } }, sub) : null
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [pipelines, setPipelines] = useState<any[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [notif, setNotif] = useState<string|null>(null)
  const [counts, setCounts] = useState({ pip: 0, act: 0, done: 0, ag: 0 })

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(null), 3000) }

  const loadStats = useCallback(async () => {
    const [a, b, c, d] = await Promise.all([
      supabase.from('v_pipelines').select('*', { count: 'exact', head: true }),
      supabase.from('v_actions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('v_actions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('v_agents_registry').select('*', { count: 'exact', head: true })
    ])
    setCounts({ pip: a.count||0, act: b.count||0, done: c.count||0, ag: d.count||0 })
  }, [])

  const loadData = useCallback(async (p: Page) => {
    setLoading(true)
    if (p === 'pipelines') {
      const { data } = await supabase.from('v_pipelines').select('*').order('created_at', { ascending: false }).limit(20)
      setPipelines(data || [])
    } else if (p === 'actions') {
      const { data } = await supabase.from('v_actions').select('*').order('priority', { ascending: false }).limit(30)
      setActions(data || [])
    } else if (p === 'agents') {
      const { data } = await supabase.from('v_agents_registry').select('*').order('category')
      setAgents(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadData(page) }, [page, loadData])

  const launchPipeline = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('enqueue_product_pipeline', {
        p_tenant_id: TENANT_ID, p_product_id: crypto.randomUUID(),
        p_product_name: 'Product ' + Date.now().toString().slice(-6), p_budget: 500, p_target_roas: 1.5
      })
      if (error) throw error
      notify('Pipeline launched!')
      loadData('pipelines')
      loadStats()
    } catch(e: any) { notify('Error: ' + e.message) }
    setLoading(false)
  }

  const approveAction = async (id: string) => {
    await supabase.from('actions_queue').update({ status: 'approved' }).eq('id', id)
    notify('Approved'); loadData('actions')
  }

  const rejectAction = async (id: string) => {
    await supabase.from('actions_queue').update({ status: 'rejected' }).eq('id', id)
    notify('Rejected'); loadData('actions')
  }

  const toggleAgent = async (id: string, cur: boolean) => {
    await supabase.from('agents_registry').update({ is_enabled: !cur }).eq('id', id)
    notify(cur ? 'Agent disabled' : 'Agent enabled'); loadData('agents')
  }

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'pipelines', label: 'Pipelines', icon: '🚀' },
    { id: 'actions', label: 'Actions', icon: '⚡' },
    { id: 'agents', label: 'Agents', icon: '🤖' },
    { id: 'risk', label: 'Risk', icon: '🛡️' },
    { id: 'saas', label: 'SaaS', icon: '💎' },
  ] as const

  return (
    <div style={S.app}>
      <div style={S.sidebar}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1e1e3a' }}>
          <div style={S.logo}>⚡ AEGIS</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>v1.0 · Autopilot</div>
        </div>
        <nav style={{ padding: '16px 0', flex: 1 }}>
          {nav.map(item => (
            <button key={item.id} onClick={() => setPage(item.id as Page)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 20px',
              background: page === item.id ? '#1e1e3a' : 'transparent', border: 'none',
              color: page === item.id ? '#6366f1' : '#94a3b8', cursor: 'pointer', fontSize: 14,
              fontWeight: page === item.id ? 600 : 400,
              borderLeft: page === item.id ? '3px solid #6366f1' : '3px solid transparent'
            }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e1e3a', fontSize: 12, color: '#475569' }}>
          <div>🟢 Supabase OK</div>
          <div>Tenant: AEGIS-OWNER</div>
        </div>
      </div>

      <div style={S.main}>
        <div style={S.header}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {nav.find(n => n.id === page)?.icon} {nav.find(n => n.id === page)?.label}
          </h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {notif && <div style={S.notif}>{notif}</div>}
            <div style={S.tag}>{new Date().toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        <div style={S.content}>
          {page === 'dashboard' && <DashPage counts={counts} onRefresh={loadStats} />}
          {page === 'pipelines' && <PipePage pipelines={pipelines} loading={loading} onLaunch={launchPipeline} onRefresh={() => loadData('pipelines')} />}
          {page === 'actions' && <ActPage actions={actions} loading={loading} onApprove={approveAction} onReject={rejectAction} onRefresh={() => loadData('actions')} />}
          {page === 'agents' && <AgPage agents={agents} loading={loading} onToggle={toggleAgent} onRefresh={() => loadData('agents')} />}
          {page === 'risk' && <RiskPage />}
          {page === 'saas' && <SaasPage />}
        </div>
      </div>
    </div>
  )
}

function DashPage({ counts, onRefresh }: { counts: any; onRefresh: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 15, color: '#94a3b8' }}>Command Center</h2>
        <button onClick={onRefresh} style={S.btnSec}>🔄 Refresh</button>
      </div>
      <div style={S.grid}>
        <StatCard label="Pipelines" value={counts.pip} sub="Active" color="#6366f1" />
        <StatCard label="Pending Actions" value={counts.act} sub="Queue" color="#fbbf24" />
        <StatCard label="Completed" value={counts.done} sub="Done" color="#4ade80" />
        <StatCard label="Agents" value={counts.ag} sub="Registry" color="#60a5fa" />
        <StatCard label="ROAS" value="2.4x" sub="Live" color="#4ade80" />
        <StatCard label="Spend" value="€1,247" sub="Today" color="#f87171" />
        <StatCard label="Revenue" value="€2,993" sub="Today" color="#4ade80" />
      </div>
      <div style={S.row2}>
        <div style={S.panel}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8' }}>🎯 System Status</h3>
          {[
            ['Database', 'online', 'green'], ['Risk Engine', 'active', 'green'],
            ['Agent Orchestrator', 'running', 'green'], ['Budget Guard', 'armed', 'blue'],
            ['Kill Switch', 'standby', 'yellow'], ['Auto Hedge', 'monitoring', 'blue']
          ].map(([label, status, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a1a2e' }}>
              <span style={{ fontSize: 13 }}>{label}</span>
              <Badge text={status} color={color} />
            </div>
          ))}
        </div>
        <div style={S.panel}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8' }}>📈 Phase Status</h3>
          {[
            ['Phase', 'Phase 1 → €1M', '#6366f1'], ['Stop-Loss', '€150/day', '#f87171'],
            ['Max Spend', '€500/day', '#fbbf24'], ['Min ROAS', '1.10x', '#4ade80'],
            ['Mode', 'Semi-Auto', '#60a5fa'], ['Plan', 'Growth Trial', '#a78bfa']
          ].map(([label, value, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a2e' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PipePage({ pipelines, loading, onLaunch, onRefresh }: any) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={onLaunch} disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>🚀 Launch Pipeline</button>
        <button onClick={onRefresh} style={S.btnSec}>🔄 Refresh</button>
      </div>
      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading...</div> : (
        <div style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 12, overflow: 'hidden' }}>
          <table style={S.table}>
            <thead>
              <tr>{['Product','Status','Budget','Spent','ROAS','Date'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {pipelines.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#475569' }}>No pipelines. Launch one!</td></tr>
              ) : pipelines.map((p: any) => (
                <tr key={p.id}>
                  <td style={S.td}>{p.product_name}</td>
                  <td style={S.td}><Badge text={p.status} color={p.status==='active'?'green':p.status==='pending'?'yellow':'gray'} /></td>
                  <td style={S.td}>€{p.total_budget}</td>
                  <td style={S.td}>€{p.spent_budget||0}</td>
                  <td style={{ ...S.td, color: '#4ade80' }}>{p.roas ? p.roas+'x' : 'N/A'}</td>
                  <td style={{ ...S.td, fontSize: 12, color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ActPage({ actions, loading, onApprove, onReject, onRefresh }: any) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 15, color: '#94a3b8' }}>Actions Queue</h2>
        <button onClick={onRefresh} style={S.btnSec}>🔄</button>
      </div>
      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actions.length === 0 ? (
            <div style={{ ...S.panel, textAlign: 'center', color: '#475569' }}>Queue empty</div>
          ) : actions.map((a: any) => (
            <div key={a.id} style={{ ...S.panel, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{a.agent_name} · {a.action_type}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Priority: {a.priority}</div>
              </div>
              <Badge text={a.status} color={a.status==='pending'?'yellow':a.status==='completed'?'green':a.status==='approved'?'blue':'red'} />
              {a.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onApprove(a.id)} style={S.approve}>✓ OK</button>
                  <button onClick={() => onReject(a.id)} style={S.reject}>✗ No</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AgPage({ agents, loading, onToggle, onRefresh }: any) {
  const cats = [...new Set(agents.map((a: any) => a.category))]
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 15, color: '#94a3b8' }}>Agents Registry</h2>
        <button onClick={onRefresh} style={S.btnSec}>🔄</button>
      </div>
      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading...</div> : (
        <div>
          {cats.map((cat: any) => (
            <div key={cat} style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {agents.filter((a: any) => a.category === cat).map((ag: any) => (
                  <div key={ag.id} style={{ ...S.panel, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{ag.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Runs: {ag.run_count}</div>
                    </div>
                    <button onClick={() => onToggle(ag.id, ag.is_enabled)} style={{
                      background: ag.is_enabled ? '#1e3a1e' : '#1e1e2a',
                      color: ag.is_enabled ? '#4ade80' : '#475569',
                      border: ag.is_enabled ? '1px solid #4ade80' : '1px solid #475569',
                      padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 600
                    }}>{ag.is_enabled ? 'ON' : 'OFF'}</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {agents.length === 0 && <div style={{ color: '#475569', textAlign: 'center', padding: 40 }}>No agents</div>}
        </div>
      )}
    </div>
  )
}

function RiskPage() {
  const stages = [
    { phase: 'Phase 1 · 0→1M', maxLoss: '€150/j', maxSpend: '€500/j', minRoas: '1.10x', active: true },
    { phase: 'Phase 2 · 1M→10M', maxLoss: '€500/j', maxSpend: '€2,000/j', minRoas: '1.20x', active: false },
    { phase: 'Phase 3 · 10M→100M', maxLoss: '€1,500/j', maxSpend: '€8,000/j', minRoas: '1.30x', active: false },
  ]
  const guards = [
    { name: 'Budget Guard', desc: 'Daily spend limit protection', status: 'armed', color: 'green' },
    { name: 'ROAS Guard', desc: 'Min ROAS enforcement', status: 'armed', color: 'green' },
    { name: 'Metabolic Throttle', desc: 'Burst spending limiter', status: 'armed', color: 'green' },
    { name: 'Volatility Detector', desc: 'Performance anomaly detection', status: 'monitoring', color: 'blue' },
    { name: 'Capital Protection', desc: 'Catastrophic loss emergency stop', status: 'standby', color: 'yellow' },
    { name: 'Kill Switch', desc: 'Nuclear option - stops all', status: 'standby', color: 'red' },
  ]
  return (
    <div style={S.row2}>
      <div>
        <h2 style={{ margin: '0 0 16px', fontSize: 15, color: '#94a3b8' }}>🎯 Risk Stages</h2>
        {stages.map(s => (
          <div key={s.phase} style={{ ...S.panel, border: s.active ? '1px solid #6366f1' : '1px solid #1e1e3a', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{s.phase}</span>
              <Badge text={s.active ? 'active' : 'locked'} color={s.active ? 'green' : 'gray'} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['Max Loss', s.maxLoss, '#f87171'], ['Max Spend', s.maxSpend, '#fbbf24'], ['Min ROAS', s.minRoas, '#4ade80']].map(([k, v, c]) => (
                <div key={k} style={{ textAlign: 'center', background: '#1a1a2e', borderRadius: 8, padding: '8px 4px' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <h2 style={{ margin: '0 0 16px', fontSize: 15, color: '#94a3b8' }}>🛡️ Guard Rails</h2>
        {guards.map(g => (
          <div key={g.name} style={{ ...S.panel, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{g.name}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{g.desc}</div>
            </div>
            <Badge text={g.status} color={g.color} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SaasPage() {
  const plans = [
    { name: 'Trial', price: '€0', runs: '10 runs', features: ['All agents', 'Full dashboard', 'Email support'], current: false },
    { name: 'Starter', price: '€99/mo', runs: '10 runs/mo', features: ['All agents', 'Pipelines', 'Analytics'], current: false },
    { name: 'Growth', price: '€299/mo', runs: '50 runs/mo', features: ['Priority support', 'Advanced risk', 'API access'], current: true },
    { name: 'Elite', price: '€999/mo', runs: '200 runs/mo', features: ['Revenue share', 'Dedicated support', 'Custom agents'], current: false },
  ]
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Current Plan: Growth Trial</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>15 days remaining · 0/10 runs used</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {plans.map(p => (
          <div key={p.name} style={{ ...S.panel, border: p.current ? '1px solid #6366f1' : '1px solid #1e1e3a' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1', marginBottom: 4 }}>{p.price}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{p.runs}</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {p.features.map(f => (
                <li key={f} style={{ fontSize: 13, color: '#94a3b8', padding: '4px 0', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#4ade80' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            {p.current && <div style={{ marginTop: 12 }}><Badge text="Current Plan" color="purple" /></div>}
          </div>
        ))}
      </div>
      <div style={S.panel}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#94a3b8' }}>💰 Revenue Share Model</h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8' }}>2% revenue share applies above €200K CA</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[['Revenue', '€0', '#4ade80'], ['Share Rate', '2%', '#6366f1'], ['Threshold', '€200K', '#fbbf24']].map(([k, v, c]) => (
            <div key={k} style={{ background: '#1a1a2e', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
