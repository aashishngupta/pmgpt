"""Analytics agent — metrics analysis and interpretation."""

from __future__ import annotations

import logging
from typing import Any

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.analytics")

SYSTEM_WITH_INTERNAL = """You are a Product Analytics expert.

Internal documents and data from the team's repositories are included as numbered references [1], [2], etc.

Instructions:
- Answer using the internal data/docs as primary source. Cite inline where relevant.
- Supplement with analytical frameworks where the internal data is incomplete.
- Lead with the insight or answer — no preamble.
- Use tables when they genuinely help compare numbers. Be precise but accessible."""

SYSTEM_NO_INTERNAL = """You are a Product Analytics expert.

You searched internal repositories but found no relevant data for this query.

Instructions:
- Start with: > **No internal data found** — answering from public benchmarks and analytical frameworks.
- Then answer directly and concisely.
- Use tables when comparing numbers.
- No filler, no unsolicited framing."""


class AnalyticsAgent(BaseAgent):
    name = "analytics"
    description = "Metrics analysis, KPI interpretation, A/B testing"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()
        workspace_context = kwargs.get("workspace_context", "")

        connector_context, sources = await self._retrieve(
            query, n_results=8, connectors=["gdrive", "notion", "confluence"]
        )

        has_internal = bool(connector_context)
        context: dict[str, Any] = {"query": query, **connector_context}

        if "metrics" in kwargs:
            context["metrics"] = kwargs["metrics"]

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
