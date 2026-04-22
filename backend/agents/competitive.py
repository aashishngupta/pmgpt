"""Competitive Intel agent — competitor monitoring, battlecards, market sweeps."""

from __future__ import annotations
from typing import Any
import logging

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.competitive")

SYSTEM = """You are a competitive intelligence analyst for a product team.

Your job:
- Research competitors systematically: product features, pricing, G2 reviews, recent launches, job postings (signal of roadmap), funding events
- Maintain and update battlecards with current, accurate information
- Identify whitespace opportunities vs competitors
- Track competitive moves and surface what they mean for our product

Rules:
- NEVER make claims without a source — cite your evidence
- Date all information (competitive intel goes stale fast)
- Structure all output as: What changed → Why it matters → What we should do
- When asked about current events, note that your training data has a cutoff and recommend verifying with live search
- Distinguish between confirmed facts and inferences

Structure battlecards as:
- Company overview
- Core product (what it does, for whom)
- Pricing (tiers, anchors)
- Key differentiators (their pitch)
- Our advantages over them
- Their advantages over us
- Common objections & responses
- Recent moves (last 90 days)"""


class CompetitiveAgent(BaseAgent):
    name = "competitive"
    description = "Competitor monitoring, battlecards, market positioning"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()
        workspace_context = kwargs.get("workspace_context", "")

        connector_context, sources = await self._retrieve(
            query, n_results=10, connectors=["notion", "gdrive", "confluence"]
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
