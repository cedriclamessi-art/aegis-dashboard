# AEGIS Dashboard - Guide d'installation

## Architecture

```
AEGIS v5.0
├── Backend (Express + TypeScript)
│   ├── API REST sur le port 3001
│   ├── Base de données PostgreSQL
│   └── Services d'agents
│
└── Frontend (React + Vite)
    ├── Dashboard sur le port 3000
    ├── Interface utilisateur
    └── Appels API vers le backend
```

## Installation rapide

### 1. Backend

```bash
# Installation des dépendances
npm install

# Configuration de la base de données
npm run db:init
npm run db:seed

# Lancement du serveur API (port 3001)
npm run dev:api
```

### 2. Frontend

```bash
# Les dépendances du frontend sont automatiquement installées
# Lancement du dashboard (port 3000)
npm run dev:dashboard
```

### 3. Mode développement complet

Pour lancer simultanément le backend et le frontend:

```bash
npm run dev
```

Cela lancera:
- Backend API: http://localhost:3001
- Frontend Dashboard: http://localhost:3000

## Endpoints API utilisés par le dashboard

### Agents
- `GET /api/agents` - Liste tous les agents
- `GET /api/agents/:id` - Détails d'un agent
- `POST /api/agents` - Créer un nouvel agent
- `PUT /api/agents/:id` - Mettre à jour un agent
- `DELETE /api/agents/:id` - Supprimer un agent

### Tasks
- `GET /api/tasks` - Liste des tâches
- `GET /api/tasks/:id` - Détails d'une tâche
- `POST /api/tasks` - Créer une tâche

### Statistics
- `GET /api/stats` - Statistiques du dashboard

## Structure du Frontend

```
frontend/src/
├── components/           # Composants réutilisables
│   ├── Header.tsx       # En-tête avec navigation
│   ├── Sidebar.tsx      # Menu latéral
│   ├── StatCard.tsx     # Carte de statistique
│   ├── AgentList.tsx    # Liste des agents
│   └── Chart.tsx        # Graphiques
│
├── pages/               # Pages principales
│   ├── Dashboard.tsx    # Tableau de bord principal
│   ├── Agents.tsx       # Gestion des agents
│   ├── Tasks.tsx        # Gestion des tâches
│   ├── Analytics.tsx    # Analytiques
│   └── Settings.tsx     # Paramètres
│
├── services/           # Services API
│   └── api.ts          # Client API avec Axios
│
├── hooks/              # Hooks personnalisés
│   └── useDashboard.ts # Hook pour les statistiques
│
├── types/              # Définitions TypeScript
│   └── index.ts        # Types généraux
│
└── App.tsx            # Composant principal avec Router
```

## Configuration de l'API Backend

Le frontend s'attend aux endpoints API suivants (voir `frontend/src/services/api.ts`):

```typescript
// Chemin de base: http://localhost:3001/api
const API_BASE = '/api'
```

### Exemple de réponse attendue pour les statistiques

```json
{
  "total_agents": 15,
  "active_agents": 12,
  "total_tasks": 342,
  "success_rate": 94,
  "tasks_today": 28
}
```

## Personnalisation

### Thème et couleurs

Les couleurs sont définies dans `frontend/tailwind.config.js`:

```javascript
colors: {
  aegis: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    // ...
    900: '#0c2d6b',
  }
}
```

### Ajout de nouvelles pages

1. Créer le fichier dans `frontend/src/pages/`
2. Ajouter la route dans `frontend/src/App.tsx`
3. Ajouter l'entrée de navigation dans `frontend/src/components/Sidebar.tsx`

## Build pour production

```bash
# Build complet (backend + frontend)
npm run build

# Build du frontend uniquement
npm run build:dashboard

# Preview du build frontend
npm run preview:dashboard
```

## Troubleshooting

### Le dashboard ne peut pas se connecter à l'API
- Vérifiez que le backend API s'exécute sur le port 3001
- Vérifiez le proxy dans `frontend/vite.config.ts`
- Vérifiez que les endpoints retournent les bonnes données

### Erreurs de TypeScript
```bash
# Réinstaller les dépendances
npm install --prefix frontend
npm run build
```

### Ports déjà utilisés
```bash
# Changer le port du dashboard dans frontend/vite.config.ts
server: { port: 3001 }

# Changer le port de l'API dans api/server.ts
const PORT = process.env.PORT || 3002
```

## Prochaines étapes

- [ ] Implémenter l'authentification JWT
- [ ] Ajouter des graphiques avec Recharts
- [ ] Créer des modales pour la création/édition d'agents
- [ ] Ajouter les notifications en temps réel (WebSocket)
- [ ] Implémenter le système de permissions
- [ ] Ajouter des tests E2E
