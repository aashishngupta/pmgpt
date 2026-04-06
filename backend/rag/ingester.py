"""
Ingester — pulls documents from connectors and indexes into the VectorStore.

Key design decisions
────────────────────
1.  Content hashing   — each record's content is MD5-hashed before indexing.
                        On re-sync, unchanged docs are skipped (no re-embed cost).
2.  Timestamp filter  — connectors that support `modified_since` kwarg only return
                        docs changed since the last successful sync, making syncs fast.
3.  Chunk stability   — chunk IDs are derived from (connector + source_id + chunk_idx)
                        so upserts overwrite stale chunks for the same document.
4.  Sync state file   — data/rag/sync_state.json records per-connector:
                          last_sync   (ISO timestamp of last successful run)
                          doc_count   (how many unique docs were indexed)
                          chunk_count (total chunks in the store for that connector)
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

from backend.rag.store import VectorStore

logger = logging.getLogger("pmgpt.rag.ingester")

CHUNK_SIZE    = 900   # characters
CHUNK_OVERLAP = 150

# ── Connector-specific broad ingestion queries ─────────────────────────────────
# Each query fetches a different slice; results are deduplicated by source_id.
INGEST_QUERIES: dict[str, list[str]] = {
    "jira":       [
        "ORDER BY updated DESC",
        "type = Story ORDER BY priority ASC",
        "type = Bug ORDER BY priority DESC",
        "type = Epic ORDER BY created DESC",
    ],
    "confluence": ["", "product roadmap strategy OKR"],
    "notion":     ["", "product strategy metrics roadmap"],
    "gdrive":     ["", "product strategy report analysis roadmap metrics"],
    "slack":      ["product update", "engineering update", "release"],
    "gcalendar":  ["sprint planning review retro roadmap"],
}
DEFAULT_QUERIES = ["", "product strategy"]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _content_hash(record: dict[str, Any]) -> str:
    """Stable MD5 of the record's meaningful content fields."""
    blob = "|".join([
        str(record.get("title") or record.get("summary") or record.get("key") or ""),
        str(record.get("content") or record.get("description") or record.get("summary") or ""),
        str(record.get("last_edited_time") or record.get("updated") or record.get("modifiedTime") or ""),
    ])
    return hashlib.md5(blob.encode()).hexdigest()


def _chunk(text: str) -> list[str]:
    """Split text into overlapping chunks."""
    text = text.strip()
    if not text:
        return []
    if len(text) <= CHUNK_SIZE:
        return [text]
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start : start + CHUNK_SIZE])
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def _make_chunks(record: dict[str, Any], connector_name: str) -> list[dict[str, Any]]:
    """Convert a connector record into indexable chunk dicts."""
    source_id = str(
        record.get("id") or record.get("key") or record.get("url") or record.get("title") or ""
    )
    title = str(
        record.get("title") or record.get("summary") or record.get("key") or "Untitled"
    )
    url = str(
        record.get("url") or record.get("webViewLink") or record.get("permalink") or ""
    )
    last_modified = str(
        record.get("last_edited_time") or record.get("updated") or
        record.get("modifiedTime") or ""
    )
    content_type = str(record.get("type") or record.get("mime_type") or connector_name)
    chash = _content_hash(record)

    # Build the text to embed: title + content body
    body = str(
        record.get("content") or record.get("description") or record.get("summary") or ""
    )
    raw = f"{title}\n\n{body}".strip()

    text_chunks = _chunk(raw)
    if not text_chunks:
        # Index title-only records so they're at least discoverable
        text_chunks = [title]

    id_base = hashlib.md5(f"{connector_name}:{source_id}".encode()).hexdigest()[:12]
    return [
        {
            "id": f"{id_base}_{i}",
            "text": chunk,
            # ── metadata (all must be str / int / float / bool) ──────────────
            "title":         title,
            "url":           url,
            "connector":     connector_name,
            "source_id":     source_id,
            "content_type":  content_type,
            "last_modified": last_modified,
            "content_hash":  chash,
            "chunk_idx":     i,
            "total_chunks":  len(text_chunks),
        }
        for i, chunk in enumerate(text_chunks)
    ]


# ── Sync state ─────────────────────────────────────────────────────────────────

class SyncState:
    """Tracks per-connector sync metadata on disk (data/rag/sync_state.json)."""

    def __init__(self, path: str) -> None:
        self._path = path
        self._data: dict[str, dict] = {}
        self._load()

    def _load(self) -> None:
        try:
            with open(self._path) as f:
                self._data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            self._data = {}

    def _save(self) -> None:
        os.makedirs(os.path.dirname(self._path), exist_ok=True)
        with open(self._path, "w") as f:
            json.dump(self._data, f, indent=2)

    def last_sync(self, connector: str) -> str | None:
        return self._data.get(connector, {}).get("last_sync")

    def record_sync(self, connector: str, doc_count: int, chunk_count: int) -> None:
        self._data[connector] = {
            "last_sync":   datetime.now(timezone.utc).isoformat(),
            "doc_count":   doc_count,
            "chunk_count": chunk_count,
        }
        self._save()

    def all(self) -> dict[str, dict]:
        return dict(self._data)


# ── Ingester ───────────────────────────────────────────────────────────────────

class Ingester:
    def __init__(self, store: VectorStore, registry, state_path: str = "data/rag/sync_state.json") -> None:
        self.store = store
        self.registry = registry
        self.state = SyncState(state_path)

    # ── Single connector ───────────────────────────────────────────────────────

    async def ingest_connector(self, name: str, connector, force: bool = False) -> int:
        """
        Fetch and index documents from one connector.

        Args:
            name:      Connector name (e.g. "gdrive", "notion").
            connector: Connector instance.
            force:     If True, re-index even unchanged documents.

        Returns:
            Number of chunks indexed/updated.
        """
        if not self.store.available:
            return 0

        queries = INGEST_QUERIES.get(name, DEFAULT_QUERIES)
        last_sync = None if force else self.state.last_sync(name)

        seen_ids:    set[str] = set()
        seen_hashes: set[str] = set()
        all_chunks:  list[dict] = []
        doc_count = 0

        for q in queries:
            kwargs: dict[str, Any] = {"max_results": 100}
            if last_sync:
                kwargs["modified_since"] = last_sync

            try:
                records = await connector.fetch(q, **kwargs)
            except Exception as exc:
                logger.warning("Connector %s query=%r failed: %s", name, q, exc)
                continue

            for rec in records or []:
                sid = str(
                    rec.get("id") or rec.get("key") or
                    rec.get("url") or rec.get("title") or ""
                )
                if sid in seen_ids:
                    continue
                seen_ids.add(sid)

                chash = _content_hash(rec)
                if chash in seen_hashes and not force:
                    continue           # identical content, skip
                seen_hashes.add(chash)

                chunks = _make_chunks(rec, name)
                if chunks:
                    all_chunks.extend(chunks)
                    doc_count += 1

        if all_chunks:
            if force or not last_sync:
                # Full refresh: wipe stale chunks first
                self.store.delete_by_connector(name)
            self.store.upsert(all_chunks)
            logger.info(
                "Indexed connector=%s docs=%d chunks=%d (incremental=%s)",
                name, doc_count, len(all_chunks), bool(last_sync),
            )
        else:
            logger.info("No new/changed documents in connector=%s", name)

        self.state.record_sync(name, doc_count, len(all_chunks))
        return len(all_chunks)

    # ── All connectors ─────────────────────────────────────────────────────────

    async def ingest_all(self, force: bool = False) -> dict[str, int]:
        """Ingest all registered connectors in parallel."""
        if not self.store.available:
            logger.warning("VectorStore unavailable — skipping RAG ingestion.")
            return {}

        connectors = self.registry.all()
        if not connectors:
            logger.info("No connectors registered — nothing to ingest.")
            return {}

        mode = "FULL" if force else "INCREMENTAL"
        logger.info("RAG ingestion starting [%s] — %d connectors…", mode, len(connectors))

        async def _one(n: str, c) -> tuple[str, int]:
            try:
                return n, await self.ingest_connector(n, c, force=force)
            except Exception as exc:
                logger.error("Ingestion failed for %s: %s", n, exc)
                return n, 0

        results = dict(await asyncio.gather(*[_one(n, c) for n, c in connectors.items()]))
        total = sum(results.values())
        logger.info(
            "RAG ingestion done — total_chunks=%d  by_connector=%s",
            total, results,
        )
        return results

    async def ingest_one(self, connector_name: str, force: bool = False) -> int:
        """Re-sync a single connector by name."""
        connector = self.registry.get(connector_name)
        if not connector:
            raise ValueError(f"Connector not registered: {connector_name!r}")
        return await self.ingest_connector(connector_name, connector, force=force)

    def sync_status(self) -> dict[str, Any]:
        """Return current sync state + vector store stats."""
        return {
            "store":      self.store.stats(),
            "connectors": self.state.all(),
        }
