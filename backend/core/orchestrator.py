"""
Orchestrator — intent detection and agent routing.

Detects the user's intent from the query and dispatches to the correct agent.
Falls back to the strategy agent for general PM questions.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from backend.agents.analytics import AnalyticsAgent
from backend.agents.base import BaseAgent
from backend.agents.docs import DocsAgent
from backend.agents.ops import OpsAgent
from backend.agents.review import ReviewAgent
from backend.agents.sprint import SprintAgent
from backend.agents.strategy import StrategyAgent
from backend.connectors.registry import ConnectorRegistry
from backend.core.classifier import DataClassifier
from backend.core.governance import AuditLogger
from backend.llm.router import LLMRouter

logger = logging.getLogger("pmgpt.orchestrator")


# Intent → (agent_name, keywords)
INTENT_RULES: list[tuple[str, list[str]]] = [
    ("sprint", [
        "sprint", "spillover", "velocity", "jira", "backlog",
        "story point", "ticket", "issue", "blocked", "standup",
        "scrum", "iteration", "burndown",
    ]),
    ("docs", [
        "prd", "spec", "requirement", "document", "confluence", "notion",
        "write a", "draft a", "create a doc", "user story", "acceptance criteria",
    ]),
    ("strategy", [
        "roadmap", "okr", "vision", "strategy", "prioritiz", "north star",
        "objective", "key result", "quarterly", "annual plan", "rice", "ice",
        "now next later", "theme", "bet", "initiative",
    ]),
    ("analytics", [
        "metric", "kpi", "retention", "conversion", "churn", "dau", "mau",
        "funnel", "a/b test", "experiment", "dashboard", "analytics",
        "measure", "trend", "growth", "engagement",
    ]),
    ("ops", [
        "standup", "triage", "release note", "changelog", "update email",
        "meeting note", "action item", "follow-up", "daily", "weekly",
    ]),
    ("review", [
        "resume", "job description", "interview", "career", "cover letter",
        "portfolio", "linkedin", "hire", "hiring", "pm role",
    ]),
]


class Orchestrator:
    def __init__(
        self,
        router: LLMRouter,
        registry: ConnectorRegistry,
        classifier: DataClassifier,
        audit: AuditLogger,
    ) -> None:
        shared = (router, registry, classifier, audit)
        self._agents: dict[str, BaseAgent] = {
            "sprint": SprintAgent(*shared),
            "docs": DocsAgent(*shared),
            "strategy": StrategyAgent(*shared),
            "analytics": AnalyticsAgent(*shared),
            "ops": OpsAgent(*shared),
            "review": ReviewAgent(*shared),
        }

    def detect_intent(self, query: str) -> str:
        q = query.lower()
        scores: dict[str, int] = {}
        for agent_name, keywords in INTENT_RULES:
            hits = sum(1 for kw in keywords if re.search(re.escape(kw), q))
            if hits:
                scores[agent_name] = hits

        if not scores:
            return "strategy"  # default fallback

        return max(scores, key=lambda k: scores[k])

    async def handle(
        self,
        query: str,
        user_role: str,
        agent_override: str | None = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """
        Route the query to the appropriate agent and return a structured response.

        Returns:
            {
                "agent": str,
                "response": str,
                "intent_detected": str,
            }
        """
        intent = agent_override or self.detect_intent(query)

        agent = self._agents.get(intent)
        if agent is None:
            logger.warning("Unknown agent '%s', falling back to strategy", intent)
            agent = self._agents["strategy"]
            intent = "strategy"

        logger.info("Routing query to agent=%s role=%s", intent, user_role)

        response = await agent.run(query, user_role, **kwargs)

        return {
            "agent": agent.name,
            "response": response,
            "intent_detected": intent,
        }
