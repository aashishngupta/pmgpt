"""
Orchestrator — intent detection and agent routing.

Detects the user's intent from the query and dispatches to the correct agent.
Falls back to the strategy agent for general PM questions.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from typing import TYPE_CHECKING

from backend.agents.analytics import AnalyticsAgent
from backend.agents.base import BaseAgent
from backend.agents.docs import DocsAgent
from backend.agents.general import GeneralAgent
from backend.agents.ops import OpsAgent
from backend.agents.review import ReviewAgent
from backend.agents.sprint import SprintAgent
from backend.agents.strategy import StrategyAgent
from backend.connectors.registry import ConnectorRegistry
from backend.core.classifier import DataClassifier
from backend.core.governance import AuditLogger
from backend.llm.router import LLMRouter

if TYPE_CHECKING:
    from backend.rag.retriever import Retriever

logger = logging.getLogger("pmgpt.orchestrator")


# Intent → (agent_name, keywords)  — ordered by specificity, most specific first
INTENT_RULES: list[tuple[str, list[str]]] = [
    ("sprint", [
        "sprint", "spillover", "velocity", "jira", "backlog",
        "story point", "ticket", "issue", "blocked", "scrum",
        "iteration", "burndown", "board", "epic",
    ]),
    ("docs", [
        "prd", "spec", "requirement", "confluence", "notion",
        "write a", "draft a", "create a doc", "user story",
        "acceptance criteria", "documentation", "rfc",
    ]),
    ("strategy", [
        "roadmap", "okr", "product vision", "product strategy",
        "north star", "key result", "quarterly plan", "annual plan",
        "rice framework", "ice framework", "now next later",
        "strategic bet", "initiative", "positioning", "gtm",
    ]),
    ("analytics", [
        "metric", "kpi", "retention", "conversion", "churn", "dau", "mau",
        "funnel", "a/b test", "experiment", "dashboard", "analytics",
        "measure", "trend", "engagement", "cohort", "activation",
    ]),
    ("ops", [
        "standup", "triage", "release note", "changelog", "update email",
        "meeting note", "action item", "follow-up", "daily update", "weekly update",
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
        retriever: "Retriever | None" = None,
    ) -> None:
        shared = (router, registry, classifier, audit)
        kw = {"retriever": retriever}
        self._agents: dict[str, BaseAgent] = {
            "sprint":    SprintAgent(*shared, **kw),
            "docs":      DocsAgent(*shared, **kw),
            "strategy":  StrategyAgent(*shared, **kw),
            "analytics": AnalyticsAgent(*shared, **kw),
            "ops":       OpsAgent(*shared, **kw),
            "review":    ReviewAgent(*shared, **kw),
            "general":   GeneralAgent(*shared, **kw),
        }

    def detect_intent(self, query: str) -> str:
        q = query.lower()
        scores: dict[str, int] = {}
        for agent_name, keywords in INTENT_RULES:
            hits = sum(1 for kw in keywords if re.search(re.escape(kw), q))
            if hits:
                scores[agent_name] = hits

        if not scores:
            return "general"  # neutral fallback — no domain keywords matched

        return max(scores, key=lambda k: scores[k])

    async def handle(
        self,
        query: str,
        user_role: str,
        agent_override: str | None = None,
        history: list[dict] | None = None,
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

        response, sources = await agent.run(query, user_role, history=history, **kwargs)

        return {
            "agent": agent.name,
            "response": response,
            "intent_detected": intent,
            "sources": sources,
        }
