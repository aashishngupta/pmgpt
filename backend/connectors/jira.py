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
        key = issue.get("key", "")
        assignee = fields.get("assignee") or {}
        reporter = fields.get("reporter") or {}
        status = fields.get("status") or {}
        priority = fields.get("priority") or {}
        comments_raw = (fields.get("comment") or {}).get("comments", [])
        issue_type = (fields.get("issuetype") or {}).get("name", "")

        return {
            "key": key,
            "title": fields.get("summary", ""),      # alias for ingester
            "summary": fields.get("summary", ""),
            "description": self._adf_to_text(fields.get("description")),
            "content": self._adf_to_text(fields.get("description")),  # alias for ingester
            "type": issue_type,
            "assignee": assignee.get("displayName", ""),
            "reporter": reporter.get("displayName", ""),
            "status": status.get("name", ""),
            "priority": priority.get("name", ""),
            "created": fields.get("created", ""),
            "updated": fields.get("updated", ""),
            "url": f"{self._base}/browse/{key}",   # direct link to the issue
            "comments": [
                {
                    "author": (c.get("author") or {}).get("displayName", ""),
                    "body": self._adf_to_text(c.get("body")),
                    "created": c.get("created", ""),
                }
                for c in comments_raw
            ],
        }

    def _adf_to_text(self, node: Any, depth: int = 0) -> str:
        """
        Recursively extract plain text from Atlassian Document Format (ADF) JSON.
        Falls back gracefully if the description is already a plain string.
        """
        if not node:
            return ""
        if isinstance(node, str):
            return node
        if not isinstance(node, dict):
            return ""

        ntype = node.get("type", "")
        text = node.get("text", "")

        # Leaf text node
        if text:
            return text

        parts: list[str] = []
        for child in node.get("content", []):
            child_text = self._adf_to_text(child, depth + 1)
            if child_text:
                parts.append(child_text)

        # Add appropriate separators based on block type
        sep = "\n" if ntype in ("paragraph", "heading", "bulletList", "orderedList",
                                "listItem", "blockquote", "codeBlock", "rule") else " "
        return sep.join(parts)

    async def create_issue(
        self,
        project_key: str,
        summary: str,
        description: str,
        issue_type: str = "Epic",
        priority: str = "Medium",
        labels: list[str] | None = None,
    ) -> dict[str, Any]:
        """Create a Jira issue and return its key and URL."""
        url = f"{self._base}/rest/api/3/issue"
        body: dict[str, Any] = {
            "fields": {
                "project": {"key": project_key},
                "summary": summary,
                "issuetype": {"name": issue_type},
                "priority": {"name": priority},
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": description}],
                        }
                    ],
                },
            }
        }
        if labels:
            body["fields"]["labels"] = labels

        async with httpx.AsyncClient(auth=self._auth, timeout=15.0) as client:
            resp = await client.post(url, json=body)
            resp.raise_for_status()
            data = resp.json()

        key = data.get("key", "")
        return {"key": key, "url": f"{self._base}/browse/{key}", "id": data.get("id", "")}

    async def get_projects(self) -> list[dict[str, Any]]:
        """Return list of accessible Jira projects."""
        url = f"{self._base}/rest/api/3/project/search"
        async with httpx.AsyncClient(auth=self._auth, timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
        return [{"key": p["key"], "name": p["name"]} for p in data.get("values", [])]

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
