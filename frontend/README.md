# AEGIS Dashboard

Dashboard moderne pour la gestion des agents IA AEGIS.

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Le dashboard sera disponible sur `http://localhost:3000`

## Build

```bash
npm run build
```

## Structure

- `src/pages/` - Pages principales (Dashboard, Agents, Tasks, etc.)
- `src/components/` - Composants réutilisables (Header, Sidebar, Cards, etc.)
- `src/services/` - Services API et logique métier
- `src/hooks/` - Hooks personnalisés
- `src/types/` - Définitions TypeScript

## Fonctionnalités

- ✅ Dashboard principal avec statistiques en temps réel
- ✅ Gestion des agents
- ✅ Suivi des tâches
- ✅ Graphiques d'activité
- ✅ Interface responsive
- 🔄 Analytics avancées (à venir)
- 🔄 Configuration utilisateur (à venir)

## Configuration

Créez un fichier `.env.local` :

```
VITE_API_URL=http://localhost:3001/api
```

## Technologies

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Recharts
- React Router
- Axios
