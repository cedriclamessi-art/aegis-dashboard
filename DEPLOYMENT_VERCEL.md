# 🚀 Guide de Déploiement AEGIS sur Vercel

## ✅ État du Projet

- **Frontend React + Vite** ✅ Compilé
- **Backend Express.js** ✅ Compilé  
- **OAuth 2.0** ✅ Implémenté (TikTok, Meta, Google)
- **Configuration Vercel** ✅ Optimisée pour fonctionner sans dépendances externes
- **Mode Démo** ✅ Données simulées incluses

## 📋 Prérequis

1. **Compte Vercel** - https://vercel.com
2. **GitHub** - Code poussé sur GitHub
3. **Node.js 18+** sur votre machine locale

## 🔧 Configuration Locale (Optionnel)

### 1. Installez les dépendances
```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Compilez le projet
```bash
npm run build
```

### 3. Testez localement (Pour Vercel, utilisez plutôt `vercel dev`)
```bash
npm start
```

## 🌐 Déploiement sur Vercel

### Étape 1: Préparez votre code

```bash
# Vérifiez que votre code est à jour
git status

# Ajoutez tous les changements
git add .

# Créez un commit
git commit -m "feat: AEGIS Media Buying deployment ready for Vercel"

# Poussez sur GitHub
git push origin main
```

### Étape 2: Connectez Vercel à GitHub

1. Allez sur https://vercel.com/dashboard
2. Cliquez sur "Add New" → "Project"
3. Importez votre repository GitHub
4. Vercel détectera automatiquement `vercel.json` et configurera le projet

### Étape 3: Configurez les Variables d'Environnement

Dans Vercel Dashboard:
1. Allez sur **Settings → Environment Variables**
2. Ajoutez les variables **obligatoires**:

```
NODE_ENV = production
ALLOWED_ORIGINS = https://your-project.vercel.app
```

3. **(Optionnel)** Ajoutez les variables de production:

**Sécurité:**
```
JWT_SECRET = (laissez vide pour auto-génération)
ENCRYPTION_KEY = (laissez vide pour auto-génération)
```

**Base de données (Optionnel):**
```
DATABASE_URL = postgresql://user:pass@host:port/dbname
DB_SSL = true
```

**Redis (Optionnel):**
```
REDIS_URL = redis://:password@host:port
```

**OAuth (Optionnel):**
```
TIKTOK_APP_ID = votre_app_id
TIKTOK_APP_SECRET = votre_secret
META_APP_ID = votre_app_id
META_APP_SECRET = votre_secret
GOOGLE_CLIENT_ID = votre_client_id
GOOGLE_CLIENT_SECRET = votre_secret
```

### Étape 4: Déployez

1. Vercel déploiera automatiquement lorsque vous poussez sur GitHub
2. Ou cliquez manuellement sur "Deploy" dans Vercel Dashboard
3. Attendez 2-5 minutes pour que le déploiement se termine

## ✅ Vérification du Déploiement

### Vérifiez les endpoints après déploiement:

```bash
# Remplacez YOUR_DOMAIN par votre domaine Vercel
export DOMAIN="your-project.vercel.app"

# 1. Vérifiez le statut de l'API
curl https://$DOMAIN/api/v1/status

# Réponse attendue:
# {"status":"ok","env":"production","version":"5.0.0","mode":"offline-demo"}

# 2. Vérifiez la santé du serveur
curl https://$DOMAIN/health

# Réponse attendue:
# {"status":"healthy|degraded","timestamp":"...","uptime":...,"mode":"offline-demo|online","services":{...}}

# 3. Testez les campagnes
curl https://$DOMAIN/api/v1/campaigns/tiktok

# 4. Testez les métriques
curl https://$DOMAIN/api/v1/metrics/platform/tiktok

# 5. Accédez au Dashboard
open https://$DOMAIN
```

## 🔌 Mode Démo vs Mode Production

### Mode Démo (défaut sans BD/Redis)
- ✅ Pas besoin de base de données
- ✅ Pas besoin de Redis
- ✅ OAuth flows avec données simulées
- ✅ Campagnes et métriques simulées
- ⚠️  Données stockées en mémoire (non persistantes après redéploiement)
- 📌 Parfait pour démos et testing

### Mode Production (avec services externes)
- ✅ Données persistantes en base de données
- ✅ Cache Redis pour performances
- ✅ OAuth réel avec vraies intégrations
- ⚠️  Coûts additionnels pour les services

## 🔑 Configuration des OAuth (Optionnel)

Pour activer les vrais OAuth flows:

### 1. TikTok
1. Allez sur https://business.tiktok.com/portal
2. Créez une app et obtenez App ID & Secret
3. Configurez Redirect URI: `https://your-domain.vercel.app/api/v1/auth/oauth/tiktok/callback`
4. Ajoutez les variables d'environnement à Vercel

### 2. Meta/Facebook
1. Allez sur https://developers.facebook.com/apps
2. Créez une app et obtenez App ID & Secret
3. Configurez Redirect URI: `https://your-domain.vercel.app/api/v1/auth/oauth/meta/callback`
4. Ajoutez les variables d'environnement à Vercel

### 3. Google Ads
1. Allez sur https://console.cloud.google.com/
2. Créez un OAuth 2.0 credential
3. Configurez Redirect URI: `https://your-domain.vercel.app/api/v1/auth/oauth/google/callback`
4. Ajoutez les variables d'environnement à Vercel

## 🗄️ Configuration de la Base de Données (Optionnel)

Si vous voulez persistence des données:

### Vercel Postgres (Recommandé)
```bash
# Créez une base de données via Vercel Dashboard
# Vercel génère automatiquement DATABASE_URL
# Il suffit d'ajouter la variable d'environnement
```

### Supabase
```bash
# 1. Créez un compte: https://supabase.com
# 2. Créez un nouveau projet
# 3. Récupérez la DATABASE_URL
# 4. Ajoutez comme variable d'environnement à Vercel
```

### Railway
```bash
# 1. Allez sur https://railway.app
# 2. Créez une base de données PostgreSQL
# 3. Récupérez la DATABASE_URL
# 4. Ajoutez comme variable d'environnement à Vercel
```

## ⚠️ Troubleshooting

### Erreur: "Database connection failed"
→ Normal en mode démo. Continuez!

### Erreur: "Redis connection failed"
→ Normal en mode démo. Continuez!

### Erreur: "CORS error"
→ Mettez à jour `ALLOWED_ORIGINS` dans les variables d'environnement
→ Exemple: `https://your-domain.vercel.app,https://www.your-domain.vercel.app`

### OAuth Flow se redirige mal
→ Vérifiez que les Redirect URIs correspondent exactement sur les plateformes OAuth
→ Vérifiez que les credentials OAuth sont correctement configurés dans Vercel

### Le frontend ne se charge pas
→ Vérifiez que `frontend/dist` existe et contient les fichiers compilés
→ Vérifiez que le build de Vercel s'est complété sans erreurs

## 📊 Monitoring

Après déploiement, vérifiez:
1. Vercel Dashboard - Build & Deployment logs
2. Vercel Functions - Runtime logs
3. Frontend - Console du navigateur pour les erreurs client
4. API - Endpoints `/health` et `/api/v1/status`

## 🚀 Prochaines Étapes

1. **Personnalisez le domaine:**
   - Achetez un domaine
   - Configurez le custom domain dans Vercel

2. **Mettez en place OAuth:**
   - Suivez les instructions OAuth ci-dessus
   - Testez les connexions OAuth

3. **Connectez une base de données:**
   - Choisissez un service (Vercel Postgres, Supabase, etc.)
   - Mettez en place les migrations de schéma

4. **Intégrez les vraies APIs:**
   - Remplacez les données mock par les vraies APIs
   - Testez les campaigns et metrics réels

## 📝 Notes

- **Mode Démo:** Sufficient for MVP and demonstrations
- **Mode Production:** Required for real data persistence
- **Scalabilité:** Vercel auto-scales according to traffic
- **Coûts:** Free tier includes generous usage; check pricing for high traffic

## 🆘 Support

- Vercel Docs: https://vercel.com/docs
- GitHub Issues: Create issues in your repository
- Vercel Support: https://vercel.com/support
