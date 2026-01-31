# 🚀 AEGIS v5.0 - Ultimate AI Agent Platform

Production-ready SaaS with 16 AI agents, 5 connectors, multi-tenant infrastructure.

## Features

✅ Multi-tenant SaaS (RLS, subscriptions, billing)
✅ 16 AI Agents with workflows
✅ 5 Connectors (Meta, TikTok, Google, Pinterest, Shopify)
✅ Job Queue + Scheduler + DLQ
✅ Webhooks + OAuth + Encrypted credentials
✅ Observability + Health checks + Metrics
✅ PostgreSQL 14+ + Redis

## Quick Start

\`\`\`bash
npm install
cp config/env.sample config/.env
npm run db:init
npm run db:seed
npm run dev
\`\`\`

## Project Structure

- agents/ - 16 AI agents + orchestration
- connectors/ - Meta, TikTok, Google, Pinterest, Shopify
- database/ - PostgreSQL schema, migrations
- jobs/ - Queue, scheduler, DLQ
- api/ - REST API server

## Deployment

\`\`\`bash
npm run build && npm run deploy
\`\`\`

## License

Proprietary - AEGIS v5.0
