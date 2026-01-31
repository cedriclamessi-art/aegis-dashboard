# Checklist des Endpoints API pour le Dashboard

## ✅ Endpoints requis pour le Dashboard

### Agents
- [ ] `GET /api/agents` - Liste tous les agents
  - Response: Array<{id, name, type, status, task_count, success_rate, created_at, updated_at}>
  
- [ ] `GET /api/agents/:id` - Récupère un agent
  - Response: {id, name, type, status, task_count, success_rate, created_at, updated_at}
  
- [ ] `POST /api/agents` - Crée un nouvel agent
  - Payload: {name, type, status}
  - Response: {id, name, type, status, task_count, success_rate, created_at, updated_at}
  
- [ ] `PUT /api/agents/:id` - Met à jour un agent
  - Payload: Partial<Agent>
  - Response: {id, name, type, status, task_count, success_rate, created_at, updated_at}
  
- [ ] `DELETE /api/agents/:id` - Supprime un agent
  - Response: 204 No Content

### Tasks
- [ ] `GET /api/tasks` - Liste les tâches
  - Query: ?agent_id=uuid (optionnel)
  - Response: Array<{id, agent_id, status, created_at, updated_at, result, error}>
  
- [ ] `GET /api/tasks/:id` - Récupère une tâche
  - Response: {id, agent_id, status, created_at, updated_at, result, error}
  
- [ ] `POST /api/tasks` - Crée une tâche
  - Payload: {agent_id, status}
  - Response: {id, agent_id, status, created_at, updated_at, result, error}

### Statistics
- [ ] `GET /api/stats` - Récupère les statistiques
  - Response: {total_agents, active_agents, total_tasks, success_rate, tasks_today}

## Implementation Status

### Backend Implementation
- [ ] Vérifier que tous les endpoints sont implémentés
- [ ] Vérifier que les formats de réponse correspondent
- [ ] Tester les endpoints avec curl ou Postman
- [ ] Ajouter la validation des données
- [ ] Ajouter la gestion des erreurs
- [ ] Ajouter les logs d'API

### Frontend Integration
- [ ] Tester la connexion API en développement
- [ ] Vérifier que les requêtes sont correctement formatées
- [ ] Tester le chargement des données du dashboard
- [ ] Tester la création/modification/suppression d'agents
- [ ] Tester la création/suivi des tâches

## Test rapide

### Avec curl
```bash
# Tester la connexion
curl http://localhost:3001/api/stats

# Tester GET agents
curl http://localhost:3001/api/agents

# Tester POST agent
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"analyzer","status":"inactive"}'

# Tester GET tasks
curl http://localhost:3001/api/tasks
```

### Dans le browser console
```javascript
// Test de la connexion API
fetch('http://localhost:3001/api/stats')
  .then(r => r.json())
  .then(d => console.log(d))
```

## Format de réponse détaillé

### Agent Object
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "AI Analyzer",
  "type": "analyzer",
  "status": "active",
  "task_count": 42,
  "success_rate": 94.5,
  "created_at": "2024-01-30T10:00:00Z",
  "updated_at": "2024-01-30T10:00:00Z"
}
```

### Task Object
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "agent_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "created_at": "2024-01-30T10:00:00Z",
  "updated_at": "2024-01-30T10:05:00Z",
  "result": "Analysis completed successfully",
  "error": null
}
```

### Dashboard Stats Object
```json
{
  "total_agents": 15,
  "active_agents": 12,
  "total_tasks": 342,
  "success_rate": 94.2,
  "tasks_today": 28
}
```

## Notes importantes

1. **CORS**: Assurez-vous que CORS est activé côté backend
2. **Port API**: Le frontend s'attend à ce que l'API soit sur le port 3001
3. **Content-Type**: Toutes les requêtes POST/PUT doivent avoir `Content-Type: application/json`
4. **Erreurs**: Les erreurs doivent retourner le code HTTP approprié (400, 404, 500)
5. **Authentication**: Préparez pour l'ajout future de JWT tokens
