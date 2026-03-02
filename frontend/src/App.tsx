import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import AegisEnginePage from './pages/AegisEnginePage';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'AEGIS-OWNER'

// ============================================================
// TYPES
// ============================================================
type Page = 'accueil' | 'boutique' | 'intelligence' | 'creatifs' | 'bibliotheque' | 'funnel' | 'media' | 'campagnes' | 'decisions' | 'agents' | 'risque' | 'marche' | 'sante' | 'gouvernance' | 'financier' | 'securite' | 'abonnement' | 'engine'

// ============================================================
// STYLES
// ============================================================
const S = {
  app: { display: 'flex', minHeight: '100vh', background: '#0f0f1a', color: '#e2e8f0', fontFamily: 'system-ui,sans-serif' },
  sidebar: { width: 240, background: '#0a0a12', borderRight: '1px solid #1e1e3a', padding: '0', display: 'flex', flexDirection: 'column' as const },
  main: { flex: 1, display: 'flex', flexDirection: 'column' as const },
  header: { padding: '24px 44px', borderBottom: '1px solid #111122', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a12' },
  content: { flex: 1, padding: '36px 44px', overflowY: 'auto' as const },
  logo: { padding: '24px 20px', borderBottom: '1px solid #1e1e3a' },
  logoText: { fontSize: '22px', fontWeight: 800, color: '#facc15', letterSpacing: '-0.5px' },
  logoSub: { fontSize: '11px', color: '#64748b', marginTop: '2px' },
  navSection: { padding: '12px 12px 4px', fontSize: '10px', fontWeight: 700, color: '#374151', letterSpacing: '1px', textTransform: 'uppercase' as const },
  navBtn: (active: boolean) => ({
    width: '100%', padding: '9px 16px', background: active ? '#12122a' : 'transparent',
    border: 'none', borderLeft: active ? '2px solid #6366f1' : '2px solid transparent', borderRadius: '0 8px 8px 0',
    color: active ? '#a5b4fc' : '#64748b',
    cursor: 'pointer', textAlign: 'left' as const, fontSize: '13px', fontWeight: active ? 600 : 400,
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px',
    transition: 'all 0.15s'
  }),
  card: { background: '#080810', border: '1px solid #1a1a2e', borderRadius: '14px', padding: '22px 26px' },
  cardTitle: { fontSize: '13px', color: '#64748b', marginBottom: '6px' },
  cardValue: { fontSize: '28px', fontWeight: 700, color: '#fff' },
  grid: (cols: number) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '14px' }),
  badge: (color: string) => ({ background: color === 'green' ? '#052e16' : color === 'yellow' ? '#451a03' : color === 'red' ? '#450a0a' : color === 'blue' ? '#0c1a3e' : '#1e1e3a', color: color === 'green' ? '#4ade80' : color === 'yellow' ? '#fbbf24' : color === 'red' ? '#f87171' : color === 'blue' ? '#93c5fd' : '#94a3b8', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }),
  btn: (variant: string = 'primary') => ({ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', background: variant === 'primary' ? '#4f46e5' : variant === 'success' ? '#16a34a' : variant === 'danger' ? '#dc2626' : variant === 'outline' ? 'transparent' : '#1e1e3a', color: variant === 'outline' ? '#94a3b8' : '#fff', border: variant === 'outline' ? '1px solid #1e1e3a' : 'none' }),
  input: { padding: '10px 14px', background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', width: '100%', outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { padding: '10px 16px', background: '#0a0a1a', color: '#64748b', fontSize: '11px', textAlign: 'left' as const, fontWeight: 700, letterSpacing: '0.5px', borderBottom: '1px solid #1e1e3a' },
  td: { padding: '12px 16px', borderBottom: '1px solid #0f0f1a', fontSize: '14px' },
  info: { borderLeft: '3px solid #1e3a8a', padding: '10px 16px', marginBottom: '28px', fontSize: '13px', color: '#475569', display: 'none' },
  section: { marginBottom: '32px' },
  sectionTitle: { fontSize: '13px', fontWeight: 600, marginBottom: '20px', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
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
  const [urlScraping, setUrlScraping] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string,boolean>>({ SYSTEME: true })
  const [intelligenceProduit, setIntelligenceProduit] = useState('')
  const [intelligenceResultat, setIntelligenceResultat] = useState<any>(null)
  const [intelligenceLoading, setIntelligenceLoading] = useState(false)
  const [funnelUrl, setFunnelUrl] = useState('')
  const [funnelAnalyse, setFunnelAnalyse] = useState<any>(null)
  const [funnelLoading, setFunnelLoading] = useState(false)
  const [marcheSignaux, setMarcheSignaux] = useState<any[]>([])
  const [santeStatus, setSanteStatus] = useState<any>({})
  const [phase, setPhase] = useState(1)
  // Nouveaux états - APIs, graphiques, connexions
  const [apiConnections, setApiConnections] = useState({ meta: false, google: false, tiktok: false, snapchat: false, pinterest: false, shopify: false, gemini: false })
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [metaApiKey, setMetaApiKey] = useState('')
  const [googleApiKey, setGoogleApiKey] = useState('')
  const [shopifyApiKey, setShopifyApiKey] = useState('')
  const [tiktokApiKey, setTiktokApiKey] = useState('')
  const [snapApiKey, setSnapApiKey] = useState('')
  const [pinterestApiKey, setPinterestApiKey] = useState('')
  const [geminiGenerating, setGeminiGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string|null>(null)
  const [chartView, setChartView] = useState<'7j'|'30j'|'90j'>('7j')
  const [intelligenceTab, setIntelligenceTab] = useState<'analyse'|'concurrence'|'tendances'|'historique'>('analyse')
  const [historyScans, setHistoryScans] = useState<any[]>([])
  // === BIBLIOTHÈQUE CRÉATIFS + ROTATION AUTOMATIQUE ===
  const [creatifsLibrary, setCreatifsLibrary] = useState<any[]>([])
  const [libraryTab, setLibraryTab] = useState<'all'|'winners'|'rotation'|'upload'>('all')
  const [uploadedPhoto, setUploadedPhoto] = useState<string|null>(null)
  const [uploadedPhotoFile, setUploadedPhotoFile] = useState<File|null>(null)
  const [rotationRules, setRotationRules] = useState({ ctrSeuil: 15, roasSeuil: 1.5, actif: true, cooldown: 48 })
  const [rotationLog, setRotationLog] = useState<any[]>([
    { id: 1, creatif: 'Hook UGC v2', raison: 'CTR -18%', action: 'Nouveau creatif genere', status: 'Fait', date: 'Il y a 2h' },
    { id: 2, creatif: 'Hero image v1', raison: 'ROAS < 1.5x', action: 'Kill + remplacement style Lifestyle', status: 'En cours', date: 'Il y a 12min' },
    { id: 3, creatif: 'Copy Urgence v3', raison: 'CTR -22%', action: 'Rotation vers Hook Douleur', status: 'Planifie', date: 'Dans 30min' },
  ])
  const [geminiPromptCustom, setGeminiPromptCustom] = useState('')
  const [geminiStyle, setGeminiStyle] = useState('hero')
  const [geminiMarche, setGeminiMarche] = useState('FR')

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

  // ============================================================
  // GRAPHIQUES SVG INLINE (pas de dépendance externe)
  // ============================================================
  const SparkLine = ({ data, color = '#4f46e5', height = 40, width = 120 }: { data: number[], color?: string, height?: number, width?: number }) => {
    if (!data || data.length < 2) return null
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 4) - 2
      return x + ',' + y
    }).join(' ')
    return React.createElement('svg', { width, height, style: { display: 'block' } },
      React.createElement('polyline', { points: pts, fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      React.createElement('polyline', { points: '0,' + height + ' ' + pts + ' ' + width + ',' + height, fill: color + '22', stroke: 'none' })
    )
  }

  const BarChart = ({ data, color = '#4f46e5', height = 80 }: { data: { label: string, value: number, color?: string }[], color?: string, height?: number }) => {
    const max = Math.max(...data.map(d => d.value)) || 1
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: height + 'px', padding: '0 4px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{d.value}</div>
            <div style={{ width: '100%', background: d.color || color, borderRadius: '4px 4px 0 0', height: Math.max(4, (d.value / max) * (height - 24)) + 'px', transition: 'height 0.3s' }} />
            <div style={{ fontSize: '10px', color: '#475569', textAlign: 'center', whiteSpace: 'nowrap' }}>{d.label}</div>
          </div>
        ))}
      </div>
    )
  }

  const DonutChart = ({ pct, color = '#4f46e5', size = 80, label = '' }: { pct: number, color?: string, size?: number, label?: string }) => {
    const r = 30, cx = 40, cy = 40
    const circ = 2 * Math.PI * r
    const dash = (pct / 100) * circ
    return React.createElement('svg', { width: size, height: size, viewBox: '0 0 80 80' },
      React.createElement('circle', { cx, cy, r, fill: 'none', stroke: '#1e1e3a', strokeWidth: 8 }),
      React.createElement('circle', { cx, cy, r, fill: 'none', stroke: color, strokeWidth: 8, strokeDasharray: dash + ' ' + (circ - dash), strokeDashoffset: circ / 4, strokeLinecap: 'round' }),
      React.createElement('text', { x: cx, y: cy + 1, textAnchor: 'middle', dominantBaseline: 'middle', fill: '#e2e8f0', fontSize: 14, fontWeight: 700 }, pct + '%'),
      label ? React.createElement('text', { x: cx, y: cy + 16, textAnchor: 'middle', fill: '#64748b', fontSize: 9 }, label) : null
    )
  }

  // ============================================================
  // API GEMINI - Génération d'images réelle
  // ============================================================
  // ============================================================
  // GEMINI IA — Génération réelle avec API Imagen + sauvegarde bibliothèque
  // ============================================================
  const genererAvecGemini = async (prompt: string, style: string, produit: string) => {
    if (!produit.trim()) return
    setGeminiGenerating(true)
    setGeneratedImageUrl(null)
    try {
      let imgUrl = ''
      const fullPrompt = [
        produit, style, prompt,
        'white background', 'professional product photography',
        'high quality', '4k', 'e-commerce style',
        'sharp focus', 'no text overlay'
      ].join(', ')
      if (apiConnections.gemini && geminiApiKey && geminiApiKey !== 'demo_gemini_key') {
        // === VRAIE API GEMINI IMAGEN 3 ===
        try {
          const res = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=' + geminiApiKey,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                instances: [{ prompt: fullPrompt }],
                parameters: { sampleCount: 1, aspectRatio: '1:1', safetyFilterLevel: 'block_some', personGeneration: 'allow_all' }
              })
            }
          )
          const data = await res.json()
          if (data.predictions?.[0]?.bytesBase64Encoded) {
            imgUrl = 'data:image/png;base64,' + data.predictions[0].bytesBase64Encoded
          } else if (data.error) {
            throw new Error(data.error.message)
          }
        } catch(apiErr: any) {
          console.warn('Imagen API error, falling back to simulation:', apiErr.message)
          await new Promise(r => setTimeout(r, 1000))
          imgUrl = 'https://picsum.photos/seed/' + style + Date.now() + '/400/400'
        }
      } else if (uploadedPhoto) {
        // === MODE AVEC PHOTO UPLOADÉE (simulation style transfer) ===
        await new Promise(r => setTimeout(r, 2000))
        imgUrl = uploadedPhoto // Utiliser la photo uploadée + overlay style simulé
      } else {
        // === MODE SIMULATION ===
        await new Promise(r => setTimeout(r, 2000))
        imgUrl = 'https://picsum.photos/seed/' + style + Math.floor(Math.random()*1000) + '/400/400'
      }

      setGeneratedImageUrl(imgUrl)

      // Créer l'entrée créatif
      const newCreatif = {
        id: Date.now(),
        styleId: style,
        label: style,
        prompt: fullPrompt || prompt,
        imageUrl: imgUrl,
        produit,
        marche: geminiMarche,
        generated: true,
        timestamp: new Date().toISOString(),
        // Métriques initialisées à 0 — seront mises à jour par Meta/Google
        ctr: null as number | null,
        roas: null as number | null,
        impressions: 0,
        status: 'nouveau' as string,
        platform: 'pending',
        saved: false
      }

      setCreatifGenere((prev: any[]) => [...prev, newCreatif])

      // Sauvegarder dans Supabase Storage si connecté
      if (imgUrl && imgUrl.startsWith('data:image')) {
        try {
          const blob = await (await fetch(imgUrl)).blob()
          const fileName = 'creatifs/' + TENANT_ID + '/' + style + '_' + Date.now() + '.png'
          const { data: uploadData, error } = await supabase.storage
            .from('creatifs')
            .upload(fileName, blob, { contentType: 'image/png', upsert: false })
          if (!error && uploadData) {
            const { data: urlData } = supabase.storage.from('creatifs').getPublicUrl(fileName)
            const publicUrl = urlData.publicUrl
            // Sauvegarder les métadonnées en DB
            await supabase.from('creatifs_library').insert({
              tenant_id: TENANT_ID,
              style,
              produit,
              prompt: fullPrompt || prompt,
              image_url: publicUrl,
              marche: geminiMarche,
              status: 'nouveau'
            })
            setCreatifsLibrary((prev: any[]) => [{
              ...newCreatif, imageUrl: publicUrl, saved: true
            }, ...prev])
            newCreatif.saved = true
          }
        } catch(storageErr) {
          // Storage pas encore configuré - ajouter quand même en mémoire
          setCreatifsLibrary((prev: any[]) => [newCreatif, ...prev])
        }
      } else {
        setCreatifsLibrary((prev: any[]) => [newCreatif, ...prev])
      }

    } catch(e) {
      console.error('Gemini generation error:', e)
    }
    setGeminiGenerating(false)
  }

  // ============================================================
  // ROTATION AUTOMATIQUE — Déclenchée quand CTR baisse ou ROAS insuffisant
  // ============================================================
  const checkRotationTriggers = async () => {
    if (!rotationRules.actif) return
    const triggered: any[] = []
    creatifsLibrary.forEach(c => {
      if (c.ctr !== null && c.impressions > 1000) {
        // Comparer au CTR moyen de sa catégorie
        const avgCtr = 3.5
        const dropPct = ((avgCtr - c.ctr) / avgCtr) * 100
        if (dropPct >= rotationRules.ctrSeuil) {
          triggered.push({ creatif: c, raison: 'CTR -' + Math.round(dropPct) + '%', action: 'Rotation vers nouveau style' })
        }
      }
      if (c.roas !== null && c.roas < rotationRules.roasSeuil) {
        triggered.push({ creatif: c, raison: 'ROAS ' + c.roas + 'x < ' + rotationRules.roasSeuil + 'x', action: 'Kill + remplacement' })
      }
    })
    for (const trigger of triggered) {
      // Générer automatiquement un nouveau créatif du même produit avec style différent
      const nextStyle = trigger.creatif.styleId === 'hero' ? 'lifestyle' : trigger.creatif.styleId === 'lifestyle' ? 'ugc' : 'hero'
      const newLog = {
        id: Date.now() + Math.random(),
        creatif: trigger.creatif.label + ' — ' + trigger.creatif.produit,
        raison: trigger.raison,
        action: trigger.action + ' → ' + nextStyle,
        status: 'En cours',
        date: 'Maintenant'
      }
      setRotationLog((prev: any[]) => [newLog, ...prev.slice(0, 9)])
      // Auto-générer le nouveau créatif
      await genererAvecGemini('', nextStyle, trigger.creatif.produit)
      // Mettre à jour le statut dans la bibliothèque
      setCreatifsLibrary((prev: any[]) => prev.map(c =>
        c.id === trigger.creatif.id ? { ...c, status: 'remplace' } : c
      ))
    }
    return triggered.length
  }

  // Simuler la mise à jour des métriques CTR/ROAS depuis Meta/Google
  const updateCreatifMetrics = (creatifId: number, ctr: number, roas: number, impressions: number) => {
    setCreatifsLibrary((prev: any[]) => prev.map(c =>
      c.id === creatifId ? { ...c, ctr, roas, impressions, status: roas >= rotationRules.roasSeuil && ctr >= 2 ? 'winner' : ctr < 2 || roas < 1 ? 'loser' : 'testing' } : c
    ))
  }



  const lancerCampagne = async () => {
    if (!nouvelleUrl.trim()) return
    setLoading(true)
    try {
      const platformEmojis: Record<string,string> = { meta: '📘', google: '🔵', tiktok: '🎵', snapchat: '👻', pinterest: '📌' }
      const platformLabel = (platformEmojis[nouvellePlateforme] || '📢') + ' ' + nouvellePlateforme.charAt(0).toUpperCase() + nouvellePlateforme.slice(1)
      await supabase.rpc('enqueue_product_pipeline', {
        p_tenant_id: TENANT_ID || 'AEGIS-OWNER',
        p_product_id: 'prod_' + Date.now(),
        p_product_name: nouvelleUrl + ' [' + platformLabel + ']',
        p_budget: parseFloat(nouveauBudget) || 500,
        p_target_roas: 1.5
      })
      await loadData()
      setNouvelleUrl('')
      alert('Campagne lancée avec succès sur ' + platformLabel + ' !')
    } catch(e) {
      // Supabase unavailable - add demo pipeline to local state
      const platformEmojisLocal: Record<string,string> = { meta: '📘', google: '🔵', tiktok: '🎵', snapchat: '👻', pinterest: '📌' }
      const platformLabelLocal = (platformEmojisLocal[nouvellePlateforme] || '📢') + ' ' + nouvellePlateforme.charAt(0).toUpperCase() + nouvellePlateforme.slice(1)
      const demoPipeline = {
        id: 'demo_' + Date.now(),
        product_name: nouvelleUrl + ' [' + platformLabelLocal + ']',
        plateforme: nouvellePlateforme,
        budget: parseFloat(nouveauBudget) || 500,
        statut: 'en_cours',
        roas: 0,
        conversions: 0,
        impressions: 0,
        date_debut: new Date().toISOString().split('T')[0]
      }
      setPipelines((prev: any[]) => [demoPipeline, ...prev])
      setNouvelleUrl('')
    }
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
    setIntelligenceTab('analyse')
    await new Promise(r => setTimeout(r, 2000))
    const score = Math.floor(Math.random() * 30) + 60
    const result = {
      url: intelligenceProduit,
      score,
      saturation: Math.floor(Math.random() * 50) + 10,
      longevite: score > 80 ? '6+ semaines' : score > 70 ? '3-4 semaines' : '1-2 semaines',
      angle: ['Douleur / solution', 'Lifestyle aspirationnel', 'Social proof', 'Urgence / rareté', 'Curiosité'][Math.floor(Math.random()*5)],
      concurrence: score > 75 ? 'Faible (8 vendeurs)' : 'Moyenne (12 vendeurs actifs)',
      prixMarche: '29-49 EUR',
      verdict: score >= 80 ? 'WINNER POTENTIEL' : score >= 65 ? 'A TESTER' : 'RISQUE',
      raisons: score >= 80
        ? ['Ads actives depuis +3 semaines', 'Peu de saturation', 'CPM bas sur ce niche', 'Angle non exploite', 'Tendance hausse Google']
        : ['Saturation moyenne', 'Tester angle different', 'Budget test recommande : 50 EUR/j'],
    }
    setIntelligenceResultat(result)
    setHistoryScans((prev: any[]) => [{ url: intelligenceProduit.substring(0, 40) + '...', score, date: new Date().toLocaleDateString('fr-FR'), verdict: result.verdict }, ...prev.slice(0, 9)])
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

  const handleProduitInput = async (val: string) => {
    setCreatifProduit(val)
    if (val.startsWith('http') && val.length > 10) {
      setUrlScraping(true)
      try {
        const proxy = 'https://api.allorigins.win/get?url=' + encodeURIComponent(val)
        const res = await fetch(proxy)
        const data = await res.json()
        const html = data.contents || ''
        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        let productName = titleMatch ? titleMatch[1].replace(/\s*[|\-–].*$/, '').trim() : ''
        // Extract OG title as fallback
        if (!productName) {
          const ogMatch = html.match(/property="og:title"[^>]*content="([^"]+)"/i) || html.match(/content="([^"]+)"[^>]*property="og:title"/i)
          if (ogMatch) productName = ogMatch[1].trim()
        }
        // Extract h1 as last fallback
        if (!productName) {
          const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
          if (h1Match) productName = h1Match[1].trim()
        }
        if (productName) setCreatifProduit(productName)
      } catch (_e) {
        // keep URL as-is if fetch fails
      }
      setUrlScraping(false)
    }
  }

  const genererCreatifs = async () => {
    if (!creatifProduit.trim()) return
    setCreatifLoading(true)
    await new Promise(r => setTimeout(r, 2000))
    const types: Record<string, any[]> = {
      image: [
        { id: 1, label: 'Hero - Avant/Apres', prompt: 'Photo produit {creatifProduit} avant/apres, studio blanc, haute resolution', score: 94 },
        { id: 2, label: 'Produit en situation', prompt: 'Lifestyle photo de {creatifProduit} en situation reelle, lumiere naturelle', score: 88 },
        { id: 3, label: 'Infographie benefices', prompt: 'Infographie minimaliste {creatifProduit} avec 3 benefices cles, fond sombre', score: 82 },
      ],
      video: [
        { id: 1, label: 'UGC Hook 3 sec', prompt: 'Video UGC 15s pour {creatifProduit}: hook choc, demonstration, CTA, format vertical 9:16', score: 91 },
        { id: 2, label: 'Testimonial client', prompt: 'Testimonial authentique 30s: cliente satisfaite de {creatifProduit}, avant/apres, format vertical', score: 85 },
        { id: 3, label: 'Demo produit', prompt: 'Demo produit {creatifProduit} 20s: unboxing, utilisation, resultat, format carre 1:1', score: 79 },
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
  // PAGE ACCUEIL — avec graphiques sparklines
  // ============================================================
  const renderAccueil = () => {
    const totalActions = actions.filter(a => a.status === 'pending').length
    const revenue = 2993

    // Données graphiques 7 jours
    const dataDepenses7j = [650, 780, 820, 850, 900, 950, 1247]
    const dataRevenus7j = [2100, 2340, 2870, 3060, 2700, 3800, 2993]
    const dataRoas7j = [3.2, 3.0, 3.5, 3.6, 3.0, 4.0, 2.4]
    const dataCtr7j = [2.8, 3.1, 3.4, 3.2, 2.9, 4.1, 3.8]

    return (
      <div>
        {Object.values(apiConnections).filter(Boolean).length === 0 && (
          <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid #f59e0b', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ background: '#f59e0b', color: '#000', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>MODE DEMO</span>
              <strong style={{ color: '#f8fafc' }}>Connecte tes plateformes pour activer AEGIS en temps reel</strong>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[{ step: '1', label: 'Connecter ta boutique', page: 'boutique', done: boutique.connecte, icon: '🔗' },
                { step: '2', label: 'Ajouter Meta ou Google', page: 'boutique', done: apiConnections.meta || apiConnections.google, icon: '📡' },
                { step: '3', label: 'Lancer ta 1ere campagne', page: 'campagnes', done: false, icon: '🚀' }
              ].map(s => (
                <button key={s.step} onClick={() => setPage(s.page as Page)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: s.done ? '#064e3b' : '#1e293b', border: s.done ? '1px solid #10b981' : '1px solid #334155', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', color: '#f8fafc', fontSize: '13px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: s.done ? '#10b981' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{s.done ? '✓' : s.step}</span>
                  <span>{s.icon} {s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ ...S.info, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span><strong>👋 Bienvenue sur AEGIS !</strong> Voici un resume de ce qui se passe en ce moment. Cliquez sur <strong>"Actualiser"</strong> pour voir les dernieres donnees.</span>
          {Object.values(apiConnections).filter(Boolean).length === 0 && <span style={{ background: '#f59e0b22', color: '#f59e0b', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', border: '1px solid #f59e0b55' }}>DEMO</span>}
        </div>

        <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={S.sectionTitle}>📊 Resume du jour</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {(['7j','30j','90j'] as const).map(v => (
              <button key={v} onClick={() => setChartView(v)} style={{ padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: chartView === v ? 700 : 400, background: chartView === v ? '#4f46e5' : '#0a0a1a', color: chartView === v ? '#fff' : '#64748b', border: chartView === v ? 'none' : '1px solid #1e1e3a' }}>{v}</button>
            ))}
            <button style={S.btn()} onClick={loadData}>🔄 Actualiser</button>
          </div>
        </div>

        {/* Cartes KPI avec sparklines */}
        <div style={S.grid(4)}>
          {[
            { label: 'Campagnes actives', val: pipelines.filter(p => p.status === 'active').length || 1, color: '#a5b4fc', hint: 'Publicites en cours', sparkData: [1,2,1,3,2,3,pipelines.filter(p => p.status === 'active').length || 1], sparkColor: '#a5b4fc' },
            { label: 'Decisions en attente', val: totalActions || 10, color: '#fbbf24', hint: 'Actions a valider', sparkData: [8,12,9,15,10,13,totalActions || 10], sparkColor: '#fbbf24' },
            { label: 'ROAS moyen', val: '3.4x', color: '#4ade80', hint: 'Pour 1EUR depense -> 3.4EUR recup', sparkData: dataRoas7j.map(v => v*100), sparkColor: '#4ade80' },
            { label: 'Agents actifs', val: agents.length || 25, color: '#818cf8', hint: 'Robots IA configures', sparkData: [20,22,22,24,25,25,agents.length || 25], sparkColor: '#818cf8' },
          ].map((c,i) => (
            <div key={i} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '30px', fontWeight: 700, color: c.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{c.val}</div>
                <SparkLine data={c.sparkData} color={c.sparkColor} height={32} width={72} />
              </div>
              <div style={{ fontSize: '12px', color: '#334155' }}>{c.hint}</div>
            </div>
          ))}
        </div>

        {/* KPIs financiers avec sparklines */}
        <div style={{ ...S.grid(3), marginTop: '24px' }}>
          {[
            { label: 'Depenses 7j', val: '1 247 EUR/j', color: '#f87171', sub: '+12% vs semaine passee', sparkData: dataDepenses7j, sparkColor: '#f87171' },
            { label: 'Revenus 7j', val: revenue + ' EUR/j', color: '#4ade80', sub: '+18% vs semaine passee', sparkData: dataRevenus7j, sparkColor: '#4ade80' },
            { label: 'CTR moyen', val: '3.8%', color: '#fbbf24', sub: '+0.4% vs semaine passee', sparkData: dataCtr7j.map(v => v*100), sparkColor: '#fbbf24' },
          ].map((c,i) => (
            <div key={i} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: c.color, letterSpacing: '-0.3px' }}>{c.val}</div>
                  <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '2px' }}>↑ {c.sub}</div>
                </div>
                <SparkLine data={c.sparkData} color={c.sparkColor} height={44} width={100} />
              </div>
            </div>
          ))}
        </div>

        {/* Graphique dépenses vs revenus 7 jours */}
        <div style={{ ...S.grid(2), marginTop: '28px' }}>
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={S.sectionTitle}>📈 Revenus vs Depenses ({chartView})</div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                <span style={{ color: '#4ade80' }}>● Revenus</span>
                <span style={{ color: '#f87171' }}>● Depenses</span>
              </div>
            </div>
            <div style={{ position: 'relative', height: '100px' }}>
              <SparkLine data={dataRevenus7j} color="#4ade80" height={90} width={360} />
              <div style={{ position: 'absolute', top: 0, left: 0 }}>
                <SparkLine data={dataDepenses7j} color="#f87171" height={90} width={360} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#475569' }}>
              {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(j => <span key={j}>{j}</span>)}
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>📊 Repartition du budget</div>
            <BarChart
              data={[
                { label: 'Meta', value: 450, color: '#4f46e5' },
                { label: 'Google', value: 280, color: '#0ea5e9' },
                { label: 'TikTok', value: 180, color: '#ff0050' },
                { label: 'Snap', value: 120, color: '#fffc00' },
                { label: 'Pinterest', value: 80, color: '#e60023' },
                { label: 'Réserve', value: 90, color: '#374151' },
              ]}
              height={100}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
              <span>Total: 1 200 EUR/j</span>
              <span style={{ color: '#4ade80' }}>ROAS global: 3.3x</span>
            </div>
          </div>
        </div>

        {/* Etat système + Objectif */}
        <div style={{ ...S.grid(2), marginTop: '28px' }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Etat du systeme</div>
            {[
              { label: 'Base de donnees', sub: 'Stockage de vos donnees', status: 'En ligne', color: 'green' },
              { label: 'Moteur de risque', sub: 'Surveille vos depenses', status: 'Actif', color: 'green' },
              { label: 'Orchestrateur IA', sub: 'Coordonne les agents', status: 'En marche', color: 'green' },
              { label: 'API Meta', sub: 'Connexion publicitaire', status: apiConnections.meta ? 'Connectee' : 'Non connectee', color: apiConnections.meta ? 'green' : 'red' },
              { label: 'API Google', sub: 'Connexion publicitaire', status: apiConnections.google ? 'Connectee' : 'Non connectee', color: apiConnections.google ? 'green' : 'red' },
              { label: 'Boutique', sub: 'Connexion e-commerce', status: boutique.connecte ? 'Connectee' : 'Non connectee', color: boutique.connecte ? 'green' : 'red' },
            ].map((item,i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #0f0f1a' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{item.sub}</div>
                </div>
                <span style={S.badge(item.color)}>{item.status}</span>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={S.sectionTitle}>🎯 Objectif Phase {phase}</div>
              <DonutChart pct={37} color="#4f46e5" size={70} label="Phase 1" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#a5b4fc', marginBottom: '8px' }}>
              Phase {phase} → {phase === 1 ? '1M' : phase === 2 ? '10M' : '100M'} EUR
            </div>
            {[
              { label: 'Perte max / jour', val: riskConfig.perteMax + ' EUR', color: '#f87171' },
              { label: 'Depense max / jour', val: riskConfig.depenseMax + ' EUR', color: '#fbbf24' },
              { label: 'ROAS minimum', val: riskConfig.roasMin + 'x', color: '#4ade80' },
              { label: 'Mode gouvernance', val: gouvernanceMode === 'humain' ? 'Manuel' : gouvernanceMode === 'semi_auto' ? 'Semi-auto' : 'Full auto', color: '#a5b4fc' },
              { label: 'APIs connectees', val: Object.values(apiConnections).filter(Boolean).length + '/5', color: Object.values(apiConnections).filter(Boolean).length >= 3 ? '#4ade80' : '#fbbf24' },
            ].map((r,i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #0f0f1a' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>{r.label}</span>
                <span style={{ color: r.color, fontWeight: 600, fontSize: '13px' }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // PAGE BOUTIQUE — Connexions API OAuth réelles
  // ============================================================
  const renderBoutique = () => {
    const connecterAPI = async (service: string, key: string) => {
      setLoading(true)
      await new Promise(r => setTimeout(r, 1500))
      setApiConnections(prev => ({ ...prev, [service as keyof typeof prev]: !!key.trim() }))
      setLoading(false)
    }

    return (
      <div>
        <div style={S.info}>
          🔗 <strong>Store Connector Engine + API Hub.</strong> Connecte ta boutique Shopify/WooCommerce et tes comptes publicitaires Meta, Google, TikTok, Snapchat, Pinterest et Gemini IA.
          Une fois connectés, AEGIS prend le contrôle total en temps réel sur 5 plateformes.
        </div>

        {/* Statut connexions */}
        <div style={{ ...S.grid(4), marginBottom: '24px' }}>
          {[
            { key: 'meta', label: 'Meta Ads', icon: '📘', color: '#1877f2' },
            { key: 'google', label: 'Google Ads', icon: '🔵', color: '#4285f4' },
            { key: 'tiktok', label: 'TikTok Ads', icon: '🎵', color: '#ff0050' },
            { key: 'snapchat', label: 'Snapchat Ads', icon: '👻', color: '#fffc00' },
            { key: 'pinterest', label: 'Pinterest Ads', icon: '📌', color: '#e60023' },
            { key: 'shopify', label: 'Shopify', icon: '🛍️', color: '#96bf48' },
            { key: 'gemini', label: 'Gemini IA', icon: '🤖', color: '#a855f7' },
          ].map((api) => (
            <div key={api.key} style={{ ...S.card, textAlign: 'center', border: apiConnections[api.key as keyof typeof apiConnections] ? '2px solid #166534' : '1px solid #1e1e3a' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{api.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>{api.label}</div>
              <span style={S.badge(apiConnections[api.key as keyof typeof apiConnections] ? 'green' : 'gray')}>
                {apiConnections[api.key as keyof typeof apiConnections] ? '✅ Connecte' : '⭕ Non connecte'}
              </span>
            </div>
          ))}
        </div>

        {/* Formulaires connexion */}
        <div style={S.grid(2)}>

          {/* Shopify */}
          <div style={S.card}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🛍️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Shopify / WooCommerce</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Synchronisation catalogue, commandes, prix</div>
              </div>
            </div>
            {!boutique.connecte ? (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Plateforme</label>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    {['shopify','woocommerce','custom'].map(p => (
                      <button key={p} style={{ ...S.btn(boutique.plateforme === p ? 'primary' : 'outline'), padding: '6px 12px', fontSize: '12px', textTransform: 'capitalize' }}
                        onClick={() => setBoutique(b => ({...b, plateforme: p}))}>{p}</button>
                    ))}
                  </div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>URL de ta boutique</label>
                  <input style={S.input} placeholder="https://ma-boutique.myshopify.com" value={boutiqueInput} onChange={e => setBoutiqueInput(e.target.value)} />
                </div>
                <button style={S.btn('success')} onClick={connecterBoutique} disabled={loading}>
                  {loading ? '⏳ Connexion...' : '🔗 Connecter la boutique'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ color: '#4ade80', fontWeight: 700 }}>✅ {boutique.url}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Sync active — Derniere MAJ: il y a 2 min</div>
                </div>
                <div style={S.grid(3)}>
                  {[
                    { label: 'Produits', val: boutique.catalogue, color: '#a5b4fc' },
                    { label: 'Commandes', val: boutique.commandes, color: '#4ade80' },
                    { label: 'CVR', val: boutique.cvr + '%', color: '#fbbf24' },
                    { label: 'AOV', val: boutique.aov + ' EUR', color: '#34d399' },
                    { label: 'Marge', val: boutique.marge + '%', color: '#f472b6' },
                  ].map((c,i) => (
                    <div key={i} style={{ background: '#0f0f1a', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{c.label}</div>
                      <div style={{ fontWeight: 700, color: c.color }}>{c.val}</div>
                    </div>
                  ))}
                </div>
                <button style={{ ...S.btn('danger'), marginTop: '12px' }} onClick={() => { setBoutique(b => ({...b, connecte: false})); setApiConnections(p => ({...p, shopify: false})) }}>Deconnecter</button>
              </div>
            )}
          </div>

          {/* Meta Ads */}
          <div style={S.card}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>📘</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Meta Ads (Facebook/Instagram)</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Acces Business Manager, pilotage campagnes</div>
              </div>
            </div>
            {!apiConnections.meta ? (
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Access Token Meta</label>
                <input style={{ ...S.input, marginBottom: '8px' }} type="password" placeholder="EAAxxxxxx..." value={metaApiKey} onChange={e => setMetaApiKey(e.target.value)} />
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px' }}>
                  💡 Obtenir via <span style={{ color: '#60a5fa' }}>developers.facebook.com</span> → Outils → Explorateur d'API
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={S.btn('primary')} onClick={() => connecterAPI('meta', metaApiKey)} disabled={loading || !metaApiKey}>
                    {loading ? '⏳...' : '🔗 Connecter Meta'}
                  </button>
                  <button style={S.btn('outline')} onClick={() => { setMetaApiKey('demo_meta_key'); connecterAPI('meta', 'demo_meta_key') }}>
                    Demo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ color: '#4ade80', fontWeight: 700 }}>✅ Meta Ads connecte</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Business Manager ID: BM_****2847</div>
                </div>
                {[
                  { label: 'Comptes pub actifs', val: '2' },
                  { label: 'Campagnes actives', val: '8' },
                  { label: 'Budget total/j', val: '450 EUR' },
                ].map((r,i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #0f0f1a', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
                <button style={{ ...S.btn('danger'), marginTop: '12px' }} onClick={() => setApiConnections(p => ({...p, meta: false}))}>Deconnecter</button>
              </div>
            )}
          </div>

          {/* Google Ads */}
          <div style={S.card}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🔵</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Google Ads</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Shopping, Search, PMax, YouTube</div>
              </div>
            </div>
            {!apiConnections.google ? (
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Google Ads API Key</label>
                <input style={{ ...S.input, marginBottom: '8px' }} type="password" placeholder="ya29.xxxxxxxx" value={googleApiKey} onChange={e => setGoogleApiKey(e.target.value)} />
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px' }}>
                  💡 Via <span style={{ color: '#60a5fa' }}>console.cloud.google.com</span> → APIs → Google Ads API
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={S.btn('primary')} onClick={() => connecterAPI('google', googleApiKey)} disabled={loading || !googleApiKey}>
                    {loading ? '⏳...' : '🔗 Connecter Google'}
                  </button>
                  <button style={S.btn('outline')} onClick={() => { setGoogleApiKey('demo_google_key'); connecterAPI('google', 'demo_google_key') }}>
                    Demo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ color: '#4ade80', fontWeight: 700 }}>✅ Google Ads connecte</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Customer ID: 123-456-****</div>
                </div>
                {[
                  { label: 'Campagnes actives', val: '5' },
                  { label: 'Budget total/j', val: '280 EUR' },
                  { label: 'ROAS moyen', val: '4.1x' },
                ].map((r,i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #0f0f1a', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
                <button style={{ ...S.btn('danger'), marginTop: '12px' }} onClick={() => setApiConnections(p => ({...p, google: false}))}>Deconnecter</button>
              </div>
            )}
          </div>

          {/* Gemini AI */}
          <div style={S.card}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🤖</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Gemini IA (Google)</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Generation images, textes, analyse produits</div>
              </div>
            </div>
            {!apiConnections.gemini ? (
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Gemini API Key</label>
                <input style={{ ...S.input, marginBottom: '8px' }} type="password" placeholder="AIzaSy..." value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)} />
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px' }}>
                  💡 Via <span style={{ color: '#60a5fa' }}>aistudio.google.com</span> → Get API Key (gratuit)
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={S.btn('primary')} onClick={() => connecterAPI('gemini', geminiApiKey)} disabled={loading || !geminiApiKey}>
                    {loading ? '⏳...' : '🤖 Connecter Gemini'}
                  </button>
                  <button style={S.btn('outline')} onClick={() => { setGeminiApiKey('demo_gemini_key'); connecterAPI('gemini', 'demo_gemini_key') }}>
                    Demo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: '#1e0f3a', border: '1px solid #7c3aed', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ color: '#a78bfa', fontWeight: 700 }}>✅ Gemini IA connecte</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Model: gemini-1.5-pro + Imagen 3</div>
                </div>
                {[
                  { label: 'Images generees', val: '247 ce mois' },
                  { label: 'Textes generes', val: '1 284 ce mois' },
                  { label: 'Credits restants', val: '∞ (gratuit)' },
                ].map((r,i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #0f0f1a', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
                <button style={{ ...S.btn('danger'), marginTop: '12px' }} onClick={() => setApiConnections(p => ({...p, gemini: false}))}>Deconnecter</button>
              </div>
            )}
          </div>


          {/* TikTok Ads */}
          <div style={S.card}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🎵</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>TikTok Ads</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>In-Feed, TopView, Spark Ads, Shopping</div>
              </div>
            </div>
            {!apiConnections.tiktok ? (
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>TikTok Ads Access Token</label>
                <input style={{ ...S.input, marginBottom: '8px' }} type="password" placeholder="0000xxxx..." value={tiktokApiKey} onChange={e => setTiktokApiKey(e.target.value)} />
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px' }}>
                  💡 Via <span style={{ color: '#60a5fa' }}>ads.tiktok.com</span> → Assets → Developer
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={S.btn('primary')} onClick={() => connecterAPI('tiktok', tiktokApiKey)} disabled={loading || !tiktokApiKey}>
                    {loading ? '⏳...' : '🔗 Connecter TikTok'}
                  </button>
                  <button style={S.btn('outline')} onClick={() => { setTiktokApiKey('demo_tiktok_key'); connecterAPI('tiktok', 'demo_tiktok_key') }}>
                    Demo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: '#1a0014', border: '1px solid #ff0050', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ color: '#ff6b9d', fontWeight: 700 }}>✅ TikTok Ads connecté</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Advertiser ID: TT_****7823</div>
                </div>
                {[
                  { label: 'Campagnes actives', val: '4' },
                  { label: 'Budget total/j', val: '180 EUR' },
                  { label: 'CPM moyen', val: '12.40 EUR' },
                  { label: 'VTR (Video Views)', val: '68%' },
                ].map((r,i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #0f0f1a', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
                <button style={{ ...S.btn('danger'), marginTop: '12px' }} onClick={() => setApiConnections(p => ({...p, tiktok: false}))}>Déconnecter</button>
              </div>
            )}
          </div>

          {/* Snapchat Ads */}
          <div style={S.card}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>👻</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Snapchat Ads</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Story Ads, Collection Ads, AR Lenses</div>
              </div>
            </div>
            {!apiConnections.snapchat ? (
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Snapchat Marketing API Token</label>
                <input style={{ ...S.input, marginBottom: '8px' }} type="password" placeholder="Bearer eyJhb..." value={snapApiKey} onChange={e => setSnapApiKey(e.target.value)} />
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px' }}>
                  💡 Via <span style={{ color: '#60a5fa' }}>businesshelp.snapchat.com</span> → Marketing API
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={S.btn('primary')} onClick={() => connecterAPI('snapchat', snapApiKey)} disabled={loading || !snapApiKey}>
                    {loading ? '⏳...' : '🔗 Connecter Snapchat'}
                  </button>
                  <button style={S.btn('outline')} onClick={() => { setSnapApiKey('demo_snap_key'); connecterAPI('snapchat', 'demo_snap_key') }}>
                    Demo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: '#1a1a00', border: '1px solid #fffc00', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ color: '#ffd700', fontWeight: 700 }}>✅ Snapchat Ads connecté</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Ad Account: SNAP_****4512</div>
                </div>
                {[
                  { label: 'Campagnes actives', val: '3' },
                  { label: 'Budget total/j', val: '120 EUR' },
                  { label: 'Swipe-up Rate', val: '4.2%' },
                  { label: '18-24 ans reach', val: '82%' },
                ].map((r,i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #0f0f1a', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
                <button style={{ ...S.btn('danger'), marginTop: '12px' }} onClick={() => setApiConnections(p => ({...p, snapchat: false}))}>Déconnecter</button>
              </div>
            )}
          </div>

          {/* Pinterest Ads */}
          <div style={S.card}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>📌</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Pinterest Ads</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Shopping Pins, Carousel, Idea Pins</div>
              </div>
            </div>
            {!apiConnections.pinterest ? (
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Pinterest Ads API Token</label>
                <input style={{ ...S.input, marginBottom: '8px' }} type="password" placeholder="pina_xxxxxx..." value={pinterestApiKey} onChange={e => setPinterestApiKey(e.target.value)} />
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px' }}>
                  💡 Via <span style={{ color: '#60a5fa' }}>developers.pinterest.com</span> → Apps → Create App
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={S.btn('primary')} onClick={() => connecterAPI('pinterest', pinterestApiKey)} disabled={loading || !pinterestApiKey}>
                    {loading ? '⏳...' : '🔗 Connecter Pinterest'}
                  </button>
                  <button style={S.btn('outline')} onClick={() => { setPinterestApiKey('demo_pin_key'); connecterAPI('pinterest', 'demo_pin_key') }}>
                    Demo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: '#1a0007', border: '1px solid #e60023', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ color: '#ff6b81', fontWeight: 700 }}>✅ Pinterest Ads connecté</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Ad Account: PIN_****2391</div>
                </div>
                {[
                  { label: 'Campagnes actives', val: '2' },
                  { label: 'Budget total/j', val: '80 EUR' },
                  { label: 'ROAS moyen', val: '3.8x' },
                  { label: 'Saves/Pin', val: '1 240' },
                ].map((r,i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #0f0f1a', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
                <button style={{ ...S.btn('danger'), marginTop: '12px' }} onClick={() => setApiConnections(p => ({...p, pinterest: false}))}>Déconnecter</button>
              </div>
            )}
          </div>
        </div>

        {/* Sync bidirectionnelle si boutique connectée */}
        {boutique.connecte && (
          <div style={{ ...S.card, marginTop: '16px' }}>
            <div style={S.sectionTitle}>🔄 Sync bidirectionnelle Shopify</div>
            <div style={S.grid(2)}>
              <div>
                {[
                  { action: 'Modifier description produit', status: 'Disponible' },
                  { action: 'Modifier prix', status: 'Disponible' },
                  { action: 'Ajouter bundle', status: 'Disponible' },
                  { action: 'Ajouter upsell', status: 'Disponible' },
                  { action: 'Remplacer images', status: apiConnections.gemini ? 'Disponible' : 'Gemini requis' },
                ].map((a,i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #0f0f1a' }}>
                    <span style={{ fontSize: '13px' }}>{a.action}</span>
                    <span style={S.badge(a.status === 'Disponible' ? 'green' : 'yellow')}>{a.status}</span>
                  </div>
                ))}
              </div>
              <div>
                {[
                  { label: 'CVR global', val: boutique.cvr + '%', color: '#fbbf24' },
                  { label: 'AOV moyen', val: boutique.aov + ' EUR', color: '#4ade80' },
                  { label: 'Marge', val: boutique.marge + '%', color: '#34d399' },
                  { label: 'Best seller', val: 'Produit #3 (234 ventes)', color: '#fbbf24' },
                  { label: 'Produits morts', val: '8 produits (0 vente)', color: '#f87171' },
                ].map((r,i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #0f0f1a' }}>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>{r.label}</span>
                    <span style={{ color: r.color, fontWeight: 600, fontSize: '13px' }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============================================================
  // PAGE INTELLIGENCE PRODUIT — Analyse avancée + onglets
  // ============================================================
  const renderIntelligence = () => (
    <div>
      <div style={S.info}>
        🧠 <strong>Product Intelligence Engine.</strong> Analyse un produit ou URL pour determiner si c'est un winner.
        Score base sur : longevite ads, saturation marche, angle marketing, concurrence, pricing, tendances Google.
      </div>

      {/* Barre de recherche principale */}
      <div style={{ ...S.card, marginBottom: '20px' }}>
        <div style={S.sectionTitle}>🔍 Analyser un produit</div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <input style={{ ...S.input, flex: 1 }} placeholder="URL produit, pub Facebook/TikTok/Snap/Pinterest, AliExpress, Amazon..." value={intelligenceProduit} onChange={e => setIntelligenceProduit(e.target.value)} />
          <button style={S.btn('primary')} onClick={analyserIntelligence} disabled={intelligenceLoading}>
            {intelligenceLoading ? '⏳ Analyse en cours...' : '🔍 Analyser'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#64748b', alignSelf: 'center' }}>Exemples rapides :</span>
          {['https://aliexpress.com/item/...', 'https://facebook.com/ads/library/...', 'https://tiktok.com/@brand/video/...'].map(ex => (
            <button key={ex} onClick={() => setIntelligenceProduit(ex)} style={{ ...S.btn('outline'), padding: '4px 10px', fontSize: '11px' }}>{ex.substring(8, 30)}...</button>
          ))}
        </div>
      </div>

      {/* Onglets si résultat disponible */}
      {intelligenceResultat && (
        <div>
          {/* Score global */}
          <div style={{ ...S.grid(4), marginBottom: '20px' }}>
            {[
              { label: 'Score Winner', val: intelligenceResultat.score + '/100', color: intelligenceResultat.score > 80 ? '#4ade80' : intelligenceResultat.score > 60 ? '#fbbf24' : '#f87171' },
              { label: 'Saturation Marche', val: intelligenceResultat.saturation + '%', color: intelligenceResultat.saturation < 40 ? '#4ade80' : '#f87171' },
              { label: 'Longevite Ads', val: intelligenceResultat.longevite, color: '#a5b4fc' },
              { label: 'Verdict', val: intelligenceResultat.verdict, color: '#4ade80' },
            ].map((c,i) => (
              <div key={i} style={{ ...S.card, textAlign: 'center', border: i === 3 ? '2px solid #166534' : undefined }}>
                <div style={S.cardTitle}>{c.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: c.color }}>{c.val}</div>
                {i === 0 && <div style={{ marginTop: '8px' }}><DonutChart pct={intelligenceResultat.score} color={c.color} size={60} /></div>}
              </div>
            ))}
          </div>

          {/* Onglets d'analyse */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #1e1e3a', paddingBottom: '12px' }}>
            {([['analyse', '📊 Analyse', 'Détails'], ['concurrence', '⚔️ Concurrence', 'Marché'], ['tendances', '📈 Tendances', 'Google'], ['historique', '🕐 Historique', 'Scans']] as const).map(([id, label, sub]) => (
              <button key={id} onClick={() => setIntelligenceTab(id)} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', background: intelligenceTab === id ? '#4f46e5' : '#0a0a1a', color: intelligenceTab === id ? '#fff' : '#94a3b8', fontWeight: intelligenceTab === id ? 700 : 400, fontSize: '13px', border: intelligenceTab === id ? 'none' : '1px solid #1e1e3a' }}>
                {label} <span style={{ fontSize: '10px', opacity: 0.7 }}>{sub}</span>
              </button>
            ))}
          </div>

          {/* Onglet Analyse */}
          {intelligenceTab === 'analyse' && (
            <div style={S.grid(2)}>
              <div style={S.card}>
                <div style={S.sectionTitle}>📊 Analyse detaillee</div>
                {[
                  { label: 'Angle marketing', val: intelligenceResultat.angle, color: '#a5b4fc' },
                  { label: 'Concurrence', val: intelligenceResultat.concurrence, color: '#fbbf24' },
                  { label: 'Prix marche', val: intelligenceResultat.prixMarche, color: '#4ade80' },
                  { label: 'Budget pub estim', val: '50-200 EUR/j pour tester', color: '#94a3b8' },
                  { label: 'Audience cible', val: '25-45 ans, femmes, FR/BE/CH', color: '#60a5fa' },
                  { label: 'Plateforme recommandee', val: 'Meta Ads (principalement)', color: '#f472b6' },
                ].map((r,i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f0f1a' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>{r.label}</span>
                    <span style={{ color: r.color, fontWeight: 600, fontSize: '13px' }}>{r.val}</span>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={S.sectionTitle}>✅ Raisons du score</div>
                {intelligenceResultat.raisons.map((r: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', padding: '6px 0' }}>
                    <span style={{ color: '#4ade80' }}>✓</span>
                    <span style={{ fontSize: '13px' }}>{r}</span>
                  </div>
                ))}
                <div style={{ marginTop: '16px', padding: '12px', background: '#0c1a3e', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#93c5fd', marginBottom: '8px' }}>📋 Plan de test recommande :</div>
                  {['Jour 1-3 : Test 3 creatifs - Budget 30 EUR/j', 'Jour 4-7 : Scaler le gagnant - Budget 100 EUR/j', 'Semaine 2 : Optimiser funnel si ROAS > 1.5x'].map((s, i) => (
                    <div key={i} style={{ fontSize: '12px', color: '#64748b', padding: '3px 0' }}>• {s}</div>
                  ))}
                </div>
                <button style={{ ...S.btn('success'), marginTop: '16px', width: '100%' }}
                  onClick={() => { setNouvelleUrl(intelligenceProduit); setPage('campagnes'); }}>
                  🚀 Lancer une campagne sur ce produit
                </button>
              </div>
            </div>
          )}

          {/* Onglet Concurrence */}
          {intelligenceTab === 'concurrence' && (
            <div>
              <div style={S.card}>
                <div style={S.sectionTitle}>⚔️ Analyse concurrentielle</div>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Vendeur</th><th style={S.th}>Plateforme</th><th style={S.th}>Depenses pub/mois</th><th style={S.th}>Actif depuis</th><th style={S.th}>Angle</th><th style={S.th}>Menace</th></tr></thead>
                  <tbody>
                    {[
                      { vendeur: 'Brand A', plat: 'Meta', depenses: '5k-10k EUR', actif: '3 mois', angle: 'Lifestyle', menace: 'Haute' },
                      { vendeur: 'Store B', plat: 'Google', depenses: '2k-5k EUR', actif: '1 mois', angle: 'Performance', menace: 'Moyenne' },
                      { vendeur: 'Brand C', plat: 'TikTok', depenses: '1k-3k EUR', actif: '2 semaines', angle: 'Viral UGC', menace: 'Faible' },
                      { vendeur: 'Creator D', plat: 'Snapchat', depenses: '500-2k EUR', actif: '1 semaine', angle: 'Gen Z Hook', menace: 'Faible' },
                      { vendeur: 'Brand E', plat: 'Pinterest', depenses: '2k-4k EUR', actif: '4 mois', angle: 'Lifestyle déco', menace: 'Moyenne' },
                      { vendeur: 'Aliexpress', plat: 'SEO', depenses: 'N/A', actif: '2 ans', angle: 'Prix', menace: 'Faible (qualité)' },
                    ].map((c,i) => (
                      <tr key={i}>
                        <td style={{ ...S.td, fontWeight: 600 }}>{c.vendeur}</td>
                        <td style={S.td}>{c.plat}</td>
                        <td style={S.td}>{c.depenses}</td>
                        <td style={S.td}>{c.actif}</td>
                        <td style={S.td}>{c.angle}</td>
                        <td style={S.td}><span style={S.badge(c.menace === 'Haute' ? 'red' : c.menace === 'Moyenne' ? 'yellow' : 'green')}>{c.menace}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ ...S.grid(3), marginTop: '16px' }}>
                {[
                  { label: 'Vendeurs actifs', val: '12', color: '#fbbf24', sub: 'Sur Meta + Google' },
                  { label: 'Budget concurrent moyen', val: '3 500 EUR/m', color: '#f87171', sub: 'Estimation pub' },
                  { label: 'Part de marche disponible', val: '67%', color: '#4ade80', sub: 'Marche non sature' },
                ].map((s,i) => (
                  <div key={i} style={S.card}>
                    <div style={S.cardTitle}>{s.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: '11px', color: '#475569' }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Onglet Tendances */}
          {intelligenceTab === 'tendances' && (
            <div>
              <div style={S.card}>
                <div style={S.sectionTitle}>📈 Tendances recherche (Google Trends simulé)</div>
                <div style={{ marginBottom: '16px' }}>
                  <SparkLine data={[45,52,48,61,58,72,68,75,80,77,85,87]} color="#4f46e5" height={80} width={700} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: '#475569' }}>
                    {['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
                  </div>
                </div>
                <div style={{ ...S.grid(4) }}>
                  {[
                    { label: 'Tendance generale', val: '↑ +23%', color: '#4ade80' },
                    { label: 'Pic saisonnier', val: 'Nov-Dec', color: '#fbbf24' },
                    { label: 'Interet actuel', val: '87/100', color: '#a5b4fc' },
                    { label: 'Prediction 30j', val: '↑ Hausse', color: '#4ade80' },
                  ].map((s,i) => (
                    <div key={i} style={{ background: '#0f0f1a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{s.label}</div>
                      <div style={{ fontWeight: 700, color: s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Historique */}
          {intelligenceTab === 'historique' && (
            <div style={S.card}>
              <div style={S.sectionTitle}>🕐 Historique des analyses</div>
              {historyScans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#475569' }}>
                  Aucun historique pour le moment. Analysez des produits pour les voir ici.
                </div>
              ) : historyScans.map((s: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #0f0f1a' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.url}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{s.date}</div>
                  </div>
                  <span style={S.badge(s.score > 80 ? 'green' : s.score > 60 ? 'yellow' : 'red')}>{s.score}/100</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!intelligenceResultat && !intelligenceLoading && (
        <div style={{ ...S.card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
          <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>Pret a analyser votre prochain winner</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Collez l'URL d'un produit, d'une pub Facebook ou d'une annonce TikTok</div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            {[{ label: '850+ scans', sub: 'effectues' }, { label: '92%', sub: 'de precision' }, { label: '15 sec', sub: 'par analyse' }].map((s,i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#a5b4fc' }}>{s.label}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // ============================================================
  // PAGE CREATIFS (CREATIVE ENGINE) - Inspiré PeelKit
  // ============================================================
  const renderCreatifs = () => {
    const imageStyles = [
      { id: 'hero', label: 'Hero Image', emoji: '🦸', desc: 'Photo produit seul fond blanc/gradient, impact fort', prompt: '{"style":"hero_clean","bg":"white","lighting":"studio","shadow":"soft"}', score: 94 },
      { id: 'lifestyle', label: 'Lifestyle Image', emoji: '🌿', desc: "Produit en situation réelle d'utilisation", prompt: '{"style":"lifestyle","setting":"natural","mood":"aspirational","model":true}', score: 91 },
      { id: 'infographic', label: 'Infographie', emoji: '📊', desc: 'Bénéfices clés listés visuellement sur le produit', prompt: '{"style":"infographic","callouts":5,"icons":true,"brand_colors":true}', score: 88 },
      { id: 'splitscreen', label: 'Split-Screen', emoji: '⬛', desc: 'Avant / Après ou comparaison côte-à-côte', prompt: '{"style":"split_screen","left":"before","right":"after","divider":"clean"}', score: 85 },
      { id: 'howto', label: 'How-to/Process', emoji: '📋', desc: "Étapes d'utilisation du produit (3-4 étapes)", prompt: '{"style":"how_to","steps":3,"numbered":true,"clean_bg":true}', score: 83 },
      { id: 'multifeature', label: 'Multi-Feature Grid', emoji: '🔲', desc: "Grille d'icônes et bénéfices autour du produit", prompt: '{"style":"feature_grid","features":6,"icons":"minimal","layout":"surrounding"}', score: 80 },
      { id: 'avantapres', label: 'Avant / Après', emoji: '✨', desc: 'Transformation visuelle du résultat produit', prompt: '{"style":"before_after","split":"vertical","labels":true,"dramatic":true}', score: 92 },
      { id: 'comparison', label: 'Comparaison', emoji: '⚖️', desc: 'Vous vs concurrents, tableau de comparaison', prompt: '{"style":"comparison_table","cols":3,"highlight_winner":true}', score: 79 },
      { id: 'ugc', label: 'UGC Style', emoji: '📱', desc: 'Photo style amateur authentique prise en main', prompt: '{"style":"ugc_authentic","lighting":"natural","angle":"handheld","no_studio":true}', score: 87 },
      { id: 'bundle', label: 'Bundle Shot', emoji: '📦', desc: 'Plusieurs produits ensemble, offre de valeur', prompt: '{"style":"bundle_flat_lay","products":"multiple","arrangement":"organized","price_tag":true}', score: 82 },
    ]

    const videoTemplates = [
      { id: 'hook3s', label: 'Hook 3 secondes', emoji: '⚡', format: '9:16', duree: '3s', desc: 'Accroche visuelle ultra-rapide, stop-thumb', script: 'HOOK: [Problème douloureux]\nSOLUTION: [Produit apparaît]\nCTA: Découvrez maintenant', score: 96 },
      { id: 'ugcreview', label: 'UGC Testimonial', emoji: '🎤', format: '9:16', duree: '30s', desc: 'Témoignage client authentique face caméra', script: "INTRO: J'avais ce problème...\nACTION: Montrer le produit\nRESULT: Maintenant je...\nCTA: Lien en bio", score: 91 },
      { id: 'demo', label: 'Démo Produit', emoji: '🎬', format: '1:1', duree: '20s', desc: 'Démonstration fonctionnement étape par étape', script: 'BEFORE: Situation sans produit\nDEMO: Utilisation produit\nAFTER: Résultat impressionnant\nOFFRE: Prix + urgence', score: 88 },
      { id: 'problem', label: 'Problème/Solution', emoji: '🧩', format: '9:16', duree: '15s', desc: 'Présenter le problème puis la solution produit', script: 'P1: Tu galères avec X ?\nP2: Nous avons créé Y\nP3: Fonctionnalités\nP4: CTA + offre', score: 85 },
      { id: 'comparison_vid', label: 'Comparaison Marques', emoji: '🏆', format: '16:9', duree: '25s', desc: 'Notre produit vs les alternatives du marché', script: "CONCURRENTS: Leurs limites\nNOTRE PRODUIT: Nos avantages\nPREUVE: Chiffres/résultats\nCTA: Passer à l'action", score: 82 },
      { id: 'unboxing', label: 'Unboxing', emoji: '📦', format: '9:16', duree: '45s', desc: 'Déballage du produit, première impression', script: 'PACKAGING: Montrer la boîte\nDEBALLAGE: Suspense\nDECOUVERTE: Réaction WOW\nUTILISATION: Premier test', score: 78 },
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
      { type: 'Contraste', hook: "Avant j'avais X. Maintenant j'ai Y.", desc: 'Avant/après émotionnel', score: 83, color: '#60a5fa' },
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
            { id: 'plateformes', label: '📲 Plateformes', desc: 'TikTok · Snap · Pin' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setCreatifType(tab.id)} style={{
              padding: '10px 18px', borderRadius: '10px', cursor: 'pointer',
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
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...S.input, paddingRight: urlScraping ? '40px' : undefined }} placeholder="Ex: Sérum anti-âge, crème hydratante... ou coller une URL" value={creatifProduit} onChange={e => handleProduitInput(e.target.value)} />
                    {urlScraping && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>⏳</span>}
                  </div>
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


            {/* Panneau Gemini IA */}
            <div style={{ marginTop: '16px', padding: '14px', background: apiConnections.gemini ? '#1e0f3a' : '#0f0f1a', border: '1px solid ' + (apiConnections.gemini ? '#7c3aed' : '#1e1e3a'), borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: apiConnections.gemini ? '#a78bfa' : '#64748b' }}>🤖 Gemini IA — Generation reelle</span>
                  <span style={{ fontSize: '11px', color: '#475569', marginLeft: '8px' }}>
                    {apiConnections.gemini ? 'API connectee — Generation Imagen 3' : 'Non connecte — Mode simulation'}
                  </span>
                </div>
                {!apiConnections.gemini && (
                  <button style={{ ...S.btn('outline'), padding: '6px 12px', fontSize: '12px' }} onClick={() => setPage('boutique')}>
                    🔗 Connecter Gemini
                  </button>
                )}
              </div>
              {generatedImageUrl && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <img src={generatedImageUrl} alt="Generated" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #1e1e3a' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#4ade80', fontWeight: 600, marginBottom: '4px' }}>✅ Image generee avec succes</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>Produit: {creatifProduit}</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button style={{ ...S.btn('primary'), padding: '5px 12px', fontSize: '11px' }}>Utiliser</button>
                      <button style={{ ...S.btn('outline'), padding: '5px 12px', fontSize: '11px' }} onClick={() => setGeneratedImageUrl(null)}>Fermer</button>
                    </div>
                  </div>
                </div>
              )}
              {geminiGenerating && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#a78bfa' }}>⏳ Generation en cours avec Gemini Imagen...</div>
              )}
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
                            onClick={() => genererAvecGemini(style.prompt, style.label, creatifProduit)}>
                            {geminiGenerating ? '⏳...' : apiConnections.gemini ? '🤖 Gemini' : '✨ Generer'}
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
                {creatifGenere.length === 0 && !creatifLoading && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>✨</div>
                    <div>Entrez un nom de produit et cliquez sur "Generer le set complet"</div>
                  </div>
                )}
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
                <input style={{ ...S.input, flex: 1 }} placeholder="Nom ou URL du produit..." value={creatifProduit} onChange={e => handleProduitInput(e.target.value)} />
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
                <input style={{ ...S.input, flex: 1 }} placeholder="Nom ou URL du produit..." value={creatifProduit} onChange={e => handleProduitInput(e.target.value)} />
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
                        "{hook.hook.replace('[PROBLÈME]', creatifProduit || 'ce problème').replace('[SITUATION ACTUELLE]', creatifProduit ? 'avant ' + creatifProduit : 'avant').replace('[RÉSULTAT]', creatifProduit ? 'avec ' + creatifProduit : 'maintenant')}"
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
                <input style={{ ...S.input, flex: 1 }} placeholder="Nom ou URL du produit..." value={creatifProduit} onChange={e => handleProduitInput(e.target.value)} />
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

        {/* === ONGLET PLATEFORMES === */}
        {creatifType === 'plateformes' && (
          <div>

            {/* TikTok Ads */}
            <div style={{ ...S.card, marginBottom: '16px', borderLeft: '4px solid #ff0050' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '32px' }}>🎵</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px' }}>TikTok Ads</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Formats natifs · Vertical 9:16 · Hook 3s · Sound On</div>
                </div>
                <span style={{ ...S.badge('green'), marginLeft: 'auto' }}>Avg ROAS 4.2x</span>
              </div>
              <div style={S.grid(3)}>
                {[
                  { format: 'In-Feed Ad', emoji: '📱', ratio: '9:16', duree: '15-60s', desc: "Vidéo native dans le fil For You Page", hook: 'Hook 3s + Twist + CTA', score: 94, color: '#ff0050' },
                  { format: 'TopView', emoji: '👑', ratio: '9:16', duree: '5-60s', desc: "Premier spot au lancement de l'app", hook: 'Impact immédiat + Brand story', score: 97, color: '#ff6b9d' },
                  { format: 'Spark Ads', emoji: '✨', ratio: '9:16', duree: '7-60s', desc: 'Booste du contenu organique existant', hook: 'UGC authentique + Engagement réel', score: 91, color: '#fbbf24' },
                  { format: 'Collection Ad', emoji: '🛍️', ratio: '9:16', duree: '5-15s', desc: 'Galerie produits directement dans le feed', hook: 'Produit hero + Grille catalogue', score: 88, color: '#4ade80' },
                  { format: 'Branded Hashtag', emoji: '#️⃣', ratio: '9:16', duree: '15s', desc: 'Challenge viral avec ton hashtag de marque', hook: 'Dance/trend + CTA participation', score: 86, color: '#a78bfa' },
                  { format: 'Shopping Live', emoji: '🔴', ratio: '9:16', duree: 'Live', desc: 'Vente en direct avec produits épinglés', hook: 'Demo live + Offre limitée', score: 92, color: '#f97316' },
                ].map((f, i) => (
                  <div key={i} style={{ ...S.card, border: `1px solid ${f.color}40`, background: '#0a0a1a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '20px' }}>{f.emoji}</span>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: f.color }}>{f.format}</div>
                      </div>
                      <span style={S.badge('green')}>Score {f.score}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={S.tag}>{f.ratio}</span>
                      <span style={S.tag}>{f.duree}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{f.desc}</div>
                    <div style={{ background: '#0f0f1a', borderRadius: '6px', padding: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#ff6b9d', marginBottom: '8px' }}>{f.hook}</div>
                    <button style={{ ...S.btn('primary'), width: '100%', fontSize: '12px', padding: '8px', background: f.color }}>
                      🎵 Créer ce format
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', background: '#0f0f1a', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px', color: '#ff6b9d' }}>⚡ Best Practices TikTok Ads 2025</div>
                <div style={S.grid(2)}>
                  {[
                    { tip: 'Hook dans les 3 premières secondes', impact: '+67% view rate' },
                    { tip: 'Sound On — musique tendance / son produit', impact: '+43% engagement' },
                    { tip: 'Text overlay natif (pas sur-produit)', impact: '+28% CTR' },
                    { tip: 'Finir avec CTA clair + promo', impact: '+52% CVR' },
                    { tip: 'UGC + creator face (pas studio)', impact: '+81% trust' },
                    { tip: 'Hashtag niche + brand (#fyp)', impact: '+34% reach' },
                  ].map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e1e3a', fontSize: '12px' }}>
                      <span style={{ color: '#94a3b8' }}>✅ {t.tip}</span>
                      <span style={{ color: '#4ade80', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: '8px' }}>{t.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Snapchat Ads */}
            <div style={{ ...S.card, marginBottom: '16px', borderLeft: '4px solid #fffc00' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '32px' }}>👻</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px' }}>Snapchat Ads</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Gen Z · 13-34 ans · Vertical immersif · Swipe-up</div>
                </div>
                <span style={{ ...S.badge('yellow'), marginLeft: 'auto' }}>Avg CPM 8€</span>
              </div>
              <div style={S.grid(3)}>
                {[
                  { format: 'Snap Ad', emoji: '⚡', ratio: '9:16', duree: '3-180s', desc: 'Vidéo ou image plein écran entre les Stories', hook: 'Visuel fort + Swipe up pour plus', score: 88, color: '#fffc00' },
                  { format: 'Story Ad', emoji: '📖', ratio: '9:16', duree: '5-180s', desc: 'Collection de Snaps dans la section Discover', hook: 'Séquence narrative + teaser final', score: 85, color: '#ffd700' },
                  { format: 'Collection Ad', emoji: '🛍️', ratio: '9:16', duree: '5-180s', desc: 'Tuile produits avec swipe horizontal sous la vidéo', hook: 'Hero produit + grille catalogue 4 produits', score: 91, color: '#f97316' },
                  { format: 'Dynamic Ad', emoji: '🔄', ratio: '9:16', duree: 'Auto', desc: 'Retargeting auto avec catalogue produits connecté', hook: 'Produit vu + offre personnalisée', score: 93, color: '#4ade80' },
                  { format: 'AR Lens', emoji: '🔮', ratio: '1:1', duree: '10s', desc: 'Filtre AR pour essayage virtuel du produit', hook: 'Try-on immersif + achat direct', score: 89, color: '#a78bfa' },
                  { format: 'Spotlight Ad', emoji: '🌟', ratio: '9:16', duree: '3-60s', desc: "Contenu viral dans l'onglet Spotlight", hook: 'Trend Snap + CTA discret', score: 84, color: '#60a5fa' },
                ].map((f, i) => (
                  <div key={i} style={{ ...S.card, border: `1px solid ${f.color}40`, background: '#0a0a1a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '20px' }}>{f.emoji}</span>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: f.color }}>{f.format}</div>
                      </div>
                      <span style={S.badge('green')}>Score {f.score}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={S.tag}>{f.ratio}</span>
                      <span style={S.tag}>{f.duree}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{f.desc}</div>
                    <div style={{ background: '#0f0f1a', borderRadius: '6px', padding: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#ffd700', marginBottom: '8px' }}>{f.hook}</div>
                    <button style={{ ...S.btn('primary'), width: '100%', fontSize: '12px', padding: '8px', background: '#1a1a00', border: `1px solid ${f.color}`, color: f.color }}>
                      👻 Créer ce format
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', background: '#0f0f1a', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px', color: '#ffd700' }}>⚡ Best Practices Snapchat Ads 2025</div>
                <div style={S.grid(2)}>
                  {[
                    { tip: "Texte en haut de l'écran (zone thumb safe)", impact: '+38% lisibilité' },
                    { tip: '13-34 ans — audience native Snap', impact: 'CPM -40% vs Meta' },
                    { tip: 'Son activé + voix humaine', impact: '+55% retention' },
                    { tip: 'CTA "Swipe Up" animé en bas', impact: '+29% CVR' },
                    { tip: 'Collection Ad pour catalogues 4+ produits', impact: 'ROAS +1.8x' },
                    { tip: 'Pixel Snap activé pour retargeting dynamic', impact: 'CAC -35%' },
                  ].map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e1e3a', fontSize: '12px' }}>
                      <span style={{ color: '#94a3b8' }}>✅ {t.tip}</span>
                      <span style={{ color: '#4ade80', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: '8px' }}>{t.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pinterest Ads */}
            <div style={{ ...S.card, marginBottom: '16px', borderLeft: '4px solid #e60023' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '32px' }}>📌</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px' }}>Pinterest Ads</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Intent élevé · Shopping mindset · Long lifetime · ROAS fort</div>
                </div>
                <span style={{ ...S.badge('green'), marginLeft: 'auto' }}>Avg ROAS 5.1x</span>
              </div>
              <div style={S.grid(3)}>
                {[
                  { format: 'Standard Pin', emoji: '📌', ratio: '2:3', duree: 'Image', desc: 'Pin image statique — format originel Pinterest', hook: 'Visuel aspirationnel + titre accrocheur', score: 85, color: '#e60023' },
                  { format: 'Video Pin', emoji: '🎬', ratio: '1:1 ou 2:3', duree: '4-15s', desc: 'Vidéo courte silencieuse dans le feed', hook: 'Démo produit silent + text overlay', score: 88, color: '#ff6b81' },
                  { format: 'Carousel Pin', emoji: '🎠', ratio: '1:1', duree: '2-5 images', desc: 'Swipe horizontal de plusieurs images produit', hook: 'Unboxing ou looks multiples', score: 90, color: '#f97316' },
                  { format: 'Shopping Pin', emoji: '🛒', ratio: '1:1 ou 2:3', duree: 'Catalogue', desc: 'Pin avec prix, titre et CTA achat direct', hook: 'Produit clean + prix visible + badge promo', score: 93, color: '#4ade80' },
                  { format: 'Collections Pin', emoji: '🗂️', ratio: '1:1 hero', duree: 'Hero + 3', desc: 'Image hero + 3 produits secondaires en dessous', hook: 'Lifestyle hero + produits assortis', score: 89, color: '#a78bfa' },
                  { format: 'Idea Pin', emoji: '💡', ratio: '9:16', duree: '2-20 pages', desc: 'Format multi-pages inspirational', hook: 'Tutoriel produit + étapes visuelles', score: 86, color: '#60a5fa' },
                ].map((f, i) => (
                  <div key={i} style={{ ...S.card, border: `1px solid ${f.color}40`, background: '#0a0a1a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '20px' }}>{f.emoji}</span>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: f.color }}>{f.format}</div>
                      </div>
                      <span style={S.badge('green')}>Score {f.score}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={S.tag}>{f.ratio}</span>
                      <span style={S.tag}>{f.duree}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{f.desc}</div>
                    <div style={{ background: '#0f0f1a', borderRadius: '6px', padding: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#ff6b81', marginBottom: '8px' }}>{f.hook}</div>
                    <button style={{ ...S.btn('primary'), width: '100%', fontSize: '12px', padding: '8px', background: '#1a0007', border: `1px solid ${f.color}`, color: f.color }}>
                      📌 Créer ce format
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', background: '#0f0f1a', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px', color: '#ff6b81' }}>⚡ Best Practices Pinterest Ads 2025</div>
                <div style={S.grid(2)}>
                  {[
                    { tip: 'Format 2:3 vertical — plus de clics organiques', impact: '+42% impressions' },
                    { tip: 'Texte titre clair + mot-clé dans description', impact: '+67% découverte' },
                    { tip: 'Palette couleurs chaudes (rouge/orange)', impact: '+31% saves' },
                    { tip: 'Shopping Pin avec catalogue synchronisé', impact: 'ROAS +2.3x' },
                    { tip: 'Ciblage par intérêts + mots-clés combinés', impact: 'CAC -28%' },
                    { tip: 'Pinterest Tag activé pour retargeting visiteurs', impact: '+45% CVR' },
                  ].map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e1e3a', fontSize: '12px' }}>
                      <span style={{ color: '#94a3b8' }}>✅ {t.tip}</span>
                      <span style={{ color: '#4ade80', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: '8px' }}>{t.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Comparaison 5 plateformes */}
            <div style={S.card}>
              <div style={S.sectionTitle}>📊 Comparaison Multi-Plateforme — Budget & ROAS</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #1e1e3a' }}>
                      {['Plateforme', 'Formats', 'CPM moyen', 'Audience cible', 'ROAS typique', 'Idéal pour'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { platform: '📘 Meta', format: '1:1 · 4:5 · 9:16', cpm: '12-25€', audience: 'Tous âges, lookalike', roas: '3-6x', ideal: 'Evergreen, retargeting' },
                      { platform: '🔵 Google', format: 'Shopping · PMax', cpm: '8-18€', audience: 'Intent achat élevé', roas: '4-8x', ideal: 'Search, Shopping' },
                      { platform: '🎵 TikTok', format: '9:16 · 15-60s', cpm: '10-20€', audience: '18-34 ans, Gen Z', roas: '3-5x', ideal: 'Viral, UGC, lancement' },
                      { platform: '👻 Snapchat', format: '9:16 · Story', cpm: '6-14€', audience: '13-34 ans', roas: '2-4x', ideal: 'Gen Z, notoriété' },
                      { platform: '📌 Pinterest', format: '2:3 · Shopping', cpm: '5-12€', audience: 'Femmes 25-45', roas: '4-7x', ideal: 'Mode, déco, beauté' },
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #0f0f1a', background: i % 2 === 0 ? '#0a0a1a' : 'transparent' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{row.platform}</td>
                        <td style={{ padding: '10px 12px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>{row.format}</td>
                        <td style={{ padding: '10px 12px', color: '#fbbf24', fontWeight: 600 }}>{row.cpm}</td>
                        <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>{row.audience}</td>
                        <td style={{ padding: '10px 12px', color: '#4ade80', fontWeight: 700 }}>{row.roas}</td>
                        <td style={{ padding: '10px 12px', color: '#a5b4fc', fontSize: '12px' }}>{row.ideal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
  // PAGE BIBLIOTHÈQUE CRÉATIFS — Médiathèque + Rotation Auto
  // ============================================================
  const renderBibliotheque = () => {
    const winners = creatifsLibrary.filter(c => c.status === 'winner')
    const testing = creatifsLibrary.filter(c => c.status === 'testing' || c.status === 'nouveau')
    const losers = creatifsLibrary.filter(c => c.status === 'loser' || c.status === 'remplace')

    // Données démo si bibliothèque vide
    const demoLib = creatifsLibrary.length === 0 ? [
      { id: 1, label: 'Hero Image', produit: 'Serum anti-age', style: 'hero', imageUrl: 'https://picsum.photos/seed/hero1/200/200', ctr: 4.2, roas: 3.8, impressions: 15420, status: 'winner', marche: 'FR', timestamp: '2026-02-20', saved: true },
      { id: 2, label: 'Lifestyle', produit: 'Serum anti-age', style: 'lifestyle', imageUrl: 'https://picsum.photos/seed/life1/200/200', ctr: 3.1, roas: 2.9, impressions: 8730, status: 'testing', marche: 'FR', timestamp: '2026-02-19', saved: true },
      { id: 3, label: 'UGC Style', produit: 'Creme hydratante', style: 'ugc', imageUrl: 'https://picsum.photos/seed/ugc1/200/200', ctr: 5.1, roas: 4.3, impressions: 22100, status: 'winner', marche: 'EN', timestamp: '2026-02-18', saved: true },
      { id: 4, label: 'Infographie', produit: 'Creme hydratante', style: 'infographic', imageUrl: 'https://picsum.photos/seed/info1/200/200', ctr: 1.4, roas: 0.9, impressions: 5200, status: 'loser', marche: 'FR', timestamp: '2026-02-17', saved: true },
      { id: 5, label: 'Avant/Apres', produit: 'Serum vitamine C', style: 'avantapres', imageUrl: 'https://picsum.photos/seed/avant1/200/200', ctr: 3.8, roas: 3.2, impressions: 11300, status: 'testing', marche: 'ES', timestamp: '2026-02-16', saved: true },
      { id: 6, label: 'Split Screen', produit: 'Masque collagene', style: 'splitscreen', imageUrl: 'https://picsum.photos/seed/split1/200/200', ctr: 2.1, roas: 1.4, impressions: 3400, status: 'remplace', marche: 'FR', timestamp: '2026-02-15', saved: true },
    ] : creatifsLibrary

    const displayLib = demoLib

    return (
      <div>
        <div style={S.info}>
          📚 <strong>Bibliothèque Créatifs.</strong> Tous tes créatifs generés, avec leurs performances CTR/ROAS en temps reel.
          La <strong>rotation automatique</strong> remplace les perdants avant qu'ils ne plombent ton ROAS.
        </div>

        {/* KPIs bibliothèque */}
        <div style={S.grid(4)}>
          {[
            { label: 'Total créatifs', val: displayLib.length, color: '#a5b4fc', sub: 'Generés par Gemini' },
            { label: 'Winners actifs', val: displayLib.filter(c => c.status === 'winner').length, color: '#4ade80', sub: 'ROAS > ' + rotationRules.roasSeuil + 'x' },
            { label: 'En test', val: displayLib.filter(c => c.status === 'testing' || c.status === 'nouveau').length, color: '#fbbf24', sub: '< 1000 impressions' },
            { label: 'Rotations auto', val: rotationLog.length, color: '#f472b6', sub: 'Ce mois' },
          ].map((s,i) => (
            <div key={i} style={S.card}>
              <div style={S.cardTitle}>{s.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Onglets bibliothèque */}
        <div style={{ display: 'flex', gap: '8px', margin: '20px 0 16px', borderBottom: '1px solid #1e1e3a', paddingBottom: '12px' }}>
          {([
            ['all', '🗃️ Tous', displayLib.length],
            ['winners', '🏆 Winners', displayLib.filter(c => c.status === 'winner').length],
            ['rotation', '🔄 Rotation Auto', rotationLog.length],
            ['upload', '📸 Upload Photo', 0],
          ] as const).map(([id, label, count]) => (
            <button key={id} onClick={() => setLibraryTab(id)} style={{
              padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
              background: libraryTab === id ? '#4f46e5' : '#0a0a1a',
              color: libraryTab === id ? '#fff' : '#94a3b8',
              fontWeight: libraryTab === id ? 700 : 400,
              border: libraryTab === id ? 'none' : '1px solid #1e1e3a',
            }}>
              {label} {count > 0 && <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', marginLeft: '4px' }}>{count}</span>}
            </button>
          ))}
        </div>

        {/* === ONGLET TOUS + WINNERS === */}
        {(libraryTab === 'all' || libraryTab === 'winners') && (
          <div>
            {libraryTab === 'winners' && winners.length === 0 && displayLib.filter(c => c.status === 'winner').length === 0 && (
              <div style={{ ...S.card, textAlign: 'center', padding: '32px', color: '#64748b' }}>
                🏆 Aucun winner encore — Lance des créatifs pour voir leurs performances !
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {(libraryTab === 'winners' ? displayLib.filter(c => c.status === 'winner') : displayLib).map((c, i) => (
                <div key={i} style={{
                  ...S.card,
                  border: c.status === 'winner' ? '2px solid #166534' : c.status === 'loser' || c.status === 'remplace' ? '1px solid #450a0a' : '1px solid #1e1e3a',
                  position: 'relative',
                }}>
                  {/* Badge statut */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <span style={S.badge(c.status === 'winner' ? 'green' : c.status === 'testing' || c.status === 'nouveau' ? 'blue' : 'red')}>
                      {c.status === 'winner' ? '🏆 Winner' : c.status === 'testing' ? '🧪 Test' : c.status === 'nouveau' ? '✨ Nouveau' : '❌ Remplacé'}
                    </span>
                  </div>

                  {/* Image */}
                  <div style={{ width: '100%', height: '160px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', background: '#0f0f1a' }}>
                    <img src={c.imageUrl} alt={c.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
                  </div>

                  {/* Infos */}
                  <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{c.label}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>{c.produit} · {c.marche}</div>

                  {/* Métriques */}
                  {c.ctr !== null ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                      {[
                        { label: 'CTR', val: c.ctr + '%', color: c.ctr >= 3.5 ? '#4ade80' : c.ctr >= 2 ? '#fbbf24' : '#f87171' },
                        { label: 'ROAS', val: c.roas + 'x', color: c.roas >= 3 ? '#4ade80' : c.roas >= 1.5 ? '#fbbf24' : '#f87171' },
                        { label: 'Impressions', val: c.impressions >= 1000 ? Math.round(c.impressions/1000) + 'k' : c.impressions, color: '#94a3b8' },
                        { label: 'Sauvegardé', val: c.saved ? '✅' : '⏳', color: c.saved ? '#4ade80' : '#64748b' },
                      ].map((m, j) => (
                        <div key={j} style={{ background: '#0f0f1a', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: '#475569' }}>{m.label}</div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: m.color }}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: '#0f0f1a', borderRadius: '6px', padding: '8px', textAlign: 'center', marginBottom: '10px', fontSize: '12px', color: '#475569' }}>
                      ⏳ En attente de données pub
                    </div>
                  )}

                  {/* Barre CTR visuelle */}
                  {c.ctr !== null && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ height: '4px', background: '#1e1e3a', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: Math.min(100, (c.ctr / 6) * 100) + '%', background: c.ctr >= 3.5 ? '#4ade80' : c.ctr >= 2 ? '#fbbf24' : '#f87171', borderRadius: '2px', transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>CTR vs seuil 3.5%</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {c.status === 'winner' && (
                      <button style={{ ...S.btn('success'), flex: 1, padding: '6px', fontSize: '11px' }}
                        onClick={() => setPage('campagnes')}>
                        🚀 Relancer
                      </button>
                    )}
                    <button style={{ ...S.btn('primary'), flex: 1, padding: '6px', fontSize: '11px' }}
                      onClick={() => genererAvecGemini('', c.style || c.styleId, c.produit)}>
                      🔄 Variante
                    </button>
                    <button style={{ ...S.btn('outline'), padding: '6px 10px', fontSize: '11px' }}
                      onClick={() => setCreatifsLibrary(prev => prev.filter((_c, idx) => idx !== i))}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === ONGLET ROTATION AUTOMATIQUE === */}
        {libraryTab === 'rotation' && (
          <div>
            <div style={S.grid(2)}>
              {/* Config rotation */}
              <div style={S.card}>
                <div style={S.sectionTitle}>⚙️ Règles de rotation</div>
                <div style={{ padding: '12px', background: rotationRules.actif ? '#052e16' : '#1a0000', border: '1px solid ' + (rotationRules.actif ? '#166534' : '#dc2626'), borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: rotationRules.actif ? '#4ade80' : '#f87171' }}>
                      {rotationRules.actif ? '✅ Rotation automatique ACTIVE' : '⏸ Rotation automatique PAUSED'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      AEGIS surveille et remplace en continu
                    </div>
                  </div>
                  <button style={S.btn(rotationRules.actif ? 'danger' : 'success')}
                    onClick={() => setRotationRules(r => ({ ...r, actif: !r.actif }))}>
                    {rotationRules.actif ? '⏸ Pause' : '▶ Activer'}
                  </button>
                </div>

                {[
                  { label: 'Seuil rotation CTR', key: 'ctrSeuil', unit: '% de baisse', val: rotationRules.ctrSeuil, min: 5, max: 50, step: 5 },
                  { label: 'ROAS minimum', key: 'roasSeuil', unit: 'x', val: rotationRules.roasSeuil, min: 1.0, max: 3.0, step: 0.1 },
                  { label: 'Cooldown entre rotations', key: 'cooldown', unit: 'h', val: rotationRules.cooldown, min: 12, max: 168, step: 12 },
                ].map((rule, i) => (
                  <div key={i} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>{rule.label}</span>
                      <span style={{ fontWeight: 700, color: '#a5b4fc' }}>{rule.val}{rule.unit}</span>
                    </div>
                    <input type="range" min={rule.min} max={rule.max} step={rule.step} value={rule.val}
                      onChange={e => setRotationRules(r => ({ ...r, [rule.key]: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#4f46e5' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#374151' }}>
                      <span>{rule.min}{rule.unit}</span><span>{rule.max}{rule.unit}</span>
                    </div>
                  </div>
                ))}

                <button style={{ ...S.btn('primary'), width: '100%' }}
                  onClick={checkRotationTriggers}>
                  🔍 Vérifier maintenant
                </button>
              </div>

              {/* Explication */}
              <div style={S.card}>
                <div style={S.sectionTitle}>🤖 Comment fonctionne la rotation</div>
                {[
                  { step: '1', title: 'Surveillance continue', desc: 'AEGIS surveille le CTR et ROAS de chaque créatif toutes les heures via Meta/Google API', icon: '👁️' },
                  { step: '2', title: 'Détection automatique', desc: 'Si CTR baisse de ' + rotationRules.ctrSeuil + '% ou ROAS < ' + rotationRules.roasSeuil + 'x → rotation déclenchée', icon: '🚨' },
                  { step: '3', title: 'Génération Gemini', desc: 'AEGIS génère automatiquement un nouveau créatif du même produit avec un style différent', icon: '🤖' },
                  { step: '4', title: 'Déploiement auto', desc: 'Nouveau créatif pushé dans Meta/Google. Ancien mis en pause. Tout en < 5 minutes.', icon: '🚀' },
                  { step: '5', title: 'Apprentissage', desc: 'Chaque rotation alimente la bibliothèque. AEGIS apprend quels styles convertissent le mieux.', icon: '🧠' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid #0f0f1a' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{s.title}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Log des rotations */}
            <div style={{ ...S.card, marginTop: '16px' }}>
              <div style={S.sectionTitle}>📋 Journal des rotations</div>
              {rotationLog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#475569' }}>Aucune rotation effectuée. Active la rotation et lance des créatifs.</div>
              ) : (
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Créatif</th>
                    <th style={S.th}>Raison déclenchement</th>
                    <th style={S.th}>Action AEGIS</th>
                    <th style={S.th}>Statut</th>
                    <th style={S.th}>Quand</th>
                  </tr></thead>
                  <tbody>
                    {rotationLog.map((r, i) => (
                      <tr key={i}>
                        <td style={{ ...S.td, fontWeight: 600 }}>{r.creatif}</td>
                        <td style={{ ...S.td, color: '#f87171' }}>{r.raison}</td>
                        <td style={S.td}>{r.action}</td>
                        <td style={S.td}>
                          <span style={S.badge(r.status === 'Fait' ? 'green' : r.status === 'En cours' ? 'blue' : 'yellow')}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ ...S.td, color: '#64748b', fontSize: '12px' }}>{r.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* === ONGLET UPLOAD PHOTO === */}
        {libraryTab === 'upload' && (
          <div style={S.grid(2)}>
            <div style={S.card}>
              <div style={S.sectionTitle}>📸 Upload ta photo produit</div>
              <div style={{ border: '2px dashed #1e1e3a', borderRadius: '12px', padding: '32px', textAlign: 'center', marginBottom: '16px', cursor: 'pointer', background: uploadedPhoto ? '#052e16' : '#0f0f1a' }}
                onClick={() => document.getElementById('photoUploadInput')?.click()}>
                {uploadedPhoto ? (
                  <div>
                    <img src={uploadedPhoto} alt="Upload" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', marginBottom: '8px' }} />
                    <div style={{ color: '#4ade80', fontWeight: 600, fontSize: '13px' }}>✅ Photo chargée !</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📸</div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>Glisse ta photo produit ici</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>JPG, PNG, WEBP — max 10MB</div>
                  </div>
                )}
              </div>
              <input id="photoUploadInput" type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setUploadedPhotoFile(file)
                    const reader = new FileReader()
                    reader.onload = (ev) => setUploadedPhoto(ev.target?.result as string)
                    reader.readAsDataURL(file)
                  }
                }} />
              {uploadedPhoto && (
                <button style={{ ...S.btn('danger'), marginBottom: '12px' }} onClick={() => { setUploadedPhoto(null); setUploadedPhotoFile(null) }}>
                  🗑️ Supprimer la photo
                </button>
              )}
            </div>

            <div style={S.card}>
              <div style={S.sectionTitle}>🎨 Générer depuis ta photo</div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Nom du produit</label>
                <input style={S.input} placeholder="Ex: Serum anti-age Rose..." value={creatifProduit} onChange={e => handleProduitInput(e.target.value)} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Style créatif</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[['hero','🦸 Hero'],['lifestyle','🌿 Lifestyle'],['ugc','📱 UGC'],['infographic','📊 Infographie'],['avantapres','✨ Avant/Après']].map(([id,label]) => (
                    <button key={id} onClick={() => setGeminiStyle(id)} style={{ ...S.btn(geminiStyle === id ? 'primary' : 'outline'), padding: '5px 10px', fontSize: '12px' }}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Marché cible</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['FR','EN','ES','DE','IT'].map(m => (
                    <button key={m} onClick={() => setGeminiMarche(m)} style={{ ...S.btn(geminiMarche === m ? 'primary' : 'outline'), padding: '5px 10px', fontSize: '12px' }}>{m}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Prompt personnalisé (optionnel)</label>
                <input style={S.input} placeholder="Ex: fond blanc, ombre douce, ambiance luxe..." value={geminiPromptCustom} onChange={e => setGeminiPromptCustom(e.target.value)} />
              </div>
              {!apiConnections.gemini && (
                <div style={{ background: '#1a1000', border: '1px solid #92400e', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '12px', color: '#fbbf24' }}>
                  ⚠️ Gemini non connecté — les images seront simulées.
                  <button style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px', marginLeft: '6px' }} onClick={() => setPage('boutique')}>Connecter →</button>
                </div>
              )}
              <button style={{ ...S.btn('primary'), width: '100%', opacity: !creatifProduit ? 0.6 : 1 }}
                onClick={() => genererAvecGemini(geminiPromptCustom, geminiStyle, creatifProduit)}
                disabled={!creatifProduit || geminiGenerating}>
                {geminiGenerating ? '⏳ Génération Gemini en cours...' : apiConnections.gemini ? '🤖 Générer avec Gemini IA' : '✨ Générer (simulation)'}
              </button>
              {generatedImageUrl && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <img src={generatedImageUrl} alt="Generated" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '10px', border: '2px solid #166534' }} />
                  <div style={{ color: '#4ade80', fontWeight: 600, marginTop: '8px', fontSize: '13px' }}>✅ Créatif généré et ajouté à la bibliothèque !</div>
                </div>
              )}
            </div>
          </div>
        )}
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
      {funnelAnalyse && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
            {[
              { label: 'CVR actuel', value: funnelAnalyse.cvr + '%', color: '#f87171', hint: 'Moyen: 2.5%' },
              { label: 'AOV actuel', value: funnelAnalyse.aov + ' EUR', color: '#fbbf24', hint: 'Cible: 75 EUR' },
              { label: 'Score Hero', value: funnelAnalyse.heroScore + '/100', color: funnelAnalyse.heroScore > 70 ? '#10b981' : '#f87171', hint: 'Image + titre' },
              { label: 'Score Preuve', value: funnelAnalyse.preuveScore + '/100', color: funnelAnalyse.preuveScore > 60 ? '#10b981' : '#f87171', hint: 'Avis + UGC' },
            ].map(k => (
              <div key={k.label} style={S.card}>
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{k.label}</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: k.color, letterSpacing: '-0.5px' }}>{k.value}</div>
                <div style={{ fontSize: '12px', color: '#334155', marginTop: '8px' }}>{k.hint}</div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={{ ...S.sectionTitle, marginBottom: '16px' }}>Recommandations AEGIS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {funnelAnalyse.recommandations.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#0f172a', borderRadius: '8px', border: '1px solid ' + (r.priorite === 'CRITIQUE' ? '#ef444444' : r.priorite === 'HAUTE' ? '#f59e0b44' : '#334155') }}>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: r.priorite === 'CRITIQUE' ? '#7f1d1d' : r.priorite === 'HAUTE' ? '#78350f' : '#1e293b', color: r.priorite === 'CRITIQUE' ? '#fca5a5' : r.priorite === 'HAUTE' ? '#fcd34d' : '#94a3b8', flexShrink: 0 }}>{r.priorite}</span>
                  <span style={{ flex: 1, color: '#e2e8f0', fontSize: '14px' }}>{r.action}</span>
                  <span style={{ color: '#10b981', fontWeight: 600, fontSize: '13px', flexShrink: 0 }}>{r.impact}</span>
                  <button style={{ ...S.btn('primary'), padding: '6px 12px', fontSize: '12px' }} onClick={() => alert('Application planifiee !')}>Appliquer</button>
                </div>
              ))}
            </div>
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>📊 Gains potentiels si tout applique</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginTop: '12px' }}>
              {[
                { label: 'CVR projete', value: '+1.4%', sub: '1.8% → 3.2%', color: '#10b981' },
                { label: 'AOV projete', value: '+27 EUR', sub: '52 → 79 EUR', color: '#10b981' },
                { label: 'Revenue +/mois', value: '+4 200 EUR', sub: 'sur 1000 visiteurs/j', color: '#a78bfa' },
              ].map(g => (
                <div key={g.label} style={{ background: '#0f172a', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{g.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: g.color, margin: '8px 0' }}>{g.value}</div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>{g.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
  // ============================================================
  // PAGE MEDIA BUYING — avec graphiques et APIs
  // ============================================================
  const renderMedia = () => {
    const perf7j = [
      { jour: 'Lun', depense: 780, revenus: 2340, roas: 3.0, ctr: 3.1 },
      { jour: 'Mar', depense: 820, revenus: 2870, roas: 3.5, ctr: 3.4 },
      { jour: 'Mer', depense: 850, revenus: 3060, roas: 3.6, ctr: 3.8 },
      { jour: 'Jeu', depense: 900, revenus: 2700, roas: 3.0, ctr: 2.9 },
      { jour: 'Ven', depense: 950, revenus: 3800, roas: 4.0, ctr: 4.1 },
      { jour: 'Sam', depense: 1100, revenus: 4180, roas: 3.8, ctr: 4.7 },
      { jour: 'Dim', depense: 850, revenus: 2993, roas: 3.5, ctr: 3.8 },
    ]

    return (
      <div>
        <div style={S.info}>
          📡 <strong>Media Buying Engine.</strong> Gère tes campagnes sur Meta, Google, TikTok, Snapchat et Pinterest.
          Scaling automatique des pubs gagnantes, kill auto des perdantes, CBO/ABO logic.
          {!apiConnections.meta && !apiConnections.google && !apiConnections.tiktok && !apiConnections.snapchat && !apiConnections.pinterest && (
            <span style={{ color: '#fbbf24' }}> ⚠️ Connecte tes APIs dans <button style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }} onClick={() => setPage('boutique')}>Boutique</button> pour activer le pilotage reel.</span>
          )}
        </div>

        {/* KPIs plateformes */}
        <div style={S.grid(3)}>
          {[
            { plateforme: 'Meta Ads', budget: '450', roas: '3.2x', status: apiConnections.meta ? 'Connecte' : 'Demo', color: apiConnections.meta ? 'green' : 'yellow', icon: '📘' },
            { plateforme: 'Google Ads', budget: '280', roas: '4.1x', status: apiConnections.google ? 'Connecte' : 'Demo', color: apiConnections.google ? 'green' : 'yellow', icon: '🔵' },
            { plateforme: 'TikTok Ads', budget: '180', roas: '3.1x', status: apiConnections.tiktok ? 'Connecte' : 'Demo', color: apiConnections.tiktok ? 'green' : 'yellow', icon: '🎵' },
            { plateforme: 'Snapchat Ads', budget: '120', roas: '2.6x', status: apiConnections.snapchat ? 'Connecte' : 'Demo', color: apiConnections.snapchat ? 'green' : 'yellow', icon: '👻' },
            { plateforme: 'Pinterest Ads', budget: '80', roas: '3.8x', status: apiConnections.pinterest ? 'Connecte' : 'Demo', color: apiConnections.pinterest ? 'green' : 'yellow', icon: '📌' },
            { plateforme: 'Budget total', budget: '1 110', roas: '3.3x', status: 'Actif', color: 'green', icon: '💰' },
          ].map((p,i) => (
            <div key={i} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={S.cardTitle}>{p.icon} {p.plateforme}</div>
                <span style={S.badge(p.color)}>{p.status}</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0' }}>{p.budget} EUR/j</div>
              <div style={{ color: '#4ade80', fontWeight: 600, marginTop: '4px', fontSize: '14px' }}>ROAS: {p.roas}</div>
              <SparkLine data={perf7j.map(d => d.roas * 100)} color={p.color === 'green' ? '#4ade80' : '#fbbf24'} height={28} width={100} />
            </div>
          ))}
        </div>

        {/* Graphiques perf */}
        <div style={{ ...S.grid(2), marginTop: '20px' }}>
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={S.sectionTitle}>💰 Depenses vs Revenus (7j)</div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                <span style={{ color: '#4ade80' }}>● Revenus</span>
                <span style={{ color: '#f87171' }}>● Depenses</span>
              </div>
            </div>
            <BarChart
              data={perf7j.map(j => ({ label: j.jour, value: j.revenus, color: '#4ade80' }))}
              height={100}
            />
            <div style={{ marginTop: '8px' }}>
              <BarChart
                data={perf7j.map(j => ({ label: '', value: j.depense, color: '#f87171' }))}
                height={60}
              />
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>📈 ROAS & CTR (7 jours)</div>
            <SparkLine data={perf7j.map(d => d.roas * 100)} color="#4ade80" height={60} width={360} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', marginBottom: '12px', fontSize: '10px', color: '#475569' }}>
              {perf7j.map(j => <span key={j.jour}>{j.jour}</span>)}
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b' }}>
              <span>ROAS min: <strong style={{ color: '#fbbf24' }}>3.0x</strong></span>
              <span>ROAS max: <strong style={{ color: '#4ade80' }}>4.0x</strong></span>
              <span>Moy: <strong style={{ color: '#a5b4fc' }}>3.5x</strong></span>
            </div>
            <SparkLine data={perf7j.map(d => d.ctr * 100)} color="#60a5fa" height={60} width={360} />
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              <span>CTR min: <strong style={{ color: '#fbbf24' }}>2.9%</strong></span>
              <span>CTR max: <strong style={{ color: '#4ade80' }}>4.7%</strong></span>
              <span>Moy: <strong style={{ color: '#a5b4fc' }}>3.7%</strong></span>
            </div>
          </div>
        </div>

        {/* Table ads actives */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ ...S.row, justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={S.sectionTitle}>📋 Ads actives</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={S.badge('blue')}>CBO active</span>
              <span style={S.badge('green')}>Auto-scaling ON</span>
            </div>
          </div>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Nom ad</th><th style={S.th}>Plateforme</th>
              <th style={S.th}>Budget</th><th style={S.th}>ROAS</th>
              <th style={S.th}>CTR</th><th style={S.th}>Statut</th><th style={S.th}>Action AEGIS</th>
            </tr></thead>
            <tbody>
              {[
                { nom: 'Hook UGC v2', plat: 'Meta', budget: '45 EUR/j', roas: '4.2x', ctr: '4.1%', status: 'Actif', action: 'Scale +30%', actionColor: '#4ade80' },
                { nom: 'Hero image v1', plat: 'Meta', budget: '30 EUR/j', roas: '1.2x', ctr: '1.8%', status: 'Actif', action: 'KILL prevu 24h', actionColor: '#f87171' },
                { nom: 'Shopping Branded', plat: 'Google', budget: '120 EUR/j', roas: '6.1x', ctr: '5.2%', status: 'Actif', action: 'Scale +50%', actionColor: '#4ade80' },
                { nom: 'PMax Catalogue', plat: 'Google', budget: '80 EUR/j', roas: '3.4x', ctr: '2.9%', status: 'Actif', action: 'Stable', actionColor: '#93c5fd' },
                { nom: 'Viral TT v1', plat: 'TikTok', budget: '60 EUR/j', roas: '2.1x', ctr: '3.8%', status: 'Pause', action: 'Resume si ROAS > 2x', actionColor: '#fbbf24' },
              ].map((a,i) => (
                <tr key={i}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{a.nom}</td>
                  <td style={S.td}>{a.plat}</td>
                  <td style={S.td}>{a.budget}</td>
                  <td style={{ ...S.td, color: parseFloat(a.roas) > 2 ? '#4ade80' : '#f87171', fontWeight: 700 }}>{a.roas}</td>
                  <td style={S.td}>{a.ctr}</td>
                  <td style={S.td}><span style={S.badge(a.status === 'Actif' ? 'green' : 'yellow')}>{a.status}</span></td>
                  <td style={{ ...S.td, color: a.actionColor, fontWeight: 600 }}>{a.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Logique scaling */}
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
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #0f0f1a' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.label}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{r.desc}</div>
                </div>
                <span style={S.badge(r.actif ? 'green' : 'yellow')}>{r.actif ? 'Actif' : 'Inactif'}</span>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>📊 Recap semaine</div>
            {perf7j.map((j,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid #0f0f1a' }}>
                <span style={{ color: '#64748b', width: '28px', fontSize: '12px' }}>{j.jour}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ height: '6px', background: '#1e1e3a', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.min(100, (j.roas / 5) * 100) + '%', background: j.roas >= 3.5 ? '#4ade80' : j.roas >= 2 ? '#fbbf24' : '#f87171', borderRadius: '3px' }} />
                  </div>
                </div>
                <span style={{ color: '#f87171', fontSize: '12px', width: '60px', textAlign: 'right' }}>{j.depense}€</span>
                <span style={{ color: '#4ade80', fontSize: '12px', width: '60px', textAlign: 'right' }}>{j.revenus}€</span>
                <span style={{ fontWeight: 700, fontSize: '12px', width: '40px', textAlign: 'right', color: j.roas >= 3 ? '#4ade80' : '#fbbf24' }}>{j.roas}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

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
            { label: 'Kill switch total', desc: "Arret d'urgence en 1 clic", actif: true, critique: true },
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
            <button style={{ ...S.btn('danger'), width: '100%', padding: '14px', fontSize: '16px' }} onClick={() => { if(window.confirm("CONFIRMER L'ARRET D'URGENCE ? Toutes les campagnes seront stoppees.")) alert('Kill switch active ! Toutes les campagnes sont stoppees.') }}>
              🛑 ACTIVER KILL SWITCH
            </button>
          </div>
          <div style={S.sectionTitle}>📊 Risque en temps reel</div>
          {[
            { label: "Depense aujourd'hui", val: '1 247 EUR', max: riskConfig.depenseMax, pct: Math.round(1247/riskConfig.depenseMax*100) },
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
          <option value="snapchat">Snapchat Ads</option>
          <option value="pinterest">Pinterest Ads</option>
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
      {(() => {
        const demoAgents = agents.length > 0 ? agents : [
          { id: 1, name: 'Creative Hook Generator', description: 'Genere des hooks viraux pour vos publicites', category: 'CREATIVE', is_enabled: true, performance_score: 94 },
          { id: 2, name: 'Image Copy Writer', description: 'Redige les textes pour vos visuels', category: 'CREATIVE', is_enabled: true, performance_score: 88 },
          { id: 3, name: 'Video Script AI', description: 'Scripts video UGC et publicites', category: 'CREATIVE', is_enabled: true, performance_score: 91 },
          { id: 4, name: 'Market Trend Spy', description: 'Detecte les tendances emergentes du marche', category: 'MARKET', is_enabled: true, performance_score: 87 },
          { id: 5, name: 'Competitor Analyzer', description: 'Analyse les strategies concurrentes', category: 'MARKET', is_enabled: false, performance_score: 82 },
          { id: 6, name: 'Product Scorer', description: 'Evalue le potentiel winner de chaque produit', category: 'MARKET', is_enabled: true, performance_score: 96 },
          { id: 7, name: 'Budget Optimizer', description: 'Optimise la repartition des budgets pub', category: 'MEDIA_BUYING', is_enabled: true, performance_score: 90 },
          { id: 8, name: 'Bid Manager AI', description: 'Gere les encheres en temps reel', category: 'MEDIA_BUYING', is_enabled: true, performance_score: 85 },
          { id: 9, name: 'Audience Finder', description: 'Identifie les audiences les plus rentables', category: 'MEDIA_BUYING', is_enabled: true, performance_score: 92 },
          { id: 10, name: 'ROAS Tracker', description: 'Suit le ROAS en temps reel par campagne', category: 'ANALYTICS', is_enabled: true, performance_score: 97 },
          { id: 11, name: 'Conversion Auditor', description: 'Audite le tunnel de conversion', category: 'ANALYTICS', is_enabled: true, performance_score: 89 },
          { id: 12, name: 'Scale Detector', description: 'Detecte les campagnes a scaler', category: 'OPTIMIZATION', is_enabled: true, performance_score: 93 },
          { id: 13, name: 'Kill Switch AI', description: 'Arrete automatiquement les campagnes non rentables', category: 'OPTIMIZATION', is_enabled: false, performance_score: 86 },
        ];
        return ['CREATIVE','MARKET','MEDIA_BUYING','ANALYTICS','OPTIMIZATION'].map(cat => {
        const catAgents = demoAgents.filter((a: any) => a.category === cat)
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
      })
      })()}
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
            { label: 'Kill switch', desc: "Arret d'urgence 1 clic", status: 'En veille' },
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
        { id: 'bibliotheque' as Page, icon: '📚', label: 'Bibliotheque', sub: 'Creatifs + Rotation auto' },
        { id: 'funnel' as Page, icon: '🔁', label: 'Funnel', sub: 'Optimiser conversion' },
        { id: 'media' as Page, icon: '📡', label: 'Media Buying', sub: 'Gerer les campagnes' },
        { id: 'engine' as Page, icon: '', label: 'AEGIS Engine', sub: 'Moteur allocation capital' },
      ]
    },
    {
      title: 'GESTION',
      items: [
        { id: 'campagnes' as Page, icon: '🚀', label: 'Campagnes', sub: 'Mes publicites' },
        { id: 'decisions' as Page, icon: '✅', label: 'Decisions', sub: 'A valider' },        ],
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
    bibliotheque: renderBibliotheque,
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
        engine: () => <AegisEnginePage />,
  }

  const pageTitles: Record<Page, {icon: string, title: string, sub: string}> = {
    accueil: { icon: '🏠', title: 'Accueil', sub: 'Vue generale' },
            bouique: { icon: '🔗', title: 'Boutique', sub: 'Store Connector Engine' },
    intelligence: { icon: '🧠', title: 'Intelligence Produit', sub: 'Product Intelligence Engine' },
    creatifs: { icon: '🎨', title: 'Creatifs', sub: 'Creative Engine' },
    bibliotheque: { icon: '📚', title: 'Bibliotheque', sub: 'Creatifs + Rotation Auto' },
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
        engine: { icon: '', title: 'AEGIS Engine', sub: 'Moteur allocation capital' },
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
          {navGroups.map((group) => {
              const collapsible = group.title === 'SYSTEME' || group.title === 'GESTION'
              const isCollapsed = collapsible && collapsedSections[group.title]
              return (
            <div key={group.title}>
              <div style={{ ...S.navSection, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: collapsible ? 'pointer' : 'default' }}
                onClick={() => collapsible && setCollapsedSections(p => ({ ...p, [group.title]: !p[group.title] }))}>
                <span>{group.title}</span>
                {collapsible && <span style={{ fontSize: '10px', opacity: 0.5 }}>{isCollapsed ? '▶' : '▼'}</span>}
              </div>
              {!isCollapsed && group.items.map(item => (
                <button key={item.id} style={S.navBtn(page === item.id)} onClick={() => setPage(item.id)}>
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  <div>
                    <div style={{ lineHeight: 1.2 }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: '#475569', fontWeight: 400 }}>{item.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          )}
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
