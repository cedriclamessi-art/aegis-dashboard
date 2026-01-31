# ⚡ Quick Start - Déployez sur Vercel en 5 minutes

## Pour les Pressés

### 1. Préparation (2 min)

```bash
# Assurez-vous que tout est committé
git status

# Si des changements non committé:
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Déploiement (1 min)

**Option A: CLI Vercel (Recommandé si déjà connecté à GitHub)**
```bash
npm install -g vercel
vercel
# Suivez les prompts, acceptez les valeurs par défaut
```

**Option B: Dashboard Vercel**
1. Allez sur https://vercel.com/dashboard
2. "Add New" → "Project"
3. Sélectionnez votre repo GitHub
4. "Deploy"

### 3. Configuration (2 min)

Dans Vercel Dashboard → Settings → Environment Variables:

Ajoutez:
```
NODE_ENV = production
ALLOWED_ORIGINS = https://your-project.vercel.app
```

C'est tout! ✅

## ✅ C'est Déployé!

Accédez à votre app: **https://your-project.vercel.app**

### Testez:
```bash
# Remplacez par votre URL
curl https://your-project.vercel.app/api/v1/status
```

## 🔧 Optionnel: Configurer les OAuth Vrais

Si vous voulez tester les OAuth flows avec les vraies API:

### TikTok
1. https://business.tiktok.com/portal
2. Créez une app, obtenez APP_ID et APP_SECRET
3. Redirect URI: `https://your-project.vercel.app/api/v1/auth/oauth/tiktok/callback`
4. Vercel Dashboard → Add variables

### Meta
1. https://developers.facebook.com/apps
2. Créez une app, obtenez APP_ID et APP_SECRET
3. Redirect URI: `https://your-project.vercel.app/api/v1/auth/oauth/meta/callback`
4. Vercel Dashboard → Add variables

### Google
1. https://console.cloud.google.com/
2. Créez OAuth credentials
3. Redirect URI: `https://your-project.vercel.app/api/v1/auth/oauth/google/callback`
4. Vercel Dashboard → Add variables

## 📚 Besoin de Plus de Détails?

- **Guide Complet**: `DEPLOYMENT_VERCEL.md`
- **Variables d'Environnement**: `VERCEL_ENV_SETUP.md`
- **Status du Projet**: `DEPLOYMENT_READY.md`

## ❓ Troubleshooting Rapide

| Problème | Solution |
|----------|----------|
| "Build failed" | Vérifiez les logs Vercel, assurez-vous que npm run build fonctionne localement |
| "Database connection failed" | C'est normal en mode démo, ça continue de fonctionner |
| "CORS error" | Mettez à jour ALLOWED_ORIGINS dans les variables |
| "Frontend doesn't load" | Assurez-vous que frontend/dist existe |

## 🎉 Vous avez Terminé!

Votre AEGIS Media Buying Dashboard est maintenant déployé sur Vercel! 🚀

**Profitez de votre MVP!**
