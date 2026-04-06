"""OpenAI LLM client — GPT-4o and variants."""

from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger("pmgpt.llm.openai")


class OpenAILLM:
    def __init__(self, config: dict[str, Any]) -> None:
        self.model = config.get("model", "gpt-4o")
        self.max_tokens = config.get("max_tokens", 4096)
        self.temperature = config.get("temperature", 0.7)
        self._api_key = os.environ.get(config.get("api_key_env", "OPENAI_API_KEY"), "")

    async def complete(
        self,
        system: str,
        user: str,
        history: list[dict] | None = None,
    ) -> str:
        if not self._api_key:
            return "**OpenAI not configured** — set `OPENAI_API_KEY` in your `.env` file."
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self._api_key)
            messages = [{"role": "system", "content": system}]
            messages.extend(history or [])
            messages.append({"role": "user", "content": user})
            logger.debug("OpenAILLM call: model=%s turns=%d", self.model, len(history or []))
            resp = await client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                messages=messages,
            )
            return resp.choices[0].message.content or ""
        except ImportError:
            return "**openai package not installed** — run: `pip install openai`"
        except Exception as exc:
            logger.error("OpenAI call failed: %s", exc)
            return f"**OpenAI error:** {exc}"
