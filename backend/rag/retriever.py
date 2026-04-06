"""
Retriever — semantic search interface used by all agents.

Queries the VectorStore and returns structured context + citation sources.
Filters results by minimum relevance score to avoid injecting noise.
"""

from __future__ import annotations

import logging
from typing import Any

from backend.rag.store import VectorStore

logger = logging.getLogger("pmgpt.rag.retriever")

# Minimum cosine similarity (0–1) to consider a chunk relevant.
# 0.35 ≈ "somewhat related"; tune up if too many false positives.
MIN_SCORE = 0.35


class Retriever:
    def __init__(self, store: VectorStore) -> None:
        self.store = store

    @property
    def has_data(self) -> bool:
        return self.store.available and self.store.count() > 0

    def search(
        self,
        query: str,
        n_results: int = 8,
        connectors: list[str] | None = None,
        min_score: float = MIN_SCORE,
    ) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        """
        Semantic search over indexed documents.

        Args:
            query:      The user's natural-language query.
            n_results:  How many chunks to retrieve from the store.
            connectors: Restrict search to these connector names (None = all).
            min_score:  Minimum similarity score (0–1) to keep a result.

        Returns:
            context  — {"{connector}_docs": "formatted numbered snippets"} ready for LLM
            sources  — [{title, url, connector}] for UI citation chips
        """
        if not self.has_data:
            return {}, []

        # ChromaDB `where` filter supports only a single field equality.
        # For multi-connector filtering, retrieve more and filter client-side.
        where: dict | None = None
        if connectors and len(connectors) == 1:
            where = {"connector": connectors[0]}

        hits = self.store.search(query, n_results=n_results, where=where)

        # Client-side filter by connector list and minimum score
        hits = [
            h for h in hits
            if h["score"] >= min_score
            and (connectors is None or h["connector"] in connectors)
        ]

        if not hits:
            return {}, []

        # Deduplicate by source_id (keep highest-scoring chunk per document)
        seen: dict[str, dict] = {}
        for h in sorted(hits, key=lambda x: x["score"], reverse=True):
            sid = h.get("source_id") or h["title"]
            if sid not in seen:
                seen[sid] = h

        deduped = list(seen.values())

        # Build numbered citation list (ordered by score)
        sources: list[dict[str, Any]] = []
        context_by_connector: dict[str, list[str]] = {}

        for idx, hit in enumerate(deduped, start=1):
            conn = hit["connector"]
            snippet = f"[{idx}] {hit['title']}\n{hit['text'][:600]}"
            context_by_connector.setdefault(conn, []).append(snippet)

            if hit.get("url"):
                sources.append({
                    "title": hit["title"],
                    "url": hit["url"],
                    "connector": conn,
                })

        # Format context dict for LLM injection
        context: dict[str, Any] = {
            f"{conn}_docs": "\n\n".join(snippets)
            for conn, snippets in context_by_connector.items()
        }

        logger.debug(
            "RAG retrieved %d unique docs for query=%r (connectors=%s)",
            len(deduped), query[:60], connectors,
        )
        return context, sources
