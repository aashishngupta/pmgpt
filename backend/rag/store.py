"""
VectorStore — ChromaDB wrapper for pmGPT document embeddings.

All connector documents are stored in a single persistent collection.
Each chunk carries metadata: title, url, connector, source_id, chunk_idx.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("pmgpt.rag.store")

COLLECTION_NAME = "pmgpt_docs"


class VectorStore:
    """
    Thin wrapper around a ChromaDB persistent collection.
    Uses the default embedding function (sentence-transformers/all-MiniLM-L6-v2)
    so no separate API key is needed for embeddings.
    """

    def __init__(self, persist_dir: str = "data/rag") -> None:
        try:
            import chromadb
            self._client = chromadb.PersistentClient(path=persist_dir)
            self._col = self._client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
            logger.info(
                "VectorStore ready — collection=%s chunks=%d",
                COLLECTION_NAME,
                self._col.count(),
            )
            self._available = True
        except ImportError:
            logger.warning(
                "chromadb not installed — RAG disabled. "
                "Run: pip install chromadb"
            )
            self._available = False
        except Exception as exc:
            logger.error("VectorStore init failed: %s", exc)
            self._available = False

    # ── Public API ────────────────────────────────────────────────────────────

    @property
    def available(self) -> bool:
        return self._available

    def count(self) -> int:
        if not self._available:
            return 0
        return self._col.count()

    def upsert(self, chunks: list[dict[str, Any]]) -> None:
        """Insert or update chunks. Each chunk must have: id, text, + metadata fields."""
        if not self._available or not chunks:
            return
        try:
            self._col.upsert(
                ids=[c["id"] for c in chunks],
                documents=[c["text"] for c in chunks],
                metadatas=[
                    {k: v for k, v in c.items() if k not in ("id", "text")}
                    for c in chunks
                ],
            )
        except Exception as exc:
            logger.error("VectorStore upsert failed: %s", exc)

    def search(
        self,
        query: str,
        n_results: int = 8,
        where: dict | None = None,
    ) -> list[dict[str, Any]]:
        """
        Semantic search. Returns list of hits sorted by relevance.
        Each hit: {text, title, url, connector, source_id, score}
        """
        if not self._available or self._col.count() == 0:
            return []
        try:
            n = min(n_results, self._col.count())
            kwargs: dict[str, Any] = {"query_texts": [query], "n_results": n}
            if where:
                kwargs["where"] = where

            res = self._col.query(**kwargs)
            hits = []
            for doc, meta, dist in zip(
                res["documents"][0],
                res["metadatas"][0],
                res["distances"][0],
            ):
                # cosine distance → similarity (higher = more relevant)
                score = 1.0 - dist
                hits.append({
                    "text": doc,
                    "title": meta.get("title", ""),
                    "url": meta.get("url", ""),
                    "connector": meta.get("connector", ""),
                    "source_id": meta.get("source_id", ""),
                    "score": round(score, 4),
                })
            return hits
        except Exception as exc:
            logger.warning("VectorStore search failed: %s", exc)
            return []

    def delete_by_connector(self, connector_name: str) -> None:
        """Remove all chunks belonging to a specific connector."""
        if not self._available:
            return
        try:
            self._col.delete(where={"connector": connector_name})
            logger.info("Deleted chunks for connector=%s", connector_name)
        except Exception as exc:
            logger.warning("Delete failed for connector=%s: %s", connector_name, exc)

    def list_docs(
        self,
        connector: str | None = None,
        limit: int = 200,
        offset: int = 0,
    ) -> dict[str, Any]:
        """
        Return unique documents (first chunk only) with metadata.
        Optionally filter by connector name.
        """
        if not self._available:
            return {"total": 0, "docs": []}
        try:
            where = {"chunk_idx": 0}
            if connector:
                where = {"$and": [{"chunk_idx": 0}, {"connector": connector}]}
            result = self._col.get(
                where=where,
                include=["metadatas", "documents"],
                limit=limit,
                offset=offset,
            )
            docs = []
            for meta, doc in zip(result["metadatas"], result["documents"]):
                docs.append({
                    "title":         meta.get("title", ""),
                    "connector":     meta.get("connector", ""),
                    "url":           meta.get("url", ""),
                    "content_type":  meta.get("content_type", ""),
                    "last_modified": meta.get("last_modified", ""),
                    "total_chunks":  meta.get("total_chunks", 1),
                    "preview":       doc[:300],
                })
            return {"total": len(docs), "docs": docs}
        except Exception as exc:
            logger.warning("list_docs failed: %s", exc)
            return {"total": 0, "docs": []}

    def stats(self) -> dict[str, Any]:
        if not self._available:
            return {"available": False, "total_chunks": 0}
        return {"available": True, "total_chunks": self._col.count()}
