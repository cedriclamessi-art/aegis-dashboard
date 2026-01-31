# Configuration des Variables d'Environnement pour Vercel

## Configuration rapide

### 1. Créez un fichier `.env.production` localement (optionnel pour les tests)

```bash
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://your-domain.vercel.app
APP_VERSION=5.0.0
```

### 2. Configurez les variables dans le dashboard Vercel

Allez dans: **Settings → Environment Variables**

#### Variables obligatoires (minimum)
```
NODE_ENV = production
ALLOWED_ORIGINS = https://your-domain.vercel.app,https://www.your-domain.vercel.app
```

#### Variables optionnelles (pour fonctionnalité complète)

**Sécurité:**
```
JWT_SECRET = (générée automatiquement si non fournie)
ENCRYPTION_KEY = (générée automatiquement si non fournie)
```

**Base de données (optionnel - mode démo si non fourni):**
```
DATABASE_URL = postgresql://user:password@host:port/dbname
DB_HOST = host
DB_PORT = 5432
DB_NAME = dbname
DB_USER = user
DB_PASSWORD = password
DB_SSL = true
```

**Redis (optionnel - mode démo si non fourni):**
```
REDIS_URL = redis://:password@host:port
REDIS_HOST = host
REDIS_PORT = 6379
```

**OAuth (optionnel - mode démo avec données simulées si non fourni):**
```
TIKTOK_APP_ID = your_app_id
TIKTOK_APP_SECRET = your_app_secret
TIKTOK_REDIRECT_URI = https://your-domain.vercel.app/api/v1/auth/oauth/tiktok/callback

META_APP_ID = your_app_id
META_APP_SECRET = your_app_secret
META_REDIRECT_URI = https://your-domain.vercel.app/api/v1/auth/oauth/meta/callback

GOOGLE_CLIENT_ID = your_client_id
GOOGLE_CLIENT_SECRET = your_client_secret
GOOGLE_REDIRECT_URI = https://your-domain.vercel.app/api/v1/auth/oauth/google/callback
```

## Services Recommandés

### Base de données
- **Vercel Postgres** (Recommandé): https://vercel.com/docs/storage/vercel-postgres
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app
- **Render**: https://render.com

### Cache/Redis
- **Upstash Redis**: https://upstash.com
- **Redis Cloud**: https://redis.com/cloud
- **Railway**: https://railway.app

### OAuth
- **TikTok Ads**: https://business.tiktok.com/portal
- **Meta**: https://developers.facebook.com/apps
- **Google Cloud**: https://console.cloud.google.com/

## Mode Démo

Si vous ne configurez pas de base de données ou Redis:
- L'application s'exécutera en **mode démo**
- Les données OAuth seront stockées **en mémoire** (non persistantes)
- Les campagnes et métriques utilisent des **données simulées**
- Parfait pour tester et démontrer l'application

## Instructions de Déploiement

1. **Poussez votre code sur GitHub**
```bash
git add .
git commit -m "feat: Vercel deployment ready"
git push origin main
```

2. **Importez le projet dans Vercel**
   - Allez sur https://vercel.com/new
   - Connectez votre GitHub
   - Sélectionnez le repository AEGIS

3. **Configurez les variables d'environnement**
   - Dans Settings → Environment Variables
   - Ajoutez les variables requises (minimum NODE_ENV, ALLOWED_ORIGINS)
   - Optionnel: Ajoutez DATABASE_URL, REDIS_URL, OAuth credentials

4. **Déployez**
   - Vercel détectera automatiquement le configuration (vercel.json)
   - Le build et deployment se feront automatiquement
   - Votre app sera disponible sur https://your-project.vercel.app

## Vérification Post-Déploiement

Testez les endpoints:
```bash
# Vérifier le statut
curl https://your-domain.vercel.app/api/v1/status

# Vérifier la santé
curl https://your-domain.vercel.app/health

# Vérifier les campagnes
curl https://your-domain.vercel.app/api/v1/campaigns/tiktok
```

## Troubleshooting

**Erreur: "Database connection failed"**
- Normal en mode démo, ajoutez DATABASE_URL si vous avez une BD

**Erreur: "Redis connection failed"**
- Normal en mode démo, ajoutez REDIS_URL si vous avez Redis

**Erreur: "CORS error"**
- Mettez à jour ALLOWED_ORIGINS pour inclure votre domaine Vercel

**OAuth ne fonctionne pas**
- Configurez les credentials OAuth dans les variables d'environnement
- Vérifiez les URLs de callback

## Génération des Clés de Sécurité

```bash
# Générer JWT_SECRET (32+ chars)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Générer ENCRYPTION_KEY (64 chars hex)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```
