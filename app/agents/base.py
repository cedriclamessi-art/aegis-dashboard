import json
import time
import logging
from app.config import LLM_PROVIDER, LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, PROVIDER_DEFAULTS
from app.database import save_agent_run, complete_agent_run

log = logging.getLogger("aegis.agent")


def _get_provider_config():
    """Resolve provider settings: base_url, model, api_key."""
    defaults = PROVIDER_DEFAULTS.get(LLM_PROVIDER, PROVIDER_DEFAULTS["ollama"])
    return {
        "provider": LLM_PROVIDER,
        "base_url": LLM_BASE_URL or defaults.get("base_url", ""),
        "model": LLM_MODEL or defaults.get("model", "llama3.1"),
        "api_key": LLM_API_KEY or defaults.get("api_key", ""),
    }


def llm_call(system_prompt: str, user_message: str) -> dict:
    """
    Unified LLM call. Returns {"text": str, "tokens_in": int, "tokens_out": int}.
    Supports: ollama, groq, openrouter, anthropic, gemini.
    """
    cfg = _get_provider_config()
    provider = cfg["provider"]

    if provider == "anthropic":
        return _call_anthropic(cfg, system_prompt, user_message)
    elif provider == "gemini":
        return _call_gemini(cfg, system_prompt, user_message)
    else:
        # OpenAI-compatible: ollama, groq, openrouter
        return _call_openai_compat(cfg, system_prompt, user_message)


def _call_openai_compat(cfg: dict, system_prompt: str, user_message: str) -> dict:
    """Call OpenAI-compatible API (Ollama, Groq, OpenRouter)."""
    from openai import OpenAI

    client = OpenAI(
        base_url=cfg["base_url"],
        api_key=cfg["api_key"] or "not-needed",
    )
    response = client.chat.completions.create(
        model=cfg["model"],
        max_tokens=4096,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )
    choice = response.choices[0]
    usage = response.usage
    return {
        "text": choice.message.content or "",
        "tokens_in": getattr(usage, "prompt_tokens", 0) if usage else 0,
        "tokens_out": getattr(usage, "completion_tokens", 0) if usage else 0,
    }


def _call_anthropic(cfg: dict, system_prompt: str, user_message: str) -> dict:
    """Call Anthropic Claude API."""
    import anthropic

    if not cfg["api_key"]:
        raise RuntimeError("ANTHROPIC_API_KEY manquante. Configure ton .env.")
    client = anthropic.Anthropic(api_key=cfg["api_key"])
    response = client.messages.create(
        model=cfg["model"],
        max_tokens=4096,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    return {
        "text": response.content[0].text,
        "tokens_in": getattr(response.usage, "input_tokens", 0),
        "tokens_out": getattr(response.usage, "output_tokens", 0),
    }


def _call_gemini(cfg: dict, system_prompt: str, user_message: str) -> dict:
    """Call Google Gemini API."""
    import google.generativeai as genai

    if not cfg["api_key"]:
        raise RuntimeError("LLM_API_KEY (Gemini) manquante. Configure ton .env.")
    genai.configure(api_key=cfg["api_key"])
    model = genai.GenerativeModel(cfg["model"], system_instruction=system_prompt)
    response = model.generate_content(user_message)
    return {
        "text": response.text,
        "tokens_in": getattr(response.usage_metadata, "prompt_token_count", 0) if hasattr(response, "usage_metadata") else 0,
        "tokens_out": getattr(response.usage_metadata, "candidates_token_count", 0) if hasattr(response, "usage_metadata") else 0,
    }


class BaseAgent:
    agent_type: str = "base"
    system_prompt: str = ""

    def run(self, user_id: str, input_data: dict) -> dict:
        run_id = save_agent_run(user_id, self.agent_type, input_data)
        cfg = _get_provider_config()
        t0 = time.time()
        log.info("[%s] run #%s for user=%s | provider=%s model=%s",
                 self.agent_type, run_id, user_id, cfg["provider"], cfg["model"])
        try:
            user_message = self.build_prompt(input_data)
            resp = llm_call(self.system_prompt, user_message)
            raw_text = resp["text"]
            result = self.parse_output(raw_text)
            result["_raw"] = raw_text
            result["_run_id"] = run_id
            result["_provider"] = cfg["provider"]
            result["_model"] = cfg["model"]
            complete_agent_run(run_id, result, status="completed")
            elapsed = time.time() - t0
            log.info("[%s] completed in %.1fs | %s | tokens: %d in / %d out",
                     self.agent_type, elapsed, cfg["provider"],
                     resp["tokens_in"], resp["tokens_out"])
            return result
        except Exception as e:
            elapsed = time.time() - t0
            log.error("[%s] FAILED after %.1fs (%s): %s",
                      self.agent_type, elapsed, cfg["provider"], e)
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
