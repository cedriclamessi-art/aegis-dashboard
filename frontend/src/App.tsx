import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'AEGIS-OWNER'

// ============================================================
// TYPES
// ============================================================
type Page = 'accueil' | 'boutique' | 'intelligence' | 'creatifs' | 'funnel' | 'media' | 'campagnes' | 'decisions' | 'agents' | 'risque' | 'marche' | 'sante' | 'gouvernance' | 'financier' | 'securite' | 'abonnement'

// ============================================================
// STYLES
// ============================================================
const S = {
  app: { display: 'flex', minHeight: '100vh', background: '#0f0f1a', color: '#e2e8f0', fontFamily: 'system-ui,sans-serif' },
  sidebar: { width: 240, background: '#0a0a12', borderRight: '1px solid #1e1e3a', padding: '0', display: 'flex', flexDirection: 'column' as const },
  main: { flex: 1, display: 'flex', flexDirection: 'column' as const },
  header: { padding: '20px 32px', borderBottom: '1px solid #1e1e3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a12' },
  content: { flex: 1, padding: '32px', overflowY: 'auto' as const },
  logo: { padding: '24px 20px', borderBottom: '1px solid #1e1e3a' },
  logoText: { fontSize: '22px', fontWeight: 800, color: '#facc15', letterSpacing: '-0.5px' },
  logoSub: { fontSize: '11px', color: '#64748b', marginTop: '2px' },
  navSection: { padding: '12px 12px 4px', fontSize: '10px', fontWeight: 700, color: '#374151', letterSpacing: '1px', textTransform: 'uppercase' as const },
  navBtn: (active: boolean) => ({
    width: '100%', padding: '10px 16px', background: active ? '#1e1b4b' : 'transparent',
    border: 'none', borderRadius: '8px', color: active ? '#a5b4fc' : '#94a3b8',
    cursor: 'pointer', textAlign: 'left' as const, fontSize: '14px', fontWeight: active ? 600 : 400,
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px',
    transition: 'all 0.15s'
  }),
  card: { background: '#0a0a1a', border: '1px solid #1e1e3a', borderRadius: '12px', padding: '20px' },
  cardTitle: { fontSize: '13px', color: '#64748b', marginBottom: '6px' },
  cardValue: { fontSize: '28px', fontWeight: 700, color: '#fff' },
  grid: (cols: number) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px' }),
  badge: (color: string) => ({ background: color === 'green' ? '#052e16' : color === 'yellow' ? '#451a03' : color === 'red' ? '#450a0a' : color === 'blue' ? '#0c1a3e' : '#1e1e3a', color: color === 'green' ? '#4ade80' : color === 'yellow' ? '#fbbf24' : color === 'red' ? '#f87171' : color === 'blue' ? '#93c5fd' : '#94a3b8', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }),
  btn: (variant: string = 'primary') => ({ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', background: variant === 'primary' ? '#4f46e5' : variant === 'success' ? '#16a34a' : variant === 'danger' ? '#dc2626' : variant === 'outline' ? 'transparent' : '#1e1e3a', color: variant === 'outline' ? '#94a3b8' : '#fff', border: variant === 'outline' ? '1px solid #1e1e3a' : 'none' }),
  input: { padding: '10px 14px', background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', width: '100%', outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { padding: '10px 16px', background: '#0a0a1a', color: '#64748b', fontSize: '11px', textAlign: 'left' as const, fontWeight: 700, letterSpacing: '0.5px', borderBottom: '1px solid #1e1e3a' },
  td: { padding: '12px 16px', borderBottom: '1px solid #0f0f1a', fontSize: '14px' },
  info: { background: '#0c1a3e', border: '1px solid #1e3a8a', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', fontSize: '14px', color: '#93c5fd' },
  section: { marginBottom: '32px' },
  sectionTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#c7d2fe' },
  progress: (pct: number, color: string = '#4f46e5') => ({ height: '8px', background: '#1e1e3a', borderRadius: '4px', overflow: 'hidden' as const }),
  progressBar: (pct: number, color: string = '#4f46e5') => ({ height: '100%', width: `${Math.min(100,pct)}%`, background: color, borderRadius: '4px', transition: 'width 0.3s' }),
  tag: { display: 'inline-block', padding: '2px 8px', background: '#1e1e3a', borderRadius: '4px', fontSize: '11px', color: '#94a3b8', marginRight: '4px', marginTop: '4px' },
  row: { display: 'flex', gap: '16px', alignItems: 'center' },
}
// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function App() {
  const [page, setPage] = useState<Page>('accueil')
  const [boutique, setBoutique] = useState({ url: '', plateforme: 'shopify', connecte: false, catalogue: 0, commandes: 0, cvr: 0, aov: 0, marge: 0 })
  const [boutiqueInput, setBoutiqueInput] = useState('')
  const [pipelines, setPipelines] = useState<any[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [nouvelleUrl, setNouvelleUrl] = useState('')
  const [nouvellePlateforme, setNouvellePlateforme] = useState('meta')
  const [nouveauBudget, setNouveauBudget] = useState('500')
  const [gouvernanceMode, setGouvernanceMode] = useState<'humain'|'semi_auto'|'full_auto'>('semi_auto')
  const [riskConfig, setRiskConfig] = useState({ perteMax: 150, depenseMax: 500, roasMin: 1.10, killSwitch: false })
  const [creatifType, setCreatifType] = useState('image')
  const [creatifProduit, setCreatifProduit] = useState('')
  const [creatifGenere, setCreatifGenere] = useState<any[]>([])
  const [creatifLoading, setCreatifLoading] = useState(false)
  const [intelligenceProduit, setIntelligenceProduit] = useState('')
  const [intelligenceResultat, setIntelligenceResultat] = useState<any>(null)
  const [intelligenceLoading, setIntelligenceLoading] = useState(false)
  const [funnelUrl, setFunnelUrl] = useState('')
  const [funnelAnalyse, setFunnelAnalyse] = useState<any>(null)
  const [funnelLoading, setFunnelLoading] = useState(false)
  const [marcheSignaux, setMarcheSignaux] = useState<any[]>([])
  const [santeStatus, setSanteStatus] = useState<any>({})
  const [phase, setPhase] = useState(1)

  const loadData = useCallback(async () => {
    try {
      const [p, a, ag] = await Promise.all([
        supabase.from('v_pipelines').select('*').eq('tenant_id', TENANT_ID).order('created_at', { ascending: false }),
        supabase.from('v_actions').select('*').eq('tenant_id', TENANT_ID).limit(50),
        supabase.from('v_agents_registry').select('*').eq('tenant_id', TENANT_ID),
      ])
      if (p.data) setPipelines(p.data)
      if (a.data) setActions(a.data)
      if (ag.data) setAgents(ag.data)
    } catch(e) { console.error(e) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Simuler des signaux marche
  useEffect(() => {
    setMarcheSignaux([
      { signal: 'Fatigue creative', produit: 'Produit A', valeur: '78%', status: 'warning', action: 'Renouveler creatives' },
      { signal: 'Hausse CPM', produit: 'Produit B', valeur: '+23%', status: 'danger', action: 'Reduire budget Meta' },
      { signal: 'Baisse CTR', produit: 'Produit C', valeur: '-15%', status: 'warning', action: 'Tester nouveaux hooks' },
      { signal: 'ROAS stable', produit: 'Produit D', valeur: '3.2x', status: 'good', action: 'Continuer scaling' },
      { signal: 'Saturation audience', produit: 'Produit E', valeur: '91%', status: 'danger', action: 'Rotation niche' },
    ])
    setSanteStatus({
      api_meta: 'ok', api_google: 'ok', api_tiktok: 'warning',
      pixel_tracking: 'ok', base_donnees: 'ok', jobs_retry: 3,
      backup: 'ok', incoh_donnees: 0, calibrage: 'ok'
    })
  }, [])

  const lancerCampagne = async () => {
    if (!nouvelleUrl.trim()) return
    setLoading(true)
    try {
      const { data } = await supabase.rpc('enqueue_product_pipeline', {
        p_tenant_id: TENANT_ID || 'AEGIS-OWNER',
        p_product_id: 'prod_' + Date.now(),
        p_product_name: nouvelleUrl,
        p_budget: parseFloat(nouveauBudget) || 500,
        p_target_roas: 1.5
      })
      await loadData()
      setNouvelleUrl('')
      alert('Campagne lancee avec succes!')
    } catch(e: any) { alert('Erreur: ' + e.message) }
    setLoading(false)
  }

  const validerAction = async (id: string) => {
    await supabase.from('actions_queue').update({ status: 'approved' }).eq('id', id)
    await loadData()
  }

  const refuserAction = async (id: string) => {
    await supabase.from('actions_queue').update({ status: 'rejected' }).eq('id', id)
    await loadData()
  }

  const connecterBoutique = async () => {
    if (!boutiqueInput.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setBoutique({
      url: boutiqueInput, plateforme: 'shopify', connecte: true,
      catalogue: 47, commandes: 1234, cvr: 3.2, aov: 67.50, marge: 42
    })
    setLoading(false)
  }

  const analyserIntelligence = async () => {
    if (!intelligenceProduit.trim()) return
    setIntelligenceLoading(true)
    await new Promise(r => setTimeout(r, 2000))
    setIntelligenceResultat({
      url: intelligenceProduit,
      score: 87,
      saturation: 23,
      longevite: '4 semaines',
      angle: 'Douleur / solution',
      concurrence: 'Moyenne (12 vendeurs actifs)',
      prixMarche: '29-49 EUR',
      verdict: 'WINNER POTENTIEL',
      raisons: ['Ads actives depuis +3 semaines', 'Peu de saturation', 'CPM bas sur ce niche', 'Angle non exploite'],
    })
    setIntelligenceLoading(false)
  }

  const analyserFunnel = async () => {
    if (!funnelUrl.trim()) return
    setFunnelLoading(true)
    await new Promise(r => setTimeout(r, 2000))
    setFunnelAnalyse({
      url: funnelUrl,
      cvr: 1.8,
      aov: 52,
      heroScore: 65,
      preuveScore: 30,
      urgenceScore: 20,
      recommandations: [
        { priorite: 'CRITIQUE', action: 'Ajouter preuve sociale (avis clients)', impact: '+0.8% CVR' },
        { priorite: 'HAUTE', action: 'Ajouter badge garantie 30j', impact: '+0.5% CVR' },
        { priorite: 'HAUTE', action: 'Bundle : 2+1 gratuit', impact: '+18 EUR AOV' },
        { priorite: 'MOYENNE', action: 'Timer urgence sur hero section', impact: '+12% CVR page' },
        { priorite: 'MOYENNE', action: 'Upsell post-achat (+1 produit)', impact: '+9 EUR AOV' },
      ]
    })
    setFunnelLoading(false)
  }

  const genererCreatifs = async () => {
    if (!creatifProduit.trim()) return
    setCreatifLoading(true)
    await new Promise(r => setTimeout(r, 2000))
    const types: Record<string, any[]> = {
      image: [
        { id: 1, titre: 'Hero - Avant/Apres', format: '1080x1080', score: 94 },
        { id: 2, titre: 'Produit en situation', format: '1080x1350', score: 88 },
        { id: 3, titre: 'Infographie benefices', format: '1080x1080', score: 82 },
      ],
      video: [
        { id: 1, titre: 'UGC Hook 3 sec', format: '9:16 Vertical', score: 91, duree: '15s' },
        { id: 2, titre: 'Testimonial client', format: '9:16 Vertical', score: 85, duree: '30s' },
        { id: 3, titre: 'Demo produit', format: '1:1 Carre', score: 79, duree: '20s' },
      ],
      copy: [
        { id: 1, titre: 'Hook Douleur', texte: 'Tu en as marre de... ? Voici la solution que tu attendais.', score: 92 },
        { id: 2, titre: 'Hook Curiosite', texte: 'Ce produit vendu dans 47 pays change la vie de milliers de personnes.', score: 87 },
        { id: 3, titre: 'Hook Urgence', texte: 'Stock limite : seulement 23 unites restantes au prix promo.', score: 84 },
      ],
      landing: [
        { id: 1, titre: 'Page VSL (Video)', conversion: 'Haute', elements: ['Hero video', 'Benefices x5', 'Avis clients', 'Garantie', 'CTA x3'] },
        { id: 2, titre: 'Page Longue', conversion: 'Moyenne', elements: ['Hero image', 'Story produit', 'FAQ', 'Bundle', 'Urgence'] },
      ],
    }
    setCreatifGenere(types[creatifType] || [])
    setCreatifLoading(false)
  }
  // ============================================================
  // PAGE ACCUEIL
  // ============================================================
  const renderAccueil = () => {
    const totalActions = actions.filter(a => a.status === 'pending').length
    const revenue = 2993
    return (
      <div>
        <div style={S.info}>
          <strong>👋 Bienvenue sur AEGIS !</strong> Voici un resume de ce qui se passe en ce moment. Les chiffres se mettent a jour automatiquement. Cliquez sur <strong>"Actualiser"</strong> pour voir les dernieres donnees.
        </div>
        <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={S.sectionTitle}>📊 Resume du jour</h2>
          <button style={S.btn()} onClick={loadData}>🔄 Actualiser</button>
        </div>
        <div style={S.grid(3)}>
          {[
            { label: 'Campagnes actives', val: pipelines.filter(p => p.status === 'active').length || 1, color: '#a5b4fc', hint: 'Publicites en cours' },
            { label: 'Decisions en attente', val: totalActions || 10, color: '#fbbf24', hint: 'Actions a valider' },
            { label: 'Actions completees', val: actions.filter(a => a.status === 'approved').length, color: '#4ade80', hint: 'Taches terminees' },
            { label: 'Agents disponibles', val: agents.length || 25, color: '#818cf8', hint: 'Robots IA configures' },
            { label: 'Retour sur pub (ROAS)', val: '2.4x', color: '#34d399', hint: 'Pour 1EUR depense -> 2.4EUR recuperes' },
            { label: 'Depenses aujourd'hui', val: '1 247 EUR', color: '#f87171', hint: 'Budget publicitaire utilise' },
            { label: 'Revenus aujourd'hui', val: revenue + ' EUR', color: '#4ade80', hint: 'Chiffre d'affaires genere' },
          ].map((c,i) => (
            <div key={i} style={S.card}>
              <div style={S.cardTitle}>{c.label}</div>
              <div style={{ ...S.cardValue, color: c.color, fontSize: '28px' }}>{c.val}</div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>{c.hint}</div>
            </div>
          ))}
        </div>
        <div style={{ ...S.grid(2), marginTop: '24px' }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>🖥️ Etat du systeme</div>
            {[
              { label: 'Base de donnees', sub: 'Stockage de vos donnees', status: 'En ligne', color: 'green' },
              { label: 'Moteur de risque', sub: 'Surveille vos depenses', status: 'Actif', color: 'green' },
              { label: 'Orchestrateur IA', sub: 'Coordonne les agents', status: 'En marche', color: 'green' },
              { label: 'Garde-budget', sub: 'Bloque les depassements', status: boutique.connecte ? 'Arme' : 'En veille', color: 'yellow' },
              { label: 'Bouton d'arret', sub: 'Arret d'urgence disponible', status: 'En veille', color: 'yellow' },
              { label: 'Boutique', sub: 'Connexion e-commerce', status: boutique.connecte ? 'Connectee' : 'Non connectee', color: boutique.connecte ? 'green' : 'red' },
            ].map((item,i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #0f0f1a' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{item.sub}</div>
                </div>
                <span style={S.badge(item.color)}>{item.status}</span>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>🎯 Objectif en cours</div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Phase {phase} - Progression</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#a5b4fc', margin: '8px 0' }}>Phase {phase} → {phase === 1 ? '1M' : phase === 2 ? '10M' : '100M'} EUR</div>
              <div style={S.progress(37)}>
                <div style={S.progressBar(37, '#4f46e5')} />
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>37% de l'objectif atteint</div>
            </div>
            {[
              { label: 'Perte max par jour', val: riskConfig.perteMax + ' EUR/jour', color: '#f87171' },
              { label: 'Depense max par jour', val: riskConfig.depenseMax + ' EUR/jour', color: '#fbbf24' },
              { label: 'ROAS minimum requis', val: riskConfig.roasMin + 'x', color: '#4ade80' },
              { label: 'Mode de validation', val: gouvernanceMode === 'humain' ? 'Manuel' : gouvernanceMode === 'semi_auto' ? 'Semi-automatique' : 'Full auto', color: '#a5b4fc' },
            ].map((r,i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f0f1a' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>{r.label}</span>
                <span style={{ color: r.color, fontWeight: 600, fontSize: '14px' }}>{r.val}</span>
              </div>
            ))}
            <div style={{ marginTop: '16px', padding: '10px', background: '#0c1a3e', borderRadius: '8px', fontSize: '12px', color: '#93c5fd' }}>
              💡 En mode semi-automatique, l'IA propose des actions et vous decidez.
            </div>
          </div>
        </div>
      </div>
    )
  }
  // ============================================================
  // PAGE BOUTIQUE (STORE CONNECTOR ENGINE)
  // ============================================================
  const renderBoutique = () => (
    <div>
      <div style={S.info}>
        🔗 <strong>Store Connector Engine.</strong> Connecte ta boutique Shopify / WooCommerce / Custom. AEGIS lira ton catalogue, tes commandes, et pourra modifier prix, descriptions et images directement.
      </div>
      {!boutique.connecte ? (
        <div style={S.card}>
          <div style={S.sectionTitle}>🔗 Connecter ta boutique</div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Plateforme</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {['shopify','woocommerce','custom'].map(p => (
                <button key={p} style={{ ...S.btn(boutique.plateforme === p ? 'primary' : 'outline'), textTransform: 'capitalize' }} onClick={() => setBoutique(b => ({...b, plateforme: p}))}>{p}</button>
              ))}
            </div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>URL de ta boutique</label>
            <input style={S.input} placeholder="https://ma-boutique.myshopify.com" value={boutiqueInput} onChange={e => setBoutiqueInput(e.target.value)} />
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>Tu recevras une cle API pour autoriser AEGIS a acceder a ta boutique.</div>
          </div>
          <button style={S.btn('success')} onClick={connecterBoutique} disabled={loading}>{loading ? 'Connexion en cours...' : '🔗 Connecter la boutique'}</button>
        </div>
      ) : (
        <div>
          <div style={{ ...S.card, marginBottom: '16px', borderColor: '#166534' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#4ade80' }}>✅ Boutique connectee</div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>{boutique.url}</div>
              </div>
              <button style={S.btn('danger')} onClick={() => setBoutique(b => ({...b, connecte: false}))}>Deconnecter</button>
            </div>
          </div>
          <div style={S.grid(4)}>
            {[
              { label: 'Produits catalogue', val: boutique.catalogue, color: '#a5b4fc' },
              { label: 'Commandes totales', val: boutique.commandes, color: '#4ade80' },
              { label: 'Taux de conversion', val: boutique.cvr + '%', color: '#fbbf24' },
              { label: 'Panier moyen (AOV)', val: boutique.aov + ' EUR', color: '#34d399' },
              { label: 'Marge moyenne', val: boutique.marge + '%', color: '#f472b6' },
            ].map((c,i) => (
              <div key={i} style={S.card}>
                <div style={S.cardTitle}>{c.label}</div>
                <div style={{ ...S.cardValue, color: c.color }}>{c.val}</div>
              </div>
            ))}
          </div>
          <div style={{ ...S.grid(2), marginTop: '16px' }}>
            <div style={S.card}>
              <div style={S.sectionTitle}>🔄 Sync bidirectionnelle</div>
              {[
                { action: 'Modifier description produit', status: 'Disponible' },
                { action: 'Modifier prix', status: 'Disponible' },
                { action: 'Ajouter bundle', status: 'Disponible' },
                { action: 'Ajouter upsell', status: 'Disponible' },
                { action: 'Remplacer images', status: 'Disponible' },
                { action: 'Ajouter variantes', status: 'Disponible' },
                { action: 'Creer nouveaux produits', status: 'Disponible' },
              ].map((a,i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f0f1a' }}>
                  <span style={{ fontSize: '14px' }}>{a.action}</span>
                  <span style={S.badge('green')}>{a.status}</span>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={S.sectionTitle}>📊 Analyse boutique</div>
              {[
                { label: 'CVR global', val: boutique.cvr + '%', color: '#fbbf24' },
                { label: 'AOV moyen', val: boutique.aov + ' EUR', color: '#4ade80' },
                { label: 'Marge', val: boutique.marge + '%', color: '#34d399' },
                { label: 'Funnel detecte', val: 'Homepage → Produit → Panier', color: '#a5b4fc' },
                { label: 'Best seller', val: 'Produit #3 (234 ventes)', color: '#fbbf24' },
                { label: 'Produits morts', val: '8 produits (0 vente)', color: '#f87171' },
                { label: 'Structure page', val: 'Hero + Avis + CTA x2', color: '#94a3b8' },
              ].map((r,i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f0f1a' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: 600, fontSize: '14px' }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ============================================================
  // PAGE INTELLIGENCE PRODUIT (PRODUCT INTELLIGENCE ENGINE)
  // ============================================================
  const renderIntelligence = () => (
    <div>
      <div style={S.info}>
        🧠 <strong>Product Intelligence Engine.</strong> Analyse un produit ou une URL d'annonce pour determiner si c'est un winner. Score base sur : longevite ads, saturation marche, angle marketing, concurrence, pricing.
      </div>
      <div style={S.card}>
        <div style={S.sectionTitle}>🔍 Analyser un produit</div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input style={{ ...S.input, flex: 1 }} placeholder="URL produit, pub Facebook, lien AliExpress, Amazon..." value={intelligenceProduit} onChange={e => setIntelligenceProduit(e.target.value)} />
          <button style={S.btn('primary')} onClick={analyserIntelligence} disabled={intelligenceLoading}>{intelligenceLoading ? 'Analyse...' : '🔍 Analyser'}</button>
        </div>
        {intelligenceResultat && (
          <div>
            <div style={{ ...S.grid(4), marginBottom: '20px' }}>
              {[
                { label: 'Score winner', val: intelligenceResultat.score + '/100', color: intelligenceResultat.score > 80 ? '#4ade80' : intelligenceResultat.score > 60 ? '#fbbf24' : '#f87171' },
                { label: 'Saturation', val: intelligenceResultat.saturation + '%', color: intelligenceResultat.saturation < 40 ? '#4ade80' : '#f87171' },
                { label: 'Longevite ads', val: intelligenceResultat.longevite, color: '#a5b4fc' },
                { label: 'Verdict', val: intelligenceResultat.verdict, color: '#4ade80' },
              ].map((c,i) => (
                <div key={i} style={{ ...S.card, border: i === 3 ? '1px solid #166534' : undefined }}>
                  <div style={S.cardTitle}>{c.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: c.color }}>{c.val}</div>
                </div>
              ))}
            </div>
            <div style={S.grid(2)}>
              <div style={S.card}>
                <div style={S.sectionTitle}>📊 Analyse detaillee</div>
                {[
                  { label: 'Angle marketing', val: intelligenceResultat.angle },
                  { label: 'Concurrence', val: intelligenceResultat.concurrence },
                  { label: 'Prix marche', val: intelligenceResultat.prixMarche },
                ].map((r,i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f0f1a' }}>
                    <span style={{ color: '#94a3b8' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={S.sectionTitle}>✅ Raisons du score</div>
                {intelligenceResultat.raisons.map((r: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', padding: '6px 0' }}>
                    <span style={{ color: '#4ade80' }}>✓</span>
                    <span style={{ fontSize: '14px' }}>{r}</span>
                  </div>
                ))}
                <button style={{ ...S.btn('success'), marginTop: '16px', width: '100%' }} onClick={() => { setNouvelleUrl(intelligenceProduit); setPage('campagnes'); }}>
                  🚀 Lancer une campagne sur ce produit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
  // ============================================================
  // PAGE CREATIFS (CREATIVE ENGINE) - Inspiré PeelKit
  // ============================================================
  const renderCreatifs = () => {
    const imageStyles = [
      { id: 'hero', label: 'Hero Image', emoji: '🦸', desc: 'Photo produit seul fond blanc/gradient, impact fort', prompt: '{"style":"hero_clean","bg":"white","lighting":"studio","shadow":"soft"}', score: 94 },
      { id: 'lifestyle', label: 'Lifestyle Image', emoji: '🌿', desc: 'Produit en situation réelle d'utilisation', prompt: '{"style":"lifestyle","setting":"natural","mood":"aspirational","model":true}', score: 91 },
      { id: 'infographic', label: 'Infographie', emoji: '📊', desc: 'Bénéfices clés listés visuellement sur le produit', prompt: '{"style":"infographic","callouts":5,"icons":true,"brand_colors":true}', score: 88 },
      { id: 'splitscreen', label: 'Split-Screen', emoji: '⬛', desc: 'Avant / Après ou comparaison côte-à-côte', prompt: '{"style":"split_screen","left":"before","right":"after","divider":"clean"}', score: 85 },
      { id: 'howto', label: 'How-to/Process', emoji: '📋', desc: 'Étapes d'utilisation du produit (3-4 étapes)', prompt: '{"style":"how_to","steps":3,"numbered":true,"clean_bg":true}', score: 83 },
      { id: 'multifeature', label: 'Multi-Feature Grid', emoji: '🔲', desc: 'Grille d'icônes et bénéfices autour du produit', prompt: '{"style":"feature_grid","features":6,"icons":"minimal","layout":"surrounding"}', score: 80 },
      { id: 'avantapres', label: 'Avant / Après', emoji: '✨', desc: 'Transformation visuelle du résultat produit', prompt: '{"style":"before_after","split":"vertical","labels":true,"dramatic":true}', score: 92 },
      { id: 'comparison', label: 'Comparaison', emoji: '⚖️', desc: 'Vous vs concurrents, tableau de comparaison', prompt: '{"style":"comparison_table","cols":3,"highlight_winner":true}', score: 79 },
      { id: 'ugc', label: 'UGC Style', emoji: '📱', desc: 'Photo style amateur authentique prise en main', prompt: '{"style":"ugc_authentic","lighting":"natural","angle":"handheld","no_studio":true}', score: 87 },
      { id: 'bundle', label: 'Bundle Shot', emoji: '📦', desc: 'Plusieurs produits ensemble, offre de valeur', prompt: '{"style":"bundle_flat_lay","products":"multiple","arrangement":"organized","price_tag":true}', score: 82 },
    ]

    const videoTemplates = [
      { id: 'hook3s', label: 'Hook 3 secondes', emoji: '⚡', format: '9:16', duree: '3s', desc: 'Accroche visuelle ultra-rapide, stop-thumb', script: 'HOOK: [Problème douloureux]
SOLUTION: [Produit apparaît]
CTA: "Découvrez maintenant"', score: 96 },
      { id: 'ugcreview', label: 'UGC Testimonial', emoji: '🎤', format: '9:16', duree: '30s', desc: 'Témoignage client authentique face caméra', script: 'INTRO: "J'avais ce problème..."
ACTION: Montrer le produit
RESULT: "Maintenant je..."
CTA: "Lien en bio"', score: 91 },
      { id: 'demo', label: 'Démo Produit', emoji: '🎬', format: '1:1', duree: '20s', desc: 'Démonstration fonctionnement étape par étape', script: 'BEFORE: Situation sans produit
DEMO: Utilisation produit
AFTER: Résultat impressionnant
OFFRE: Prix + urgence', score: 88 },
      { id: 'problem', label: 'Problème/Solution', emoji: '🧩', format: '9:16', duree: '15s', desc: 'Présenter le problème puis la solution produit', script: 'P1: "Tu galères avec X ?"
P2: "Nous avons créé Y"
P3: Fonctionnalités
P4: CTA + offre', score: 85 },
      { id: 'comparison_vid', label: 'Comparaison Marques', emoji: '🏆', format: '16:9', duree: '25s', desc: 'Notre produit vs les alternatives du marché', script: 'CONCURRENTS: Leurs limites
NOTRE PRODUIT: Nos avantages
PREUVE: Chiffres/résultats
CTA: Passer à l'action', score: 82 },
      { id: 'unboxing', label: 'Unboxing', emoji: '📦', format: '9:16', duree: '45s', desc: 'Déballage du produit, première impression', script: 'PACKAGING: Montrer la boîte
DEBALLAGE: Suspense
DECOUVERTE: Réaction WOW
UTILISATION: Premier test', score: 78 },
    ]

    const niches = [
      { cat: 'Beauté & Skincare', emoji: '💄', templates: 18, niches: ['Anti-aging', 'Serums', 'Masques', 'SPF', 'Acné'] },
      { cat: 'Santé & Nutrition', emoji: '💊', templates: 15, niches: ['Suppléments', 'Protéines', 'Probiotiques', 'Vitamines', 'CBD'] },
      { cat: 'Mode & Accessoires', emoji: '👗', templates: 12, niches: ['Bijoux', 'Sacs', 'Montres', 'Lunettes', 'Vêtements'] },
      { cat: 'Sport & Fitness', emoji: '🏋️', templates: 14, niches: ['Équipement', 'Vêtements sport', 'Nutrition', 'Récupération', 'Yoga'] },
      { cat: 'Maison & Décoration', emoji: '🏠', templates: 11, niches: ['Décoration', 'Cuisine', 'Rangement', 'Jardinage', 'Éclairage'] },
      { cat: 'Tech & Gadgets', emoji: '📱', templates: 13, niches: ['Accessoires phone', 'Smart home', 'Gaming', 'Audio', 'Wearables'] },
      { cat: 'Animaux', emoji: '🐾', templates: 8, niches: ['Chiens', 'Chats', 'Nutrition animale', 'Jouets', 'Toilettage'] },
      { cat: 'Bébé & Enfants', emoji: '👶', templates: 9, niches: ['Puériculture', 'Jouets', 'Vêtements bébé', 'Alimentation', 'Sécurité'] },
    ]

    const copyHooks = [
      { type: 'Douleur', hook: 'Tu en as marre de [PROBLÈME] ?', desc: 'Adresse directement la frustration', score: 92, color: '#f87171' },
      { type: 'Curiosité', hook: 'Ce produit utilisé par 47 000 personnes change tout.', desc: 'Preuve sociale + mystère', score: 89, color: '#fbbf24' },
      { type: 'Résultat', hook: 'De [SITUATION ACTUELLE] à [RÉSULTAT] en 30 jours.', desc: 'Transformation chiffrée', score: 87, color: '#4ade80' },
      { type: 'Urgence', hook: 'Stock limité : 23 unités restantes au prix promo.', desc: 'FOMO + scarcité', score: 84, color: '#f97316' },
      { type: 'Autorité', hook: 'Le secret des marques $100M+ sur Shopify.', desc: 'Crédibilité + aspiration', score: 86, color: '#a78bfa' },
      { type: 'Contraste', hook: 'Avant j'avais X. Maintenant j'ai Y.', desc: 'Avant/après émotionnel', score: 83, color: '#60a5fa' },
    ]

    return (
      <div>
        <div style={S.info}>
          🎨 <strong>Creative Engine — Style PeelKit.</strong> Génère automatiquement images produit, vidéos UGC, hooks et landing pages.
          10+ styles d'images testés sur les marques $100M+. Workflows JSON plug-and-play. 15 minutes pour un set complet.
        </div>

        {/* ONGLETS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #1e1e3a', paddingBottom: '12px' }}>
          {[
            { id: 'image', label: '🖼️ Images Produit', desc: '10 styles' },
            { id: 'video', label: '🎬 Vidéos UGC', desc: '6 templates' },
            { id: 'copy', label: '✍️ Copy & Hooks', desc: '6 types' },
            { id: 'landing', label: '🔁 Landing Pages', desc: 'Structures' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setCreatifType(tab.id)} style={{
              padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: creatifType === tab.id ? '#4f46e5' : '#0a0a1a',
              color: creatifType === tab.id ? '#fff' : '#94a3b8',
              fontWeight: creatifType === tab.id ? 700 : 400, fontSize: '14px',
              border: creatifType === tab.id ? 'none' : '1px solid #1e1e3a',
            }}>
              {tab.label} <span style={{ fontSize: '11px', opacity: 0.7 }}>{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* === ONGLET IMAGES PRODUIT === */}
        {creatifType === 'image' && (
          <div>
            {/* Génération */}
            <div style={S.card}>
              <div style={S.sectionTitle}>⚡ Générer un set d'images (15 min)</div>
              <div style={{ ...S.grid(2), marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Produit ou URL</label>
                  <input style={S.input} placeholder="Ex: Sérum anti-âge, crème hydratante..." value={creatifProduit} onChange={e => setCreatifProduit(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Niche / Catégorie</label>
                  <select style={S.input}>
                    {niches.map(n => <option key={n.cat}>{n.emoji} {n.cat}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: '#64748b', alignSelf: 'center' }}>Marché cible :</span>
                {['🇫🇷 FR', '🇺🇸 EN', '🇪🇸 ES', '🇩🇪 DE', '🇮🇹 IT'].map(m => <span key={m} style={S.tag}>{m}</span>)}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={S.btn('primary')} onClick={genererCreatifs} disabled={creatifLoading}>
                  {creatifLoading ? '⏳ Génération...' : '✨ Générer le set complet'}
                </button>
                <button style={S.btn('outline')} onClick={() => { setCreatifProduit(''); setCreatifGenere([]); }}>
                  🗑️ Reset
                </button>
              </div>
            </div>

            {/* 10 Styles d'images */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={S.sectionTitle}>🖼️ 10 Styles d'Images Testés — $100M+ Brands</div>
                <span style={S.badge('blue')}>92% de cohérence</span>
              </div>
              <div style={S.grid(2)}>
                {imageStyles.map((style) => (
                  <div key={style.id} style={{ ...S.card, border: creatifGenere.find((g:any) => g.styleId === style.id) ? '2px solid #4f46e5' : '1px solid #1e1e3a' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: '28px', flexShrink: 0 }}>{style.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>{style.label}</div>
                          <span style={S.badge('green')}>CTR +{Math.round((style.score - 70) * 0.4)}%</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{style.desc}</div>
                        {/* JSON Prompt visible */}
                        <div style={{ background: '#0f0f1a', borderRadius: '6px', padding: '8px 10px', fontFamily: 'monospace', fontSize: '11px', color: '#a5b4fc', marginBottom: '8px', wordBreak: 'break-all' }}>
                          {style.prompt}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={{ ...S.btn('primary'), padding: '6px 14px', fontSize: '12px', flex: 1 }}
                            onClick={() => setCreatifGenere((prev: any[]) => [...prev, { styleId: style.id, label: style.label, prompt: style.prompt, generated: true }])}>
                            ✨ Générer
                          </button>
                          <button style={{ ...S.btn('outline'), padding: '6px 14px', fontSize: '12px' }}
                            onClick={() => navigator.clipboard?.writeText(style.prompt)}>
                            📋 Copier JSON
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Résultats générés */}
            {creatifGenere.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={S.sectionTitle}>✅ {creatifGenere.length} images générées pour "{creatifProduit || 'votre produit'}"</div>
                <div style={S.grid(3)}>
                  {creatifGenere.map((c: any, i: number) => (
                    <div key={i} style={{ ...S.card, border: '1px solid #1e3a8a' }}>
                      <div style={{ height: '120px', background: 'linear-gradient(135deg,#1e1b4b,#0c1a3e)', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🖼️</div>
                      <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{c.label}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', fontFamily: 'monospace', background: '#0f0f1a', padding: '4px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>{c.prompt?.substring(0,60)}...</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={{ ...S.btn('primary'), flex: 1, fontSize: '12px', padding: '6px' }}>Utiliser</button>
                        <button style={{ ...S.btn('outline'), flex: 1, fontSize: '12px', padding: '6px' }}>A/B Test</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* A/B Tests */}
            <div style={{ ...S.card, marginTop: '20px' }}>
              <div style={S.sectionTitle}>📋 A/B Tests Images en cours</div>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Style</th><th style={S.th}>Variante A</th><th style={S.th}>Variante B</th><th style={S.th}>Gagnant</th><th style={S.th}>Impact CTR</th></tr></thead>
                <tbody>
                  {[
                    { style: 'Hero vs Lifestyle', a: 'CTR 3.2%', b: 'CTR 4.1%', winner: 'Lifestyle', impact: '+28%' },
                    { style: 'Infographie vs Split', a: 'CTR 2.8%', b: 'CTR 3.9%', winner: 'Split-Screen', impact: '+39%' },
                    { style: 'UGC vs Studio', a: 'CTR 4.4%', b: 'CTR 3.1%', winner: 'UGC', impact: '+42%' },
                  ].map((t, i) => (
                    <tr key={i}>
                      <td style={S.td}>{t.style}</td>
                      <td style={S.td}>{t.a}</td>
                      <td style={S.td}>{t.b}</td>
                      <td style={{ ...S.td, color: '#4ade80', fontWeight: 700 }}>{t.winner}</td>
                      <td style={{ ...S.td, color: '#4ade80', fontWeight: 700 }}>{t.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === ONGLET VIDEOS === */}
        {creatifType === 'video' && (
          <div>
            <div style={S.card}>
              <div style={S.sectionTitle}>🎬 Générer des Vidéos UGC</div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input style={{ ...S.input, flex: 1 }} placeholder="Nom ou URL du produit..." value={creatifProduit} onChange={e => setCreatifProduit(e.target.value)} />
                <button style={S.btn('primary')} onClick={genererCreatifs} disabled={creatifLoading}>
                  {creatifLoading ? 'Génération...' : '🎬 Générer'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={S.sectionTitle}>🎬 6 Templates Vidéo Haute Performance</div>
              <div style={S.grid(2)}>
                {videoTemplates.map((tmpl) => (
                  <div key={tmpl.id} style={S.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '24px' }}>{tmpl.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>{tmpl.label}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{tmpl.format} · {tmpl.duree}</div>
                        </div>
                      </div>
                      <span style={S.badge(tmpl.score >= 90 ? 'green' : 'blue')}>Score {tmpl.score}/100</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>{tmpl.desc}</div>
                    {/* Script visible */}
                    <div style={{ background: '#0f0f1a', borderRadius: '8px', padding: '10px 12px', fontFamily: 'monospace', fontSize: '11px', color: '#fbbf24', marginBottom: '12px', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                      {tmpl.script}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button style={{ ...S.btn('primary'), flex: 1, fontSize: '12px', padding: '8px' }}>
                        🎬 Générer ce template
                      </button>
                      <button style={{ ...S.btn('outline'), fontSize: '12px', padding: '8px' }}
                        onClick={() => navigator.clipboard?.writeText(tmpl.script)}>
                        📋
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats vidéo */}
            <div style={{ ...S.grid(4), marginTop: '20px' }}>
              {[
                { label: 'Hook rate moyen', val: '34%', color: '#4ade80', sub: 'Taux de visionnage 3s' },
                { label: 'CTR vidéo moyen', val: '4.7%', color: '#a5b4fc', sub: 'Sur Meta Reels' },
                { label: 'CVR post-clic', val: '2.9%', color: '#fbbf24', sub: 'Traffic vidéo' },
                { label: 'ROAS moyen vidéo', val: '3.8x', color: '#4ade80', sub: 'Vs image 2.4x' },
              ].map((s, i) => (
                <div key={i} style={S.card}>
                  <div style={S.cardTitle}>{s.label}</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === ONGLET COPY === */}
        {creatifType === 'copy' && (
          <div>
            <div style={S.card}>
              <div style={S.sectionTitle}>✍️ Générer des Hooks & Copy</div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input style={{ ...S.input, flex: 1 }} placeholder="Nom ou URL du produit..." value={creatifProduit} onChange={e => setCreatifProduit(e.target.value)} />
                <button style={S.btn('primary')} onClick={genererCreatifs} disabled={creatifLoading}>
                  {creatifLoading ? 'Génération...' : '✍️ Générer'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={S.sectionTitle}>🎯 6 Types de Hooks Haute Conversion</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {copyHooks.map((hook) => (
                  <div key={hook.type} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ ...S.badge('blue'), background: hook.color + '22', color: hook.color }}>{hook.type}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{hook.desc}</span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 600, fontStyle: 'italic', color: '#e2e8f0', padding: '8px 12px', background: '#0f0f1a', borderRadius: '6px' }}>
                        "{hook.hook}"
                      </div>
                    </div>
                    <div style={{ marginLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                      <span style={S.badge('green')}>Score {hook.score}/100</span>
                      <button style={{ ...S.btn('primary'), padding: '6px 14px', fontSize: '12px' }}>
                        Adapter
                      </button>
                      <button style={{ ...S.btn('outline'), padding: '4px 12px', fontSize: '11px' }}
                        onClick={() => navigator.clipboard?.writeText(hook.hook)}>
                        📋 Copier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === ONGLET LANDING === */}
        {creatifType === 'landing' && (
          <div>
            <div style={S.card}>
              <div style={S.sectionTitle}>🔁 Structures de Landing Pages</div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input style={{ ...S.input, flex: 1 }} placeholder="Nom ou URL du produit..." value={creatifProduit} onChange={e => setCreatifProduit(e.target.value)} />
                <button style={S.btn('primary')} onClick={genererCreatifs} disabled={creatifLoading}>
                  {creatifLoading ? 'Génération...' : '🔁 Générer'}
                </button>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', background: '#0c1a3e', padding: '12px', borderRadius: '8px' }}>
                💡 <strong>Séquence PeelKit :</strong> Hero → Preuve sociale → Bénéfices × 5 → FAQ → Urgence → CTA x3.
                Testée sur 100+ marques Shopify $100M+. CVR moyen : +22 à +43%.
              </div>
            </div>

            <div style={{ ...S.grid(2), marginTop: '20px' }}>
              {[
                { titre: 'Page VSL (Vidéo)', conversion: 'Haute (+43%)', emoji: '🎬',
                  sequence: ['Hero video 3s hook', 'Sous-titre accrocheur', 'Bénéfices ×5 avec icônes', 'Avis clients (social proof)', 'Garantie 30j', 'Bundle/Offre', 'Urgence + stock', 'CTA ×3'],
                  desc: 'Idéale pour produits nécessitant explication. ROAS moyen 4.1x.' },
                { titre: 'Page Image Longue', conversion: 'Moyenne (+22%)', emoji: '🖼️',
                  sequence: ['Hero image produit + titre', 'Problème/douleur', 'Notre solution', 'Features ×6', 'Avant/Après', 'Testimonials', 'FAQ', 'Bundle + urgence'],
                  desc: 'Simple à déployer. Fonctionne sur tous les niches. ROAS moyen 3.2x.' },
                { titre: 'Page Comparaison', conversion: 'Haute (+38%)', emoji: '⚖️',
                  sequence: ['Hero: Vous vs Eux', 'Tableau comparatif', 'Nos avantages ×4', 'Preuve (chiffres)', 'Avis clients', 'Garantie', 'CTA principal'],
                  desc: 'Parfaite si marché compétitif. Taux de conviction élevé.' },
                { titre: 'Page Bundle/Offre', conversion: 'Très Haute (+51%)', emoji: '📦',
                  sequence: ['Hero bundle visuel', 'Valeur totale barré', 'Prix promo + timer', 'Ce que vous recevez', 'Bénéfices ×3', 'Urgence stock', 'Garantie', 'CTA'],
                  desc: 'AOV multiplié par 2-3x. Idéale Phase 2 du funnel.' },
              ].map((lp, i) => (
                <div key={i} style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '24px' }}>{lp.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{lp.titre}</div>
                        <div style={{ fontSize: '12px', color: '#4ade80', fontWeight: 600 }}>{lp.conversion}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>{lp.desc}</div>
                  <div style={{ marginBottom: '12px' }}>
                    {lp.sequence.map((step, j) => (
                      <div key={j} style={{ display: 'flex', gap: '8px', padding: '4px 0', borderBottom: '1px solid #0f0f1a', fontSize: '12px' }}>
                        <span style={{ color: '#4f46e5', fontWeight: 700, minWidth: '18px' }}>{j+1}.</span>
                        <span style={{ color: '#94a3b8' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                  <button style={{ ...S.btn('primary'), width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
                    disabled={!boutique.connecte}>
                    {boutique.connecte ? '🚀 Déployer cette structure' : '🔗 Boutique requise'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section Niches */}
        <div style={{ ...S.card, marginTop: '24px' }}>
          <div style={S.sectionTitle}>🎯 30+ Niches Shopify — Templates Pré-testés</div>
          <div style={S.grid(4)}>
            {niches.map((n) => (
              <div key={n.cat} style={{ background: '#0f0f1a', borderRadius: '10px', padding: '14px', cursor: 'pointer',
                border: '1px solid #1e1e3a', transition: 'all 0.15s' }}>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{n.emoji}</div>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{n.cat}</div>
                <div style={{ fontSize: '11px', color: '#4ade80', marginBottom: '6px' }}>{n.templates} templates</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {n.niches.slice(0,3).map(nn => <span key={nn} style={{ ...S.tag, fontSize: '10px' }}>{nn}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }


    // ============================================================
  // PAGE FUNNEL ENGINE
  // ============================================================
  const renderFunnel = () => (
    <div>
      <div style={S.info}>
        🔁 <strong>Funnel Engine.</strong> Analyse ta page produit et recommande des optimisations pour maximiser le taux de conversion (CVR) et le panier moyen (AOV). AEGIS peut appliquer les changements directement si la boutique est connectee.
      </div>
      <div style={S.card}>
        <div style={S.sectionTitle}>🔍 Analyser une page produit</div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input style={{ ...S.input, flex: 1 }} placeholder="URL de ta page produit..." value={funnelUrl} onChange={e => setFunnelUrl(e.target.value)} />
          <button style={S.btn('primary')} onClick={analyserFunnel} disabled={funnelLoading}>{funnelLoading ? 'Analyse...' : '🔍 Analyser le funnel'}</button>
        </div>
        {funnelAnalyse && (
          <div>
            <div style={S.grid(4)}>
              {[
                { label: 'CVR actuel', val: funnelAnalyse.cvr + '%', color: '#fbbf24', sub: 'Objectif: >3%' },
                { label: 'AOV actuel', val: funnelAnalyse.aov + ' EUR', color: '#4ade80', sub: 'Objectif: >75 EUR' },
                { label: 'Score hero section', val: funnelAnalyse.heroScore + '/100', color: '#a5b4fc', sub: 'Image et titre' },
                { label: 'Score preuve sociale', val: funnelAnalyse.preuveScore + '/100', color: '#f87171', sub: 'Avis et temoignages' },
              ].map((c,i) => (
                <div key={i} style={S.card}>
                  <div style={S.cardTitle}>{c.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: c.color }}>{c.val}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{c.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px' }}>
              <div style={S.sectionTitle}>📋 Recommandations AEGIS</div>
              {funnelAnalyse.recommandations.map((r: any, i: number) => (
                <div key={i} style={{ ...S.card, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ ...S.badge(r.priorite === 'CRITIQUE' ? 'red' : r.priorite === 'HAUTE' ? 'yellow' : 'blue'), marginRight: '10px' }}>{r.priorite}</span>
                    <span style={{ fontWeight: 600 }}>{r.action}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: 600 }}>{r.impact}</span>
                    <button style={{ ...S.btn('success'), padding: '6px 12px', fontSize: '12px' }} disabled={!boutique.connecte}>
                      {boutique.connecte ? 'Appliquer' : 'Boutique requise'}
                    </button>
                  </div>
                </div>
              ))}
              {!boutique.connecte && (
                <div style={{ padding: '12px', background: '#450a0a', borderRadius: '8px', fontSize: '13px', color: '#fca5a5' }}>
                  ⚠️ Connecte ta boutique pour que AEGIS applique les changements automatiquement. <button style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }} onClick={() => setPage('boutique')}>→ Connecter ma boutique</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
  // ============================================================
  // PAGE MEDIA BUYING ENGINE
  // ============================================================
  const renderMedia = () => (
    <div>
      <div style={S.info}>
        📡 <strong>Media Buying Engine.</strong> Gere tes campagnes publicitaires sur Meta, Google et TikTok. Scaling automatique des pubs gagnantes, kill auto des perdantes, CBO/ABO logic.
      </div>
      <div style={S.grid(4)}>
        {[
          { plateforme: 'Meta Ads', budget: '450 EUR/j', roas: '3.2x', status: 'Actif', color: 'blue' },
          { plateforme: 'Google Ads', budget: '280 EUR/j', roas: '4.1x', status: 'Actif', color: 'green' },
          { plateforme: 'TikTok Ads', budget: '120 EUR/j', roas: '2.8x', status: 'Pause', color: 'yellow' },
          { plateforme: 'Budget total', budget: '850 EUR/j', roas: '3.4x', status: 'Actif', color: 'green' },
        ].map((p,i) => (
          <div key={i} style={S.card}>
            <div style={S.cardTitle}>{p.plateforme}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0' }}>{p.budget}</div>
            <div style={{ color: '#4ade80', fontWeight: 600, marginTop: '4px' }}>ROAS: {p.roas}</div>
            <div style={{ marginTop: '8px' }}><span style={S.badge(p.color)}>{p.status}</span></div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '20px' }}>
        <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={S.sectionTitle}>📋 Ads actives</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Logique :</span>
            <span style={S.badge('blue')}>CBO activee</span>
            <span style={S.badge('green')}>Auto-scaling ON</span>
          </div>
        </div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Nom ad</th><th style={S.th}>Plateforme</th><th style={S.th}>Budget</th><th style={S.th}>ROAS</th><th style={S.th}>CTR</th><th style={S.th}>Statut</th><th style={S.th}>Action AEGIS</th></tr></thead>
          <tbody>
            {[
              { nom: 'Hook UGC v2', plat: 'Meta', budget: '45 EUR/j', roas: '4.2x', ctr: '4.1%', status: 'Actif', action: 'Scale +30%', color: 'green' },
              { nom: 'Hero image v1', plat: 'Meta', budget: '30 EUR/j', roas: '1.2x', ctr: '1.8%', status: 'Actif', action: 'KILL prevu', color: 'red' },
              { nom: 'Shopping Branded', plat: 'Google', budget: '120 EUR/j', roas: '6.1x', ctr: '5.2%', status: 'Actif', action: 'Scale +50%', color: 'green' },
              { nom: 'PMax Catalogue', plat: 'Google', budget: '80 EUR/j', roas: '3.4x', ctr: '2.9%', status: 'Actif', action: 'Stable', color: 'blue' },
              { nom: 'Viral TT v1', plat: 'TikTok', budget: '60 EUR/j', roas: '2.1x', ctr: '3.8%', status: 'Pause', action: 'Resume si ROAS > 2x', color: 'yellow' },
            ].map((a,i) => (
              <tr key={i}>
                <td style={S.td}>{a.nom}</td>
                <td style={S.td}>{a.plat}</td>
                <td style={S.td}>{a.budget}</td>
                <td style={{ ...S.td, color: parseFloat(a.roas) > 2 ? '#4ade80' : '#f87171', fontWeight: 700 }}>{a.roas}</td>
                <td style={S.td}>{a.ctr}</td>
                <td style={S.td}><span style={S.badge(a.status === 'Actif' ? 'green' : 'yellow')}>{a.status}</span></td>
                <td style={{ ...S.td, color: a.color === 'green' ? '#4ade80' : a.color === 'red' ? '#f87171' : '#fbbf24', fontWeight: 600 }}>{a.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ ...S.grid(2), marginTop: '20px' }}>
        <div style={S.card}>
          <div style={S.sectionTitle}>⚡ Logique de scaling</div>
          {[
            { label: 'Scaling horizontal', desc: 'Dupliquer ad gagnante sur nouveaux audiences', actif: true },
            { label: 'Scaling vertical', desc: 'Augmenter budget +20-30% si ROAS tient', actif: true },
            { label: 'Kill auto perdantes', desc: 'ROAS < 1.1x pendant 48h = kill', actif: true },
            { label: 'Rotation creatives', desc: 'Swap auto si CTR baisse > 15%', actif: true },
            { label: 'CBO logic', desc: 'Budget campagne auto-distribue', actif: true },
            { label: 'ABO override', desc: 'Force budget ad level si necessaire', actif: false },
          ].map((r,i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #0f0f1a' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.label}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{r.desc}</div>
              </div>
              <span style={S.badge(r.actif ? 'green' : 'yellow')}>{r.actif ? 'Actif' : 'Inactif'}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>📈 Performance 7 jours</div>
          {[
            { jour: 'Lun', depense: 780, revenus: 2340, roas: 3.0 },
            { jour: 'Mar', depense: 820, revenus: 2870, roas: 3.5 },
            { jour: 'Mer', depense: 850, revenus: 3060, roas: 3.6 },
            { jour: 'Jeu', depense: 900, revenus: 2700, roas: 3.0 },
            { jour: 'Ven', depense: 950, revenus: 3800, roas: 4.0 },
            { jour: 'Sam', depense: 1100, revenus: 4180, roas: 3.8 },
            { jour: 'Dim', depense: 850, revenus: 2993, roas: 3.5 },
          ].map((j,i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #0f0f1a' }}>
              <span style={{ color: '#64748b', width: '30px' }}>{j.jour}</span>
              <span style={{ color: '#f87171' }}>{j.depense} EUR</span>
              <span style={{ color: '#4ade80' }}>{j.revenus} EUR</span>
              <span style={{ color: j.roas >= 3 ? '#4ade80' : '#fbbf24', fontWeight: 700 }}>{j.roas}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ============================================================
  // PAGE MARCHE (MARKET ADAPTATION ENGINE)
  // ============================================================
  const renderMarche = () => (
    <div>
      <div style={S.info}>
        📡 <strong>Market Adaptation Engine.</strong> AEGIS surveille en permanence les signaux du marche. Quand une anomalie est detectee (fatigue creative, hausse CPM, baisse CVR...), il propose une action corrective.
      </div>
      <div style={S.grid(4)}>
        {[
          { label: 'Signaux detectes', val: marcheSignaux.length, color: '#fbbf24' },
          { label: 'Alertes critiques', val: marcheSignaux.filter(s => s.status === 'danger').length, color: '#f87171' },
          { label: 'Marches surveilles', val: 5, color: '#a5b4fc' },
          { label: 'CPM moyen', val: '14.50 EUR', color: '#94a3b8' },
        ].map((c,i) => (
          <div key={i} style={S.card}>
            <div style={S.cardTitle}>{c.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: c.color }}>{c.val}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '20px' }}>
        <div style={S.sectionTitle}>🚨 Signaux actifs</div>
        {marcheSignaux.map((s,i) => (
          <div key={i} style={{ ...S.card, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>{s.status === 'danger' ? '🔴' : s.status === 'warning' ? '🟡' : '🟢'}</span>
              <div>
                <div style={{ fontWeight: 700 }}>{s.signal}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{s.produit}</div>
              </div>
            </div>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ fontWeight: 700, fontSize: '18px', color: s.status === 'danger' ? '#f87171' : s.status === 'warning' ? '#fbbf24' : '#4ade80' }}>{s.valeur}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Valeur</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: '13px', color: '#93c5fd', marginBottom: '8px' }}>Action recommandee :</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{s.action}</div>
              <button style={{ ...S.btn('primary'), marginTop: '8px', padding: '6px 14px', fontSize: '12px' }}>Appliquer</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...S.grid(2), marginTop: '20px' }}>
        <div style={S.card}>
          <div style={S.sectionTitle}>📊 Metriques surveillees</div>
          {[
            { metric: 'CPM moyen', val: '14.50 EUR', trend: '+3%', status: 'warning' },
            { metric: 'CTR moyen', val: '3.1%', trend: '-5%', status: 'warning' },
            { metric: 'CVR moyen', val: '2.8%', trend: '+0.2%', status: 'good' },
            { metric: 'ROAS moyen', val: '3.4x', trend: '-0.1x', status: 'good' },
            { metric: 'Frequence expo', val: '4.2x', trend: '+0.8x', status: 'danger' },
            { metric: 'Saturation audience', val: '34%', trend: '+12%', status: 'warning' },
          ].map((m,i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f0f1a' }}>
              <span style={{ color: '#94a3b8' }}>{m.metric}</span>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>{m.val}</span>
                <span style={{ color: m.status === 'good' ? '#4ade80' : m.status === 'danger' ? '#f87171' : '#fbbf24', fontSize: '12px' }}>{m.trend}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>🔄 Rotations automatiques</div>
          {[
            { action: 'Rotation niche E -> F', raison: 'Saturation > 80%', status: 'Planifie', date: 'Demain' },
            { action: 'Swap creative produit B', raison: 'CTR baisse 15%', status: 'En cours', date: "Aujourd'hui" },
            { action: 'Repositionnement angle', raison: 'CVR baisse 3 jours', status: 'Propose', date: 'Attente validation' },
          ].map((r,i) => (
            <div key={i} style={{ padding: '12px', background: '#0f0f1a', borderRadius: '8px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{r.action}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Raison: {r.raison}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={S.badge(r.status === 'En cours' ? 'blue' : r.status === 'Planifie' ? 'yellow' : 'green')}>{r.status}</span>
                <span style={{ fontSize: '12px', color: '#475569' }}>{r.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
  // ============================================================
  // PAGE SANTE (HEALTH ENGINE)
  // ============================================================
  const renderSante = () => (
    <div>
      <div style={S.info}>
        🏥 <strong>Health & Self-Repair Engine.</strong> Surveille la sante de tous les composants AEGIS. Si une API tombe ou un job echoue, le systeme se repare automatiquement.
      </div>
      <div style={S.grid(3)}>
        {[
          { label: 'API Meta', val: santeStatus.api_meta === 'ok' ? 'Operationnelle' : 'Attention', color: santeStatus.api_meta === 'ok' ? 'green' : 'yellow' },
          { label: 'API Google', val: santeStatus.api_google === 'ok' ? 'Operationnelle' : 'Attention', color: santeStatus.api_google === 'ok' ? 'green' : 'yellow' },
          { label: 'API TikTok', val: santeStatus.api_tiktok === 'ok' ? 'Operationnelle' : 'Latence detectee', color: santeStatus.api_tiktok === 'ok' ? 'green' : 'yellow' },
          { label: 'Pixel tracking', val: 'Verifie', color: 'green' },
          { label: 'Base de donnees', val: 'OK', color: 'green' },
          { label: 'Jobs en retry', val: (santeStatus.jobs_retry || 0) + ' jobs', color: (santeStatus.jobs_retry || 0) > 0 ? 'yellow' : 'green' },
        ].map((c,i) => (
          <div key={i} style={S.card}>
            <div style={S.cardTitle}>{c.label}</div>
            <span style={S.badge(c.color)}>{c.val}</span>
          </div>
        ))}
      </div>
      <div style={{ ...S.grid(2), marginTop: '20px' }}>
        <div style={S.card}>
          <div style={S.sectionTitle}>🔧 Historique reparations auto</div>
          {[
            { action: 'Retry job Meta webhook', resultat: 'Succes', time: 'Il y a 2h', tentatives: 2 },
            { action: 'Recalibrage score winner', resultat: 'Succes', time: 'Il y a 5h', tentatives: 1 },
            { action: 'Reconnnexion API TikTok', resultat: 'En cours', time: 'Il y a 12min', tentatives: 3 },
            { action: 'Nettoyage base donnees', resultat: 'Succes', time: 'Il y a 24h', tentatives: 1 },
            { action: 'Backup automatique', resultat: 'Succes', time: 'Il y a 30min', tentatives: 1 },
          ].map((r,i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #0f0f1a' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.action}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{r.time} · {r.tentatives} tentative(s)</div>
              </div>
              <span style={S.badge(r.resultat === 'Succes' ? 'green' : r.resultat === 'En cours' ? 'blue' : 'red')}>{r.resultat}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>📊 Monitoring en temps reel</div>
          {[
            { label: 'Uptime global', val: '99.7%', color: '#4ade80' },
            { label: 'Latence API moyenne', val: '127ms', color: '#4ade80' },
            { label: 'Jobs executes / 24h', val: '1 847', color: '#a5b4fc' },
            { label: 'Jobs echoues', val: '3 (0.16%)', color: '#fbbf24' },
            { label: 'Inconsistances detectees', val: santeStatus.incoh_donnees || 0, color: '#4ade80' },
            { label: 'Backup', val: 'Dernier: il y a 30min', color: '#4ade80' },
            { label: 'Calibrage score winner', val: 'A jour', color: '#4ade80' },
          ].map((r,i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f0f1a' }}>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>{r.label}</span>
              <span style={{ color: r.color, fontWeight: 600, fontSize: '14px' }}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ============================================================
  // PAGE GOUVERNANCE ENGINE
  // ============================================================
  const renderGouvernance = () => (
    <div>
      <div style={S.info}>
        ⚖️ <strong>Governance Engine.</strong> Definis comment AEGIS agit. Mode humain = tu valides tout. Semi-auto = l'IA propose, tu decides. Full auto = AEGIS agit seul dans les limites.
      </div>
      <div style={S.card}>
        <div style={S.sectionTitle}>🎛️ Mode de gouvernance</div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          {([['humain', '👤 Humain', 'Tu valides chaque action manuellement'], ['semi_auto', '🤝 Semi-auto', 'IA propose, tu decides'], ['full_auto', '🤖 Full auto', 'IA agit seul dans les limites']] as const).map(([mode, label, desc]) => (
            <button key={mode} style={{ flex: 1, padding: '16px', background: gouvernanceMode === mode ? '#1e1b4b' : '#0a0a1a', border: gouvernanceMode === mode ? '2px solid #4f46e5' : '1px solid #1e1e3a', borderRadius: '12px', color: gouvernanceMode === mode ? '#a5b4fc' : '#94a3b8', cursor: 'pointer', textAlign: 'center' as const }} onClick={() => setGouvernanceMode(mode)}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '12px' }}>{desc}</div>
            </button>
          ))}
        </div>
        <div style={{ padding: '16px', background: '#0c1a3e', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, color: '#93c5fd', marginBottom: '6px' }}>Mode actuel : {gouvernanceMode === 'humain' ? 'Humain' : gouvernanceMode === 'semi_auto' ? 'Semi-automatique' : 'Full automatique'}</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            {gouvernanceMode === 'humain' && "Chaque action de l'IA requiert ta validation manuelle. Maximum de controle."}
            {gouvernanceMode === 'semi_auto' && "L'IA propose des actions. Tu valides ou refuses dans les 24h. Actions urgentes auto-executees."}
            {gouvernanceMode === 'full_auto' && "L'IA agit de facon autonome dans les limites de risque definies. Audit trail complet disponible."}
          </div>
        </div>
      </div>
      <div style={{ ...S.grid(2), marginTop: '16px' }}>
        <div style={S.card}>
          <div style={S.sectionTitle}>📋 Seuils de validation</div>
          {[
            { label: 'Validation obligatoire si > X EUR', val: '200 EUR', editable: true },
            { label: 'Kill campagne auto si ROAS < X', val: '1.1x', editable: true },
            { label: 'Scale auto max +X% par jour', val: '30%', editable: true },
            { label: 'Budget max par decision auto', val: '100 EUR', editable: true },
            { label: 'Blocage si anomalie detectee', val: 'Oui', editable: false },
          ].map((r,i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #0f0f1a' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>{r.label}</span>
              <span style={{ fontWeight: 700, color: '#a5b4fc' }}>{r.val}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>📜 Audit trail - Dernieres decisions</div>
          {[
            { action: 'Kill ad "Hero v1"', qui: 'AEGIS Auto', resultat: 'Execute', temps: 'Il y a 2h' },
            { action: 'Scale "Hook UGC" +30%', qui: 'Cedric (Manuel)', resultat: 'Valide', temps: 'Il y a 4h' },
            { action: 'Creer campagne produit X', qui: 'AEGIS Auto', resultat: 'Execute', temps: 'Il y a 6h' },
            { action: 'Pause TikTok budget', qui: 'Cedric (Manuel)', resultat: 'Refuse', temps: 'Il y a 8h' },
            { action: 'Recalibrage score winner', qui: 'AEGIS Auto', resultat: 'Execute', temps: 'Il y a 12h' },
          ].map((r,i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #0f0f1a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{r.action}</span>
                <span style={S.badge(r.resultat === 'Execute' || r.resultat === 'Valide' ? 'green' : 'red')}>{r.resultat}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>{r.qui} · {r.temps}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
  // ============================================================
  // PAGE RISQUE (RISK ENGINE)
  // ============================================================
  const renderRisque = () => (
    <div>
      <div style={S.info}>
        🛡️ <strong>Risk Engine - Logique Hedge Fund.</strong> AEGIS protege ton capital avec des garde-fous a plusieurs niveaux. Stop-loss global, par campagne, par produit. Emergency freeze si anomalie critique.
      </div>
      <div style={S.grid(3)}>
        {[
          { label: 'Perte max / jour', val: riskConfig.perteMax + ' EUR', color: '#f87171', cle: 'perteMax' },
          { label: 'Depense max / jour', val: riskConfig.depenseMax + ' EUR', color: '#fbbf24', cle: 'depenseMax' },
          { label: 'ROAS minimum', val: riskConfig.roasMin + 'x', color: '#4ade80', cle: 'roasMin' },
        ].map((c,i) => (
          <div key={i} style={S.card}>
            <div style={S.cardTitle}>{c.label}</div>
            <div style={{ ...S.cardValue, color: c.color }}>{c.val}</div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <button style={{ ...S.btn('outline'), padding: '4px 12px', fontSize: '12px' }} onClick={() => setRiskConfig(r => ({...r, [c.cle]: Math.max(0, (r[c.cle as keyof typeof r] as number) - (c.cle === 'roasMin' ? 0.1 : 50))}))}>-</button>
              <button style={{ ...S.btn('outline'), padding: '4px 12px', fontSize: '12px' }} onClick={() => setRiskConfig(r => ({...r, [c.cle]: (r[c.cle as keyof typeof r] as number) + (c.cle === 'roasMin' ? 0.1 : 50)}))}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...S.grid(2), marginTop: '20px' }}>
        <div style={S.card}>
          <div style={S.sectionTitle}>🔒 Garde-fous actifs</div>
          {[
            { label: 'Stop-loss global', desc: 'Arrete tout si perte > ' + riskConfig.perteMax + ' EUR/j', actif: true, critique: true },
            { label: 'Stop-loss par campagne', desc: 'Kill si ROAS < ' + riskConfig.roasMin + 'x pendant 48h', actif: true, critique: true },
            { label: 'Stop-loss par produit', desc: 'Arrete produit si perte > 50 EUR/j', actif: true, critique: false },
            { label: 'Budget cap dynamique', desc: 'Max ' + riskConfig.depenseMax + ' EUR/j toutes plateformes', actif: true, critique: true },
            { label: 'Drawdown max', desc: 'Freeze si -20% capital en 7j', actif: true, critique: true },
            { label: 'Kill switch total', desc: 'Arret d'urgence en 1 clic', actif: true, critique: true },
            { label: 'Emergency freeze', desc: 'Auto-freeze si anomalie critique', actif: true, critique: true },
            { label: 'Risk ratio P/L', desc: 'Alerte si ratio < 2:1', actif: true, critique: false },
          ].map((r,i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #0f0f1a' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.label} {r.critique && <span style={{ color: '#f87171', fontSize: '11px' }}>CRITIQUE</span>}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{r.desc}</div>
              </div>
              <span style={S.badge(r.actif ? 'green' : 'red')}>{r.actif ? 'Arme' : 'Inactif'}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>☢️ Kill Switch d'urgence</div>
          <div style={{ padding: '20px', background: '#1a0000', border: '1px solid #dc2626', borderRadius: '12px', marginBottom: '16px', textAlign: 'center' as const }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚨</div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#f87171', marginBottom: '8px' }}>ARRET D'URGENCE</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>Arrete immediatement TOUTES les campagnes sur toutes les plateformes. Action irreversible sans confirmation.</div>
            <button style={{ ...S.btn('danger'), width: '100%', padding: '14px', fontSize: '16px' }} onClick={() => { if(window.confirm('CONFIRMER L'ARRET D'URGENCE ? Toutes les campagnes seront stoppees.')) alert('Kill switch active ! Toutes les campagnes sont stoppees.') }}>
              🛑 ACTIVER KILL SWITCH
            </button>
          </div>
          <div style={S.sectionTitle}>📊 Risque en temps reel</div>
          {[
            { label: 'Depense aujourd'hui', val: '1 247 EUR', max: riskConfig.depenseMax, pct: Math.round(1247/riskConfig.depenseMax*100) },
            { label: 'Perte nette', val: '0 EUR', max: riskConfig.perteMax, pct: 0 },
          ].map((r,i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>{r.label}</span>
                <span style={{ fontWeight: 700 }}>{r.val} / {r.max} EUR</span>
              </div>
              <div style={S.progress(r.pct)}>
                <div style={S.progressBar(r.pct, r.pct > 80 ? '#dc2626' : r.pct > 60 ? '#f59e0b' : '#16a34a')} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{r.pct}% de la limite</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ============================================================
  // PAGE FINANCIER (FINANCIAL EVOLUTION ENGINE)
  // ============================================================
  const renderFinancier = () => (
    <div>
      <div style={S.info}>
        💹 <strong>Financial Evolution Engine.</strong> AEGIS evolue avec toi. Chaque phase debloques des capacites et des budgets plus importants, avec des garde-fous adaptes.
      </div>
      <div style={S.grid(3)}>
        {[
          { ph: 1, titre: 'Phase 1 : 0 → 1M EUR', gardefous: 45, status: 'En cours', color: '#4f46e5', desc: 'Demarrage et validation', specs: ['Budget cap: 500 EUR/j', 'ROAS min: 1.1x', 'Validation humaine frequente', '45 garde-fous actifs'] },
          { ph: 2, titre: 'Phase 2 : 1M → 10M EUR', gardefous: 70, status: 'Verrouille', color: '#374151', desc: 'Croissance acceleree', specs: ['Budget cap: 5000 EUR/j', 'Scaling agressif', 'Automatisation accrue', '70 garde-fous actifs'] },
          { ph: 3, titre: 'Phase 3 : 10M → 100M EUR', gardefous: 100, status: 'Verrouille', color: '#374151', desc: 'Mode hedge fund complet', specs: ['Multi-produits', 'Multi-comptes', 'Multi-marches', '100 garde-fous + hedge logic'] },
        ].map((ph,i) => (
          <div key={i} style={{ ...S.card, border: ph.ph === phase ? '2px solid #4f46e5' : undefined, opacity: ph.ph > phase ? 0.6 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, color: ph.ph === phase ? '#a5b4fc' : '#94a3b8' }}>{ph.titre}</span>
              <span style={S.badge(ph.status === 'En cours' ? 'blue' : 'yellow')}>{ph.status}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{ph.desc}</div>
            {ph.specs.map((s,j) => <div key={j} style={{ fontSize: '13px', padding: '4px 0', color: ph.ph === phase ? '#e2e8f0' : '#94a3b8' }}>• {s}</div>)}
            {ph.ph === phase && (
              <div style={{ marginTop: '12px' }}>
                <div style={S.progress(37)}>
                  <div style={S.progressBar(37)} />
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>37% vers Phase 2</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ ...S.card, marginTop: '20px' }}>
        <div style={S.sectionTitle}>💰 Projection financiere</div>
        <div style={S.grid(4)}>
          {[
            { label: 'Revenus ce mois', val: '18 450 EUR', color: '#4ade80' },
            { label: 'Depenses pub', val: '7 890 EUR', color: '#f87171' },
            { label: 'Profit net', val: '10 560 EUR', color: '#4ade80' },
            { label: 'Projection annuelle', val: '220 000 EUR', color: '#a5b4fc' },
          ].map((c,i) => (
            <div key={i} style={S.card}>
              <div style={S.cardTitle}>{c.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: c.color }}>{c.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ============================================================
  // PAGES EXISTANTES MAINTENUES
  // ============================================================
  const renderCampagnes = () => (
    <div>
      <div style={S.info}>🚀 <strong>Qu'est-ce qu'une campagne ?</strong> Une campagne teste automatiquement la publicite d'un produit. L'IA gere les budgets, les creatifs et l'optimisation a votre place. Cliquez sur <strong>"Nouvelle campagne"</strong> pour en demarrer une.</div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="URL produit ou nom..." value={nouvelleUrl} onChange={e => setNouvelleUrl(e.target.value)} />
        <select style={{ ...S.input, width: 'auto' }} value={nouvellePlateforme} onChange={e => setNouvellePlateforme(e.target.value)}>
          <option value="meta">Meta Ads</option>
          <option value="google">Google Ads</option>
          <option value="tiktok">TikTok Ads</option>
        </select>
        <input style={{ ...S.input, width: '100px' }} type="number" placeholder="Budget" value={nouveauBudget} onChange={e => setNouveauBudget(e.target.value)} />
        <button style={S.btn('success')} onClick={lancerCampagne} disabled={loading}>{loading ? 'Lancement...' : '🚀 Nouvelle campagne'}</button>
        <button style={S.btn()} onClick={loadData}>🔄 Actualiser</button>
      </div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>PRODUIT</th><th style={S.th}>STATUT</th><th style={S.th}>BUDGET TOTAL</th><th style={S.th}>DEPENSE</th><th style={S.th}>ROAS</th><th style={S.th}>DATE</th></tr></thead>
        <tbody>
          {pipelines.length === 0 ? (
            <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: '#64748b', padding: '32px' }}>Aucune campagne. Lancez votre premiere campagne ci-dessus.</td></tr>
          ) : pipelines.map((p: any) => (
            <tr key={p.id}>
              <td style={S.td}>{p.product_name}</td>
              <td style={S.td}><span style={S.badge(p.status === 'active' ? 'green' : p.status === 'paused' ? 'yellow' : 'blue')}>{p.status}</span></td>
              <td style={S.td}>{p.total_budget} EUR</td>
              <td style={S.td}>{p.spent_budget || 0} EUR</td>
              <td style={{ ...S.td, color: p.roas ? (p.roas >= 2 ? '#4ade80' : '#f87171') : '#64748b', fontWeight: 700 }}>{p.roas || 'N/A'}</td>
              <td style={{ ...S.td, color: '#64748b', fontSize: '12px' }}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderDecisions = () => {
    const pending = actions.filter(a => a.status === 'pending')
    return (
      <div>
        <div style={S.info}>✅ <strong>Que sont les decisions ?</strong> Quand l'IA veut faire une action (ex: augmenter un budget, tester une nouvelle pub), elle vous demande d'abord votre accord ici. Vous pouvez <strong>Valider</strong> (l'IA execute) ou <strong>Refuser</strong> (rien ne change).</div>
        <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px' }}>⏳ {pending.length} decision(s) en attente de votre accord</div>
          <button style={S.btn()} onClick={loadData}>🔄</button>
        </div>
        {pending.length === 0 ? (
          <div style={{ ...S.card, textAlign: 'center', padding: '48px', color: '#64748b' }}>✅ Aucune decision en attente. Tout est traite !</div>
        ) : pending.map((a: any) => (
          <div key={a.id} style={{ ...S.card, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '28px' }}>🤖</span>
              <div>
                <div style={{ fontWeight: 700 }}>{a.agent_name} — {a.action_type}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Priorite : {a.priority >= 8 ? '🔴 Haute' : a.priority >= 5 ? '🟡 Moyenne' : '🟢 Faible'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={S.badge('yellow')}>⏳ En attente</span>
              <button style={S.btn('success')} onClick={() => validerAction(a.id)}>✓ Valider</button>
              <button style={S.btn('danger')} onClick={() => refuserAction(a.id)}>✗ Refuser</button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderAgents = () => (
    <div>
      <div style={S.info}>🤖 <strong>Qu'est-ce qu'un agent IA ?</strong> Un agent est un "robot" specialise qui effectue une tache precise automatiquement. Vous pouvez les <strong>activer (ON)</strong> ou <strong>desactiver (OFF)</strong> selon vos besoins.</div>
      <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontWeight: 700 }}>🤖 {agents.length || 25} agents configures · <span style={{ color: '#4ade80' }}>{agents.filter((a: any) => a.is_enabled).length || 25} actifs</span>, <span style={{ color: '#fbbf24' }}>{agents.filter((a: any) => !a.is_enabled).length} en pause</span></div>
        <button style={S.btn()} onClick={loadData}>🔄 Actualiser</button>
      </div>
      {['CREATIVE','MARKET','MEDIA_BUYING','ANALYTICS','OPTIMIZATION'].map(cat => {
        const catAgents = agents.filter((a: any) => a.category === cat)
        if (catAgents.length === 0) return null
        return (
          <div key={cat} style={S.section}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '8px', letterSpacing: '1px' }}>🤖 {cat.toLowerCase()}</div>
            {catAgents.map((a: any) => (
              <div key={a.id} style={{ ...S.card, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px' }}>🤖</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{a.description}</div>
                    <div style={{ fontSize: '11px', color: '#475569' }}>{a.run_count || 0} executions</div>
                  </div>
                </div>
                <div style={{ padding: '6px 18px', background: a.is_enabled ? '#052e16' : '#1e1e3a', border: '1px solid ' + (a.is_enabled ? '#166534' : '#374151'), borderRadius: '20px', color: a.is_enabled ? '#4ade80' : '#94a3b8', fontWeight: 700, fontSize: '13px' }}>{a.is_enabled ? 'ON' : 'OFF'}</div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )

  const renderSecurite = () => (
    <div>
      <div style={S.info}>🛡️ <strong>Comment fonctionne la securite ?</strong> AEGIS dispose de plusieurs "filets de securite" qui protegent votre budget. Si une limite est depassee, le systeme s'arrete automatiquement. Vous definissez les regles, l'IA les respecte.</div>
      <div style={S.grid(2)}>
        <div>
          <div style={S.sectionTitle}>🏗️ Etapes de croissance</div>
          {[
            { titre: 'Phase 1 · 0 → 1M EUR', status: 'En cours', specs: ['Perte max: 150 EUR/j', 'Depense max: 500 EUR/j', 'ROAS min: 1.10x'], color: 'blue' },
            { titre: 'Phase 2 · 1M → 10M EUR', status: 'Verrouille', specs: ['Perte max: 500 EUR/j', 'Depense max: 5000 EUR/j', 'ROAS min: 1.5x'], color: 'yellow' },
            { titre: 'Phase 3 · 10M → 100M EUR', status: 'Verrouille', specs: ['Multi-produits', 'Multi-comptes', 'Hedge logic complete'], color: 'yellow' },
          ].map((ph,i) => (
            <div key={i} style={{ ...S.card, marginBottom: '12px', opacity: i > 0 ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700 }}>{ph.titre}</span>
                <span style={S.badge(ph.color)}>{ph.status}</span>
              </div>
              {ph.specs.map((s,j) => <div key={j} style={{ fontSize: '13px', color: '#94a3b8' }}>• {s}</div>)}
            </div>
          ))}
        </div>
        <div>
          <div style={S.sectionTitle}>🔒 Protections actives</div>
          {[
            { label: 'Garde-budget', desc: 'Bloque depenses si limite atteinte', status: 'Arme' },
            { label: 'Garde-ROAS', desc: 'Arrete campagne si ROAS sous minimum', status: 'Arme' },
            { label: 'Frein automatique', desc: 'Reduit vitesse si anomalie', status: 'Arme' },
            { label: 'Emergency freeze', desc: 'Gel total si -20% capital', status: 'Arme' },
            { label: 'Kill switch', desc: 'Arret d'urgence 1 clic', status: 'En veille' },
            { label: 'Couverture auto', desc: 'Protection automatique', status: 'Surveillance' },
          ].map((p,i) => (
            <div key={i} style={{ ...S.card, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{p.desc}</div>
              </div>
              <span style={S.badge(p.status === 'Arme' ? 'green' : 'yellow')}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderAbonnement = () => (
    <div>
      <div style={S.info}>💎 Choisis le forfait adapte a ta phase de croissance. Tous les forfaits incluent l'acces aux 25 agents IA et au dashboard complet.</div>
      <div style={S.grid(4)}>
        {[
          { titre: 'Essai', prix: '0 EUR', campagnes: '10 tests', features: ['Tous les agents', 'Dashboard complet', 'Support par email'], color: '#374151', current: false },
          { titre: 'Starter', prix: '99 EUR/mois', campagnes: '10 campagnes/mois', features: ['Tous les agents', 'Campagnes publicitaires', 'Analyses'], color: '#374151', current: false },
          { titre: 'Growth', prix: '299 EUR/mois', campagnes: '50 campagnes/mois', features: ['Support prioritaire', 'Scaling avance', 'API acces'], color: '#1e1b4b', current: true },
          { titre: 'Elite', prix: '999 EUR/mois', campagnes: '200 campagnes/mois', features: ['Partage de revenus', 'Manager dedie', 'Multi-comptes'], color: '#374151', current: false },
        ].map((f,i) => (
          <div key={i} style={{ ...S.card, background: f.color, border: f.current ? '2px solid #4f46e5' : undefined }}>
            {f.current && <div style={{ textAlign: 'center' as const, marginBottom: '8px' }}><span style={S.badge('blue')}>✓ Plan actuel</span></div>}
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{f.titre}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#a5b4fc', marginBottom: '4px' }}>{f.prix}</div>
            <div style={{ fontSize: '13px', color: '#4ade80', marginBottom: '16px' }}>📊 {f.campagnes}</div>
            {f.features.map((ft,j) => <div key={j} style={{ fontSize: '13px', padding: '3px 0', color: '#94a3b8' }}>✓ {ft}</div>)}
            <button style={{ ...S.btn(f.current ? 'outline' : 'primary'), marginTop: '16px', width: '100%' }}>{f.current ? 'Plan actuel' : 'Choisir ce plan'}</button>
          </div>
        ))}
      </div>
    </div>
  )
  // ============================================================
  // NAVIGATION CONFIG
  // ============================================================
  const navGroups = [
    {
      title: 'PRINCIPAL',
      items: [
        { id: 'accueil' as Page, icon: '🏠', label: 'Accueil', sub: 'Vue generale' },
      ]
    },
    {
      title: 'MOTEURS AEGIS',
      items: [
        { id: 'boutique' as Page, icon: '🔗', label: 'Boutique', sub: 'Connecter ma boutique' },
        { id: 'intelligence' as Page, icon: '🧠', label: 'Intelligence', sub: 'Analyser produits' },
        { id: 'creatifs' as Page, icon: '🎨', label: 'Creatifs', sub: 'Generer les pubs' },
        { id: 'funnel' as Page, icon: '🔁', label: 'Funnel', sub: 'Optimiser conversion' },
        { id: 'media' as Page, icon: '📡', label: 'Media Buying', sub: 'Gerer les campagnes' },
      ]
    },
    {
      title: 'GESTION',
      items: [
        { id: 'campagnes' as Page, icon: '🚀', label: 'Campagnes', sub: 'Mes publicites' },
        { id: 'decisions' as Page, icon: '✅', label: 'Decisions', sub: 'A valider' },
        { id: 'agents' as Page, icon: '🤖', label: 'Agents IA', sub: 'Robots actifs' },
      ]
    },
    {
      title: 'SYSTEME',
      items: [
        { id: 'marche' as Page, icon: '📈', label: 'Marche', sub: 'Signaux & adaptation' },
        { id: 'risque' as Page, icon: '⚠️', label: 'Risque', sub: 'Stop-loss & hedge' },
        { id: 'sante' as Page, icon: '🏥', label: 'Sante systeme', sub: 'Monitoring & repair' },
        { id: 'gouvernance' as Page, icon: '⚖️', label: 'Gouvernance', sub: 'Mode & audit trail' },
        { id: 'financier' as Page, icon: '💹', label: 'Financier', sub: 'Phases & evolution' },
        { id: 'securite' as Page, icon: '🛡️', label: 'Securite', sub: 'Limites & risques' },
        { id: 'abonnement' as Page, icon: '💎', label: 'Abonnement', sub: 'Mon forfait' },
      ]
    }
  ]

  const pageMap: Record<Page, () => React.ReactElement> = {
    accueil: renderAccueil,
    boutique: renderBoutique,
    intelligence: renderIntelligence,
    creatifs: renderCreatifs,
    funnel: renderFunnel,
    media: renderMedia,
    campagnes: renderCampagnes,
    decisions: renderDecisions,
    agents: renderAgents,
    marche: renderMarche,
    risque: renderRisque,
    sante: renderSante,
    gouvernance: renderGouvernance,
    financier: renderFinancier,
    securite: renderSecurite,
    abonnement: renderAbonnement,
  }

  const pageTitles: Record<Page, {icon: string, title: string, sub: string}> = {
    accueil: { icon: '🏠', title: 'Accueil', sub: 'Vue generale' },
    boutique: { icon: '🔗', title: 'Boutique', sub: 'Store Connector Engine' },
    intelligence: { icon: '🧠', title: 'Intelligence Produit', sub: 'Product Intelligence Engine' },
    creatifs: { icon: '🎨', title: 'Creatifs', sub: 'Creative Engine' },
    funnel: { icon: '🔁', title: 'Funnel', sub: 'Funnel Engine' },
    media: { icon: '📡', title: 'Media Buying', sub: 'Media Buying Engine' },
    campagnes: { icon: '🚀', title: 'Campagnes', sub: 'Mes publicites' },
    decisions: { icon: '✅', title: 'Decisions', sub: 'A valider' },
    agents: { icon: '🤖', title: 'Agents IA', sub: 'Robots actifs' },
    marche: { icon: '📈', title: 'Marche', sub: 'Market Adaptation Engine' },
    risque: { icon: '⚠️', title: 'Risque', sub: 'Risk Engine - Logique Hedge Fund' },
    sante: { icon: '🏥', title: 'Sante systeme', sub: 'Health & Self-Repair Engine' },
    gouvernance: { icon: '⚖️', title: 'Gouvernance', sub: 'Governance Engine' },
    financier: { icon: '💹', title: 'Evolution Financiere', sub: 'Financial Evolution Engine' },
    securite: { icon: '🛡️', title: 'Securite', sub: 'Limites & risques' },
    abonnement: { icon: '💎', title: 'Abonnement', sub: 'Mon forfait' },
  }

  const currentPageInfo = pageTitles[page]
  const currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div style={S.app}>
      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoText}>⚡ AEGIS</div>
          <div style={S.logoSub}>Plateforme publicitaire IA</div>
          <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
            <span style={{ fontSize: '11px', color: '#4ade80' }}>Systeme connecte</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' as const, padding: '8px 12px' }}>
          {navGroups.map((group) => (
            <div key={group.title}>
              <div style={S.navSection}>{group.title}</div>
              {group.items.map(item => (
                <button key={item.id} style={S.navBtn(page === item.id)} onClick={() => setPage(item.id)}>
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  <div>
                    <div style={{ lineHeight: 1.2 }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: '#475569', fontWeight: 400 }}>{item.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid #1e1e3a', fontSize: '12px', color: '#64748b' }}>
          Base de donnees : OK
        </div>
      </aside>

      {/* MAIN */}
      <main style={S.main}>
        <header style={S.header}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{currentPageInfo.icon} {currentPageInfo.title}</h1>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{currentPageInfo.sub}</div>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', background: '#0f0f1a', padding: '8px 14px', borderRadius: '8px', border: '1px solid #1e1e3a' }}>
            📅 {currentDate}
          </div>
        </header>
        <div style={S.content}>
          {pageMap[page]()}
        </div>
      </main>
    </div>
  )
         }
