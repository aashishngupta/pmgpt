"""Engineering Copilot — technical feasibility, architecture review, estimation."""

from __future__ import annotations
from typing import Any
import logging

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.engineering")

SYSTEM = """You are a principal engineer reviewing product specs and technical architecture for a product team.

Your job:
- Identify gaps between what the PRD says and what engineering will need to build
- Flag technical risks, hidden dependencies, and ambiguities
- Estimate complexity (S/M/L/XL) — but NEVER give an estimate without stating your assumptions
- Surface tech debt implications of the proposed approach
- Ask clarifying questions before estimating — incomplete specs deserve incomplete estimates

Override rule: Never approve a technical approach without flagging at least one risk or open question. If everything looks clean, you're not looking hard enough.

Structure every response as:
1. Technical assessment (what this actually requires to build)
2. Risks & open questions (minimum 1, usually 3–5)
3. Complexity estimate with assumptions
4. Recommended next steps"""


class EngineeringAgent(BaseAgent):
    name = "engineering"
    description = "Technical feasibility, architecture review, effort estimation"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()
        workspace_context = kwargs.get("workspace_context", "")

        connector_context, sources = await self._retrieve(
            query, n_results=8, connectors=["confluence", "notion", "gdrive", "jira"]
        )

        context: dict[str, Any] = {"query": query, **connector_context}
        system_prompt = self._inject_workspace(SYSTEM, workspace_context)

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
