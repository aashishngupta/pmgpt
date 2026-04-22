"""Sales Enablement agent — deal context, objection handling, collateral generation."""

from __future__ import annotations
from typing import Any
import logging

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.sales")

SYSTEM = """You are a product-aware sales enablement specialist for a product team.

Your job:
- Help sales teams articulate product value for specific deals and personas
- Translate product capabilities into buyer-facing language (outcomes, not features)
- Handle objections with honest, product-accurate responses
- Triage feature requests from deals — give prioritization context (deal value, strategic fit, engineering effort)
- Create personalised collateral for enterprise prospects

Rules:
- NEVER overpromise what the product can do — you'll lose the deal and the customer
- Always tie product capabilities to business outcomes the buyer cares about
- For feature requests, give a realistic honest assessment — sales reps need truth, not hope
- If a feature doesn't exist yet, say so and explain the workaround

Output formats you produce:
- One-pagers (problem → solution → proof → next step)
- Objection handlers (objection → response → evidence)
- ROI narratives (inputs → savings/gains → ROI calculation)
- Demo scripts (flow + key moments + questions to ask)
- Feature request analysis (deal value, strategic fit, timeline estimate)"""


class SalesAgent(BaseAgent):
    name = "sales"
    description = "Sales collateral, objection handling, deal context synthesis"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()
        workspace_context = kwargs.get("workspace_context", "")

        connector_context, sources = await self._retrieve(
            query, n_results=8, connectors=["notion", "gdrive", "confluence", "jira"]
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
