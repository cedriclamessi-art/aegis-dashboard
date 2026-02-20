import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)
const TENANT_ID = import.meta.env.VITE_TENANT_ID || ''

// ============================================================
// STYLES - Interface claire et lisible pour débutants
// ============================================================
const S = {
  app: { display: 'flex', minHeight: '100vh', background: '#0f0f1a', color: '#e2e8f0', fontFamily: 'system-ui,sans-serif' },
  sidebar: { width: 240, background: '#0a0a12', borderRight: '1px solid #1e1e3a', padding: '0', display: 'flex', flexDirection: 'column' as const },
  main: { flex: 1, display: 'flex', flexDirection: 'column' as const },
  header: { padding: '20px 32px', borderBottom: '1px solid #1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a12' },
  content: { flex: 1, padding: 32, overflowY: 'auto' as const, maxWidth: 1200 },
  logo: { fontSize: 22, fontWeight: 800, color: '#6366f1', letterSpacing: '-0.5px' },
  card: { background: '#13131f', border: '1px solid #1e1e3a', borderRadius: 16, padding: '20px 24px' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { padding: '14px 16px', textAlign: 'left' as const, fontSize: 12, color: '#64748b', fontWeight: 700, background: '#13131f', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  td: { padding: '14px 16px', fontSize: 14, borderTop: '1px solid #1a1a2e' },
  btn: { background: '#6366f1', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 },
  btnSec: { background: '#13131f', color: '#94a3b8', border: '1px solid #1e1e3a', padding: '12px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 },
  approve: { background: '#0f2a0f', color: '#4ade80', border: '1px solid #4ade80', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  reject: { background: '#2a0f0f', color: '#f87171', border: '1px solid #f87171', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  panel: { background: '#13131f', border: '1px solid #1e1e3a', borderRadius: 16, padding: 24 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  helpBox: { background: '#1a1a2e', border: '1px solid #2e2e5a', borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '1px', padding: '20px 20px 8px', margin: 0 },
}

type Page = 'accueil' | 'campagnes' | 'decisions' | 'agents' | 'securite' | 'abonnement'

function getBadgeStyle(color: string) {
  const bg: Record<string,string> = { green:'#0f2a1a', blue:'#0f1e3a', yellow:'#2a2010', red:'#2a0f0f', purple:'#1e0f3a', gray:'#1a1a2a' }
  const fc: Record<string,string> = { green:'#4ade80', blue:'#60a5fa', yellow:'#fbbf24', red:'#f87171', purple:'#a78bfa', gray:'#94a3b8' }
  return { background: bg[color] || bg.gray, color: fc[color] || fc.gray, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }
}

function Badge({ text, color }: { text: string; color: string }) {
  return React.createElement('span', { style: getBadgeStyle(color) }, text)
}

function StatCard({ emoji, label, value, desc, color, hint }: { emoji: string; label: string; value: string|number; desc: string; color?: string; hint?: string }) {
  return React.createElement('div', { style: { ...S.card, position: 'relative' as const } },
    React.createElement('div', { style: { fontSize: 24, marginBottom: 8 } }, emoji),
    React.createElement('div', { style: { fontSize: 13, color: '#64748b', marginBottom: 4, fontWeight: 500 } }, label),
    React.createElement('div', { style: { fontSize: 30, fontWeight: 800, color: color || '#e2e8f0', lineHeight: 1 } }, value),
    React.createElement('div', { style: { fontSize: 12, color: '#475569', marginTop: 6 } }, desc),
    hint ? React.createElement('div', { style: { fontSize: 11, color: '#4ade80', marginTop: 8, fontStyle: 'italic' } }, '💡 ' + hint) : null
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('accueil')
  const [pipelines, setPipelines] = useState<any[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [notif, setNotif] = useState<string|null>(null)
  const [counts, setCounts] = useState({ pip: 0, act: 0, done: 0, ag: 0 })

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(null), 3500) }

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
    if (p === 'campagnes') {
      const { data } = await supabase.from('v_pipelines').select('*').order('created_at', { ascending: false }).limit(20)
      setPipelines(data || [])
    } else if (p === 'decisions') {
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
      const { error } = await supabase.rpc('enqueue_product_pipeline', {
        p_tenant_id: TENANT_ID,
        p_product_id: crypto.randomUUID(),
        p_product_name: 'Produit ' + Date.now().toString().slice(-6),
        p_budget: 500,
        p_target_roas: 1.5
      })
      if (error) throw error
      notify('✅ Campagne lancée avec succès !')
      loadData('campagnes')
      loadStats()
    } catch(e: any) { notify('❌ Erreur : ' + e.message) }
    setLoading(false)
  }

  const approveAction = async (id: string) => {
    await supabase.from('actions_queue').update({ status: 'approved' }).eq('id', id)
    notify('✅ Action validée')
    loadData('decisions')
  }
  const rejectAction = async (id: string) => {
    await supabase.from('actions_queue').update({ status: 'rejected' }).eq('id', id)
    notify('🚫 Action refusée')
    loadData('decisions')
  }
  const toggleAgent = async (id: string, cur: boolean) => {
    await supabase.from('agents_registry').update({ is_enabled: !cur }).eq('id', id)
    notify(cur ? '⏸ Agent mis en pause' : '▶ Agent activé')
    loadData('agents')
  }

  const nav = [
    { id: 'accueil', label: 'Accueil', icon: '🏠', desc: 'Vue générale' },
    { id: 'campagnes', label: 'Campagnes', icon: '🚀', desc: 'Mes publicités' },
    { id: 'decisions', label: 'Décisions', icon: '✅', desc: 'À valider' },
    { id: 'agents', label: 'Agents IA', icon: '🤖', desc: 'Robots actifs' },
    { id: 'securite', label: 'Sécurité', icon: '🛡️', desc: 'Limites & risques' },
    { id: 'abonnement', label: 'Abonnement', icon: '💎', desc: 'Mon forfait' },
  ] as const

  return (
    <div style={S.app}>
      {/* BARRE LATÉRALE */}
      <div style={S.sidebar}>
        <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid #1e1e3a' }}>
          <div style={S.logo}>⚡ AEGIS</div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>Plateforme publicitaire IA</div>
        </div>

        <p style={S.sectionTitle}>Navigation</p>
        <nav style={{ padding: '0 8px', flex: 1 }}>
          {nav.map(item => (
            <button key={item.id} onClick={() => setPage(item.id as Page)} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '12px 16px', marginBottom: 4,
              background: page === item.id ? '#1e1e3a' : 'transparent',
              border: 'none', borderRadius: 10,
              color: page === item.id ? '#6366f1' : '#94a3b8',
              cursor: 'pointer', fontSize: 14,
              fontWeight: page === item.id ? 700 : 400,
              transition: 'all 0.15s'
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div style={{ textAlign: 'left' as const }}>
                <div>{item.label}</div>
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 400 }}>{item.desc}</div>
              </div>
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e1e3a', fontSize: 12 }}>
          <div style={{ color: '#4ade80', marginBottom: 4 }}>🟢 Système connecté</div>
          <div style={{ color: '#475569' }}>Base de données : OK</div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div style={S.main}>
        <div style={S.header}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              {nav.find(n => n.id === page)?.icon} {nav.find(n => n.id === page)?.label}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#475569' }}>
              {nav.find(n => n.id === page)?.desc}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {notif && <div style={{ background: '#0f2a1a', color: '#4ade80', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{notif}</div>}
            <div style={{ background: '#13131f', border: '1px solid #1e1e3a', padding: '8px 16px', borderRadius: 8, fontSize: 13, color: '#64748b' }}>
              📅 {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>

        <div style={S.content}>
          {page === 'accueil' && <AccueilPage counts={counts} onRefresh={loadStats} />}
          {page === 'campagnes' && <CampagnesPage pipelines={pipelines} loading={loading} onLaunch={launchPipeline} onRefresh={() => loadData('campagnes')} />}
          {page === 'decisions' && <DecisionsPage actions={actions} loading={loading} onApprove={approveAction} onReject={rejectAction} onRefresh={() => loadData('decisions')} />}
          {page === 'agents' && <AgentsPage agents={agents} loading={loading} onToggle={toggleAgent} onRefresh={() => loadData('agents')} />}
          {page === 'securite' && <SecuritePage />}
          {page === 'abonnement' && <AbonnementPage />}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// PAGE ACCUEIL
// ============================================================
function AccueilPage({ counts, onRefresh }: { counts: any; onRefresh: () => void }) {
  return (
    <div>
      <div style={S.helpBox}>
        👋 <strong>Bienvenue sur AEGIS !</strong> Voici un résumé de ce qui se passe en ce moment sur votre compte.
        Les chiffres se mettent à jour automatiquement. Cliquez sur <strong>"Actualiser"</strong> pour voir les dernières données.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, color: '#94a3b8', fontWeight: 600 }}>📊 Résumé du jour</h2>
        <button onClick={onRefresh} style={S.btnSec}>🔄 Actualiser</button>
      </div>

      <div style={S.grid4}>
        <StatCard emoji="🚀" label="Campagnes actives" value={counts.pip} desc="Publicités en cours" color="#6366f1" hint="Chaque campagne teste un produit" />
        <StatCard emoji="⏳" label="Décisions en attente" value={counts.act} desc="Actions à valider" color="#fbbf24" hint="L'IA attend votre accord" />
        <StatCard emoji="✅" label="Actions complétées" value={counts.done} desc="Tâches terminées" color="#4ade80" />
        <StatCard emoji="🤖" label="Agents disponibles" value={counts.ag} desc="Robots IA configurés" color="#60a5fa" hint="Chaque agent a un rôle précis" />
        <StatCard emoji="💰" label="Retour sur pub (ROAS)" value="2.4x" desc="Pour 1€ dépensé → 2.4€ récupérés" color="#4ade80" hint="Au-dessus de 1x = rentable !" />
        <StatCard emoji="💸" label="Dépenses aujourd'hui" value="€1 247" desc="Budget publicitaire utilisé" color="#f87171" />
        <StatCard emoji="📈" label="Revenus aujourd'hui" value="€2 993" desc="Chiffre d'affaires généré" color="#4ade80" hint="Revenus > Dépenses = bon signe" />
      </div>

      <div style={S.row2}>
        <div style={S.panel}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>🖥️ État du système</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
            Tous les composants techniques de la plateforme :
          </p>
          {[
            ['Base de données', 'En ligne', 'green', 'Stockage de vos données'],
            ['Moteur de risque', 'Actif', 'green', 'Surveille vos dépenses'],
            ['Orchestrateur IA', 'En marche', 'green', 'Coordonne les agents'],
            ['Garde-budget', 'Armé', 'blue', 'Bloque les dépassements'],
            ['Bouton d\'arrêt', 'En veille', 'yellow', 'Arrêt d\'urgence disponible'],
            ['Couverture auto', 'Surveillance', 'blue', 'Protection automatique']
          ].map(([label, status, color, desc]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1a1a2e' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>{desc}</div>
              </div>
              <Badge text={status} color={color} />
            </div>
          ))}
        </div>

        <div style={S.panel}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>🎯 Objectif en cours</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
            Votre progression vers les étapes de croissance :
          </p>
          {[
            ['Étape actuelle', 'Phase 1 → 1M€', '#6366f1'],
            ['Perte max par jour', '150€/jour', '#f87171'],
            ['Dépense max par jour', '500€/jour', '#fbbf24'],
            ['ROAS minimum requis', '1.10x', '#4ade80'],
            ['Mode de validation', 'Semi-automatique', '#60a5fa'],
            ['Forfait', 'Growth Trial', '#a78bfa']
          ].map(([label, value, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1a1a2e' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: 12, background: '#0f1e0f', borderRadius: 10, fontSize: 12, color: '#4ade80' }}>
            💡 En mode semi-automatique, l'IA propose des actions et vous décidez.
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// PAGE CAMPAGNES
// ============================================================
function CampagnesPage({ pipelines, loading, onLaunch, onRefresh }: any) {
  return (
    <div>
      <div style={S.helpBox}>
        🚀 <strong>Qu'est-ce qu'une campagne ?</strong> Une campagne teste automatiquement la publicité d'un produit.
        L'IA gère les budgets, les créatifs et l'optimisation à votre place.
        Cliquez sur <strong>"Nouvelle campagne"</strong> pour en démarrer une.
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={onLaunch} disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
          🚀 Nouvelle campagne
        </button>
        <button onClick={onRefresh} style={S.btnSec}>🔄 Actualiser</button>
      </div>

      {loading ? (
        <div style={{ color: '#64748b', textAlign: 'center' as const, padding: 60, fontSize: 15 }}>
          ⏳ Chargement en cours...
        </div>
      ) : (
        <div style={{ background: '#13131f', border: '1px solid #1e1e3a', borderRadius: 16, overflow: 'hidden' }}>
          <table style={S.table}>
            <thead>
              <tr>
                {[
                  ['Produit', 'Nom du produit testé'],
                  ['Statut', 'État de la campagne'],
                  ['Budget total', 'Montant alloué'],
                  ['Dépensé', 'Montant utilisé'],
                  ['ROAS', 'Retour sur investissement'],
                  ['Date', 'Date de création']
                ].map(([h, sub]) => (
                  <th key={h} style={S.th}>
                    <div>{h}</div>
                    <div style={{ fontSize: 10, color: '#475569', fontWeight: 400, textTransform: 'none' as const }}>{sub}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pipelines.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 48, textAlign: 'center' as const, color: '#475569' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Aucune campagne pour le moment</div>
                    <div style={{ fontSize: 13 }}>Cliquez sur "Nouvelle campagne" pour commencer !</div>
                  </td>
                </tr>
              ) : pipelines.map((p: any) => (
                <tr key={p.id} style={{ cursor: 'default' }}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{p.product_name}</td>
                  <td style={S.td}>
                    <Badge
                      text={p.status === 'active' ? '▶ Active' : p.status === 'pending' ? '⏳ En attente' : '⏸ Terminée'}
                      color={p.status === 'active' ? 'green' : p.status === 'pending' ? 'yellow' : 'gray'}
                    />
                  </td>
                  <td style={S.td}>€{p.total_budget}</td>
                  <td style={S.td}>€{p.spent_budget || 0}</td>
                  <td style={{ ...S.td, color: '#4ade80', fontWeight: 600 }}>
                    {p.roas ? p.roas + 'x' : 'N/A'}
                  </td>
                  <td style={{ ...S.td, fontSize: 12, color: '#64748b' }}>
                    {new Date(p.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ============================================================
// PAGE DECISIONS
// ============================================================
function DecisionsPage({ actions, loading, onApprove, onReject, onRefresh }: any) {
  return (
    <div>
      <div style={S.helpBox}>
        ✅ <strong>Que sont les décisions ?</strong> Quand l'IA veut faire une action (ex: augmenter un budget, tester une nouvelle pub),
        elle vous demande d'abord votre accord ici. Vous pouvez <strong>Valider</strong> (l'IA exécute) ou <strong>Refuser</strong> (rien ne change).
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 15, color: '#94a3b8', fontWeight: 600 }}>
          {actions.filter((a: any) => a.status === 'pending').length > 0
            ? `⏳ ${actions.filter((a: any) => a.status === 'pending').length} décision(s) en attente de votre accord`
            : '✅ Aucune décision en attente'}
        </h2>
        <button onClick={onRefresh} style={S.btnSec}>🔄</button>
      </div>

      {loading ? (
        <div style={{ color: '#64748b', textAlign: 'center' as const, padding: 60, fontSize: 15 }}>⏳ Chargement...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {actions.length === 0 ? (
            <div style={{ ...S.panel, textAlign: 'center' as const, padding: 48 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#4ade80' }}>Tout est à jour !</div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 8 }}>Aucune action ne nécessite votre attention.</div>
            </div>
          ) : actions.map((a: any) => (
            <div key={a.id} style={{ ...S.panel, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {a.action_type === 'increase_budget' ? '📈' :
                 a.action_type === 'decrease_budget' ? '📉' :
                 a.action_type === 'pause' ? '⏸' :
                 a.action_type === 'launch' ? '🚀' : '🤖'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  {a.agent_name} — {
                    a.action_type === 'increase_budget' ? 'Augmenter le budget' :
                    a.action_type === 'decrease_budget' ? 'Réduire le budget' :
                    a.action_type === 'pause' ? 'Mettre en pause' :
                    a.action_type === 'launch' ? 'Lancer une nouvelle pub' :
                    a.action_type
                  }
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Priorité : {a.priority >= 8 ? '🔴 Haute' : a.priority >= 5 ? '🟡 Moyenne' : '🟢 Faible'}
                </div>
              </div>
              <Badge
                text={a.status === 'pending' ? '⏳ En attente' : a.status === 'completed' ? '✅ Fait' : a.status === 'approved' ? '👍 Validé' : '❌ Refusé'}
                color={a.status === 'pending' ? 'yellow' : a.status === 'completed' ? 'green' : a.status === 'approved' ? 'blue' : 'red'}
              />
              {a.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onApprove(a.id)} style={S.approve}>✓ Valider</button>
                  <button onClick={() => onReject(a.id)} style={S.reject}>✗ Refuser</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// PAGE AGENTS IA
// ============================================================
function AgentsPage({ agents, loading, onToggle, onRefresh }: any) {
  const cats = [...new Set(agents.map((a: any) => a.category))]

  const catLabels: Record<string, { label: string; emoji: string; desc: string }> = {
    'CREATIVE': { label: 'Création de contenu', emoji: '🎨', desc: 'Génèrent des images, vidéos et textes publicitaires' },
    'MARKET': { label: 'Analyse de marché', emoji: '🔍', desc: 'Analysent les tendances et la concurrence' },
    'MEDIA_BUYING': { label: 'Achat de publicité', emoji: '📢', desc: 'Gèrent les enchères et placements publicitaires' },
    'ANALYTICS': { label: 'Analyse des résultats', emoji: '📊', desc: 'Mesurent les performances et calculent le ROAS' },
    'OPTIMIZATION': { label: 'Optimisation', emoji: '⚡', desc: 'Améliorent automatiquement les campagnes en cours' },
  }

  return (
    <div>
      <div style={S.helpBox}>
        🤖 <strong>Qu'est-ce qu'un agent IA ?</strong> Un agent est un "robot" spécialisé qui effectue une tâche précise automatiquement.
        Par exemple, <em>HeroImageAgent</em> génère des images de publicité. Vous pouvez les <strong>activer (ON)</strong> ou <strong>désactiver (OFF)</strong> selon vos besoins.
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>🤖 {agents.length} agents configurés</span>
          <span style={{ fontSize: 13, color: '#475569', marginLeft: 12 }}>
            {agents.filter((a: any) => a.is_enabled).length} actifs, {agents.filter((a: any) => !a.is_enabled).length} en pause
          </span>
        </div>
        <button onClick={onRefresh} style={S.btnSec}>🔄 Actualiser</button>
      </div>

      {loading ? (
        <div style={{ color: '#64748b', textAlign: 'center' as const, padding: 60, fontSize: 15 }}>⏳ Chargement...</div>
      ) : (
        <div>
          {cats.map((cat: any) => {
            const catInfo = catLabels[cat] || { label: cat, emoji: '🤖', desc: '' }
            return (
              <div key={cat} style={{ marginBottom: 32 }}>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>
                    {catInfo.emoji} {catInfo.label}
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{catInfo.desc}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {agents.filter((a: any) => a.category === cat).map((ag: any) => (
                    <div key={ag.id} style={{ ...S.panel, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: ag.is_enabled ? '#0f2a1a' : '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {catInfo.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{ag.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {ag.run_count} exécutions
                        </div>
                      </div>
                      <button
                        onClick={() => onToggle(ag.id, ag.is_enabled)}
                        style={{
                          background: ag.is_enabled ? '#0f2a1a' : '#1a1a2e',
                          color: ag.is_enabled ? '#4ade80' : '#475569',
                          border: ag.is_enabled ? '1px solid #4ade80' : '1px solid #1e1e3a',
                          padding: '6px 16px', borderRadius: 20,
                          cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          minWidth: 56
                        }}
                      >
                        {ag.is_enabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {agents.length === 0 && (
            <div style={{ color: '#475569', textAlign: 'center' as const, padding: 60 }}>Aucun agent configuré</div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// PAGE SECURITE
// ============================================================
function SecuritePage() {
  const stages = [
    { phase: 'Phase 1 · 0 → 1M€', maxLoss: '150€/j', maxSpend: '500€/j', minRoas: '1.10x', active: true, desc: 'Démarrage et validation' },
    { phase: 'Phase 2 · 1M → 10M€', maxLoss: '500€/j', maxSpend: '2 000€/j', minRoas: '1.20x', active: false, desc: 'Croissance accélérée' },
    { phase: 'Phase 3 · 10M → 100M€', maxLoss: '1 500€/j', maxSpend: '8 000€/j', minRoas: '1.30x', active: false, desc: 'Mise a l’echelle' },
  ]
  const guards = [
    { name: 'Garde-budget', desc: 'Bloque automatiquement les dépenses si la limite journalière est atteinte', status: 'Armé', color: 'green', emoji: '💰' },
    { name: 'Garde-ROAS', desc: 'Arrête une campagne si le retour sur pub passe sous le minimum requis', status: 'Armé', color: 'green', emoji: '📊' },
    { name: 'Frein automatique', desc: 'Ralentit les dépenses soudaines ou anormales', status: 'Armé', color: 'green', emoji: '🚦' },
    { name: 'Détecteur de chutes', desc: 'Détecte et signale les baisses de performance inhabituelles', status: 'Surveillance', color: 'blue', emoji: '📉' },
    { name: 'Protection du capital', desc: 'Arret urgence perte catastrophique', status: 'En veille', color: 'yellow', emoji: '🔒' },
    { name: 'Bouton Arret Total', desc: 'Stoppe TOUTES les campagnes immédiatement', status: 'En veille', color: 'red', emoji: '🛑' },
  ]

  return (
    <div>
      <div style={S.helpBox}>
        🛡️ <strong>Comment fonctionne la sécurité ?</strong> AEGIS dispose de plusieurs "filets de sécurité" qui protègent votre budget.
        Si une limite est dépassée, le système s'arrête automatiquement. Vous définissez les règles, l'IA les respecte.
      </div>

      <div style={S.row2}>
        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>🎯 Étapes de croissance</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
            Chaque phase débloque des budgets plus importants une fois les objectifs atteints.
          </p>
          {stages.map(s => (
            <div key={s.phase} style={{ ...S.panel, border: s.active ? '2px solid #6366f1' : '1px solid #1e1e3a', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{s.phase}</span>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.desc}</div>
                </div>
                <Badge text={s.active ? '▶ En cours' : '🔒 Verrouillée'} color={s.active ? 'green' : 'gray'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  ['🔴 Perte max', s.maxLoss, '#f87171'],
                  ['🟡 Dépense max', s.maxSpend, '#fbbf24'],
                  ['🟢 ROAS min', s.minRoas, '#4ade80']
                ].map(([k, v, c]) => (
                  <div key={k} style={{ textAlign: 'center' as const, background: '#1a1a2e', borderRadius: 10, padding: '10px 6px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>🛡️ Protections actives</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
            Ces systèmes fonctionnent en permanence en arrière-plan.
          </p>
          {guards.map(g => (
            <div key={g.name} style={{ ...S.panel, display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontSize: 24 }}>{g.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{g.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{g.desc}</div>
              </div>
              <Badge text={g.status} color={g.color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// PAGE ABONNEMENT
// ============================================================
function AbonnementPage() {
  const plans = [
    { name: 'Essai', price: '0€', period: '', runs: '10 tests', features: ['Tous les agents', 'Dashboard complet', 'Support par email'], current: false, emoji: '🆓' },
    { name: 'Starter', price: '99€', period: '/mois', runs: '10 campagnes/mois', features: ['Tous les agents', 'Campagnes publicitaires', 'Analyses'], current: false, emoji: '🌱' },
    { name: 'Growth', price: '299€', period: '/mois', runs: '50 campagnes/mois', features: ['Support prioritaire', 'Risque avancé', 'Accès API'], current: true, emoji: '🚀' },
    { name: 'Elite', price: '999€', period: '/mois', runs: '200 campagnes/mois', features: ['Partage de revenus', 'Support dédié', 'Agents sur mesure'], current: false, emoji: '💎' },
  ]

  return (
    <div>
      <div style={S.helpBox}>
        💎 <strong>Votre abonnement actuel :</strong> Growth Trial — Il vous reste <strong>15 jours d'essai</strong>.
        Vous avez utilisé 0 campagne sur les 10 disponibles dans votre période d'essai.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {plans.map(p => (
          <div key={p.name} style={{
            ...S.panel,
            border: p.current ? '2px solid #6366f1' : '1px solid #1e1e3a',
            position: 'relative' as const
          }}>
            {p.current && (
              <div style={{ position: 'absolute' as const, top: -12, left: '50%', transform: 'translateX(-50%)', background: '#6366f1', color: 'white', padding: '4px 16px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' as const }}>
                ✓ Plan actuel
              </div>
            )}
            <div style={{ fontSize: 28, marginBottom: 8 }}>{p.emoji}</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{p.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#6366f1' }}>{p.price}</span>
              <span style={{ fontSize: 13, color: '#64748b' }}>{p.period}</span>
            </div>
            <div style={{ fontSize: 12, color: '#4ade80', marginBottom: 16, fontWeight: 600 }}>
              📊 {p.runs}
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {p.features.map(f => (
                <li key={f} style={{ fontSize: 13, color: '#94a3b8', padding: '5px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            {!p.current && (
              <button style={{ ...S.btn, width: '100%', justifyContent: 'center', marginTop: 16, background: '#1e1e3a', color: '#6366f1' }}>
                Choisir ce plan
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={S.panel}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>💰 Modèle de partage de revenus</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
          Au-delà de 200 000€ de chiffre d'affaires mensuel, un partage de 2% s'applique. En dessous, aucun frais supplémentaire.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            ['📈 Revenus ce mois', '0€', '#4ade80'],
            ['🔢 Taux de partage', '2%', '#6366f1'],
            ['🎯 Seuil d'activation', '200 000€', '#fbbf24']
          ].map(([k, v, c]) => (
            <div key={k} style={{ background: '#1a1a2e', borderRadius: 12, padding: '16px 20px', textAlign: 'center' as const }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{k}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
