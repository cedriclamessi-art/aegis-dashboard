# 🚀 AEGIS v5.0 - DEPLOYMENT CHECKLIST

## Pre-Deployment

- [ ] **Repository Setup**
  - [x] Git initialized
  - [ ] GitHub/GitLab remote configured
  - [ ] Branch protection rules set

- [ ] **Dependencies**
  - [ ] `npm install` completed
  - [ ] Node.js 18+ installed
  - [ ] PostgreSQL 15+ installed
  - [ ] Redis 7+ installed

- [ ] **Environment Configuration**
  - [ ] `.env` file created (from `.env.example`)
  - [ ] Database credentials configured
  - [ ] Redis connection configured
  - [ ] JWT_SECRET set (min 32 chars)
  - [ ] ENCRYPTION_KEY set (32 chars)
  - [ ] Meta API keys configured
  - [ ] TikTok API keys configured
  - [ ] Google API keys configured
  - [ ] Pinterest API keys configured
  - [ ] Shopify API keys configured

## Database Setup

- [ ] **PostgreSQL**
  - [ ] PostgreSQL service running
  - [ ] Database `aegis_v5` created
  - [ ] User `postgres` with password set

- [ ] **Schema Initialization**
  - [ ] Run: `npm run db:init`
  - [ ] All 8 schemas created
  - [ ] All 30+ tables created
  - [ ] Indexes created (15+)
  - [ ] RLS policies enabled
  - [ ] Verify with: `psql -U postgres -d aegis_v5 -c "\dt"`

- [ ] **Data Seeding**
  - [ ] Run: `npm run db:seed`
  - [ ] 16 agents seeded
  - [ ] 15 roles seeded
  - [ ] Plans configured

## Agent Validation

- [ ] **Agent Verification**
  - [ ] Run: `npm run agents:validate`
  - [ ] All 16 agents pass validation
  - [ ] Capabilities verified
  - [ ] Dependencies resolved
  - [ ] Output: "All agents validated successfully"

## Connector Setup

- [ ] **Meta (Facebook Ads)**
  - [ ] App ID configured: `META_APP_ID`
  - [ ] App Secret configured: `META_APP_SECRET`
  - [ ] Webhook URL configured
  - [ ] Scopes: ads_management, pages_read_engagement

- [ ] **TikTok Ads**
  - [ ] App ID configured: `TIKTOK_APP_ID`
  - [ ] App Secret configured: `TIKTOK_APP_SECRET`
  - [ ] Sandbox/Production URL set
  - [ ] Scopes: advertiser_read, campaign_read

- [ ] **Google Ads**
  - [ ] Client ID configured: `GOOGLE_CLIENT_ID`
  - [ ] Client Secret configured: `GOOGLE_CLIENT_SECRET`
  - [ ] OAuth consent screen configured
  - [ ] Scopes: adwords scope enabled

- [ ] **Pinterest Ads**
  - [ ] App ID configured: `PINTEREST_APP_ID`
  - [ ] App Secret configured: `PINTEREST_APP_SECRET`
  - [ ] Redirect URI configured
  - [ ] Scopes: ads:read, catalogs:read

- [ ] **Shopify**
  - [ ] API Key configured: `SHOPIFY_API_KEY`
  - [ ] API Secret configured: `SHOPIFY_API_SECRET`
  - [ ] Webhook endpoints configured
  - [ ] Topics: products/update, orders/create

## Infrastructure Tests

- [ ] **Health Checks**
  - [ ] Run: `npm run health-check`
  - [ ] Database: ✅ Connected
  - [ ] Queue: ✅ Operational
  - [ ] Scheduler: ✅ Running
  - [ ] Agents: ✅ 16 agents ready
  - [ ] Connectors: ✅ 5 connectors initialized
  - [ ] API: ✅ API responsive

- [ ] **Connector Tests**
  - [ ] Run: `npm run connectors:test`
  - [ ] Meta test: PASSED
  - [ ] TikTok test: PASSED
  - [ ] Google test: PASSED
  - [ ] Pinterest test: PASSED
  - [ ] Shopify test: PASSED

## Application Build & Start

- [ ] **Compilation**
  - [ ] Run: `npm run build`
  - [ ] No TypeScript errors
  - [ ] No ESLint warnings (critical)
  - [ ] dist/ directory created

- [ ] **Development Server (Optional)**
  - [ ] Run: `npm run dev`
  - [ ] API starts on port 3000
  - [ ] No errors in logs
  - [ ] Ctrl+C to stop

- [ ] **Production Server**
  - [ ] Run: `npm start`
  - [ ] API running on port 3000
  - [ ] All endpoints responsive
  - [ ] Metrics collection active

## Docker Deployment

- [ ] **Docker Build**
  - [ ] Run: `docker build -t aegis:v5.0 .`
  - [ ] Image builds successfully
  - [ ] Image size reasonable (~500MB)

- [ ] **Docker Compose**
  - [ ] Run: `docker-compose up`
  - [ ] PostgreSQL container starts
  - [ ] Redis container starts
  - [ ] AEGIS container starts
  - [ ] Health checks pass
  - [ ] Verify with: `docker-compose ps`

- [ ] **Container Testing**
  - [ ] Database connectivity: OK
  - [ ] API responsive: OK
  - [ ] Agents loaded: OK
  - [ ] Connectors ready: OK

## Monitoring & Observability

- [ ] **Logging**
  - [ ] Structured logging active
  - [ ] Log level set to 'info'
  - [ ] Logs aggregation (optional): configured

- [ ] **Metrics**
  - [ ] Prometheus metrics endpoint: OK
  - [ ] Datadog integration (optional): configured
  - [ ] Sentry DSN (optional): configured

- [ ] **Alerting**
  - [ ] Failed job alerts: configured
  - [ ] Agent error alerts: configured
  - [ ] Connector failure alerts: configured
  - [ ] API health alerts: configured

## Security Verification

- [ ] **Credentials**
  - [ ] No secrets in code
  - [ ] Environment variables used
  - [ ] .env file in .gitignore
  - [ ] Vault/Secret manager ready

- [ ] **RLS Verification**
  - [ ] Multi-tenant isolation verified
  - [ ] Tenant context enforced
  - [ ] No cross-tenant data access
  - [ ] Audit logs enabled

- [ ] **Webhook Security**
  - [ ] Signature verification enabled
  - [ ] HTTPS required for webhooks
  - [ ] IP whitelisting (optional): configured
  - [ ] Rate limiting enabled

## Final Verification

- [ ] **Smoke Tests**
  - [ ] Create test agent execution
  - [ ] Create test connector sync
  - [ ] Create test job queue item
  - [ ] Verify logs are recorded

- [ ] **Documentation**
  - [ ] README.md complete
  - [ ] AUDIT_REPORT.md generated
  - [ ] API documentation prepared
  - [ ] Troubleshooting guide prepared

- [ ] **Backup & Recovery**
  - [ ] Database backup script ready
  - [ ] Disaster recovery plan documented
  - [ ] Restore procedure tested
  - [ ] Backup storage configured

## Post-Deployment

- [ ] **Monitoring (First 24h)**
  - [ ] Watch error logs
  - [ ] Monitor API latency
  - [ ] Check agent execution times
  - [ ] Verify connector syncs

- [ ] **Performance Baseline**
  - [ ] Record baseline metrics
  - [ ] Database query times
  - [ ] Agent execution times
  - [ ] API response times

- [ ] **Security Audit (First Week)**
  - [ ] Run security scanner
  - [ ] Check for vulnerabilities
  - [ ] Verify access logs
  - [ ] Test rate limiting

---

## Deployment Commands Quick Reference

```bash
# Setup
npm install
npm run build

# Database
npm run db:init
npm run db:seed

# Validation
npm run agents:validate
npm run connectors:test

# Health
npm run health-check

# Development
npm run dev

# Production
npm start

# Docker
docker-compose up -d
docker-compose logs -f

# Cleanup
docker-compose down
```

---

**Status:** Ready for deployment ✅  
**Date:** 2026-01-26  
**Version:** AEGIS v5.0.0
