"""External LLM client — Anthropic Claude API (public data only)."""

from __future__ import annotations

import logging
import os
from typing import Any

import anthropic

logger = logging.getLogger("pmgpt.llm.external")


class ExternalLLM:
    """Wraps the Anthropic Claude API. Only called for public-classified data."""

    def __init__(self, config: dict[str, Any]) -> None:
        api_key = os.environ.get(
            config.get("api_key_env", "ANTHROPIC_API_KEY"), ""
        )
        self.model = config.get("model", "claude-opus-4-6")
        self.max_tokens = config.get("max_tokens", 4096)
        self.temperature = config.get("temperature", 0.7)
        self._client = anthropic.AsyncAnthropic(api_key=api_key)

    async def complete(self, system: str, user: str) -> str:
        logger.debug("ExternalLLM call: model=%s", self.model)
        message = await self._client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return message.content[0].text
