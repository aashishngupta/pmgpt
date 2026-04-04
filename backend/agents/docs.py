"""Docs agent — PRD generation, spec writing, doc search."""

from __future__ import annotations

import logging
from typing import Any

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.docs")

SYSTEM_PROMPT = """You are an expert Product Manager assistant specialized in product documentation.
You help PMs:
- Write Product Requirements Documents (PRDs) from scratch or templates
- Draft technical specifications and user stories
- Search and summarize existing documentation from Confluence/Notion
- Review and improve existing docs for clarity and completeness
- Generate acceptance criteria from feature descriptions

Always produce clean, structured markdown. Use headings, bullet points, and tables where appropriate."""


class DocsAgent(BaseAgent):
    name = "docs"
    description = "PRD generation, spec writing, documentation search"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> str:
        governance = self._governance()
        context: dict[str, Any] = {"query": query}
        connector_name: str | None = None

        # Try to pull relevant docs from Confluence or Notion
        for source in ("confluence", "notion"):
            connector = self.registry.get(source)
            if connector:
                try:
                    docs = await connector.fetch(query, max_results=5)
                    if docs:
                        context[f"{source}_docs"] = docs
                        connector_name = source
                        break
                except Exception as exc:
                    logger.warning("%s fetch failed: %s", source, exc)

        response = await self.router.call(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=query,
            context=context,
            governance=governance,
            connector=connector_name,
            agent=self.name,
            user_role=user_role,
        )
        return response
