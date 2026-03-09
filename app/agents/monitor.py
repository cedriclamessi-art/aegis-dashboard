from app.agents.base import BaseAgent
from app.database import save_alert
from app.benchmarks import THRESHOLDS, BENCHMARKS, QUALITY_GATES


class CampaignMonitorAgent(BaseAgent):
    agent_type = "monitor"
    system_prompt = """Tu es AEGIS Monitor, un systeme de surveillance de campagnes publicitaires 24/7.
Tu combines les meilleures pratiques de claude-ads (190 checks) et meta-ads-kit (bleeder/fatigue detection).

Tu dois TOUJOURS repondre en JSON valide avec cette structure :
{
  "status": "ok|warning|critical",
  "health_score": 0-100,
  "grade": "A|B|C|D|F",
  "alerts": [
    {
      "severity": "critical|warning|info",
      "type": "bleeder|fatigue|cpa_high|roas_low|budget_depleted|spend_anomaly|frequency_creep|quality_gate|opportunity",
      "platform": "meta|tiktok|google",
      "campaign": "Nom de la campagne",
      "message": "Description claire de l'alerte",
      "current_value": 0,
      "threshold": 0,
      "suggested_action": "Action recommandee"
    }
  ],
  "bleeders": [
    {
      "campaign": "Nom",
      "reason": "CTR < 1% | Frequency > 3.5 | CPA > 3x target",
      "spend_wasted": 0,
      "action": "pause|reduce_budget|refresh_creative"
    }
  ],
  "fatigue_signals": [
    {
      "campaign": "Nom",
      "signal": "ctr_decay|cpc_inflation|frequency_creep|impression_decline",
      "severity": "low|medium|high",
      "action": "Rotation ou refresh recommande"
    }
  ],
  "health_check": {
    "meta": "ok|warning|critical|inactive",
    "tiktok": "ok|warning|critical|inactive",
    "google": "ok|warning|critical|inactive"
  },
  "quality_gates_violated": ["Description des regles violees"],
  "anomalies_detected": 0,
  "next_check_recommended": "Quand refaire un check"
}

REGLES DE DETECTION (meta-ads-kit) :
BLEEDERS (a pauser/reduire) :
- CTR < 1.0% apres 1000 impressions → bleeder
- Frequency > 3.5 en prospection → sur-saturation
- CPA > 3x le CPA cible → kill immediatement
- Depense > 50€ avec 0 conversion → bleeder critique

FATIGUE CREATIVE :
- CTR en baisse > 20% sur 3+ jours → fatigue
- CPC en hausse > 15% sur 3+ jours → fatigue
- Frequency qui grimpe → audience epuisee
- Impressions en chute → pertinence perdue

QUALITY GATES (claude-ads) :
- Budget minimum = 5x CPA par adset
- Phase d'apprentissage : pas de changement avant 50 conversions
- Conformite Special Ad Category obligatoire
- ROAS < 2 = critique, 2-3 = a ameliorer, > 3 = bon

SCORING :
- Score 90-100 = A (excellent), 80-89 = B, 70-79 = C, 60-69 = D, < 60 = F
- Chaque alerte critical retire 15 points, warning retire 5, info retire 1

Repondre en francais."""

    def build_prompt(self, input_data: dict) -> str:
        thresholds = input_data.get("thresholds", {})
        max_cpa = thresholds.get("max_cpa", 20)
        min_roas = thresholds.get("min_roas", 2.0)
        budget = input_data.get("budget_daily", 50)
        campaigns = input_data.get("campaigns", [])

        lines = [
            "SEUILS CONFIGURES :",
            f"- CPA maximum : {max_cpa}EUR",
            f"- ROAS minimum : {min_roas}",
            f"- Budget quotidien : {budget}EUR",
            f"- Bleeder CTR seuil : {THRESHOLDS['bleeder_ctr']}%",
            f"- Bleeder frequency seuil : {THRESHOLDS['bleeder_frequency']}",
            f"- Fatigue CTR drop seuil : {THRESHOLDS['fatigue_ctr_drop']}%",
            f"- Kill rule : CPA > {THRESHOLDS['max_cpa_multiplier']}x cible",
            "",
            "BENCHMARKS META 2026 :",
            f"- CTR bon : > {BENCHMARKS['meta']['ctr_good']}%",
            f"- ROAS bon : > {BENCHMARKS['meta']['roas_good']}",
            f"- Frequency prospecting max : {BENCHMARKS['meta']['frequency_prospecting']}",
            "",
            "QUALITY GATES :",
        ]
        for gate in QUALITY_GATES:
            lines.append(f"- {gate}")

        lines.append("")
        lines.append("ETAT ACTUEL DES CAMPAGNES :")
        for c in campaigns:
            lines.append(
                f"- {c.get('name', 'Campagne')} ({c.get('platform', '?')}): "
                f"Depense={c.get('spend', 0)}EUR, "
                f"CPA={c.get('cpa', 0)}EUR, "
                f"ROAS={c.get('roas', 0)}, "
                f"CTR={c.get('ctr', 0)}%, "
                f"Impressions={c.get('impressions', 0)}, "
                f"Conversions={c.get('conversions', 0)}"
            )

        if not campaigns:
            lines.append("Aucune campagne active. Retourne status 'ok' avec health_check 'inactive'.")

        lines.append("")
        lines.append("Analyse complete : detecte les bleeders, signaux de fatigue, violations de quality gates, et calcule le health score.")
        return "\n".join(lines)

    def run(self, user_id: str, input_data: dict) -> dict:
        result = super().run(user_id, input_data)
        for alert in result.get("alerts", []):
            save_alert(
                user_id=user_id,
                alert_type=alert.get("type", "unknown"),
                message=alert.get("message", ""),
                severity=alert.get("severity", "warning"),
                data=alert,
            )
        return result
