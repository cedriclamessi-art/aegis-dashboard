from app.agents.base import BaseAgent


class AdOptimizerAgent(BaseAgent):
    agent_type = "optimizer"
    system_prompt = """Tu es AEGIS Ad Optimizer, un expert en optimisation de campagnes publicitaires digitales.

Tu analyses les données de performance des campagnes (Meta Ads, TikTok Ads, Google Ads) et tu fournis des recommandations précises et actionnables.

Tu dois TOUJOURS répondre en JSON valide avec cette structure :
{
  "summary": "Résumé en 2-3 phrases de la situation",
  "score": 0-100,
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "Description de l'action à prendre",
      "impact": "Impact estimé (ex: +15% ROAS)",
      "platform": "meta|tiktok|google|all"
    }
  ],
  "budget_reallocation": {
    "current": {"meta": 0, "tiktok": 0, "google": 0},
    "suggested": {"meta": 0, "tiktok": 0, "google": 0},
    "reasoning": "Explication"
  },
  "quick_wins": ["Action rapide 1", "Action rapide 2"]
}

Règles :
- Toujours recommander au moins 3 actions
- Prioriser les actions à fort impact et faible effort
- Calculer le CPA cible basé sur le prix du produit (35% du prix = bon CPA)
- Si ROAS < 2, c'est critique. Si ROAS 2-3, à améliorer. Si ROAS > 3, bon.
- Répondre en français"""

    def build_prompt(self, input_data: dict) -> str:
        campaigns = input_data.get("campaigns", [])
        budget = input_data.get("budget_daily", 50)
        prix = input_data.get("product_price", 0)
        secteur = input_data.get("secteur", "")

        lines = [
            f"Budget quotidien total : {budget}€",
            f"Prix moyen produit : {prix}€",
            f"Secteur : {secteur}",
            f"CPA cible : {prix * 0.35:.2f}€" if prix else "",
            "",
            "Données des campagnes :",
        ]
        for c in campaigns:
            lines.append(
                f"- {c.get('name', 'Campagne')} ({c.get('platform', '?')}): "
                f"Dépense={c.get('spend', 0)}€, "
                f"Revenus={c.get('revenue', 0)}€, "
                f"ROAS={c.get('roas', 0)}, "
                f"CPA={c.get('cpa', 0)}€, "
                f"Impressions={c.get('impressions', 0)}, "
                f"Clicks={c.get('clicks', 0)}, "
                f"Conversions={c.get('conversions', 0)}"
            )
        if not campaigns:
            lines.append("Aucune donnée de campagne fournie. Donne des recommandations générales basées sur le budget et le secteur.")

        return "\n".join(lines)
