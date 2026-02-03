# AEGIS v5.0 - Guide de Déploiement SQL

## 📋 Résumé

Le fichier `deploy.sql` contient le schéma complet prêt pour la production avec:
- ✅ Multi-tenant avec Row Level Security
- ✅ OAuth-ready
- ✅ Gestion des souscriptions
- ✅ Queue de tâches asynchrones
- ✅ Infrastructure AI Agents
- ✅ 5 connecteurs (Meta, TikTok, Google, Pinterest, Shopify)
- ✅ Audit logging & Observability
- ✅ 16+ indexes pour les performances

## 🚀 Déploiement en Production

### Prérequis
```bash
# PostgreSQL 14+ installé
# Accès superuser à la base de données
# Backup de l'existant réalisé
```

### Étape 1: Créer la base de données
```bash
psql -U postgres -c "CREATE DATABASE aegis_db ENCODING 'UTF8';"
```

### Étape 2: Exécuter le script de déploiement
```bash
# Depuis la racine du projet:
psql -U postgres -d aegis_db -f database/deploy.sql

# Ou avec variables d'environnement:
PGUSER=postgres PGHOST=localhost PGPASSWORD=your_password \
psql -d aegis_db -f database/deploy.sql
```

### Étape 3: Validation du déploiement
```bash
# Vérifier que le déploiement s'est bien déroulé:
psql -U postgres -d aegis_db -c "SELECT * FROM public.deployment_log ORDER BY created_at;"
```

## 🔍 Validation Complète

Exécuter les scripts de validation suivants:

### 1. Vérifier les schémas
```sql
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN ('saas','ops','jobs','intel','crm','audit','observability','connectors','ads')
ORDER BY schema_name;
```

**Résultat attendu:** 9 schémas

### 2. Compter les tables par schéma
```sql
SELECT table_schema, COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema IN ('saas','ops','jobs','intel','crm','audit','observability','connectors','ads')
GROUP BY table_schema 
ORDER BY table_schema;
```

**Résultat attendu:**
```
| table_schema    | table_count |
|-----------------|------------|
| ads             | 1          |
| audit           | 1          |
| connectors      | 16         |
| intel           | 5          |
| jobs            | 3          |
| observability   | 2          |
| ops             | 4          |
| saas            | 1          |
```

### 3. Vérifier les policies RLS
```sql
SELECT schemaname, tablename, policyname FROM pg_policies ORDER BY tablename;
```

**Résultat attendu:** 5 policies minimum

### 4. Vérifier les extensions
```sql
SELECT extname FROM pg_extension 
WHERE extname IN ('pgcrypto','citext','pg_trgm','uuid-ossp');
```

**Résultat attendu:** 4 extensions

### 5. Vérifier les fonctions
```sql
SELECT routine_schema, routine_name FROM information_schema.routines 
WHERE routine_schema IN ('saas') 
ORDER BY routine_name;
```

**Résultat attendu:** 2 fonctions (current_tenant_id, require_tenant)

### 6. Vérifier les plans
```sql
SELECT code, name, price_cents FROM ops.plan ORDER BY sort_order;
```

**Résultat attendu:**
```
| code       | name           | price_cents |
|------------|----------------|------------|
| free       | Free           | 0          |
| starter    | Starter        | 2999       |
| pro        | Professional   | 9999       |
| enterprise | Enterprise     | 0          |
```

### 7. Vérifier les rôles d'agents
```sql
SELECT code, name FROM intel.agent_role ORDER BY code;
```

**Résultat attendu:** 4 rôles

### 8. Vérifier le catalogue d'agents
```sql
SELECT agent_name, display_name FROM intel.agent_catalog ORDER BY sort_order;
```

**Résultat attendu:** 3 agents par défaut

## 🧪 Configuration de Test

Créer un tenant de test pour le développement:

```sql
DO $$ 
DECLARE
  v_tenant_id uuid := '12345678-1234-1234-1234-567812345678';
BEGIN
  -- Créer la config tenant
  INSERT INTO ops.tenant_config (tenant_id, company_name, timezone)
  VALUES (v_tenant_id, 'Test Company', 'Europe/Paris');
  
  -- Ajouter une souscription
  INSERT INTO ops.tenant_subscription (tenant_id, plan_code, trial_end_at)
  VALUES (v_tenant_id, 'pro', now() + interval '30 days');
  
  RAISE NOTICE 'Test tenant % created successfully', v_tenant_id;
END $$;
```

## 📊 Statistiques de Déploiement

| Catégorie | Nombre |
|-----------|--------|
| Schémas | 9 |
| Tables | 33+ |
| Indexes | 16+ |
| Fonctions | 2 |
| Policies RLS | 5+ |
| Extensions | 4 |
| Plans SaaS | 4 |
| Rôles d'agents | 4 |
| Agents catalog | 3 |

## 🔐 Sécurité Multi-tenant

Le déploiement configure automatiquement:

- ✅ Row Level Security sur 10 tables principales
- ✅ Tenant context functions (`current_tenant_id()`, `require_tenant()`)
- ✅ Validation d'authentification au niveau DB
- ✅ Audit logging de tous les changements

**Configuration RLS pour chaque requête:**
```sql
-- Dans votre application, avant chaque requête:
SET LOCAL saas.tenant_id = '12345678-1234-1234-1234-567812345678';
-- Les données seront filtrées par tenant_id automatiquement
```

## 🚨 Troubleshooting

### Erreur: "permission denied for schema"
```bash
# Solution: Donner les permissions au user:
psql -U postgres -d aegis_db -c "GRANT USAGE ON ALL SCHEMAS IN DATABASE aegis_db TO your_user;"
```

### Erreur: "table already exists"
```bash
# Solution: Le script utilise IF NOT EXISTS, re-exécuter est sûr
# Ou drop et recréer:
psql -U postgres -c "DROP DATABASE IF EXISTS aegis_db;"
```

### Vérifier les logs de déploiement
```sql
SELECT phase, status, message, created_at FROM public.deployment_log;
```

## 📈 Performance & Optimisation

Les indexes suivants sont créés automatiquement:

```sql
-- Task Queue (Job Processing)
idx_task_queue_tenant_status
idx_task_queue_scheduled_for
idx_task_queue_idempotency

-- AI Agents
idx_ai_agent_tenant_enabled
idx_agent_execution_log_tenant_agent
idx_agent_execution_log_created

-- Connecteurs
idx_webhook_log_connector_event
idx_webhook_log_processed
idx_meta_campaign_tenant_status
idx_tiktok_campaign_tenant_status
idx_google_campaign_tenant_status
idx_pinterest_campaign_tenant_status
idx_shopify_order_tenant_date
```

## 🔄 Maintenance

### Vérifier l'intégrité
```sql
-- Vérifier les contraintes:
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_schema NOT IN ('pg_catalog','information_schema');

-- Analyser les performances:
ANALYZE;

-- Vérifier les dead tuples:
SELECT schemaname, tablename, n_dead_tup 
FROM pg_stat_user_tables 
WHERE n_dead_tup > 0;
```

### Sauvegarde
```bash
# Backup complet:
pg_dump -U postgres aegis_db > aegis_db_backup_$(date +%Y%m%d).sql

# Restore:
psql -U postgres -d aegis_db < aegis_db_backup_20260201.sql
```

## 📝 Notes de Déploiement

- Le script est **idempotent** - peut être exécuté plusieurs fois sans danger
- Tous les indexes sont créés avec `IF NOT EXISTS`
- Les contraintes sont respectées
- Les données initiales sont sécurisées avec `ON CONFLICT ... DO NOTHING`
- Temps estimé: 5-10 secondes en total

## 🎯 Prochaines Étapes

1. ✅ Créer la base de données
2. ✅ Exécuter le script de déploiement
3. ✅ Valider avec les requêtes de vérification
4. ✅ Configurer les variables d'environnement
5. ✅ Connecter l'application backend
6. ✅ Lancer les tests d'intégration

## 📞 Support

Pour les issues:
- Vérifier les logs: `SELECT * FROM public.deployment_log;`
- Consulter la documentation PostgreSQL
- Vérifier les permissions de l'utilisateur
- Valider la version PostgreSQL (14+)

---

**Dernière mise à jour:** 2026-02-01
**Version:** AEGIS v5.0
**Status:** Production-Ready ✅
