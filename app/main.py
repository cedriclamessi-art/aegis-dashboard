"""
AEGIS Connect — API with AI Agents
5 agents IA, Meta Ads API v25.0, multi-provider LLM, SQLite persistence.

Lancer : uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.config import (
    ALLOWED_ORIGIN, COMPOSIO_API_KEY, ANTHROPIC_API_KEY, META_ACCESS_TOKEN,
    LLM_PROVIDER, LLM_MODEL, PROVIDER_DEFAULTS,
)
from app.database import init_db
from app.routes import connect, onboarding, agents, meta

log = logging.getLogger("aegis")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    model = LLM_MODEL or PROVIDER_DEFAULTS.get(LLM_PROVIDER, {}).get("model", "?")
    log.info("DB initialized")
    log.info("LLM: %s / %s", LLM_PROVIDER, model)
    log.info("Meta: %s | Composio: %s",
             "OK" if META_ACCESS_TOKEN else "---",
             "OK" if COMPOSIO_API_KEY else "---")
    yield
    log.info("Shutting down AEGIS Connect")


app = FastAPI(title="AEGIS Connect API", version="2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN] if ALLOWED_ORIGIN != "*" else ["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(connect.router)
app.include_router(onboarding.router)
app.include_router(agents.router)
app.include_router(meta.router)


@app.get("/health")
def health():
    model = LLM_MODEL or PROVIDER_DEFAULTS.get(LLM_PROVIDER, {}).get("model", "?")
    return {
        "status": "ok",
        "llm_provider": LLM_PROVIDER,
        "llm_model": model,
        "meta_ads": bool(META_ACCESS_TOKEN),
        "composio": bool(COMPOSIO_API_KEY),
        "agents": ["optimizer", "content", "analytics", "monitor", "audit"],
    }


@app.get("/")
def root():
    return FileResponse("aegis-connect-v3.html")
