"""Ops agent — standup summaries, task triage, daily operations."""

from __future__ import annotations

import logging
from typing import Any

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.ops")

SYSTEM_PROMPT = """You are a Product Operations assistant helping PMs run smoother day-to-day operations.
You help with:
- Generating standup summaries from Jira and Slack activity
- Triaging incoming tasks and bug reports by priority and impact
- Drafting stakeholder update emails and meeting notes
- Identifying action items from conversations
- Tracking follow-ups and commitments
- Writing release notes and changelog entries

Be concise, practical, and action-oriented. Format outputs for quick consumption."""


class OpsAgent(BaseAgent):
    name = "ops"
    description = "Standup summaries, task triage, daily PM operations"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> str:
        governance = self._governance()
        context: dict[str, Any] = {"query": query}
        connector_name: str | None = None

        # Pull Jira issues for standup context
        jira = self.registry.get("jira")
        if jira:
            try:
                issues = await jira.fetch(
                    "sprint in openSprints() AND updated >= -1d ORDER BY updated DESC",
                    max_results=20,
                )
                if issues:
                    context["recent_jira_issues"] = issues
                    connector_name = "jira"
            except Exception as exc:
                logger.warning("Jira fetch failed in ops agent: %s", exc)

        # Pull recent Slack messages if available
        slack = self.registry.get("slack")
        if slack and "standup" in query.lower():
            try:
                messages = await slack.fetch(query, max_results=10)
                if messages:
                    context["slack_messages"] = messages
                    connector_name = connector_name or "slack"
            except Exception as exc:
                logger.warning("Slack fetch failed in ops agent: %s", exc)

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
