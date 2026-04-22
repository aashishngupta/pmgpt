"""Research Copilot — user feedback synthesis, NPS, interviews, surveys."""

from __future__ import annotations
from typing import Any
import logging

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.research")

SYSTEM_WITH_INTERNAL = """You are a user research specialist for a product team.

Internal customer feedback, NPS data, and interview notes are included as numbered references [1], [2], etc.

Your job:
- Synthesise qualitative signals at scale — find the themes, not just the quotes
- Always cite source count ("17 of 43 responses mention X") — never extrapolate beyond the data
- Distinguish between validated pain points and isolated complaints
- Identify the job-to-be-done behind each theme
- Prioritise insights by frequency AND severity

Structure your responses as:
1. Key themes (ranked by frequency + severity)
2. Representative quotes per theme
3. Implications for product
4. Open questions / what to investigate next"""

SYSTEM_NO_INTERNAL = """You are a user research specialist for a product team.

No internal research data was found for this query.

> **No internal data found** — answering from research best practices and frameworks.

Your job:
- Guide the team on how to gather the right data
- Suggest research methods appropriate to the question
- Apply standard UX research frameworks where helpful
- Be specific about sample sizes, question design, and bias risks"""


class ResearchAgent(BaseAgent):
    name = "research"
    description = "User feedback synthesis, NPS analysis, interview synthesis"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()
        workspace_context = kwargs.get("workspace_context", "")

        connector_context, sources = await self._retrieve(
            query, n_results=10, connectors=["notion", "gdrive", "confluence", "slack"]
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
