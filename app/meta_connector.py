"""
AEGIS Meta Connector — Bridge to Meta Ads API
Fetches campaign data, duplicates campaigns, estimates audiences, generates previews.
Inspired by meta-ads-mcp + armavita-meta-ads-mcp patterns.
"""

import asyncio
import httpx
from app.config import META_ACCESS_TOKEN, META_MCP_URL

# Meta Graph API base
META_API_VERSION = "v25.0"
META_API_BASE = f"https://graph.facebook.com/{META_API_VERSION}"


def _get_token():
    if not META_ACCESS_TOKEN:
        raise RuntimeError("META_ACCESS_TOKEN manquante. Configure ton .env.")
    return META_ACCESS_TOKEN


async def _meta_get(endpoint: str, params: dict = None) -> dict:
    token = _get_token()
    params = params or {}
    params["access_token"] = token
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(f"{META_API_BASE}/{endpoint}", params=params)
        resp.raise_for_status()
        return resp.json()


async def _meta_post(endpoint: str, data: dict = None) -> dict:
    token = _get_token()
    data = data or {}
    data["access_token"] = token
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{META_API_BASE}/{endpoint}", data=data)
        resp.raise_for_status()
        return resp.json()


# ── Account Discovery ────────────────────────────────────
async def get_ad_accounts(limit: int = 50) -> list[dict]:
    """Get all ad accounts accessible by the token."""
    result = await _meta_get("me/adaccounts", {
        "fields": "id,name,account_status,currency,timezone_name,amount_spent,balance",
        "limit": limit,
    })
    return result.get("data", [])


# ── Campaigns ────────────────────────────────────────────
async def get_campaigns(account_id: str, status_filter: str = "ACTIVE") -> list[dict]:
    """Get campaigns for an ad account."""
    params = {
        "fields": "id,name,status,objective,daily_budget,lifetime_budget,budget_remaining",
        "limit": 100,
    }
    if status_filter:
        params["effective_status"] = f'["{status_filter}"]'
    result = await _meta_get(f"{account_id}/campaigns", params)
    return result.get("data", [])


# ── Ad Sets ──────────────────────────────────────────────
async def get_adsets(account_id: str, campaign_id: str = None) -> list[dict]:
    """Get ad sets, optionally filtered by campaign."""
    endpoint = f"{campaign_id}/adsets" if campaign_id else f"{account_id}/adsets"
    result = await _meta_get(endpoint, {
        "fields": "id,name,status,daily_budget,bid_amount,targeting,optimization_goal",
        "limit": 100,
    })
    return result.get("data", [])


# ── Insights (Performance Data) ──────────────────────────
async def get_insights(
    object_id: str,
    date_preset: str = "last_7d",
    level: str = "campaign",
    breakdowns: str = None,
) -> list[dict]:
    """
    Get performance insights for an account, campaign, or adset.

    object_id: account ID (act_xxx) or campaign/adset ID
    date_preset: last_7d, last_14d, last_30d, last_90d, yesterday, today
    level: account, campaign, adset, ad
    """
    params = {
        "fields": ",".join([
            "campaign_name", "adset_name", "ad_name",
            "spend", "impressions", "clicks", "ctr", "cpc",
            "actions", "action_values", "cost_per_action_type",
            "reach", "frequency",
        ]),
        "date_preset": date_preset,
        "level": level,
        "limit": 100,
    }
    if breakdowns:
        params["breakdowns"] = breakdowns

    result = await _meta_get(f"{object_id}/insights", params)
    return result.get("data", [])


def parse_insights_to_campaigns(insights: list[dict]) -> list[dict]:
    """
    Convert raw Meta insights into the CampaignData format used by AEGIS agents.
    """
    campaigns = []
    for row in insights:
        spend = float(row.get("spend", 0))
        impressions = int(row.get("impressions", 0))
        clicks = int(row.get("clicks", 0))
        ctr = float(row.get("ctr", 0))

        # Extract conversions and revenue from actions
        conversions = 0
        revenue = 0
        for action in row.get("actions", []):
            if action.get("action_type") in ("purchase", "offsite_conversion.fb_pixel_purchase"):
                conversions += int(action.get("value", 0))
        for val in row.get("action_values", []):
            if val.get("action_type") in ("purchase", "offsite_conversion.fb_pixel_purchase"):
                revenue += float(val.get("value", 0))

        cpa = spend / conversions if conversions > 0 else 0
        roas = revenue / spend if spend > 0 else 0

        campaigns.append({
            "name": row.get("campaign_name", row.get("adset_name", "Campaign")),
            "platform": "meta",
            "spend": round(spend, 2),
            "revenue": round(revenue, 2),
            "roas": round(roas, 2),
            "cpa": round(cpa, 2),
            "impressions": impressions,
            "clicks": clicks,
            "conversions": conversions,
            "ctr": round(ctr, 2),
        })
    return campaigns


# ── Sync wrappers (for use in sync agent code) ──────────
def sync_get_ad_accounts(**kwargs) -> list[dict]:
    return asyncio.run(get_ad_accounts(**kwargs))


def sync_get_campaigns(account_id: str, **kwargs) -> list[dict]:
    return asyncio.run(get_campaigns(account_id, **kwargs))


def sync_get_insights(object_id: str, **kwargs) -> list[dict]:
    return asyncio.run(get_insights(object_id, **kwargs))


def fetch_live_campaigns(account_id: str, date_preset: str = "last_7d") -> list[dict]:
    """
    One-call function: fetch insights and convert to AEGIS CampaignData format.
    This is the main entry point for agents.
    """
    raw = sync_get_insights(account_id, date_preset=date_preset, level="campaign")
    return parse_insights_to_campaigns(raw)


# ── Campaign Duplication (armavita-meta-ads-mcp) ─────────
async def duplicate_campaign(campaign_id: str, new_name: str = None, status: str = "PAUSED") -> dict:
    """Duplicate a campaign. Returns the new campaign object."""
    original = await _meta_get(campaign_id, {
        "fields": "name,objective,buying_type,special_ad_categories,bid_strategy,daily_budget,lifetime_budget,status"
    })
    account_id = await _meta_get(campaign_id, {"fields": "account_id"})
    aid = f"act_{account_id.get('account_id', '')}"

    create_data = {
        "name": new_name or f"{original.get('name', 'Campaign')} — Copy",
        "objective": original.get("objective", "OUTCOME_SALES"),
        "status": status,
        "special_ad_categories": original.get("special_ad_categories", []),
    }
    if original.get("daily_budget"):
        create_data["daily_budget"] = original["daily_budget"]
    if original.get("lifetime_budget"):
        create_data["lifetime_budget"] = original["lifetime_budget"]
    if original.get("bid_strategy"):
        create_data["bid_strategy"] = original["bid_strategy"]

    result = await _meta_post(f"{aid}/campaigns", create_data)
    return {"original_id": campaign_id, "new_id": result.get("id"), "name": create_data["name"], "status": status}


async def duplicate_adset(adset_id: str, new_campaign_id: str = None, new_name: str = None) -> dict:
    """Duplicate an ad set, optionally into a different campaign."""
    original = await _meta_get(adset_id, {
        "fields": "name,campaign_id,daily_budget,billing_event,optimization_goal,targeting,bid_amount,status"
    })

    target_campaign = new_campaign_id or original.get("campaign_id")
    create_data = {
        "name": new_name or f"{original.get('name', 'AdSet')} — Copy",
        "campaign_id": target_campaign,
        "billing_event": original.get("billing_event", "IMPRESSIONS"),
        "optimization_goal": original.get("optimization_goal", "OFFSITE_CONVERSIONS"),
        "status": "PAUSED",
    }
    if original.get("daily_budget"):
        create_data["daily_budget"] = original["daily_budget"]
    if original.get("targeting"):
        import json
        create_data["targeting"] = json.dumps(original["targeting"])
    if original.get("bid_amount"):
        create_data["bid_amount"] = original["bid_amount"]

    account_id = await _meta_get(adset_id, {"fields": "account_id"})
    aid = f"act_{account_id.get('account_id', '')}"
    result = await _meta_post(f"{aid}/adsets", create_data)
    return {"original_id": adset_id, "new_id": result.get("id"), "name": create_data["name"]}


# ── Audience Size Estimation (armavita-meta-ads-mcp) ─────
async def estimate_audience_size(account_id: str, targeting_spec: dict) -> dict:
    """
    Estimate potential reach for a targeting specification.
    targeting_spec example: {"geo_locations": {"countries": ["FR"]}, "age_min": 25, "age_max": 55}
    """
    import json
    params = {
        "targeting_spec": json.dumps(targeting_spec),
        "optimize_for": "OFFSITE_CONVERSIONS",
    }
    result = await _meta_get(f"{account_id}/delivery_estimate", params)
    data = result.get("data", [{}])
    if data:
        estimate = data[0]
        return {
            "daily_outcomes_curve": estimate.get("daily_outcomes_curve", []),
            "estimate_dau": estimate.get("estimate_dau", 0),
            "estimate_mau_lower_bound": estimate.get("estimate_mau_lower_bound", 0),
            "estimate_mau_upper_bound": estimate.get("estimate_mau_upper_bound", 0),
            "estimate_ready": estimate.get("estimate_ready", False),
        }
    return {"estimate_mau_lower_bound": 0, "estimate_mau_upper_bound": 0, "estimate_ready": False}


async def get_targeting_interests(query: str, limit: int = 20) -> list[dict]:
    """Search for targeting interests by keyword."""
    result = await _meta_get("search", {
        "type": "adinterest",
        "q": query,
        "limit": limit,
    })
    return [{"id": r["id"], "name": r["name"], "audience_size": r.get("audience_size", 0),
             "path": r.get("path", []), "topic": r.get("topic", "")}
            for r in result.get("data", [])]


# ── Ad Preview (armavita-meta-ads-mcp) ────────────────────
async def get_ad_preview(ad_id: str, ad_format: str = "DESKTOP_FEED_STANDARD") -> dict:
    """
    Get ad preview iframe URL.
    Formats: DESKTOP_FEED_STANDARD, MOBILE_FEED_STANDARD, INSTAGRAM_STANDARD,
             RIGHT_COLUMN_STANDARD, MARKETPLACE_MOBILE, STORY_MOBILE
    """
    result = await _meta_get(f"{ad_id}/previews", {"ad_format": ad_format})
    previews = result.get("data", [])
    return {"ad_id": ad_id, "format": ad_format, "previews": previews}


async def get_ad_creatives(account_id: str, limit: int = 25) -> list[dict]:
    """List ad creatives for an account."""
    result = await _meta_get(f"{account_id}/adcreatives", {
        "fields": "id,name,title,body,image_url,thumbnail_url,object_story_spec,status",
        "limit": limit,
    })
    return result.get("data", [])


# ── Report Data (armavita-meta-ads-mcp inspired) ─────────
async def get_detailed_insights(
    object_id: str,
    date_preset: str = "last_7d",
    breakdowns: str = None,
    time_increment: str = "1",
) -> list[dict]:
    """
    Get detailed time-series insights for reporting.
    time_increment: "1" (daily), "7" (weekly), "monthly"
    """
    params = {
        "fields": ",".join([
            "campaign_name", "adset_name", "ad_name",
            "spend", "impressions", "clicks", "ctr", "cpc", "cpm",
            "actions", "action_values", "cost_per_action_type",
            "reach", "frequency", "date_start", "date_stop",
        ]),
        "date_preset": date_preset,
        "time_increment": time_increment,
        "level": "campaign",
        "limit": 500,
    }
    if breakdowns:
        params["breakdowns"] = breakdowns
    result = await _meta_get(f"{object_id}/insights", params)
    return result.get("data", [])


async def get_age_gender_breakdown(object_id: str, date_preset: str = "last_7d") -> list[dict]:
    """Get performance breakdown by age and gender."""
    return await get_detailed_insights(object_id, date_preset, breakdowns="age,gender", time_increment="all_days")


async def get_placement_breakdown(object_id: str, date_preset: str = "last_7d") -> list[dict]:
    """Get performance breakdown by placement (feed, stories, reels, etc.)."""
    return await get_detailed_insights(object_id, date_preset, breakdowns="publisher_platform,platform_position", time_increment="all_days")


# ── Sync wrappers for new functions ──────────────────────
def sync_duplicate_campaign(campaign_id: str, **kwargs) -> dict:
    return asyncio.run(duplicate_campaign(campaign_id, **kwargs))


def sync_duplicate_adset(adset_id: str, **kwargs) -> dict:
    return asyncio.run(duplicate_adset(adset_id, **kwargs))


def sync_estimate_audience(account_id: str, targeting_spec: dict) -> dict:
    return asyncio.run(estimate_audience_size(account_id, targeting_spec))


def sync_get_targeting_interests(query: str, **kwargs) -> list[dict]:
    return asyncio.run(get_targeting_interests(query, **kwargs))


def sync_get_ad_preview(ad_id: str, **kwargs) -> dict:
    return asyncio.run(get_ad_preview(ad_id, **kwargs))


def sync_get_ad_creatives(account_id: str, **kwargs) -> list[dict]:
    return asyncio.run(get_ad_creatives(account_id, **kwargs))


def sync_get_detailed_insights(object_id: str, **kwargs) -> list[dict]:
    return asyncio.run(get_detailed_insights(object_id, **kwargs))


def sync_get_age_gender_breakdown(object_id: str, **kwargs) -> list[dict]:
    return asyncio.run(get_age_gender_breakdown(object_id, **kwargs))


def sync_get_placement_breakdown(object_id: str, **kwargs) -> list[dict]:
    return asyncio.run(get_placement_breakdown(object_id, **kwargs))
