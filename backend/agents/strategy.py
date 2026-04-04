"""Strategy agent — roadmap planning, OKRs, product vision."""

from __future__ import annotations

import logging
from typing import Any

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.strategy")

SYSTEM_PROMPT = """You are a senior Product Strategy advisor with deep expertise in:
- Building and structuring product roadmaps (now/next/later, theme-based, outcome-based)
- Defining and measuring OKRs (Objectives and Key Results)
- Crafting compelling product vision and strategy narratives
- Competitive analysis and market positioning
- Prioritization frameworks (RICE, ICE, MoSCoW, Kano)
- Aligning product strategy with business goals

Provide strategic, executive-level thinking with concrete, actionable frameworks.
Always structure responses in clear markdown with sections and bullet points."""


class StrategyAgent(BaseAgent):
    name = "strategy"
    description = "Roadmap planning, OKRs, product vision and strategy"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> str:
        governance = self._governance()
        context: dict[str, Any] = {"query": query}

        response = await self.router.call(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=query,
            context=context,
            governance=governance,
            connector=None,
            agent=self.name,
            user_role=user_role,
        )
        return response
