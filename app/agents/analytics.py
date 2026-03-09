from app.agents.base import BaseAgent


class AnalyticsAgent(BaseAgent):
    agent_type = "analytics"
    system_prompt = """Tu es AEGIS Analytics, un expert en analyse de performance publicitaire e-commerce.

Tu transformes des données brutes en insights actionnables avec des visualisations textuelles claires.

Tu dois TOUJOURS répondre en JSON valide avec cette structure :
{
  "summary": "Résumé exécutif en 3-4 phrases",
  "kpis": {
    "total_spend": 0,
    "total_revenue": 0,
    "overall_roas": 0,
    "average_cpa": 0,
    "total_conversions": 0,
    "best_platform": "meta|tiktok|google",
    "trend": "up|down|stable"
  },
  "insights": [
    {
      "type": "positive|negative|neutral",
      "title": "Titre de l'insight",
      "detail": "Explication détaillée",
      "metric": "Métrique concernée"
    }
  ],
  "platform_breakdown": [
    {
      "platform": "meta|tiktok|google",
      "spend": 0,
      "revenue": 0,
      "roas": 0,
      "cpa": 0,
      "verdict": "Verdict court"
    }
  ],
  "next_actions": ["Action 1", "Action 2", "Action 3"],
  "forecast": "Prévision pour la semaine prochaine basée sur les tendances"
}

Règles :
- Toujours calculer les métriques dérivées (ROAS, CPA, CTR, taux de conversion)
- Comparer les plateformes entre elles
- Identifier les tendances (hausse/baisse)
- Donner des insights actionnables, pas juste des chiffres
- Répondre en français"""

    def build_prompt(self, input_data: dict) -> str:
        date_range = input_data.get("date_range", "7 derniers jours")
        campaigns = input_data.get("campaigns", [])
        previous_period = input_data.get("previous_period", None)

        lines = [
            f"Période d'analyse : {date_range}",
            "",
            "Données actuelles :",
        ]
        for c in campaigns:
            lines.append(
                f"- {c.get('name', 'Campagne')} ({c.get('platform', '?')}): "
                f"Dépense={c.get('spend', 0)}€, "
                f"Revenus={c.get('revenue', 0)}€, "
                f"Impressions={c.get('impressions', 0)}, "
                f"Clicks={c.get('clicks', 0)}, "
                f"Conversions={c.get('conversions', 0)}"
            )

        if previous_period:
            lines.append("")
            lines.append("Données période précédente :")
            for c in previous_period:
                lines.append(
                    f"- {c.get('name', 'Campagne')} ({c.get('platform', '?')}): "
                    f"Dépense={c.get('spend', 0)}€, Revenus={c.get('revenue', 0)}€"
                )

        if not campaigns:
            lines.append("Aucune donnée fournie. Génère un template de rapport avec des exemples.")

        lines.append("")
        lines.append("Analyse ces données et fournis un rapport complet.")
        return "\n".join(lines)
