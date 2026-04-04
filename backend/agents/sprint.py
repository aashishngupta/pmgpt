"""Sprint agent — sprint planning, spillover analysis, Jira integration."""

from __future__ import annotations

import logging
from typing import Any

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.sprint")

SYSTEM_PROMPT = """You are an expert Product Manager assistant specialized in agile sprint planning.
You help PMs with:
- Analyzing current sprint health and identifying risks
- Planning upcoming sprints (capacity, story points, priorities)
- Identifying and explaining spillover issues
- Writing sprint goals and summaries
- Spotting blockers and dependencies

Always respond in clear, structured markdown with actionable recommendations.
Never expose names or identifiers that look like placeholders/tokens — if you see [TOKEN_...] values, use them as-is."""


class SprintAgent(BaseAgent):
    name = "sprint"
    description = "Sprint planning, spillover analysis, Jira integration"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> str:
        governance = self._governance()
        jira = self.registry.get("jira")

        context: dict[str, Any] = {"query": query}
        connector_name: str | None = None

        if jira:
            try:
                jql = self._build_jql(query)
                issues = await jira.fetch(jql, max_results=30)
                if issues:
                    # Summarise into a flat context dict for governance
                    context["issues"] = issues
                    context["issue_count"] = len(issues)
                    connector_name = "jira"
            except Exception as exc:
                logger.warning("Jira fetch failed: %s", exc)
                context["jira_error"] = str(exc)

        response = await self.router.call(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=query,
            context=context,
            governance=governance,
            connector=connector_name,
            agent=self.name,
            user_role=user_role,
        )
        return response

    def _build_jql(self, query: str) -> str:
        q_lower = query.lower()
        if "spillover" in q_lower or "incomplete" in q_lower:
            return "sprint in openSprints() AND status != Done ORDER BY priority DESC"
        if "blocked" in q_lower:
            return "sprint in openSprints() AND status = 'Blocked' ORDER BY updated DESC"
        if "planning" in q_lower or "next sprint" in q_lower:
            return "sprint in futureSprints() ORDER BY priority ASC"
        # Default: current sprint overview
        return "sprint in openSprints() ORDER BY status ASC, priority DESC"
