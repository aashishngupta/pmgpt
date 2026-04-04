"""RBAC role definitions and permission checking."""

from __future__ import annotations

from typing import Any

import yaml

ROLE_HIERARCHY = ["viewer", "pm", "pm_lead", "admin"]


class RBACManager:
    def __init__(self, config_path: str = "pmgpt.config.yaml") -> None:
        with open(config_path) as f:
            config = yaml.safe_load(f)

        self._roles: dict[str, dict[str, Any]] = (
            config.get("rbac", {}).get("roles", {})
        )

    def _rank(self, role: str) -> int:
        try:
            return ROLE_HIERARCHY.index(role)
        except ValueError:
            return -1

    def has_agent_access(self, role: str, agent: str) -> bool:
        role_cfg = self._roles.get(role, {})
        allowed: list[str] = role_cfg.get("agents", [])
        return "*" in allowed or agent in allowed

    def has_connector_access(self, role: str, connector: str) -> bool:
        role_cfg = self._roles.get(role, {})
        allowed: list[str] = role_cfg.get("connectors", [])
        return "*" in allowed or connector in allowed

    def max_classification(self, role: str) -> str:
        role_cfg = self._roles.get(role, {})
        return role_cfg.get("max_classification", "public")

    def role_exists(self, role: str) -> bool:
        return role in self._roles

    def is_at_least(self, role: str, min_role: str) -> bool:
        return self._rank(role) >= self._rank(min_role)
