# AEGIS Dashboard - Deployment Guide

## Production Build

### Build complet
```bash
npm run build
```

Cela génère:
- `dist/` - Application frontend compilée
- `dist/api/server.js` - Backend compilé

### Structure de déploiement

```
/var/www/aegis/
├── dist/                  # Frontend build
├── dist/api/              # Backend build
├── node_modules/
├── frontend/dist/         # Frontend static files
└── .env                   # Configuration production
```

## Docker Deployment

### Dockerfile (optionnel)

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Installer les dépendances
RUN npm ci
RUN npm ci --prefix frontend

# Build
RUN npm run build

# Exposer les ports
EXPOSE 3001 3000

# Lancer l'application
CMD ["npm", "run", "start:all"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: aegis
      POSTGRES_USER: aegis
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  aegis:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_USER: aegis
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: aegis
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

Lancer avec:
```bash
docker-compose up -d
```

## Environment Variables (Production)

Créer `.env` pour la production:

```env
NODE_ENV=production
PORT=3001

# Database
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=aegis_prod
DB_USER=aegis_user
DB_PASSWORD=your-secure-password

# Redis
REDIS_URL=redis://your-redis-host:6379

# JWT
JWT_SECRET=your-very-secure-jwt-secret-key

# CORS
CORS_ORIGIN=https://your-domain.com

# Logging
LOG_LEVEL=info
```

## Nginx Configuration

```nginx
upstream aegis_api {
    server localhost:3001;
}

upstream aegis_frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name aegis.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name aegis.example.com;

    ssl_certificate /etc/ssl/certs/aegis.crt;
    ssl_certificate_key /etc/ssl/private/aegis.key;

    # Frontend static files
    location / {
        root /var/www/aegis/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://aegis_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

## Performance Optimization

### Frontend
```bash
# Minification et tree-shaking automatique avec Vite
npm run build

# Vérifier la taille des chunks
npm run build:dashboard
# Vérifier dist/assets/
```

### Backend
```typescript
// Enable compression
import compression from 'compression'
app.use(compression())

// Enable caching
app.set('view cache', true)

// Rate limiting
import rateLimit from 'express-rate-limit'
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})
app.use(limiter)
```

## Monitoring

### Health Check
```bash
curl https://aegis.example.com/api/health
```

### Logging
```typescript
// Pino logs with structured format
logger.info({ endpoint: '/api/agents', status: 200 })
```

### Database Backups
```bash
# Backup PostgreSQL
pg_dump aegis_prod > backup_$(date +%Y%m%d).sql

# Restore
psql aegis_prod < backup_20240130.sql
```

## Scaling

### Horizontal Scaling
```bash
# Load balancer (Nginx)
# Multiple instances behind HAProxy or Nginx

upstream aegis_cluster {
    server app1.local:3001;
    server app2.local:3001;
    server app3.local:3001;
}
```

### Caching Layer
```bash
# Redis cache for agents/tasks
# TTL: 5 minutes for stats
# TTL: 1 minute for tasks
```

### Database Optimization
```sql
-- Indexes for better performance
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Use environment variables for secrets
- [ ] Enable CORS properly
- [ ] Rate limiting active
- [ ] CSRF protection
- [ ] Input validation on API
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Regular security updates
- [ ] Database encryption
- [ ] API authentication (JWT)
- [ ] Audit logging

## CI/CD Integration

### GitHub Actions example

```yaml
name: Deploy AEGIS

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        run: |
          ssh user@server "cd /var/www/aegis && \
            git pull && \
            npm install && \
            npm run build && \
            pm2 restart aegis"
```

## Monitoring & Alerts

### PM2 Process Management
```bash
# Start with PM2
pm2 start npm --name "aegis" -- run "start:all"

# Monitor
pm2 monit

# Setup auto-restart
pm2 startup
pm2 save
```

### Sentry for Error Tracking
```typescript
import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

## Troubleshooting

### Memory Issues
```bash
# Check Node memory
node --max-old-space-size=4096 dist/api/server.js

# Check Redis memory
redis-cli info memory
```

### Database Connections
```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < now() - interval '5 minutes';
```

### API Performance
```bash
# Monitor with Artillery
artillery load --target http://aegis.example.com api-test.yml
```

## Rollback Plan

```bash
# Keep previous builds
cp -r dist/ dist.backup_20240130

# In case of issues
cp -r dist.backup_20240130/* dist/
pm2 restart aegis
```
