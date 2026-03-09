# AEGIS Connect

## What is this?
AEGIS Connect is a FastAPI-based platform for e-commerce ad optimization. It connects stores (Shopify) to ad platforms (Meta, Google, TikTok) and provides 5 AI agents powered by Claude for campaign analysis and optimization.

## Tech Stack
- **Backend**: FastAPI (Python 3.12)
- **LLM**: Claude API via `anthropic` SDK (model: claude-sonnet-4-20250514)
- **Database**: SQLite with WAL mode
- **Meta Ads**: Direct Graph API v25.0 via `httpx`
- **OAuth**: Composio SDK
- **Frontend**: Single-file HTML SPA (vanilla JS, no framework)
- **Deploy**: Docker + Render (render.yaml Blueprint)

## Project Structure
```
app/
  main.py          — FastAPI app, lifespan, CORS, route mounting
  config.py        — All env vars loaded here
  database.py      — SQLite: shops, agent_runs, alerts tables
  benchmarks.py    — Industry thresholds, scoring, psychology framework
  meta_connector.py — Meta Graph API bridge (insights, duplication, audience, previews)
  agents/
    base.py        — BaseAgent: Claude API call, JSON parsing, logging, DB persistence
    optimizer.py   — Budget/bid optimization recommendations
    content.py     — Ad copy generation (4 Horsemen psychology)
    analytics.py   — Performance reports with insights
    monitor.py     — 24/7 surveillance, bleeder/fatigue detection, alerts
    audit.py       — 190-check audit with A-F scoring
  routes/
    connect.py     — OAuth endpoints (Composio)
    onboarding.py  — Shop config persistence
    agents.py      — All 5 agent POST endpoints + history + alerts
    meta.py        — 13 Meta API routes (insights, duplication, audience, reporting)
aegis-connect-v3.html — Full frontend SPA
```

## Key Patterns
- All agents extend `BaseAgent` — override `build_prompt()` and `system_prompt`
- Agent runs are persisted to `agent_runs` table with input/output
- Monitor agent auto-saves alerts to `alerts` table
- Meta connector has sync wrappers around async functions for use in sync agent code
- `auto_fetch` flag on agent endpoints pulls live Meta data when enabled

## API Routes (29 total)
- `GET /health` — Service health + config status
- `GET /` — Serve frontend HTML
- `POST /api/agents/{optimizer|content|analytics|monitor|audit}` — Run agents
- `GET /api/agents/history/{user_id}` — Agent run history
- `GET /api/agents/alerts/{user_id}` — User alerts
- `GET /api/meta/status` — Meta config check
- `GET /api/meta/{accounts|campaigns|insights|creatives}` — Read data
- `POST /api/meta/duplicate/{campaign|adset}` — Clone objects
- `POST /api/meta/audience/estimate` — Audience sizing
- `GET /api/meta/audience/interests` — Interest search
- `GET /api/meta/report/{daily|demographics|placements}` — Breakdowns
- `GET /api/meta/preview/{ad_id}` — Ad preview

## Running Locally
```bash
cp .env.example .env    # Fill in API keys
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Deploy to Render
Push to GitHub, then connect on dashboard.render.com using the Blueprint (render.yaml).
Set env vars in Render dashboard: ANTHROPIC_API_KEY (required), META_ACCESS_TOKEN + META_AD_ACCOUNT_ID (optional).

## Conventions
- All agents respond in French by default
- Agent JSON output is extracted with `find("{")..rfind("}")` pattern
- Pydantic models validate all API inputs
- Error responses use HTTPException with detail string
- Logging via `logging.getLogger("aegis")` / `logging.getLogger("aegis.agent")`
