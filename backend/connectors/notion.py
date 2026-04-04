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
        """Search Notion pages for the given query."""
        url = f"{NOTION_API}/search"
        payload = {
            "query": query,
            "filter": {"value": "page", "property": "object"},
            "page_size": kwargs.get("max_results", 10),
        }
        async with httpx.AsyncClient(headers=self._headers, timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        return [self._normalize(page) for page in data.get("results", [])]

    def _normalize(self, page: dict[str, Any]) -> dict[str, Any]:
        props = page.get("properties", {})

        def text_from(prop: dict) -> str:
            items = prop.get("title") or prop.get("rich_text") or []
            return "".join(t.get("plain_text", "") for t in items)

        title = ""
        for prop in props.values():
            if prop.get("type") == "title":
                title = text_from(prop)
                break

        created_by = page.get("created_by") or {}
        last_edited_by = page.get("last_edited_by") or {}

        return {
            "id": page.get("id", ""),
            "title": title,
            "content": "",  # full content requires separate block fetch
            "created_by": created_by.get("id", ""),
            "last_edited_by": last_edited_by.get("id", ""),
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
