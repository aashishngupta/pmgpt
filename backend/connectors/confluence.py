"""Confluence connector — fetches pages via Confluence REST API v1."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from backend.connectors.base import BaseConnector

logger = logging.getLogger("pmgpt.connectors.confluence")


class ConfluenceConnector(BaseConnector):
    name = "confluence"

    def _validate_config(self) -> None:
        for key in ("base_url", "username", "api_token"):
            if not self.config.get(key):
                logger.warning("Confluence connector: missing config key '%s'", key)

    @property
    def _auth(self) -> httpx.BasicAuth:
        return httpx.BasicAuth(
            self.config.get("username", ""),
            self.config.get("api_token", ""),
        )

    @property
    def _base(self) -> str:
        return self.config.get("base_url", "").rstrip("/")

    async def fetch(self, query: str, **kwargs: Any) -> list[dict[str, Any]]:
        """Search Confluence pages by CQL query or plain text."""
        url = f"{self._base}/rest/api/content/search"
        params = {
            "cql": f'text ~ "{query}" AND type = page',
            "limit": kwargs.get("max_results", 10),
            "expand": "body.storage,version,space",
        }
        async with httpx.AsyncClient(auth=self._auth, timeout=15.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        return [self._normalize(page) for page in data.get("results", [])]

    def _normalize(self, page: dict[str, Any]) -> dict[str, Any]:
        version = page.get("version") or {}
        space = page.get("space") or {}
        body = (page.get("body") or {}).get("storage") or {}
        author = version.get("by") or {}

        return {
            "id": page.get("id", ""),
            "title": page.get("title", ""),
            "body": body.get("value", ""),
            "author": author.get("displayName", ""),
            "space": space.get("name", ""),
            "created": page.get("history", {}).get("createdDate", ""),
            "updated": version.get("when", ""),
            "url": f"{self._base}/wiki{page.get('_links', {}).get('webui', '')}",
        }

    async def health_check(self) -> bool:
        url = f"{self._base}/rest/api/space"
        try:
            async with httpx.AsyncClient(auth=self._auth, timeout=5.0) as client:
                resp = await client.get(url)
                return resp.status_code == 200
        except Exception as exc:
            logger.error("Confluence health check failed: %s", exc)
            return False

    def field_schema(self) -> dict[str, str]:
        return {
            "id": "public",
            "title": "internal",
            "body": "internal",
            "author": "confidential",
            "space": "public",
            "created": "public",
            "updated": "public",
            "url": "public",
        }
