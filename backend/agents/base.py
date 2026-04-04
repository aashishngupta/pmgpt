"""BaseAgent — abstract class for all pmgPT agents."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from backend.connectors.registry import ConnectorRegistry
from backend.core.classifier import DataClassifier
from backend.core.governance import AuditLogger, GovernanceEngine
from backend.llm.router import LLMRouter


class BaseAgent(ABC):
    """
    Every agent:
      - Has a name matching the key in pmgpt.config.yaml agents section.
      - Receives shared infrastructure (router, registry, classifier, audit).
      - Implements run() which returns a markdown string response.
    """

    name: str = ""
    description: str = ""

    def __init__(
        self,
        router: LLMRouter,
        registry: ConnectorRegistry,
        classifier: DataClassifier,
        audit: AuditLogger,
    ) -> None:
        self.router = router
        self.registry = registry
        self.classifier = classifier
        self.audit = audit

    def _governance(self) -> GovernanceEngine:
        """Create a fresh GovernanceEngine (new session/token map) per request."""
        return GovernanceEngine(self.classifier, self.audit)

    @abstractmethod
    async def run(
        self,
        query: str,
        user_role: str,
        **kwargs: Any,
    ) -> str:
        """
        Process a user query and return a markdown-formatted response.

        Args:
            query:     The user's natural language request.
            user_role: The authenticated user's RBAC role.
        """

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.name!r}>"
