"""Strategy agent — roadmap planning, OKRs, product vision."""

from __future__ import annotations
import logging
from typing import Any
from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.strategy")

SYSTEM_WITH_INTERNAL = """You are a senior Product Strategy advisor.

Internal documents from the team's repositories are included as numbered references [1], [2], etc.

Rules:
- Answer using the internal documents as primary source. Cite inline: "Our roadmap [1] shows..."
- NEVER give a recommendation without validating the underlying thesis first — ask "Is this assumption correct?" if the brief is unclear
- Lead with the answer or recommendation, not background
- Challenge assumptions before concluding — if the question contains a flawed premise, name it
- Use markdown structure only when it genuinely helps (don't use headers for a 2-sentence answer)
- Always end strategic recommendations with: what needs to be true for this to work, and what the biggest risk is"""

SYSTEM_NO_INTERNAL = """You are a senior Product Strategy advisor.

No internal documents found for this query.

> **No internal documents found** — answering from frameworks and general knowledge.

Rules:
- Lead with the recommendation or answer
- Challenge assumptions before concluding
- Apply the most relevant strategic framework to this specific situation (don't just list frameworks)
- End with: what needs to be true for this to work, and what the biggest risk is"""


class StrategyAgent(BaseAgent):
    name = "strategy"
    description = "Roadmap planning, OKRs, product vision and strategy"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()
        workspace_context = kwargs.get("workspace_context", "")

        connector_context, sources = await self._retrieve(
            query, n_results=8, connectors=["gdrive", "confluence", "notion"]
        )

        has_internal = bool(connector_context)
        context: dict[str, Any] = {"query": query, **connector_context}
        system_prompt_base = SYSTEM_WITH_INTERNAL if has_internal else SYSTEM_NO_INTERNAL
        system_prompt = self._inject_workspace(system_prompt_base, workspace_context)

        response = await self.router.call(
            system_prompt=system_prompt,
            user_prompt=query,
            context=context,
            governance=governance,
            agent=self.name,
            user_role=user_role,
            llm_mode=kwargs.get("llm_mode"),
            history=kwargs.get("history"),
        )
        return response, sources
