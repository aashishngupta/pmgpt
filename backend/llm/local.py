"""Local LLM client — Ollama (runs on your infrastructure)."""

from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger("pmgpt.llm.local")


class LocalLLM:
    """Wraps Ollama's /api/generate endpoint. Used for internal/confidential data."""

    def __init__(self, config: dict[str, Any]) -> None:
        self.base_url = config.get("base_url", "http://localhost:11434").rstrip("/")
        self.model = config.get("model", "mistral")
        self.max_tokens = config.get("max_tokens", 4096)
        self.temperature = config.get("temperature", 0.7)

    async def complete(self, system: str, user: str) -> str:
        prompt = f"<s>[INST] {system}\n\n{user} [/INST]"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": self.max_tokens,
                "temperature": self.temperature,
            },
        }
        logger.debug("LocalLLM call: model=%s base_url=%s", self.model, self.base_url)
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/api/generate", json=payload
            )
            resp.raise_for_status()
            return resp.json().get("response", "")

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception as exc:
            logger.warning("LocalLLM health check failed: %s", exc)
            return False
