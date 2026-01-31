# 🚀 INSTALLATION DES AMÉLIORATIONS - AEGIS v5.0

## 📍 Vue d'ensemble

Ce guide vous aide à installer et activer toutes les améliorations ajoutées au projet AEGIS v5.0.

---

## ✅ ÉTAPE 1: Installer les Dépendances

### Nouvelles Dépendances de Production

```bash
cd /Users/jl/Desktop/finale

# Sécurité
npm install express-rate-limit helmet cors

# Types
npm install --save-dev @types/cors
```

### Nouvelles Dépendances de Développement

```bash
# Tests
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8

# Types additionnels
npm install --save-dev @types/express
```

---

## ✅ ÉTAPE 2: Mettre à Jour package.json

Ajoutez ces scripts dans votre `package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch api/server.ts",
    "build": "tsc",
    "start": "node dist/api/server.js",
    "db:init": "tsx scripts/init-db.ts",
    "db:seed": "tsx scripts/seed-agents.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "health-check": "tsx scripts/health-check.ts",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"**/*.{ts,json,md}\""
  }
}
```

---

## ✅ ÉTAPE 3: Créer le Fichier .env

```bash
# Copier le template
cp .env.example .env

# Éditer avec vos valeurs
nano .env  # ou vim, code, etc.
```

### Variables Minimales Requises

```env
# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/aegis_v5
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aegis_v5
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Security (Générer avec: openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-minimum-32-characters-long-here
ENCRYPTION_KEY=$(openssl rand -hex 32)
SESSION_SECRET=your-session-secret-minimum-32-characters

# Application
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
```

---

## ✅ ÉTAPE 4: Intégrer les Middleware

Modifiez `api/server.ts` pour intégrer les nouveaux middleware:

```typescript
import express from 'express';
import { validateEnvironment } from '../config/env-validator';
import { gracefulShutdown } from '../config/graceful-shutdown';
import { 
  apiLimiter, 
  authLimiter, 
  corsOptions, 
  helmetConfig,
  requestTimeout,
  sanitizeInput 
} from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import cors from 'cors';

// Validate environment at startup
validateEnvironment();

const app = express();

// Security middleware (AVANT les routes)
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
app.use(requestTimeout(30000));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/auth/', authLimiter);

// Health check endpoint (AVANT rate limiting)
app.get('/health', async (req, res) => {
  const { db } = await import('../config/database');
  const isHealthy = await db.healthCheck();
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Vos routes ici
// app.use('/api/v1', routes);

// Error handlers (APRES les routes)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

// Register server for graceful shutdown
gracefulShutdown.registerServer(server);
gracefulShutdown.init();

export default app;
```

---

## ✅ ÉTAPE 5: Configurer Vitest

Créez `vitest.config.ts` à la racine:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
    testTimeout: 10000,
  },
});
```

---

## ✅ ÉTAPE 6: Créer .env.test

```bash
cp .env.example .env.test
```

Modifiez `.env.test` avec des valeurs de test:

```env
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aegis_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-jwt-secret-minimum-32-characters-long
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
LOG_LEVEL=error
MOCK_EXTERNAL_APIS=true
```

---

## ✅ ÉTAPE 7: Tester l'Installation

### 1. Valider l'Environnement

```bash
npm run dev
```

Vous devriez voir:
```
🔍 Validating environment variables...
✅ 5 connector(s) configured
✅ Environment validation passed!

✅ Server running on port 3000
✅ Environment: development
✅ Health check: http://localhost:3000/health
```

### 2. Tester le Health Check

```bash
curl http://localhost:3000/health
```

Réponse attendue:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-26T17:23:00.000Z",
  "uptime": 5.123
}
```

### 3. Tester le Rate Limiting

```bash
# Envoyer 101 requêtes rapidement
for i in {1..101}; do
  curl http://localhost:3000/api/test
done
```

La 101ème devrait retourner:
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes"
}
```

### 4. Lancer les Tests

```bash
npm test
```

Vous devriez voir:
```
✅ tests/agents/content-creator.test.ts (6)
✅ tests/connectors/meta.test.ts (9)
✅ tests/database/tenant-isolation.test.ts (11)

Test Files  3 passed (3)
     Tests  26 passed (26)
```

### 5. Tester le Graceful Shutdown

```bash
# Démarrer le serveur
npm run dev

# Dans un autre terminal, envoyer SIGTERM
kill -TERM $(lsof -ti:3000)
```

Vous devriez voir:
```
Received SIGTERM, starting graceful shutdown...
Starting graceful shutdown sequence...
Closing HTTP server...
HTTP server closed
Executing shutdown callbacks...
Closing database connections...
Database connections closed
Closing Redis connections...
Flushing logs...
Graceful shutdown completed successfully
```

---

## ✅ ÉTAPE 8: Configurer GitHub Actions (Optionnel)

### 1. Créer les Secrets GitHub

Allez dans Settings > Secrets and variables > Actions:

- `SNYK_TOKEN` - Token Snyk pour security scan
- `CODECOV_TOKEN` - Token Codecov pour coverage
- Autres secrets de déploiement si nécessaire

### 2. Activer GitHub Actions

Le fichier `.github/workflows/ci.yml` est déjà créé.
Push sur `main` ou `develop` pour déclencher le pipeline.

---

## 📝 CHECKLIST FINALE

### Installation
- [ ] Dépendances installées (`npm install`)
- [ ] Scripts package.json ajoutés
- [ ] .env créé et rempli
- [ ] .env.test créé
- [ ] vitest.config.ts créé

### Intégration
- [ ] Middleware intégrés dans server.ts
- [ ] Validation environnement active
- [ ] Graceful shutdown activé
- [ ] Health check endpoint créé

### Tests
- [ ] Serveur démarre sans erreur
- [ ] Health check fonctionne
- [ ] Rate limiting fonctionne
- [ ] Tests passent (`npm test`)
- [ ] Graceful shutdown fonctionne

### CI/CD (Optionnel)
- [ ] Secrets GitHub configurés
- [ ] Pipeline GitHub Actions activé
- [ ] Tests automatiques passent

---

## ⚠️ TROUBLESHOOTING

### Erreur: "Missing required environment variables"

**Solution:** Vérifiez que votre `.env` contient toutes les variables requises.

```bash
# Comparer avec .env.example
diff .env .env.example
```

### Erreur: "Cannot find module 'express-rate-limit'"

**Solution:** Installez les dépendances manquantes.

```bash
npm install express-rate-limit helmet cors
```

### Erreur: "Database connection failed"

**Solution:** Vérifiez que PostgreSQL est démarré et accessible.

```bash
# Vérifier PostgreSQL
psql -U postgres -c "SELECT 1"

# Vérifier la base de données
psql -U postgres -l | grep aegis
```

### Erreur: "Redis connection failed"

**Solution:** Vérifiez que Redis est démarré.

```bash
# Vérifier Redis
redis-cli ping
# Devrait retourner: PONG
```

### Tests échouent

**Solution:** Vérifiez `.env.test` et que les services de test sont disponibles.

```bash
# Créer la base de test
psql -U postgres -c "CREATE DATABASE aegis_test"

# Lancer les tests avec verbose
npm test -- --reporter=verbose
```

---

## 🚀 PROCHAINES ÉTAPES

1. **Implémenter la logique des tests**
   - Remplacer les `TODO` dans les fichiers de test
   - Ajouter les mocks nécessaires
   - Viser 80% de couverture

2. **Intégrer Prometheus**
   - Installer `prom-client`
   - Créer endpoint `/metrics`
   - Configurer Prometheus

3. **Créer Dashboards Grafana**
   - Importer dashboards
   - Configurer alertes
   - Monitorer en temps réel

4. **Déployer en Staging**
   - Configurer environnement staging
   - Tester le pipeline CI/CD
   - Valider les déploiements

5. **Déployer en Production**
   - Suivre DEPLOYMENT_CHECKLIST.md
   - Monitoring 24/7 première semaine
   - Collecter feedback

---

## 📞 SUPPORT

**Questions ou problèmes?**

- Consulter: AMELIORATIONS_COMPLETEES.md
- Consulter: NOUVEAU_AUDIT_2026.md
- Consulter: ACTIONS_IMMEDIATES.md

---

**Installation générée le:** 26 janvier 2026
**Par:** Vy AI Assistant
**Version:** 1.0
