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

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()
        jira = self.registry.get("jira")

        context: dict[str, Any] = {"query": query}
        connector_name: str | None = None

        if jira:
            jql = self._build_jql(query)
            try:
                issues = await jira.fetch(jql, max_results=30)
                if issues:
                    context["issues"] = issues
                    context["issue_count"] = len(issues)
                    connector_name = "jira"
                else:
                    context["jira_status"] = "Connected to Jira but no issues found matching your query. Your board may be empty or the sprint hasn't started yet."
            except Exception as exc:
                logger.warning("Jira sprint fetch failed, falling back: %s", exc)
                try:
                    issues = await jira.fetch("status != Done ORDER BY updated DESC", max_results=30)
                    if issues:
                        context["issues"] = issues
                        context["issue_count"] = len(issues)
                        context["jira_status"] = "No active sprint found — showing all open issues instead."
                        connector_name = "jira"
                    else:
                        context["jira_status"] = "Connected to Jira but no open issues found. Your board appears to be empty."
                except Exception as exc2:
                    logger.warning("Jira fallback also failed: %s", exc2)
                    context["jira_status"] = "Could not connect to Jira. Please check your credentials or network connection."
        else:
            context["jira_status"] = "Jira is not configured. Please add your Jira credentials to get live sprint data."

        # Pull upcoming sprint ceremonies from calendar
        gcal = self.registry.get("gcalendar")
        if gcal:
            try:
                events = await gcal.fetch("sprint", max_results=5)
                if events:
                    context["sprint_meetings"] = events
                else:
                    context["calendar_status"] = "No upcoming sprint meetings found in calendar."
            except Exception as exc:
                logger.warning("Google Calendar fetch failed in sprint agent: %s", exc)
                context["calendar_status"] = "Could not connect to Google Calendar."

        workspace_context = kwargs.get("workspace_context", "")
        system_prompt = self._inject_workspace(SYSTEM_PROMPT, workspace_context)

        response = await self.router.call(
            system_prompt=system_prompt,
            user_prompt=query,
            context=context,
            governance=governance,
            connector=connector_name,
            agent=self.name,
            user_role=user_role,
            llm_mode=kwargs.get("llm_mode"),
            history=kwargs.get("history"),
        )
        sources = self._extract_sources(context, connector_name)
        return response, sources

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
