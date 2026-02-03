# AEGIS v5.0 - SQL Production Ready

## 📦 Fichiers Fournis

```
database/
├── deploy.sql                  # Script SQL complet (929 lignes) - À UTILISER
├── schema.sql                  # Ancien schéma (voir deploy.sql à la place)
├── validate_deployment.sh      # Script de validation automatique
├── migrations/                 # (Vide - à populer si nécessaire)
└── seeds/                      # (Vide - seeders dans deploy.sql)
```

## 🚀 Déploiement Quick Start

### Option 1: Déploiement local (Développement)
```bash
# 1. Créer la base de données
createdb aegis_db

# 2. Appliquer le schéma
psql -d aegis_db -f database/deploy.sql

# 3. Valider le déploiement
bash database/validate_deployment.sh -d aegis_db

# 4. Vérifier les logs
psql -d aegis_db -c "SELECT * FROM public.deployment_log;"
```

### Option 2: Déploiement Production (avec variables)
```bash
# Avec authentification sécurisée
export PGHOST=your-db-host.com
export PGUSER=aegis_admin
export PGPASSWORD=secure_password
export PGPORT=5432

createdb aegis_db
psql -d aegis_db -f database/deploy.sql
bash database/validate_deployment.sh -h $PGHOST -U $PGUSER -d aegis_db -p $PGPORT
```

### Option 3: Déploiement Vercel + AWS RDS
```bash
# Depuis votre Vercel deployment
PGHOST=aegis-prod.c5nxxx.rds.amazonaws.com \
PGPORT=5432 \
PGUSER=admin \
PGPASSWORD=$DB_PASSWORD \
PGDATABASE=aegis_db \
psql -f database/deploy.sql
```

## ✅ Validation Post-Déploiement

Après le déploiement, vérifier le statut:

```bash
# Validation complète (automatisée)
bash database/validate_deployment.sh

# Ou validation manuelle:
psql -d aegis_db << 'EOF'
-- 1. Vérifier les schémas
SELECT COUNT(*) as schemas_count FROM information_schema.schemata 
WHERE schema_name IN ('saas','ops','jobs','intel','audit','connectors','observability');

-- 2. Compter les tables
SELECT COUNT(*) as tables_count FROM information_schema.tables 
WHERE table_schema IN ('saas','ops','jobs','intel','connectors');

-- 3. Vérifier les données initiales
SELECT COUNT(*) FROM ops.plan;        -- Devrait être 4
SELECT COUNT(*) FROM intel.agent_role;  -- Devrait être 4
SELECT COUNT(*) FROM intel.agent_catalog; -- Devrait être 3

-- 4. Vérifier les logs de déploiement
SELECT * FROM public.deployment_log ORDER BY created_at DESC;
EOF
```

## 📊 Contenu du Deploy

### Schémas (9)
| Schéma | Contenu |
|--------|---------|
| `saas` | Fonctions de contexte tenant |
| `ops` | Configuration tenant, plans, souscriptions |
| `jobs` | Queue de tâches asynchrones, DLQ |
| `intel` | AI Agents, workflows, execution logs |
| `connectors` | Meta, TikTok, Google, Pinterest, Shopify |
| `audit` | Event logging pour compliance |
| `observability` | Metrics et health checks |
| `crm` | Réservé pour futurs connecteurs CRM |
| `ads` | Baselines pour optimisation media buying |

### Tables Clés (33)

**Tenant Infrastructure:**
- `ops.tenant_config` - Configuration tenant
- `ops.plan` - Plans SaaS (free, starter, pro, enterprise)
- `ops.tenant_subscription` - Souscriptions actives
- `ops.subscription_event_log` - Audit des changements

**Job Processing:**
- `jobs.task_queue` - Queue principale (status: pending, running, completed, failed)
- `jobs.dlq` - Dead Letter Queue pour jobs échoués
- `jobs.recurring_schedule` - Jobs récurrents

**AI Agents:**
- `intel.ai_agent` - Instances d'agents par tenant
- `intel.agent_catalog` - Catalogue global des agents
- `intel.agent_role` - Rôles (content_creator, data_analyst, etc)
- `intel.agent_execution_log` - Historique des exécutions
- `intel.agent_message_queue` - Communication inter-agents
- `intel.agent_workflow` - Workflows d'orchestration

**Connecteurs (16 tables):**
- Meta (2): `meta_ad_account`, `meta_campaign`
- TikTok (2): `tiktok_ad_account`, `tiktok_campaign`
- Google (2): `google_ad_account`, `google_campaign`
- Pinterest (2): `pinterest_ad_account`, `pinterest_campaign`
- Shopify (4): `shopify_store`, `shopify_product`, `shopify_order`, + webhooks
- Général (2): `credential_vault`, `sync_log`, `webhook_log`

**Audit & Observability:**
- `audit.event_log` - Tous les changements
- `observability.metrics` - Métriques d'application
- `observability.health_check` - Status des composants

### Données Initiales Seeded

**Plans SaaS:**
```sql
SELECT code, name, price_cents, trial_days FROM ops.plan;
-- free       | Free            | 0     | 14
-- starter    | Starter         | 2999  | 30
-- pro        | Professional    | 9999  | 30
-- enterprise | Enterprise      | 0     | 60
```

**Agent Roles:**
```sql
SELECT code, name FROM intel.agent_role;
-- content_creator      | Content Creator
-- data_analyst         | Data Analyst
-- campaign_optimizer   | Campaign Optimizer
-- customer_support     | Customer Support
```

**Agents Catalog:**
```sql
SELECT agent_name, display_name FROM intel.agent_catalog;
-- content_writer       | Content Writer
-- performance_analyst  | Performance Analyst
-- bid_optimizer        | Bid Optimizer
```

## 🔐 Sécurité Multi-tenant

Le déploiement configure automatiquement:

### Row Level Security (RLS)
- ✅ 5 policies RLS sur les tables clés
- ✅ Filtrage automatique par `tenant_id`
- ✅ Impossible de voir les données d'autres tenants même avec un bug

### Tenant Context
```sql
-- Avant TOUTE requête multi-tenant:
SET LOCAL saas.tenant_id = '12345678-1234-1234-1234-567812345678';

-- Les données sont automatiquement filtrées
SELECT * FROM jobs.task_queue;  -- Seulement du tenant
SELECT * FROM intel.ai_agent;   -- Seulement du tenant
```

### Validations
```sql
-- Cette fonction lève une exception si pas de context tenant:
SELECT saas.require_tenant();  -- EXCEPTION si tenant_id NOT SET
```

## 📈 Indexes pour Performance

16+ indexes créés automatiquement:

```sql
-- Les plus importants:
CREATE INDEX idx_task_queue_tenant_status 
  ON jobs.task_queue(tenant_id, status);

CREATE INDEX idx_ai_agent_tenant_enabled 
  ON intel.ai_agent(tenant_id, is_enabled);

CREATE INDEX idx_meta_campaign_tenant_status 
  ON connectors.meta_campaign(tenant_id, status);

-- ... et 13 autres pour les autres connecteurs
```

## 🔧 Configuration Environnement

### Variables requises pour le backend:

```bash
# .env ou fichier de configuration
DATABASE_URL=postgresql://user:password@localhost:5432/aegis_db

# Variables importantes:
AEGIS_DATABASE_POOL_SIZE=20
AEGIS_DATABASE_TIMEOUT=30000
AEGIS_DATABASE_SSL=require  # En production
```

### Vérifier la connexion:

```bash
# Test la connexion:
psql postgresql://user:password@localhost:5432/aegis_db -c "SELECT 1"

# Vérifier le contexte tenant:
psql postgresql://user:password@localhost:5432/aegis_db -c "
  SET LOCAL saas.tenant_id = '12345678-1234-1234-1234-567812345678';
  SELECT COUNT(*) FROM ops.tenant_config;
"
```

## 🧪 Tester avec un Tenant de Démo

```bash
psql -d aegis_db << 'EOF'
-- 1. Créer un tenant de test
DO $$ 
DECLARE
  v_tenant_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
BEGIN
  INSERT INTO ops.tenant_config (tenant_id, company_name, timezone)
  VALUES (v_tenant_id, 'ACME Corp', 'Europe/Paris')
  ON CONFLICT DO NOTHING;
  
  INSERT INTO ops.tenant_subscription (tenant_id, plan_code, trial_end_at)
  VALUES (v_tenant_id, 'pro', now() + interval '30 days')
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Tenant % created', v_tenant_id;
END $$;

-- 2. Vérifier avec RLS
SET LOCAL saas.tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
SELECT company_name FROM ops.tenant_config;

-- 3. Insérer une tâche test
INSERT INTO jobs.task_queue (tenant_id, task_type, payload)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sync_meta', '{"status":"test"}');

-- 4. Consulter la tâche
SELECT id, task_type, status FROM jobs.task_queue WHERE tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
EOF
```

## 📝 Maintenance Regular

```bash
# Daily
psql -d aegis_db -c "VACUUM ANALYZE;" # Maintenance

# Weekly
psql -d aegis_db -c "REINDEX DATABASE aegis_db;" # Rebuild indexes

# Monthly Backup
pg_dump aegis_db | gzip > aegis_db_$(date +%Y%m%d).sql.gz
```

## 🚨 Troubleshooting

### Problème: Connexion refusée
```bash
# Vérifier que PostgreSQL est démarré:
pg_isready -h localhost -p 5432

# Vérifier les credentials:
psql -h localhost -U postgres -d postgres -c "SELECT 1"
```

### Problème: Permission denied
```bash
# Donner les permissions:
psql -d aegis_db -c "GRANT USAGE ON ALL SCHEMAS IN DATABASE aegis_db TO aegis_user;"
psql -d aegis_db -c "GRANT ALL ON ALL TABLES IN SCHEMA saas,ops,jobs TO aegis_user;"
```

### Problème: Table already exists
```bash
# Le script est idempotent, mais si erreur:
psql -d aegis_db -c "DROP DATABASE IF EXISTS aegis_db;"
createdb aegis_db
psql -d aegis_db -f database/deploy.sql
```

## 📞 Support & Documentation

- **Schéma complet:** `database/deploy.sql` (929 lignes, documenté)
- **Guide détaillé:** `DEPLOYMENT_SQL_GUIDE.md`
- **Validation automatique:** `bash database/validate_deployment.sh`
- **Logs de déploiement:** `SELECT * FROM public.deployment_log;`

## ✨ Prochaines Étapes

1. ✅ Exécuter `deploy.sql`
2. ✅ Valider avec `validate_deployment.sh`
3. ✅ Configurer les variables d'environnement
4. ✅ Connecter le backend (Node.js/Python)
5. ✅ Tester les endpoints API
6. ✅ Configurer le monitoring/alerting

---

**Status:** ✅ Production-Ready
**Version:** AEGIS v5.0
**PostgreSQL:** 14+
**Last Updated:** 2026-02-01
