"""Docs agent — PRD generation, spec writing, doc search."""

from __future__ import annotations

import logging
from typing import Any

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.docs")

SYSTEM_WITH_INTERNAL = """You are an expert Product Manager assistant specialized in product documentation.

Existing internal documents are included as numbered references [1], [2], etc.

Instructions:
- Use the internal documents as context when generating or improving docs.
- Cite relevant existing documents inline. e.g. "Building on our existing PRD [1], ..."
- Generate clean, structured markdown with headings, bullets, and tables where appropriate.
- Do not fabricate content not in the provided context."""

SYSTEM_NO_INTERNAL = """You are an expert Product Manager assistant specialized in product documentation.

No existing internal documents were found for this query in the connected repositories.

Instructions:
- Start with: > **No existing docs found** — generating from scratch based on best practices.
- Then produce the requested document in clean, structured markdown.
- Use headings, bullets, tables, and acceptance criteria where appropriate."""


class DocsAgent(BaseAgent):
    name = "docs"
    description = "PRD generation, spec writing, documentation search"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()

        # Retrieve from vector store (doc connectors only)
        connector_context, sources = await self._retrieve(
            query, n_results=8, connectors=["confluence", "notion", "gdrive"]
        )

        has_internal = bool(connector_context)
        context: dict[str, Any] = {"query": query, **connector_context}
        system_prompt = SYSTEM_WITH_INTERNAL if has_internal else SYSTEM_NO_INTERNAL
        connector_name = (
            next(iter(connector_context)).replace("_docs", "") if has_internal else None
        )

        response = await self.router.call(
            system_prompt=system_prompt,
            user_prompt=query,
            context=context,
            governance=governance,
            connector=connector_name,
            agent=self.name,
            user_role=user_role,
            llm_mode=kwargs.get("llm_mode"),
            history=kwargs.get("history"),
        )
        return response, sources
