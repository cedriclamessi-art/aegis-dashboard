-- ============================================================
-- AEGIS - Setup complet base de donnees Supabase
-- A executer dans Supabase SQL Editor (une seule fois)
-- ============================================================

-- 1. TABLE AGENTS REGISTRY
CREATE TABLE IF NOT EXISTS agents_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'AEGIS-OWNER',
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'MARKET',
  description TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLE PIPELINES (campagnes)
CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'AEGIS-OWNER',
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed','failed','paused')),
  total_budget NUMERIC(12,2) DEFAULT 500,
  spent_budget NUMERIC(12,2) DEFAULT 0,
  target_roas NUMERIC(6,2) DEFAULT 1.5,
  roas NUMERIC(6,2),
  platform TEXT DEFAULT 'meta',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE ACTIONS QUEUE
CREATE TABLE IF NOT EXISTS actions_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'AEGIS-OWNER',
  agent_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed','failed')),
  priority INTEGER DEFAULT 5,
  payload JSONB DEFAULT '{}',
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE METRICS
CREATE TABLE IF NOT EXISTS metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'AEGIS-OWNER',
  period_date DATE NOT NULL DEFAULT CURRENT_DATE,
  revenue NUMERIC(14,2) DEFAULT 0,
  spend NUMERIC(14,2) DEFAULT 0,
  roas NUMERIC(6,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  platform TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE RISK EVENTS
CREATE TABLE IF NOT EXISTS risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'AEGIS-OWNER',
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  description TEXT,
  triggered_value NUMERIC,
  threshold_value NUMERIC,
  auto_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VUES UTILISEES PAR LE FRONTEND

CREATE OR REPLACE VIEW v_pipelines AS
SELECT
  p.id,
  p.tenant_id,
  p.product_id,
  p.product_name,
  p.status,
  p.total_budget,
  p.spent_budget,
  p.roas,
  p.target_roas,
  p.platform,
  p.created_at,
  ROUND(CASE WHEN p.spent_budget > 0 THEN p.spent_budget / p.total_budget * 100 ELSE 0 END, 1) AS budget_used_percent
FROM pipelines p;

CREATE OR REPLACE VIEW v_actions AS
SELECT
  a.id,
  a.tenant_id,
  a.agent_name,
  a.action_type,
  a.status,
  a.priority,
  a.payload,
  a.result,
  a.created_at,
  a.updated_at
FROM actions_queue a
ORDER BY a.priority DESC, a.created_at DESC;

CREATE OR REPLACE VIEW v_agents_registry AS
SELECT
  ar.id,
  ar.tenant_id,
  ar.name,
  ar.category,
  ar.description,
  ar.is_enabled,
  ar.run_count,
  ar.last_run_at,
  ar.created_at
FROM agents_registry ar
ORDER BY ar.category, ar.name;

-- 7. FONCTION POUR LANCER UN PIPELINE (appelee par le frontend)
CREATE OR REPLACE FUNCTION enqueue_product_pipeline(
  p_tenant_id TEXT,
  p_product_id TEXT,
  p_product_name TEXT,
  p_budget NUMERIC DEFAULT 500,
  p_target_roas NUMERIC DEFAULT 1.5
)
RETURNS UUID AS $$
DECLARE
  v_pipeline_id UUID;
BEGIN
  -- Creer le pipeline
  INSERT INTO pipelines (tenant_id, product_id, product_name, total_budget, target_roas, status)
  VALUES (p_tenant_id, p_product_id, p_product_name, p_budget, p_target_roas, 'active')
  RETURNING id INTO v_pipeline_id;

  -- Generer les actions IA automatiques
  INSERT INTO actions_queue (tenant_id, agent_name, action_type, status, priority, payload)
  VALUES
    (p_tenant_id, 'system', 'scan_market', 'pending', 7, json_build_object('pipeline_id', v_pipeline_id, 'product', p_product_name)),
    (p_tenant_id, 'system', 'score_winner', 'pending', 6, json_build_object('pipeline_id', v_pipeline_id, 'product', p_product_name)),
    (p_tenant_id, 'system', 'generate_hero_images', 'pending', 5, json_build_object('pipeline_id', v_pipeline_id, 'count', 3)),
    (p_tenant_id, 'system', 'generate_ugc_videos', 'pending', 5, json_build_object('pipeline_id', v_pipeline_id, 'count', 2)),
    (p_tenant_id, 'system', 'generate_copy', 'pending', 4, json_build_object('pipeline_id', v_pipeline_id, 'variants', 5)),
    (p_tenant_id, 'system', 'create_meta_campaign', 'pending', 8, json_build_object('pipeline_id', v_pipeline_id, 'budget', p_budget)),
    (p_tenant_id, 'system', 'setup_risk_guards', 'pending', 9, json_build_object('pipeline_id', v_pipeline_id, 'max_loss_pct', 0.20)),
    (p_tenant_id, 'system', 'activate_governance', 'pending', 9, json_build_object('pipeline_id', v_pipeline_id, 'mode', 'semi_auto')),
    (p_tenant_id, 'system', 'monitor_roas', 'pending', 6, json_build_object('pipeline_id', v_pipeline_id, 'min_roas', p_target_roas)),
    (p_tenant_id, 'system', 'setup_pixel_tracking', 'pending', 8, json_build_object('pipeline_id', v_pipeline_id));

  RETURN v_pipeline_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. DONNEES INITIALES - Agents
INSERT INTO agents_registry (tenant_id, name, category, description, is_enabled) VALUES
  ('AEGIS-OWNER', 'LandingBuilder', 'CREATIVE', 'Cree des pages de vente optimisees pour la conversion', TRUE),
  ('AEGIS-OWNER', 'HeroImageAgent', 'CREATIVE', 'Genere des images publicitaires percutantes', TRUE),
  ('AEGIS-OWNER', 'UGCVideoAgent', 'CREATIVE', 'Produit des videos de style UGC pour les reseaux sociaux', TRUE),
  ('AEGIS-OWNER', 'HookOptimizer', 'CREATIVE', 'Optimise les accroches publicitaires pour maximiser les clics', TRUE),
  ('AEGIS-OWNER', 'CopyAgent', 'CREATIVE', 'Redige les textes publicitaires et descriptions', TRUE),
  ('AEGIS-OWNER', 'TrendDetector', 'MARKET', 'Detecte les tendances emergentes sur les reseaux sociaux', TRUE),
  ('AEGIS-OWNER', 'WinnerScoring', 'MARKET', 'Calcule le score de potentiel de chaque produit', TRUE),
  ('AEGIS-OWNER', 'MarketScanner', 'MARKET', 'Analyse les opportunites de marche par niche et pays', TRUE),
  ('AEGIS-OWNER', 'CompetitorAnalyzer', 'MARKET', 'Surveille et analyse la strategie des concurrents', TRUE),
  ('AEGIS-OWNER', 'SaturationDetector', 'MARKET', 'Detecte quand un marche devient sature', TRUE),
  ('AEGIS-OWNER', 'MetaBuyer', 'MEDIA_BUYING', 'Gere les campagnes publicitaires Meta (Facebook/Instagram)', TRUE),
  ('AEGIS-OWNER', 'GoogleBuyer', 'MEDIA_BUYING', 'Optimise les campagnes Google Ads et Shopping', TRUE),
  ('AEGIS-OWNER', 'TikTokBuyer', 'MEDIA_BUYING', 'Pilote les campagnes TikTok Ads', TRUE),
  ('AEGIS-OWNER', 'BudgetAllocator', 'MEDIA_BUYING', 'Repartit intelligemment les budgets entre plateformes', TRUE),
  ('AEGIS-OWNER', 'AdKiller', 'MEDIA_BUYING', 'Coupe automatiquement les publicites non rentables', TRUE),
  ('AEGIS-OWNER', 'ROASTracker', 'ANALYTICS', 'Suit le retour sur investissement publicitaire en temps reel', TRUE),
  ('AEGIS-OWNER', 'FunnelAnalyzer', 'ANALYTICS', 'Analyse le parcours client et les taux de conversion', TRUE),
  ('AEGIS-OWNER', 'RevenuePredictor', 'ANALYTICS', 'Predit les revenus futurs base sur les tendances actuelles', TRUE),
  ('AEGIS-OWNER', 'CohortAnalyzer', 'ANALYTICS', 'Analyse la valeur a long terme des clients par cohorte', TRUE),
  ('AEGIS-OWNER', 'PixelVerifier', 'ANALYTICS', 'Verifie que les pixels de tracking fonctionnent correctement', TRUE),
  ('AEGIS-OWNER', 'BundleOptimizer', 'OPTIMIZATION', 'Cree et optimise les offres groupees produits', TRUE),
  ('AEGIS-OWNER', 'UpsellEngine', 'OPTIMIZATION', 'Propose des ventes additionnelles au bon moment', TRUE),
  ('AEGIS-OWNER', 'PriceOptimizer', 'OPTIMIZATION', 'Teste et optimise les prix pour maximiser les marges', TRUE),
  ('AEGIS-OWNER', 'CreativeFatigueDetector', 'OPTIMIZATION', 'Detecte quand une publicite s''epuise pour la renouveler', TRUE),
  ('AEGIS-OWNER', 'ScalingAdvisor', 'OPTIMIZATION', 'Recommande quand et comment scaler les campagnes rentables', TRUE)
ON CONFLICT DO NOTHING;

-- 9. POLICIES RLS (Row Level Security)
ALTER TABLE agents_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_events ENABLE ROW LEVEL SECURITY;

-- Policy permissive pour anon (frontend sans auth)
DROP POLICY IF EXISTS allow_all_agents ON agents_registry;
CREATE POLICY allow_all_agents ON agents_registry FOR ALL USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS allow_all_pipelines ON pipelines;
CREATE POLICY allow_all_pipelines ON pipelines FOR ALL USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS allow_all_actions ON actions_queue;
CREATE POLICY allow_all_actions ON actions_queue FOR ALL USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS allow_all_metrics ON metrics_snapshots;
CREATE POLICY allow_all_metrics ON metrics_snapshots FOR ALL USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS allow_all_risk ON risk_events;
CREATE POLICY allow_all_risk ON risk_events FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- 10. GRANT acces au role anon (Supabase public access)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION enqueue_product_pipeline(TEXT, TEXT, TEXT, NUMERIC, NUMERIC) TO anon, authenticated;

-- Verification finale
SELECT 'Setup AEGIS complete !' AS status,
  (SELECT COUNT(*) FROM agents_registry) AS agents_count,
  (SELECT COUNT(*) FROM pipelines) AS pipelines_count,
  (SELECT COUNT(*) FROM actions_queue) AS actions_count;
