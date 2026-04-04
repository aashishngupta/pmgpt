"""Slack connector — fetches messages via Slack Web API."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from backend.connectors.base import BaseConnector

logger = logging.getLogger("pmgpt.connectors.slack")

SLACK_API = "https://slack.com/api"


class SlackConnector(BaseConnector):
    name = "slack"

    def _validate_config(self) -> None:
        if not self.config.get("bot_token"):
            logger.warning("Slack connector: missing 'bot_token'")

    @property
    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.config.get('bot_token', '')}"}

    async def fetch(self, query: str, **kwargs: Any) -> list[dict[str, Any]]:
        """
        Search Slack messages for query string.

        Args:
            query: Plain text search query
        """
        url = f"{SLACK_API}/search.messages"
        params = {"query": query, "count": kwargs.get("max_results", 20)}
        async with httpx.AsyncClient(headers=self._headers, timeout=15.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        if not data.get("ok"):
            logger.error("Slack API error: %s", data.get("error"))
            return []

        messages = data.get("messages", {}).get("matches", [])
        return [self._normalize(m) for m in messages]

    def _normalize(self, msg: dict[str, Any]) -> dict[str, Any]:
        return {
            "message_text": msg.get("text", ""),
            "user_id": msg.get("user", ""),
            "user_name": msg.get("username", ""),
            "channel": (msg.get("channel") or {}).get("name", ""),
            "timestamp": msg.get("ts", ""),
            "permalink": msg.get("permalink", ""),
        }

    async def health_check(self) -> bool:
        url = f"{SLACK_API}/auth.test"
        try:
            async with httpx.AsyncClient(headers=self._headers, timeout=5.0) as client:
                resp = await client.post(url)
                data = resp.json()
                return bool(data.get("ok"))
        except Exception as exc:
            logger.error("Slack health check failed: %s", exc)
            return False

    def field_schema(self) -> dict[str, str]:
        return {
            "message_text": "internal",
            "user_id": "confidential",
            "user_name": "confidential",
            "channel": "internal",
            "timestamp": "public",
            "permalink": "public",
        }
