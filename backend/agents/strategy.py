"""Strategy agent — roadmap planning, OKRs, product vision."""

from __future__ import annotations

import logging
from typing import Any

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.strategy")

SYSTEM_WITH_INTERNAL = """You are a senior Product Strategy advisor.

Internal documents from the team's repositories are included as numbered references [1], [2], etc.

Instructions:
- Answer using the internal documents as primary source. Cite inline: e.g. "Our roadmap [1] shows..."
- If the docs don't fully cover the question, supplement with strategic frameworks.
- Lead with the answer — no preamble or filler.
- Use markdown only when it genuinely helps structure the response."""

SYSTEM_NO_INTERNAL = """You are a senior Product Strategy advisor. Answer directly and concisely.

You searched internal repositories but found no relevant documents for this query.

Instructions:
- Start with: > **No internal documents found** — answering from frameworks and general knowledge.
- Then give your strategic answer — direct, no filler.
- Lead with the recommendation or answer, not background.
- Do NOT add unsolicited product strategy framing if the question doesn't ask for it."""


class StrategyAgent(BaseAgent):
    name = "strategy"
    description = "Roadmap planning, OKRs, product vision and strategy"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()

        # Retrieve from vector store (strategy-relevant connectors only)
        connector_context, sources = await self._retrieve(
            query, n_results=8, connectors=["gdrive", "confluence", "notion"]
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
