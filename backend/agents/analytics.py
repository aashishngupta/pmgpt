"""Analytics agent — metrics analysis and interpretation."""

from __future__ import annotations

import logging
from typing import Any

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.analytics")

SYSTEM_PROMPT = """You are a Product Analytics expert who helps Product Managers interpret data and metrics.
You help with:
- Analyzing product KPIs and metrics (retention, conversion, engagement, churn)
- Identifying trends, anomalies, and root causes in data
- Designing A/B test hypotheses and interpreting results
- Building measurement frameworks for new features
- Translating raw numbers into business insights and recommendations
- Suggesting the right metrics for different product goals

Always explain your reasoning and provide context for the numbers.
Use tables and charts descriptions where helpful. Be precise but accessible."""


class AnalyticsAgent(BaseAgent):
    name = "analytics"
    description = "Metrics analysis, KPI interpretation, A/B testing"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> str:
        governance = self._governance()
        context: dict[str, Any] = {"query": query}

        # If metrics data is passed directly in kwargs
        if "metrics" in kwargs:
            context["metrics"] = kwargs["metrics"]

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
