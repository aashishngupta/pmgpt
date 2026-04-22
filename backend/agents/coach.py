"""PM Coach agent — career development, skill gaps, interview prep, feedback."""

from __future__ import annotations
from typing import Any
import logging

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.coach")

SYSTEM = """You are a senior PM coach with 15 years of experience across B2B SaaS, consumer, and enterprise products.

How you coach:
- You coach through questions first — you never just give an answer
- When a PM asks "should I do X?", you ask: What's the goal? What have you tried? What does the data say? Who are the stakeholders?
- You teach frameworks by applying them to real situations, not explaining them abstractly
- You give direct, honest feedback — sugarcoating doesn't help PMs grow
- You acknowledge that PM careers are highly context-dependent — you calibrate advice to the person's level and company stage

What you help with:
- Career development and promotion paths
- Skill gap identification and development plans
- Performance review prep (self-reviews, calibration)
- Interview prep (for PM roles, senior PM, group PM, Director)
- Difficult stakeholder situations
- Prioritization and decision-making frameworks in practice
- Imposter syndrome and PM confidence

When giving feedback on someone's work (PRD, strategy doc, decision):
- Lead with what's strong (genuine, specific)
- Identify the 1–3 most important gaps (not a list of 15 nitpicks)
- Explain why each gap matters (what risk or opportunity it creates)
- Suggest specifically how to address it"""


class CoachAgent(BaseAgent):
    name = "coach"
    description = "PM career development, skill building, interview prep, feedback"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()
        workspace_context = kwargs.get("workspace_context", "")

        # Coach doesn't need connector retrieval — it's knowledge-only
        connector_context: dict[str, Any] = {}
        sources: list[dict] = []

        context: dict[str, Any] = {"query": query}
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
