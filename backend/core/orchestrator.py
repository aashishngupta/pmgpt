"""
Orchestrator — intent detection and agent routing.

Detects the user's intent from the query and dispatches to the correct agent.
Supports workspace memory injection, @mention routing, and sub-agent invocation.
"""

from __future__ import annotations

import logging
import re
from typing import Any, TYPE_CHECKING

from backend.agents.analytics import AnalyticsAgent
from backend.agents.base import BaseAgent
from backend.agents.coach import CoachAgent
from backend.agents.competitive import CompetitiveAgent
from backend.agents.docs import DocsAgent
from backend.agents.engineering import EngineeringAgent
from backend.agents.general import GeneralAgent
from backend.agents.market import MarketAgent
from backend.agents.ops import OpsAgent
from backend.agents.prioritization import PrioritizationAgent
from backend.agents.release import ReleaseAgent
from backend.agents.research import ResearchAgent
from backend.agents.review import ReviewAgent
from backend.agents.sales import SalesAgent
from backend.agents.sprint import SprintAgent
from backend.agents.strategy import StrategyAgent
from backend.connectors.registry import ConnectorRegistry
from backend.core.classifier import DataClassifier
from backend.core.governance import AuditLogger
from backend.llm.router import LLMRouter

if TYPE_CHECKING:
    from backend.rag.retriever import Retriever

logger = logging.getLogger("pmgpt.orchestrator")


# Intent → keywords — ordered most-specific first
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
        "sprint summary", "retro", "retrospective",
    ]),
    ("research", [
        "user feedback", "customer feedback", "nps", "survey", "interview",
        "user research", "voice of customer", "voc", "csat", "user pain",
        "qualitative", "customer signal",
    ]),
    ("engineering", [
        "technical", "architecture", "tech debt", "api", "backend", "frontend",
        "engineering", "feasibility", "estimation", "estimate", "complexity",
        "system design", "tech spec", "incident", "postmortem",
    ]),
    ("competitive", [
        "competitor", "competitive", "battlecard", "market positioning",
        "vs ", "compared to", "g2", "review site", "pricing intelligence",
        "job posting", "competitor launch",
    ]),
    ("sales", [
        "sales", "deal", "objection", "prospect", "salesforce", "hubspot",
        "crm", "pipeline", "feature request from", "roi narrative", "one-pager",
        "demo script", "sales collateral",
    ]),
    ("coach", [
        "career", "pm coach", "promotion", "performance review", "growth plan",
        "interview prep", "skill gap", "feedback on my", "how do i become",
        "career development",
    ]),
    ("prioritization", [
        "prioritize", "prioritise", "priority", "rank", "what should we build",
        "what's more important", "rice score", "ice score", "prioritization",
        "trade-off", "which feature",
    ]),
    ("release", [
        "release", "go/no-go", "uat", "rollback", "ship", "deploy",
        "launch checklist", "release notes", "release manager", "stakeholder email",
    ]),
    ("market", [
        "market size", "tam", "sam", "som", "industry trend", "market research",
        "analyst report", "market intelligence", "market opportunity", "market sweep",
    ]),
    ("review", [
        "review this", "feedback on", "prd review", "spec review", "design review",
        "code review", "review agent", "pm review",
    ]),
]

# @mention → agent name map
MENTION_MAP: dict[str, str] = {
    "strategy":      "strategy",
    "docs":          "docs",
    "analytics":     "analytics",
    "ops":           "ops",
    "research":      "research",
    "engineering":   "engineering",
    "competitive":   "competitive",
    "sales":         "sales",
    "coach":         "coach",
    "prioritize":    "prioritization",
    "prioritization":"prioritization",
    "release":       "release",
    "market":        "market",
    "review":        "review",
    "sprint":        "sprint",
}

_MENTION_RE = re.compile(r"@(\w+)")


def _detect_mention(query: str) -> str | None:
    """Return agent name if @mention found, else None."""
    for match in _MENTION_RE.finditer(query.lower()):
        name = match.group(1)
        if name in MENTION_MAP:
            return MENTION_MAP[name]
    return None


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
            "sprint":         SprintAgent(*shared, **kw),
            "docs":           DocsAgent(*shared, **kw),
            "strategy":       StrategyAgent(*shared, **kw),
            "analytics":      AnalyticsAgent(*shared, **kw),
            "ops":            OpsAgent(*shared, **kw),
            "review":         ReviewAgent(*shared, **kw),
            "research":       ResearchAgent(*shared, **kw),
            "engineering":    EngineeringAgent(*shared, **kw),
            "competitive":    CompetitiveAgent(*shared, **kw),
            "sales":          SalesAgent(*shared, **kw),
            "coach":          CoachAgent(*shared, **kw),
            "prioritization": PrioritizationAgent(*shared, **kw),
            "release":        ReleaseAgent(*shared, **kw),
            "market":         MarketAgent(*shared, **kw),
            "general":        GeneralAgent(*shared, **kw),
        }

    def detect_intent(self, query: str) -> str:
        # @mention takes highest priority
        mention = _detect_mention(query)
        if mention:
            return mention

        q = query.lower()
        scores: dict[str, int] = {}
        for agent_name, keywords in INTENT_RULES:
            hits = sum(1 for kw in keywords if re.search(re.escape(kw), q))
            if hits:
                scores[agent_name] = hits

        if not scores:
            return "general"

        return max(scores, key=lambda k: scores[k])

    async def handle(
        self,
        query: str,
        user_role: str,
        agent_override: str | None = None,
        history: list[dict] | None = None,
        workspace_context: str = "",
        **kwargs: Any,
    ) -> dict[str, Any]:
        intent = agent_override or self.detect_intent(query)

        agent = self._agents.get(intent)
        if agent is None:
            logger.warning("Unknown agent '%s', falling back to strategy", intent)
            agent = self._agents["strategy"]
            intent = "strategy"

        logger.info("Routing query to agent=%s role=%s", intent, user_role)

        response, sources = await agent.run(
            query, user_role,
            history=history,
            workspace_context=workspace_context,
            **kwargs,
        )

        return {
            "agent": agent.name,
            "response": response,
            "intent_detected": intent,
            "sources": sources,
        }
