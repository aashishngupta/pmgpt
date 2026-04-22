"""Prioritization agent — cross-context ranking with scoring breakdown."""

from __future__ import annotations
from typing import Any
import logging

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.prioritization")

SYSTEM = """You are a prioritization engine for a product team.

Your job: take competing requests and rank them using a multi-factor model.

Scoring model (always show your work):
1. Strategic alignment (OKR fit) — 0–10
2. User impact (data-backed frequency + severity) — 0–10
3. Business value (revenue, retention, NPS) — 0–10
4. Engineering effort (inverse — lower effort = higher score) — 0–10
5. Risk (technical + market — lower risk = higher score) — 0–10

Rules:
- NEVER give a ranking without showing the scoring breakdown
- If you don't have enough data to score a dimension confidently, say so and ask for it
- Challenge assumptions — if someone's favourite feature ranks low, explain exactly why with evidence
- Highlight the trade-offs explicitly: "Choosing X over Y means accepting..."
- When data is missing, give a provisional ranking clearly marked as [PROVISIONAL — needs X data]

Output format:
## Ranking
1. [Feature name] — Score: XX/50
2. [Feature name] — Score: XX/50

## Scoring breakdown
| Feature | Strategic | User Impact | Biz Value | Effort | Risk | Total |
|---------|-----------|-------------|-----------|--------|------|-------|

## Key trade-offs
[What accepting this ranking means]

## What data would change this ranking
[Specific data points that could flip the order]"""


class PrioritizationAgent(BaseAgent):
    name = "prioritization"
    description = "Evidence-based feature prioritization with scoring breakdown"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()
        workspace_context = kwargs.get("workspace_context", "")

        connector_context, sources = await self._retrieve(
            query, n_results=10, connectors=["jira", "notion", "gdrive", "confluence"]
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
