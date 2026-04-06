"""BaseAgent — abstract class for all pmGPT agents."""

from __future__ import annotations

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any

from backend.connectors.registry import ConnectorRegistry
from backend.core.classifier import DataClassifier
from backend.core.governance import AuditLogger, GovernanceEngine
from backend.llm.router import LLMRouter

if TYPE_CHECKING:
    from backend.rag.retriever import Retriever

logger = logging.getLogger("pmgpt.agents.base")


class BaseAgent(ABC):
    """
    Every agent:
      - Has a name matching the key in pmgpt.config.yaml agents section.
      - Receives shared infrastructure (router, registry, classifier, audit, retriever).
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
        retriever: "Retriever | None" = None,
    ) -> None:
        self.router = router
        self.registry = registry
        self.classifier = classifier
        self.audit = audit
        self.retriever = retriever  # None when chromadb not installed

    def _governance(self) -> GovernanceEngine:
        """Create a fresh GovernanceEngine (new session/token map) per request."""
        return GovernanceEngine(self.classifier, self.audit)

    async def _retrieve(
        self,
        query: str,
        n_results: int = 8,
        connectors: list[str] | None = None,
    ) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        """
        Unified retrieval — tries RAG vector store first, falls back to live search.

        Returns:
            context  — dict ready to merge into the LLM context
            sources  — list of citation dicts {title, url, connector}
        """
        # ── 1. RAG path (vector store) ────────────────────────────────────────
        if self.retriever and self.retriever.has_data:
            ctx, sources = self.retriever.search(query, n_results=n_results, connectors=connectors)
            if ctx:
                logger.debug("RAG hit for agent=%s connectors=%s", self.name, connectors)
                return ctx, sources
            logger.debug("RAG returned no relevant results — falling back to live search")

        # ── 2. Live connector search (fallback) ───────────────────────────────
        return await self._live_search(query, connectors=connectors)

    async def _live_search(
        self,
        query: str,
        max_per_connector: int = 5,
        connectors: list[str] | None = None,
    ) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        """Direct live search across connectors (bypasses vector store)."""
        all_connectors = self.registry.all()
        if not all_connectors:
            return {}, []

        targets = {
            name: conn
            for name, conn in all_connectors.items()
            if connectors is None or name in connectors
        }

        async def _one(name: str, connector) -> tuple[str, list[dict]]:
            try:
                records = await connector.fetch(query, max_results=max_per_connector)
                return name, records or []
            except Exception as exc:
                logger.warning("Live search failed for connector=%s: %s", name, exc)
                return name, []

        pairs = await asyncio.gather(*[_one(n, c) for n, c in targets.items()])

        context: dict[str, Any] = {}
        sources: list[dict[str, Any]] = []

        for connector_name, records in pairs:
            if not records:
                continue
            snippets: list[str] = []
            for rec in records:
                title = rec.get("title") or rec.get("key") or "Untitled"
                content = (
                    rec.get("content") or rec.get("summary") or rec.get("description") or ""
                )
                url = rec.get("url") or rec.get("webViewLink") or rec.get("permalink") or ""
                idx = len(sources) + 1
                snippets.append(f"[{idx}] {title}\n{content[:600]}")
                if url:
                    sources.append({"title": title, "url": url, "connector": connector_name})
            if snippets:
                context[f"{connector_name}_docs"] = "\n\n".join(snippets)

        return context, sources

    @abstractmethod
    async def run(
        self,
        query: str,
        user_role: str,
        **kwargs: Any,
    ) -> tuple[str, list[dict[str, Any]]]:
        """
        Process a user query and return (response_markdown, sources).

        sources is a list of dicts with keys: title, url, connector.
        """

    def _extract_sources(
        self,
        context: dict[str, Any],
        connector_name: str | None,
    ) -> list[dict[str, Any]]:
        """Extract source URLs from fetched connector records."""
        sources: list[dict[str, Any]] = []
        url_fields = {
            "jira": ("key", "url"),
            "confluence": ("title", "url"),
            "notion": ("title", "url"),
            "slack": ("channel", "permalink"),
            "gdrive": ("title", "url"),
        }
        if not connector_name or connector_name not in url_fields:
            return sources

        title_key, url_key = url_fields[connector_name]

        for ctx_key, value in context.items():
            if not isinstance(value, list):
                continue
            for record in value:
                if not isinstance(record, dict):
                    continue
                url = record.get(url_key, "")
                title = record.get(title_key, record.get("title", record.get("key", "Source")))
                if url:
                    sources.append({"title": title, "url": url, "connector": connector_name})
        return sources

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.name!r}>"
