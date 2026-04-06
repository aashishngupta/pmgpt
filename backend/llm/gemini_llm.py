"""Google Gemini LLM client."""

from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger("pmgpt.llm.gemini")


class GeminiLLM:
    def __init__(self, config: dict[str, Any]) -> None:
        self.model = config.get("model", "gemini-1.5-pro")
        self.max_tokens = config.get("max_tokens", 4096)
        self.temperature = config.get("temperature", 0.7)
        self._api_key = os.environ.get(config.get("api_key_env", "GOOGLE_AI_API_KEY"), "")

    async def complete(
        self,
        system: str,
        user: str,
        history: list[dict] | None = None,
    ) -> str:
        if not self._api_key:
            return "**Gemini not configured** — set `GOOGLE_AI_API_KEY` in your `.env` file."
        try:
            import google.generativeai as genai
            genai.configure(api_key=self._api_key)
            model = genai.GenerativeModel(
                model_name=self.model,
                system_instruction=system,
                generation_config=genai.GenerationConfig(
                    max_output_tokens=self.max_tokens,
                    temperature=self.temperature,
                ),
            )
            # Build chat history
            gemini_history = []
            for turn in history or []:
                role = "user" if turn["role"] == "user" else "model"
                gemini_history.append({"role": role, "parts": [turn["content"]]})

            chat = model.start_chat(history=gemini_history)
            logger.debug("GeminiLLM call: model=%s turns=%d", self.model, len(history or []))
            resp = await chat.send_message_async(user)
            return resp.text or ""
        except ImportError:
            return "**google-generativeai not installed** — run: `pip install google-generativeai`"
        except Exception as exc:
            logger.error("Gemini call failed: %s", exc)
            return f"**Gemini error:** {exc}"
