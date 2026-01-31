# Intégration du Dashboard Frontend avec le Backend

## Endpoints requis

Le dashboard AEGIS s'attend aux endpoints suivants. Assurez-vous que votre backend Express les implémente:

### 1. Agents

#### GET /api/agents
Récupère la liste de tous les agents

**Réponse (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Agent Name",
    "type": "analyzer|executor|monitor",
    "status": "active|inactive|error",
    "created_at": "2024-01-30T00:00:00Z",
    "updated_at": "2024-01-30T00:00:00Z",
    "task_count": 42,
    "success_rate": 94.5
  }
]
```

#### GET /api/agents/:id
Récupère les détails d'un agent spécifique

#### POST /api/agents
Crée un nouvel agent

**Payload:**
```json
{
  "name": "New Agent",
  "type": "analyzer",
  "status": "inactive"
}
```

#### PUT /api/agents/:id
Met à jour un agent

#### DELETE /api/agents/:id
Supprime un agent

### 2. Tasks

#### GET /api/tasks
Récupère la liste des tâches (avec filtre optionnel par agent)

**Query params:**
- `agent_id` (optionnel): Filtrer par agent

**Réponse (200 OK):**
```json
[
  {
    "id": "uuid",
    "agent_id": "uuid",
    "status": "pending|running|completed|failed",
    "created_at": "2024-01-30T00:00:00Z",
    "updated_at": "2024-01-30T00:00:00Z",
    "result": "Task result or output",
    "error": "Error message if failed"
  }
]
```

#### GET /api/tasks/:id
Récupère les détails d'une tâche

#### POST /api/tasks
Crée une nouvelle tâche

**Payload:**
```json
{
  "agent_id": "uuid",
  "status": "pending"
}
```

### 3. Statistics

#### GET /api/stats
Récupère les statistiques du dashboard

**Réponse (200 OK):**
```json
{
  "total_agents": 15,
  "active_agents": 12,
  "total_tasks": 342,
  "success_rate": 94.2,
  "tasks_today": 28
}
```

## Exemple d'implémentation Backend (Express)

```typescript
import express from 'express'
import type { Request, Response } from 'express'

const app = express()

// Middleware
app.use(express.json())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

// Endpoints Agents
app.get('/api/agents', async (req: Request, res: Response) => {
  // TODO: Implémenter la logique
  res.json([])
})

app.get('/api/agents/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  // TODO: Implémenter la logique
  res.json({})
})

app.post('/api/agents', async (req: Request, res: Response) => {
  // TODO: Implémenter la logique
  res.status(201).json({})
})

app.put('/api/agents/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  // TODO: Implémenter la logique
  res.json({})
})

app.delete('/api/agents/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  // TODO: Implémenter la logique
  res.status(204).send()
})

// Endpoints Tasks
app.get('/api/tasks', async (req: Request, res: Response) => {
  const { agent_id } = req.query
  // TODO: Implémenter la logique
  res.json([])
})

app.get('/api/tasks/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  // TODO: Implémenter la logique
  res.json({})
})

app.post('/api/tasks', async (req: Request, res: Response) => {
  // TODO: Implémenter la logique
  res.status(201).json({})
})

// Statistics
app.get('/api/stats', async (req: Request, res: Response) => {
  // TODO: Implémenter la logique avec requêtes à la BD
  res.json({
    total_agents: 0,
    active_agents: 0,
    total_tasks: 0,
    success_rate: 0,
    tasks_today: 0
  })
})

app.listen(3001, () => {
  console.log('API listening on port 3001')
})
```

## Configuration CORS

Assurez-vous que votre backend autorise les requêtes CORS depuis le frontend:

```typescript
import cors from 'cors'

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

## Proxy Vite (développement)

Le Vite config inclut un proxy automatique:

```typescript
// frontend/vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  }
}
```

Cela signifie que les requêtes `/api/*` sont automatiquement redirigées vers `http://localhost:3001/api/*`

## Authentification

Pour ajouter l'authentification JWT:

```typescript
// Dans les services API (frontend/src/services/api.ts)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Dans le backend
import jwt from 'jsonwebtoken'

app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
})
```

## Testing

### Test des endpoints avec curl

```bash
# GET agents
curl http://localhost:3001/api/agents

# GET stats
curl http://localhost:3001/api/stats

# POST new agent
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Agent","type":"analyzer"}'
```

### Test du dashboard

1. Lancer le backend: `npm run dev:api`
2. Lancer le frontend: `npm run dev:dashboard`
3. Ouvrir http://localhost:3000 dans le navigateur
4. Vérifier les requêtes dans les DevTools
