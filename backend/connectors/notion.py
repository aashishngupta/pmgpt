"""Notion connector — fetches pages via Notion API v1."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from backend.connectors.base import BaseConnector

logger = logging.getLogger("pmgpt.connectors.notion")

NOTION_API = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


class NotionConnector(BaseConnector):
    name = "notion"

    def _validate_config(self) -> None:
        if not self.config.get("api_key"):
            logger.warning("Notion connector: missing 'api_key'")

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.config.get('api_key', '')}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
        }

    async def fetch(self, query: str, **kwargs: Any) -> list[dict[str, Any]]:
        """Search Notion pages and fetch full block content for each result."""
        url = f"{NOTION_API}/search"
        payload: dict[str, Any] = {
            "query": query,
            "filter": {"value": "page", "property": "object"},
            "page_size": kwargs.get("max_results", 10),
        }
        # Optional: filter by last_edited_time for incremental sync
        modified_since: str | None = kwargs.get("modified_since")
        if modified_since:
            payload["filter"] = {
                "and": [
                    {"value": "page", "property": "object"},
                    {"timestamp": "last_edited_time", "last_edited_time": {"after": modified_since}},
                ]
            }

        async with httpx.AsyncClient(headers=self._headers, timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            pages = resp.json().get("results", [])

            # Fetch block content for each page in parallel
            results = []
            for page in pages:
                page_id = page.get("id", "")
                content = await self._fetch_blocks(client, page_id)
                results.append(self._normalize(page, content))

        return results

    async def _fetch_blocks(self, client: httpx.AsyncClient, page_id: str) -> str:
        """Recursively fetch and flatten all text blocks from a Notion page."""
        texts: list[str] = []
        cursor: str | None = None

        while True:
            params: dict[str, Any] = {"page_size": 100}
            if cursor:
                params["start_cursor"] = cursor
            try:
                resp = await client.get(
                    f"{NOTION_API}/blocks/{page_id}/children", params=params
                )
                if resp.status_code != 200:
                    break
                data = resp.json()
            except Exception:
                break

            for block in data.get("results", []):
                text = self._block_to_text(block)
                if text:
                    texts.append(text)

            if not data.get("has_more"):
                break
            cursor = data.get("next_cursor")

        return "\n".join(texts)

    def _block_to_text(self, block: dict[str, Any]) -> str:
        """Extract plain text from a single Notion block."""
        btype = block.get("type", "")
        TEXT_TYPES = {
            "paragraph", "heading_1", "heading_2", "heading_3",
            "bulleted_list_item", "numbered_list_item", "quote",
            "callout", "toggle", "to_do",
        }
        if btype in TEXT_TYPES:
            items = (block.get(btype) or {}).get("rich_text", [])
            return "".join(t.get("plain_text", "") for t in items)
        if btype == "code":
            items = (block.get("code") or {}).get("rich_text", [])
            lang = (block.get("code") or {}).get("language", "")
            code = "".join(t.get("plain_text", "") for t in items)
            return f"```{lang}\n{code}\n```" if code else ""
        if btype == "table_row":
            cells = (block.get("table_row") or {}).get("cells", [])
            row = " | ".join(
                "".join(t.get("plain_text", "") for t in cell) for cell in cells
            )
            return row
        return ""

    def _normalize(self, page: dict[str, Any], content: str = "") -> dict[str, Any]:
        props = page.get("properties", {})

        def text_from(prop: dict) -> str:
            items = prop.get("title") or prop.get("rich_text") or []
            return "".join(t.get("plain_text", "") for t in items)

        title = ""
        for prop in props.values():
            if prop.get("type") == "title":
                title = text_from(prop)
                break

        return {
            "id": page.get("id", ""),
            "title": title,
            "content": content,
            "created_time": page.get("created_time", ""),
            "last_edited_time": page.get("last_edited_time", ""),
            "url": page.get("url", ""),
        }

    async def health_check(self) -> bool:
        url = f"{NOTION_API}/users/me"
        try:
            async with httpx.AsyncClient(headers=self._headers, timeout=5.0) as client:
                resp = await client.get(url)
                return resp.status_code == 200
        except Exception as exc:
            logger.error("Notion health check failed: %s", exc)
            return False

    def field_schema(self) -> dict[str, str]:
        return {
            "id": "public",
            "title": "internal",
            "content": "internal",
            "created_by": "confidential",
            "last_edited_by": "confidential",
            "created_time": "public",
            "last_edited_time": "public",
            "url": "public",
        }
