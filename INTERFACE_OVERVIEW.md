# AEGIS Dashboard - Vue d'ensemble

## Bienvenue sur AEGIS Dashboard !

Un tableau de bord moderne et professionnel pour gérer votre plateforme d'agents IA AEGIS v5.0.

## Fonctionnalités principales

### 📊 Dashboard Principal
- **Statistiques en temps réel**: Nombre total d'agents, agents actifs, tâches complétées, taux de réussite
- **Graphique d'activité**: Suivi des tâches sur les 7 derniers jours
- **Liste des agents actifs**: Aperçu rapide des agents les plus actifs
- **Tendances**: Visualisation des performances avec indicateurs de croissance

### 🤖 Gestion des Agents
- Liste complète de tous les agents
- Statuts (Actif, Inactif, Erreur)
- Taux de réussite et nombre de tâches par agent
- Actions: Éditer, supprimer agents
- Créer de nouveaux agents

### ✅ Suivi des Tâches
- Liste des tâches avec statuts (En attente, En cours, Complétée, Erreur)
- Filtrage par agent et statut
- Historique et détails des tâches
- Analyse des performances

### 📈 Analytics (à venir)
- Graphiques avancés et statistiques détaillées
- Analyse des tendances
- Rapports d'exportation

### ⚙️ Paramètres (à venir)
- Configuration des préférences utilisateur
- Gestion des permissions
- Intégrations

## Architecture technique

### Frontend
- **Framework**: React 18 avec TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Hooks React
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Queue**: Bull (Redis)
- **Monitoring**: Pino Logger

## Design System

### Couleurs principales
- **Primaire (Aegis Blue)**: `#0ea5e9`
- **Success (Émeraude)**: `#10b981`
- **Warning (Ambre)**: `#f59e0b`
- **Error (Rouge)**: `#ef4444`
- **Background**: `#0f172a` (slate-950)

### Composants
- **StatCard**: Affiche une statistique avec icône et tendance
- **AgentList**: Liste des agents actifs
- **TaskChart**: Graphique d'activité
- **Header**: Navigation principale
- **Sidebar**: Menu de navigation

## Navigation

```
Dashboard (Accueil)
├── Agents
│   ├── Créer un agent
│   ├── Éditer agent
│   └── Supprimer agent
├── Tasks
│   ├── Filtrer par statut
│   ├── Détails tâche
│   └── Historique
├── Analytics
└── Settings
```

## Interaction avec l'API

Le dashboard communique avec le backend via une API REST:

```
Frontend (React)     Backend (Express)     Database (PostgreSQL)
   :3000        <----> :3001        <----> :5432
                  REST API                   Agents
                                             Tasks
                                             Statistics
```

## Installation et démarrage

### Mode développement
```bash
# Tous les services (backend + frontend)
npm run dev

# Uniquement backend
npm run dev:api

# Uniquement frontend
npm run dev:dashboard
```

### Build production
```bash
npm run build
```

## Structure des fichiers

```
frontend/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatCard.tsx
│   │   ├── AgentList.tsx
│   │   └── Chart.tsx
│   ├── pages/              # Pages principales
│   │   ├── Dashboard.tsx
│   │   ├── Agents.tsx
│   │   ├── Tasks.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   ├── services/           # Services API
│   │   └── api.ts
│   ├── hooks/              # Custom hooks
│   │   └── useDashboard.ts
│   ├── types/              # Définitions TypeScript
│   ├── App.tsx             # Composant principal
│   ├── main.tsx            # Point d'entrée
│   └── index.css           # Styles globaux
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

## Utilisation

### Vue du Dashboard
1. Ouvrir http://localhost:3000
2. Voir les statistiques principales
3. Consulter le graphique d'activité
4. Examiner les agents actifs

### Gestion des Agents
1. Cliquer sur "Agents" dans le menu
2. Consulter la liste de tous les agents
3. Cliquer sur "New Agent" pour en ajouter un
4. Utiliser les actions (éditer/supprimer) à droite

### Suivi des Tâches
1. Cliquer sur "Tasks" dans le menu
2. Voir toutes les tâches en cours
3. Utiliser les filtres pour affiner les résultats
4. Cliquer sur une tâche pour voir les détails

## Authentification

L'authentification JWT peut être configurée:
- Tokens stockés dans `localStorage`
- Intercepteurs Axios pour ajouter le token aux requêtes
- Gestion des sessions utilisateur

## Prochaines améliorations

- [ ] Intégration complète des Recharts
- [ ] Système d'authentification
- [ ] WebSocket pour les mises à jour en temps réel
- [ ] Export de rapports (PDF/CSV)
- [ ] Dashboards personnalisables
- [ ] Mode sombre/clair
- [ ] Notifications push
- [ ] Tests E2E avec Cypress
- [ ] Documentation des composants
- [ ] Performance optimization

## Support et documentation

- `DASHBOARD_SETUP.md` - Guide d'installation
- `FRONTEND_API_INTEGRATION.md` - Intégration API
- `frontend/README.md` - Documentation frontend
