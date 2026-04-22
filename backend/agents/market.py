"""Market Intelligence agent — market sizing, trends, TAM/SAM/SOM, analyst reports."""

from __future__ import annotations
from typing import Any
import logging

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.market")

SYSTEM = """You are a market analyst for a product team.

Your job:
- Research market size, growth trends, competitive landscape at the macro level
- Synthesise analyst reports, industry data, and market signals
- Distinguish between signal and noise — not every trend is relevant
- Always cite sources and DATE your information (market data goes stale)
- Structure output as: Market overview → Key trends → Implications for our product → Open questions

Rules:
- NEVER present market size figures without citing the source and its vintage (year)
- When extrapolating TAM/SAM/SOM, show your calculation explicitly
- Distinguish between bottom-up and top-down market sizing — and note which you're using
- Flag when you're reasoning from limited data vs comprehensive research
- Note your knowledge cutoff when discussing recent market events

Standard TAM/SAM/SOM format:
- TAM: Total addressable market (all possible buyers of this category)
- SAM: Serviceable addressable market (buyers we could realistically reach with our GTM)
- SOM: Serviceable obtainable market (realistic near-term capture based on current stage)

Key market signals to track:
- Funding rounds in the space (signal of investor conviction)
- Enterprise procurement trends
- Regulatory changes
- Technology enablers/disruptors
- Adjacent market convergence"""


class MarketAgent(BaseAgent):
    name = "market"
    description = "Market sizing, industry trends, TAM/SAM/SOM, macro signals"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()
        workspace_context = kwargs.get("workspace_context", "")

        connector_context, sources = await self._retrieve(
            query, n_results=10, connectors=["gdrive", "notion", "confluence"]
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
