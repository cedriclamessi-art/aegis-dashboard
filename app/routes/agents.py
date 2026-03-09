import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.agents import AdOptimizerAgent, ContentGeneratorAgent, AnalyticsAgent, CampaignMonitorAgent, AuditAgent
from app.database import get_agent_runs, get_alerts
from app.config import META_ACCESS_TOKEN, META_AD_ACCOUNT_ID

router = APIRouter(prefix="/api/agents", tags=["agents"])


# ── Shared models ─────────────────────────────────────────
class CampaignData(BaseModel):
    name: str = "Campagne"
    platform: str = "meta"
    spend: float = 0
    revenue: float = 0
    roas: float = 0
    cpa: float = 0
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    ctr: float = 0


def _maybe_fetch_live(campaigns: list, account_id: str = None, auto_fetch: bool = False) -> list:
    """If auto_fetch is True and Meta is configured, pull live data."""
    if not auto_fetch or campaigns:
        return [c.model_dump() if hasattr(c, 'model_dump') else c for c in campaigns]
    aid = account_id or META_AD_ACCOUNT_ID
    if not aid or not META_ACCESS_TOKEN:
        return []
    try:
        from app.meta_connector import fetch_live_campaigns
        return fetch_live_campaigns(aid)
    except Exception:
        return []


# ── Ad Optimizer ──────────────────────────────────────────
class OptimizeRequest(BaseModel):
    user_id: str
    budget_daily: int = 50
    product_price: float = 0
    secteur: str = ""
    campaigns: list[CampaignData] = []
    auto_fetch: bool = False
    account_id: str = ""


@router.post("/optimize")
def run_optimizer(body: OptimizeRequest):
    try:
        data = body.model_dump()
        data["campaigns"] = _maybe_fetch_live(body.campaigns, body.account_id, body.auto_fetch)
        source = "meta_live" if body.auto_fetch and not body.campaigns else "manual"
        agent = AdOptimizerAgent()
        result = agent.run(body.user_id, data)
        result["_source"] = source
        return {"status": "ok", "agent": "optimizer", "result": result, "source": source}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Content Generator ────────────────────────────────────
class ContentRequest(BaseModel):
    user_id: str
    product_name: str
    product_description: str = ""
    platforms: list[str] = ["meta"]
    tone: str = "professionnel"
    language: str = "français"
    secteur: str = ""
    price: Optional[float] = None
    promotion: str = ""
    target_audience: str = ""


@router.post("/content")
def run_content(body: ContentRequest):
    try:
        agent = ContentGeneratorAgent()
        result = agent.run(body.user_id, body.model_dump())
        return {"status": "ok", "agent": "content", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Analytics ────────────────────────────────────────────
class AnalyticsRequest(BaseModel):
    user_id: str
    date_range: str = "7 derniers jours"
    campaigns: list[CampaignData] = []
    previous_period: Optional[list[CampaignData]] = None
    auto_fetch: bool = False
    account_id: str = ""


@router.post("/analytics")
def run_analytics(body: AnalyticsRequest):
    try:
        data = body.model_dump()
        data["campaigns"] = _maybe_fetch_live(body.campaigns, body.account_id, body.auto_fetch)
        source = "meta_live" if body.auto_fetch and not body.campaigns else "manual"
        agent = AnalyticsAgent()
        result = agent.run(body.user_id, data)
        result["_source"] = source
        return {"status": "ok", "agent": "analytics", "result": result, "source": source}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Campaign Monitor ─────────────────────────────────────
class MonitorRequest(BaseModel):
    user_id: str
    budget_daily: int = 50
    thresholds: dict = {"max_cpa": 20, "min_roas": 2.0}
    campaigns: list[CampaignData] = []
    auto_fetch: bool = False
    account_id: str = ""


@router.post("/monitor")
def run_monitor(body: MonitorRequest):
    try:
        data = body.model_dump()
        data["campaigns"] = _maybe_fetch_live(body.campaigns, body.account_id, body.auto_fetch)
        source = "meta_live" if body.auto_fetch and not body.campaigns else "manual"
        agent = CampaignMonitorAgent()
        result = agent.run(body.user_id, data)
        result["_source"] = source
        return {"status": "ok", "agent": "monitor", "result": result, "source": source}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Audit ─────────────────────────────────────────────────
class AuditRequest(BaseModel):
    user_id: str
    budget_daily: int = 50
    product_price: float = 0
    secteur: str = ""
    platforms: list[str] = ["meta"]
    campaigns: list[CampaignData] = []
    auto_fetch: bool = False
    account_id: str = ""


@router.post("/audit")
def run_audit(body: AuditRequest):
    try:
        data = body.model_dump()
        data["campaigns"] = _maybe_fetch_live(body.campaigns, body.account_id, body.auto_fetch)
        source = "meta_live" if body.auto_fetch and not body.campaigns else "manual"
        agent = AuditAgent()
        result = agent.run(body.user_id, data)
        result["_source"] = source
        return {"status": "ok", "agent": "audit", "result": result, "source": source}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── History & Alerts ─────────────────────────────────────
@router.get("/history/{user_id}")
def agent_history(user_id: str, limit: int = 20):
    runs = get_agent_runs(user_id, limit=limit)
    for r in runs:
        for field in ("input_data", "output_data"):
            if r.get(field) and isinstance(r[field], str):
                try:
                    r[field] = json.loads(r[field])
                except json.JSONDecodeError:
                    pass
    return {"runs": runs}


@router.get("/alerts/{user_id}")
def agent_alerts(user_id: str, unread_only: bool = False):
    alerts = get_alerts(user_id, unread_only=unread_only)
    for a in alerts:
        if a.get("data") and isinstance(a["data"], str):
            try:
                a["data"] = json.loads(a["data"])
            except json.JSONDecodeError:
                pass
    return {"alerts": alerts}
