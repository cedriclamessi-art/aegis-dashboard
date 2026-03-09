"""
Meta Ads API routes — direct access to Meta campaign data.
Includes: campaigns, insights, duplication, audience estimation, ad previews, reporting.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.config import META_ACCESS_TOKEN, META_AD_ACCOUNT_ID
from app.meta_connector import (
    sync_get_ad_accounts,
    sync_get_campaigns,
    fetch_live_campaigns,
    sync_duplicate_campaign,
    sync_duplicate_adset,
    sync_estimate_audience,
    sync_get_targeting_interests,
    sync_get_ad_preview,
    sync_get_ad_creatives,
    sync_get_detailed_insights,
    sync_get_age_gender_breakdown,
    sync_get_placement_breakdown,
)

router = APIRouter(prefix="/api/meta", tags=["meta"])


def _require_token():
    if not META_ACCESS_TOKEN:
        raise HTTPException(status_code=400, detail="META_ACCESS_TOKEN non configuree")


def _require_account(account_id: str = None) -> str:
    aid = account_id or META_AD_ACCOUNT_ID
    if not aid:
        raise HTTPException(status_code=400, detail="account_id requis (ou configurer META_AD_ACCOUNT_ID)")
    return aid


@router.get("/status")
def meta_status():
    """Check if Meta Ads is configured."""
    return {
        "configured": bool(META_ACCESS_TOKEN),
        "account_id": META_AD_ACCOUNT_ID or None,
    }


@router.get("/accounts")
def list_accounts():
    """List all accessible Meta ad accounts."""
    _require_token()
    try:
        accounts = sync_get_ad_accounts()
        return {"accounts": accounts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/campaigns")
def list_campaigns(account_id: str = None):
    """List active campaigns for an account."""
    _require_token()
    aid = _require_account(account_id)
    try:
        campaigns = sync_get_campaigns(aid)
        return {"campaigns": campaigns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights")
def get_campaign_insights(account_id: str = None, date_preset: str = "last_7d"):
    """Fetch live campaign performance in AEGIS CampaignData format."""
    _require_token()
    aid = _require_account(account_id)
    try:
        data = fetch_live_campaigns(aid, date_preset=date_preset)
        return {"campaigns": data, "source": "meta_live", "date_preset": date_preset}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Duplication (armavita) ────────────────────────────────

class DuplicateCampaignRequest(BaseModel):
    campaign_id: str
    new_name: Optional[str] = None
    status: str = "PAUSED"


class DuplicateAdSetRequest(BaseModel):
    adset_id: str
    new_campaign_id: Optional[str] = None
    new_name: Optional[str] = None


@router.post("/duplicate/campaign")
def duplicate_campaign_route(body: DuplicateCampaignRequest):
    """Duplicate a campaign (created as PAUSED)."""
    _require_token()
    try:
        result = sync_duplicate_campaign(body.campaign_id, new_name=body.new_name, status=body.status)
        return {"status": "ok", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/duplicate/adset")
def duplicate_adset_route(body: DuplicateAdSetRequest):
    """Duplicate an ad set, optionally into a different campaign."""
    _require_token()
    try:
        result = sync_duplicate_adset(body.adset_id, new_campaign_id=body.new_campaign_id, new_name=body.new_name)
        return {"status": "ok", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Audience Estimation (armavita) ────────────────────────

class AudienceEstimateRequest(BaseModel):
    targeting_spec: dict
    account_id: Optional[str] = None


@router.post("/audience/estimate")
def estimate_audience(body: AudienceEstimateRequest):
    """Estimate audience size for a targeting specification."""
    _require_token()
    aid = _require_account(body.account_id)
    try:
        result = sync_estimate_audience(aid, body.targeting_spec)
        return {"status": "ok", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audience/interests")
def search_interests(q: str, limit: int = 20):
    """Search targeting interests by keyword."""
    _require_token()
    try:
        results = sync_get_targeting_interests(q, limit=limit)
        return {"interests": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Ad Preview (armavita) ─────────────────────────────────

@router.get("/preview/{ad_id}")
def get_preview(ad_id: str, ad_format: str = "DESKTOP_FEED_STANDARD"):
    """Get ad preview iframe for a specific ad."""
    _require_token()
    try:
        result = sync_get_ad_preview(ad_id, ad_format=ad_format)
        return {"status": "ok", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/creatives")
def list_creatives(account_id: str = None, limit: int = 25):
    """List ad creatives for an account."""
    _require_token()
    aid = _require_account(account_id)
    try:
        creatives = sync_get_ad_creatives(aid, limit=limit)
        return {"creatives": creatives}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Reporting / Breakdowns (armavita) ─────────────────────

@router.get("/report/daily")
def daily_report(account_id: str = None, date_preset: str = "last_7d"):
    """Get daily time-series performance data for charts."""
    _require_token()
    aid = _require_account(account_id)
    try:
        data = sync_get_detailed_insights(aid, date_preset=date_preset, time_increment="1")
        return {"status": "ok", "data": data, "date_preset": date_preset}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/demographics")
def demographics_report(account_id: str = None, date_preset: str = "last_7d"):
    """Get performance breakdown by age and gender."""
    _require_token()
    aid = _require_account(account_id)
    try:
        data = sync_get_age_gender_breakdown(aid, date_preset=date_preset)
        return {"status": "ok", "data": data, "date_preset": date_preset}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/placements")
def placements_report(account_id: str = None, date_preset: str = "last_7d"):
    """Get performance breakdown by placement (feed, stories, reels, etc.)."""
    _require_token()
    aid = _require_account(account_id)
    try:
        data = sync_get_placement_breakdown(aid, date_preset=date_preset)
        return {"status": "ok", "data": data, "date_preset": date_preset}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
