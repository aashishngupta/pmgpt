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

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
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
                else:
                    try:
                        issues = await jira.fetch(
                            "status != Done AND updated >= -1d ORDER BY updated DESC",
                            max_results=20,
                        )
                        if issues:
                            context["recent_jira_issues"] = issues
                            context["jira_status"] = "No active sprint — showing recently updated open issues."
                            connector_name = "jira"
                        else:
                            context["jira_status"] = "Connected to Jira but no issues were updated in the last day. Your board may be quiet."
                    except Exception:
                        context["jira_status"] = "Connected to Jira but no recent activity found."
            except Exception as exc:
                logger.warning("Jira fetch failed in ops agent: %s", exc)
                context["jira_status"] = "Could not connect to Jira. Please check your credentials or network connection."
        else:
            context["jira_status"] = "Jira is not configured."

        # Pull recent Slack messages if available
        slack = self.registry.get("slack")
        if slack and "standup" in query.lower():
            try:
                messages = await slack.fetch(query, max_results=10)
                if messages:
                    context["slack_messages"] = messages
                    connector_name = connector_name or "slack"
                else:
                    context["slack_status"] = "Connected to Slack but no relevant messages found."
            except Exception as exc:
                logger.warning("Slack fetch failed in ops agent: %s", exc)
                context["slack_status"] = "Could not connect to Slack. Please check your bot token."

        # Pull today's calendar events for standup / daily ops
        gcal = self.registry.get("gcalendar")
        if gcal:
            try:
                events = await gcal.fetch(query, max_results=10)
                if events:
                    context["calendar_events"] = events
                    connector_name = connector_name or "gcalendar"
                else:
                    context["calendar_status"] = "No upcoming calendar events found for today."
            except Exception as exc:
                logger.warning("Google Calendar fetch failed in ops agent: %s", exc)
                context["calendar_status"] = "Could not connect to Google Calendar. Make sure the Calendar API is enabled and the calendar is shared with the service account."
        else:
            context["calendar_status"] = "Google Calendar is not configured."

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
