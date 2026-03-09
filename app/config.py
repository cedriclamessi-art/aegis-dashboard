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
