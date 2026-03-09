import os
from dotenv import load_dotenv

load_dotenv()

COMPOSIO_API_KEY = os.getenv("COMPOSIO_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", "")
META_AD_ACCOUNT_ID = os.getenv("META_AD_ACCOUNT_ID", "")
META_MCP_URL = os.getenv("META_MCP_URL", "")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")
PORT = int(os.getenv("PORT", "8000"))
DATABASE_PATH = os.getenv("DATABASE_PATH", "aegis.db")

# ── LLM Multi-Provider ──────────────────────────────────
# Providers: ollama (gratuit, local), groq (gratuit, rapide),
#            openrouter (agregateur), gemini (Google free tier),
#            anthropic (payant, meilleure qualite)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
LLM_API_KEY = os.getenv("LLM_API_KEY", "") or ANTHROPIC_API_KEY
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "")
LLM_MODEL = os.getenv("LLM_MODEL", "")

# Default models per provider (used when LLM_MODEL is empty)
PROVIDER_DEFAULTS = {
    "ollama": {"base_url": "http://localhost:11434/v1", "model": "llama3.1", "api_key": "ollama"},
    "groq": {"base_url": "https://api.groq.com/openai/v1", "model": "llama-3.1-70b-versatile"},
    "openrouter": {"base_url": "https://openrouter.ai/api/v1", "model": "meta-llama/llama-3.1-70b-instruct"},
    "anthropic": {"model": "claude-sonnet-4-20250514"},
    "gemini": {"model": "gemini-2.0-flash"},
}

# Legacy alias
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")

TOOLKIT_MAP = {
    "shopify": "SHOPIFY",
    "meta": "FACEBOOK_ADS",
    "tiktok": "TIKTOK_ADS",
    "google": "GOOGLE_ADS",
    "gmail": "GMAIL",
    "sheets": "GOOGLESHEETS",
    "slack": "SLACK",
}
