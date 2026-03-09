"""
AEGIS Benchmarks — Industry thresholds from claude-ads + meta-ads-kit
Used by agents for scoring, bleeder detection, fatigue analysis, and auditing.
"""

# ── Performance Thresholds (meta-ads-kit ad-config) ──────
THRESHOLDS = {
    "bleeder_ctr": 1.0,          # CTR < 1.0% = bleeder
    "bleeder_frequency": 3.5,     # Frequency > 3.5 = over-saturated
    "fatigue_ctr_drop": 20,       # CTR drop > 20% over 3 days = fatigue
    "fatigue_cpc_rise": 15,       # CPC rise > 15% over 3 days = fatigue
    "wasted_spend_pct": 20,       # > 20% wasted spend = critical
    "min_budget_cpa_ratio": 5,    # Budget should be >= 5x CPA per adset
    "max_cpa_multiplier": 3,      # CPA > 3x target = kill
    "spend_variance_pct": 15,     # Daily spend variance > 15% = alert
}

# ── Platform Benchmarks 2026 (claude-ads) ────────────────
BENCHMARKS = {
    "meta": {
        "ctr_good": 1.5,          # % — above this is good
        "ctr_great": 3.0,
        "cpa_ratio": 0.35,        # CPA target = 35% of product price
        "roas_min": 2.0,
        "roas_good": 3.0,
        "roas_great": 5.0,
        "frequency_prospecting": 3.0,
        "frequency_retargeting": 8.0,
        "event_match_quality": 8.0,  # EMQ score for CAPI
        "quality_score_min": 7,
    },
    "google": {
        "ctr_search_good": 6.66,
        "ctr_display_good": 0.46,
        "quality_score_min": 7,
        "roas_min": 2.0,
        "roas_good": 4.0,
        "impression_share_min": 50,
    },
    "tiktok": {
        "ctr_good": 1.0,
        "cpc_max": 2.50,
        "budget_cpa_ratio": 50,    # Budget >= 50x CPA per ad group
        "min_watch_time": 6,       # seconds
    },
    "linkedin": {
        "cpc_benchmark_low": 5.0,
        "cpc_benchmark_high": 7.0,
        "lead_gen_max_fields": 5,
        "min_daily_budget": 50,
    },
}

# ── Scoring System (claude-ads) ──────────────────────────
AUDIT_WEIGHTS = {
    "meta": {
        "pixel_capi": 0.30,
        "creative": 0.30,
        "structure": 0.20,
        "audience": 0.20,
    },
    "google": {
        "conversion_tracking": 0.25,
        "wasted_spend": 0.20,
        "structure": 0.15,
        "keywords": 0.15,
        "ads": 0.15,
        "settings": 0.10,
    },
}

SEVERITY_MULTIPLIERS = {
    "pass": 1.0,
    "warning": 0.5,
    "fail": 0.0,
}

# ── Quality Gates (claude-ads) ───────────────────────────
QUALITY_GATES = [
    "No Broad Match without Smart Bidding",
    "CPA > 3x target → kill immediately",
    "Budget must be >= 5x CPA per adset",
    "Learning phase protection: no changes < 50 conversions",
    "Special Ad Category compliance required",
    "Frequency > 3.5 prospecting → rotate creative",
    "CTR < 1.0% after 1000 impressions → pause and review",
]

# ── Copy Psychology Framework (meta-ads-kit) ─────────────
COPY_PSYCHOLOGY = {
    "money": {
        "name": "Money",
        "triggers": ["save", "free", "discount", "ROI", "profit", "value"],
        "angle": "Financial benefit or saving",
        "example_hook": "Economise {X}€ en {Y} jours",
    },
    "time": {
        "name": "Time",
        "triggers": ["fast", "instant", "minutes", "now", "quick", "today"],
        "angle": "Speed and convenience",
        "example_hook": "En {X} minutes, c'est fait",
    },
    "status": {
        "name": "Status",
        "triggers": ["exclusive", "premium", "elite", "VIP", "first", "limited"],
        "angle": "Social proof and aspiration",
        "example_hook": "{X}+ clients font deja confiance",
    },
    "fear": {
        "name": "Fear",
        "triggers": ["miss", "last", "ending", "risk", "lose", "warning"],
        "angle": "Loss aversion and urgency",
        "example_hook": "Derniere chance : offre expire ce soir",
    },
}

# ── Industry Templates (claude-ads) ─────────────────────
INDUSTRY_TEMPLATES = {
    "ecommerce": {
        "cpa_target_pct": 0.35,
        "roas_target": 3.0,
        "budget_split": {"prospecting": 0.70, "retargeting": 0.20, "testing": 0.10},
        "key_metrics": ["ROAS", "CPA", "AOV", "LTV"],
        "recommended_platforms": ["meta", "google", "tiktok"],
    },
    "saas": {
        "cpa_target_pct": 0.20,
        "roas_target": 5.0,
        "budget_split": {"prospecting": 0.60, "retargeting": 0.25, "testing": 0.15},
        "key_metrics": ["CAC", "LTV/CAC", "Trial-to-Paid", "MRR"],
        "recommended_platforms": ["google", "linkedin", "meta"],
    },
    "beauty": {
        "cpa_target_pct": 0.35,
        "roas_target": 3.5,
        "budget_split": {"prospecting": 0.65, "retargeting": 0.25, "testing": 0.10},
        "key_metrics": ["ROAS", "CPA", "AOV", "Repeat Rate"],
        "recommended_platforms": ["meta", "tiktok", "google"],
    },
    "mode": {
        "cpa_target_pct": 0.30,
        "roas_target": 3.0,
        "budget_split": {"prospecting": 0.60, "retargeting": 0.30, "testing": 0.10},
        "key_metrics": ["ROAS", "CPA", "Return Rate", "AOV"],
        "recommended_platforms": ["meta", "tiktok", "google"],
    },
    "sante": {
        "cpa_target_pct": 0.40,
        "roas_target": 2.5,
        "budget_split": {"prospecting": 0.70, "retargeting": 0.20, "testing": 0.10},
        "key_metrics": ["CPA", "ROAS", "Subscription Rate"],
        "recommended_platforms": ["meta", "google"],
    },
}


def get_grade(score: int) -> str:
    """Convert 0-100 score to letter grade."""
    if score >= 90: return "A"
    if score >= 80: return "B"
    if score >= 70: return "C"
    if score >= 60: return "D"
    return "F"


def get_industry_config(secteur: str) -> dict:
    """Get industry-specific configuration."""
    mapping = {
        "Beauté": "beauty",
        "Mode": "mode",
        "Maison": "ecommerce",
        "Santé": "sante",
        "Sport": "ecommerce",
        "Autre": "ecommerce",
    }
    key = mapping.get(secteur, "ecommerce")
    return INDUSTRY_TEMPLATES.get(key, INDUSTRY_TEMPLATES["ecommerce"])
