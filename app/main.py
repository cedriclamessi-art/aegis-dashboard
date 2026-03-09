"""
AEGIS Connect — API with AI Agents
Gère les connexions OAuth, l'onboarding, et 4 agents IA.

Lancer : uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import ALLOWED_ORIGIN, COMPOSIO_API_KEY, ANTHROPIC_API_KEY, META_ACCESS_TOKEN
from app.database import init_db
from app.routes import connect, onboarding, agents, meta

app = FastAPI(title="AEGIS Connect API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN] if ALLOWED_ORIGIN != "*" else ["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(connect.router)
app.include_router(onboarding.router)
app.include_router(agents.router)
app.include_router(meta.router)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "composio": bool(COMPOSIO_API_KEY),
        "anthropic": bool(ANTHROPIC_API_KEY),
        "meta_ads": bool(META_ACCESS_TOKEN),
        "agents": ["optimizer", "content", "analytics", "monitor", "audit"],
    }


@app.get("/")
def root():
    return FileResponse("aegis-connect-v3.html")
