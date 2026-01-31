# AEGIS Dashboard - Démarrage rapide

## 🚀 Installation en 3 étapes

### Étape 1: Cloner et installer les dépendances

```bash
# Les dépendances principales (backend)
npm install

# Les dépendances frontend (automatique mais peut être manuel)
npm install --prefix frontend
```

### Étape 2: Configurer l'environnement

```bash
# Copier et éditer le fichier .env
cp .env.example .env

# Éditer .env avec vos configurations:
# - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD (PostgreSQL)
# - REDIS_URL
# - JWT_SECRET (optionnel)
```

### Étape 3: Lancer l'application

```bash
# Mode développement (backend + frontend)
npm run dev

# Ouvert dans le navigateur:
# - Frontend Dashboard: http://localhost:3000
# - Backend API: http://localhost:3001
```

## 📋 Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 12
- Redis >= 6 (optionnel)

## 🎯 Premiers pas

### 1. Frontend Dashboard
- Ouvrir http://localhost:3000
- Voir le tableau de bord principal
- Explorer les pages: Agents, Tasks, Analytics

### 2. Backend API
- Vérifier la santé: `curl http://localhost:3001/health`
- Tester les endpoints: `curl http://localhost:3001/api/agents`

### 3. Database
- Initialiser: `npm run db:init`
- Charger les données de test: `npm run db:seed`

## 📚 Documentation complète

- **DASHBOARD_SETUP.md** - Configuration détaillée
- **FRONTEND_API_INTEGRATION.md** - Intégration API
- **API_ENDPOINTS_CHECKLIST.md** - Liste des endpoints
- **INTERFACE_OVERVIEW.md** - Vue d'ensemble du design

## 🔧 Commandes utiles

```bash
# Développement
npm run dev              # Backend + Frontend
npm run dev:api          # Backend seulement
npm run dev:dashboard    # Frontend seulement

# Build
npm run build            # Build complet
npm run build:api        # Build backend
npm run build:dashboard  # Build frontend

# Production
npm run start:all        # Backend + Preview frontend

# Database
npm run db:init          # Initialiser la DB
npm run db:seed          # Charger les données de test

# Maintenance
npm run health-check     # Vérifier la santé du système
npm test                 # Lancer les tests
```

## 🌐 Points d'accès

| Service | URL | Port |
|---------|-----|------|
| Dashboard Frontend | http://localhost:3000 | 3000 |
| Backend API | http://localhost:3001 | 3001 |
| PostgreSQL | localhost | 5432 |
| Redis | localhost | 6379 |

## 🔑 Endpoints principaux

```
GET  /api/agents           # Liste des agents
POST /api/agents           # Créer un agent
GET  /api/agents/:id       # Détails d'un agent
PUT  /api/agents/:id       # Mettre à jour
DELETE /api/agents/:id     # Supprimer

GET  /api/tasks            # Liste des tâches
POST /api/tasks            # Créer une tâche
GET  /api/tasks/:id        # Détails d'une tâche

GET  /api/stats            # Statistiques du dashboard
```

## 🐛 Troubleshooting

### "Port déjà en utilisation"
```bash
# Trouver le processus
lsof -i :3000    # Frontend
lsof -i :3001    # Backend

# Tuer le processus
kill -9 <PID>
```

### "Connexion DB échouée"
```bash
# Vérifier PostgreSQL
psql -h localhost -U postgres -d postgres

# Créer la DB si manquante
npm run db:init
```

### "API non accessible depuis le frontend"
- Vérifier que le backend s'exécute
- Vérifier le proxy dans `frontend/vite.config.ts`
- Vérifier CORS dans le backend

## 📦 Structure de fichiers

```
.
├── frontend/              # Application React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   ├── package.json
│   └── dist/              # Build frontend
├── api/                   # Backend Express
├── database/              # Schémas et migrations
├── config/                # Configuration
├── scripts/               # Scripts utilitaires
└── package.json           # Package principal
```

## ✅ Checklist de démarrage

- [ ] Cloner le repo
- [ ] Installer les dépendances (`npm install`)
- [ ] Installer les dépendances frontend (`npm install --prefix frontend`)
- [ ] Configurer `.env`
- [ ] Initialiser la DB (`npm run db:init`)
- [ ] Lancer en dev (`npm run dev`)
- [ ] Ouvrir http://localhost:3000
- [ ] Vérifier les endpoints API
- [ ] Tester la création d'un agent

## 📞 Support

En cas de problème:
1. Consulter la documentation dans les fichiers MD
2. Vérifier les logs du backend/frontend
3. Vérifier les services requis (DB, Redis)
4. Vérifier la configuration `.env`

## 🎉 Succès!

Si tout fonctionne:
- Dashboard visible sur http://localhost:3000
- Statistiques chargées
- Agents listés
- Tâches affichées

Bienvenue sur AEGIS Dashboard!
