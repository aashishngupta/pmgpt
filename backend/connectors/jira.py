"""Jira connector — fetches issues via the Jira REST API v3."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from backend.connectors.base import BaseConnector

logger = logging.getLogger("pmgpt.connectors.jira")


class JiraConnector(BaseConnector):
    name = "jira"

    def _validate_config(self) -> None:
        for key in ("base_url", "username", "api_token"):
            if not self.config.get(key):
                logger.warning("Jira connector: missing config key '%s'", key)

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
        """
        Fetch Jira issues matching a JQL query.

        Args:
            query: JQL string, e.g. 'project = MYPROJ AND sprint in openSprints()'
        """
        url = f"{self._base}/rest/api/3/search"
        params = {
            "jql": query,
            "maxResults": kwargs.get("max_results", 50),
            "fields": "summary,description,assignee,reporter,status,priority,created,updated,comment",
        }

        async with httpx.AsyncClient(auth=self._auth, timeout=15.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        issues = data.get("issues", [])
        return [self._normalize(issue) for issue in issues]

    def _normalize(self, issue: dict[str, Any]) -> dict[str, Any]:
        fields = issue.get("fields", {})
        assignee = fields.get("assignee") or {}
        reporter = fields.get("reporter") or {}
        status = fields.get("status") or {}
        priority = fields.get("priority") or {}
        comments_raw = (fields.get("comment") or {}).get("comments", [])

        return {
            "key": issue.get("key", ""),
            "summary": fields.get("summary", ""),
            "description": fields.get("description", ""),
            "assignee": assignee.get("displayName", ""),
            "reporter": reporter.get("displayName", ""),
            "status": status.get("name", ""),
            "priority": priority.get("name", ""),
            "created": fields.get("created", ""),
            "updated": fields.get("updated", ""),
            "comments": [
                {
                    "author": (c.get("author") or {}).get("displayName", ""),
                    "body": c.get("body", ""),
                    "created": c.get("created", ""),
                }
                for c in comments_raw
            ],
        }

    async def health_check(self) -> bool:
        url = f"{self._base}/rest/api/3/myself"
        try:
            async with httpx.AsyncClient(auth=self._auth, timeout=5.0) as client:
                resp = await client.get(url)
                return resp.status_code == 200
        except Exception as exc:
            logger.error("Jira health check failed: %s", exc)
            return False

    def field_schema(self) -> dict[str, str]:
        return {
            "key": "public",
            "summary": "internal",
            "description": "internal",
            "assignee": "confidential",
            "reporter": "confidential",
            "status": "public",
            "priority": "public",
            "created": "public",
            "updated": "public",
            "comments": "confidential",
        }
