import json
from app.agents.base import BaseAgent
from app.benchmarks import (
    THRESHOLDS, BENCHMARKS, AUDIT_WEIGHTS,
    QUALITY_GATES, INDUSTRY_TEMPLATES, get_grade, get_industry_config,
)


class AuditAgent(BaseAgent):
    agent_type = "audit"
    system_prompt = """Tu es AEGIS Audit, un systeme d'audit complet de campagnes publicitaires inspire de claude-ads (190 checks).
Tu realises un audit multi-plateforme avec un scoring precis et des recommandations priorisees.

Tu dois TOUJOURS repondre en JSON valide avec cette structure :
{
  "health_score": 0-100,
  "grade": "A|B|C|D|F",
  "executive_summary": "Resume executif en 3-4 phrases",
  "platform_scores": {
    "meta": {"score": 0-100, "grade": "A-F", "checks_passed": 0, "checks_total": 0},
    "google": {"score": 0-100, "grade": "A-F", "checks_passed": 0, "checks_total": 0},
    "tiktok": {"score": 0-100, "grade": "A-F", "checks_passed": 0, "checks_total": 0}
  },
  "categories": [
    {
      "name": "Nom de la categorie",
      "weight": 0.0-1.0,
      "score": 0-100,
      "checks": [
        {
          "id": "CHECK-001",
          "name": "Nom du check",
          "status": "pass|warning|fail",
          "detail": "Explication",
          "recommendation": "Action recommandee"
        }
      ]
    }
  ],
  "quality_gates": [
    {
      "rule": "Description de la regle",
      "status": "pass|fail",
      "detail": "Contexte"
    }
  ],
  "top_issues": [
    {
      "priority": 1,
      "severity": "critical|warning",
      "issue": "Description du probleme",
      "impact": "Impact estime",
      "fix": "Solution recommandee",
      "effort": "low|medium|high"
    }
  ],
  "quick_wins": ["Action rapide 1", "Action rapide 2", "Action rapide 3"],
  "industry_benchmark_comparison": {
    "cpa_vs_target": "above|at|below",
    "roas_vs_target": "above|at|below",
    "budget_allocation_optimal": true|false
  }
}

SYSTEME DE SCORING (claude-ads) :
Score global = Somme(Score_categorie x Poids_categorie)
- Chaque check : PASS = 100%, WARNING = 50%, FAIL = 0%
- Score categorie = moyenne des checks
- Score plateforme = moyenne ponderee des categories
- Score global = moyenne ponderee par budget

CATEGORIES D'AUDIT META (poids) :
- Pixel/CAPI (30%) : Pixel installe, evenements configures, EMQ >= 8, CAPI actif
- Creative (30%) : Diversite formats, frequence, fatigue, A/B tests actifs
- Structure (20%) : CBO vs ABO, naming convention, nombre d'adsets, budget/adset
- Audience (20%) : Taille audience, overlap, exclusions, lookalikes

CATEGORIES D'AUDIT GOOGLE (poids) :
- Conversion tracking (25%) : Tag installe, enhanced conversions, attribution
- Wasted spend (20%) : Termes negatifs, search terms, placements
- Structure (15%) : Campagnes bien organisees, groupes d'annonces
- Keywords (15%) : Match types, quality scores, negative lists
- Ads (15%) : RSA pinning, extensions, rotation
- Settings (10%) : Geo, device, schedule, bid strategy

QUALITY GATES (violations bloquantes) :
- Pas de Broad Match sans Smart Bidding
- CPA > 3x cible = kill immediat
- Budget >= 5x CPA par adset
- Phase d'apprentissage protegee (< 50 conversions)
- Compliance Special Ad Category

GRADING :
- A (90-100) : Excellent, optimisations mineures possibles
- B (80-89) : Bon, quelques ameliorations
- C (70-79) : Moyen, optimisations necessaires
- D (60-69) : Faible, action urgente requise
- F (< 60) : Critique, restructuration necessaire

Repondre en francais."""

    def build_prompt(self, input_data: dict) -> str:
        campaigns = input_data.get("campaigns", [])
        budget = input_data.get("budget_daily", 50)
        prix = input_data.get("product_price", 0)
        secteur = input_data.get("secteur", "")
        platforms = input_data.get("platforms", ["meta"])

        industry = get_industry_config(secteur) if secteur else get_industry_config("Autre")

        lines = [
            "CONTEXTE DE L'AUDIT :",
            f"Budget quotidien : {budget}EUR",
            f"Prix moyen produit : {prix}EUR",
            f"Secteur : {secteur or 'E-commerce'}",
            f"Plateformes a auditer : {', '.join(platforms)}",
            "",
            "BENCHMARKS INDUSTRIE :",
            f"- CPA cible : {prix * industry['cpa_target_pct']:.0f}EUR ({industry['cpa_target_pct']*100:.0f}% du prix)" if prix else "- CPA cible : non defini",
            f"- ROAS cible : {industry['roas_target']}",
            f"- Budget split recommande : Prospecting {industry['budget_split']['prospecting']*100:.0f}% / Retargeting {industry['budget_split']['retargeting']*100:.0f}% / Testing {industry['budget_split']['testing']*100:.0f}%",
            f"- KPIs cles : {', '.join(industry['key_metrics'])}",
            "",
            "SEUILS TECHNIQUES :",
            f"- Bleeder CTR : < {THRESHOLDS['bleeder_ctr']}%",
            f"- Frequency max : {THRESHOLDS['bleeder_frequency']}",
            f"- Kill rule CPA : > {THRESHOLDS['max_cpa_multiplier']}x cible",
            f"- Budget min par adset : {THRESHOLDS['min_budget_cpa_ratio']}x CPA",
        ]

        if "meta" in platforms:
            b = BENCHMARKS["meta"]
            lines.extend([
                "",
                "BENCHMARKS META 2026 :",
                f"- CTR bon : > {b['ctr_good']}%, excellent : > {b['ctr_great']}%",
                f"- ROAS min : {b['roas_min']}, bon : {b['roas_good']}, excellent : {b['roas_great']}",
                f"- Frequency prospecting : < {b['frequency_prospecting']}",
                f"- EMQ minimum : {b['event_match_quality']}",
            ])

        lines.append("")
        lines.append("DONNEES DES CAMPAGNES :")
        for c in campaigns:
            lines.append(
                f"- {c.get('name', 'Campagne')} ({c.get('platform', '?')}): "
                f"Depense={c.get('spend', 0)}EUR, "
                f"Revenus={c.get('revenue', 0)}EUR, "
                f"ROAS={c.get('roas', 0)}, "
                f"CPA={c.get('cpa', 0)}EUR, "
                f"CTR={c.get('ctr', 0)}%, "
                f"Impressions={c.get('impressions', 0)}, "
                f"Clicks={c.get('clicks', 0)}, "
                f"Conversions={c.get('conversions', 0)}"
            )

        if not campaigns:
            lines.append("Aucune donnee. Realise un audit de structure base sur le budget, le secteur et les benchmarks.")

        lines.append("")
        lines.append("QUALITY GATES A VERIFIER :")
        for gate in QUALITY_GATES:
            lines.append(f"- {gate}")

        lines.append("")
        lines.append("Realise l'audit complet : score chaque categorie, verifie les quality gates, identifie le top 5 des problemes, et donne les quick wins.")
        return "\n".join(lines)
