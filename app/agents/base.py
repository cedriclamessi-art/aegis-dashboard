import json
import time
import logging
import anthropic
from app.config import ANTHROPIC_API_KEY, CLAUDE_MODEL
from app.database import save_agent_run, complete_agent_run

log = logging.getLogger("aegis.agent")


def get_client():
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY manquante. Configure ton .env.")
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


class BaseAgent:
    agent_type: str = "base"
    system_prompt: str = ""

    def run(self, user_id: str, input_data: dict) -> dict:
        run_id = save_agent_run(user_id, self.agent_type, input_data)
        t0 = time.time()
        log.info("[%s] run #%s for user=%s", self.agent_type, run_id, user_id)
        try:
            user_message = self.build_prompt(input_data)
            client = get_client()
            response = client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=4096,
                system=self.system_prompt,
                messages=[{"role": "user", "content": user_message}],
            )
            raw_text = response.content[0].text
            result = self.parse_output(raw_text)
            result["_raw"] = raw_text
            result["_run_id"] = run_id
            complete_agent_run(run_id, result, status="completed")
            elapsed = time.time() - t0
            tokens_in = getattr(response.usage, "input_tokens", 0)
            tokens_out = getattr(response.usage, "output_tokens", 0)
            log.info("[%s] completed in %.1fs | tokens: %d in / %d out",
                     self.agent_type, elapsed, tokens_in, tokens_out)
            return result
        except Exception as e:
            elapsed = time.time() - t0
            log.error("[%s] FAILED after %.1fs: %s", self.agent_type, elapsed, e)
            error_data = {"error": str(e)}
            complete_agent_run(run_id, error_data, status="failed")
            raise

    def build_prompt(self, input_data: dict) -> str:
        return json.dumps(input_data, ensure_ascii=False, indent=2)

    def parse_output(self, raw_text: str) -> dict:
        try:
            start = raw_text.find("{")
            end = raw_text.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(raw_text[start:end])
        except json.JSONDecodeError:
            pass
        return {"text": raw_text}
