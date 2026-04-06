"""
BaseConnector — plugin interface for all data source connectors.

To add a new connector:
  1. Subclass BaseConnector
  2. Implement fetch(), health_check(), and field_schema()
  3. Register the connector name in pmgpt.config.yaml under connectors.enabled
  4. Place the module in backend/connectors/ — the registry auto-discovers it
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseConnector(ABC):
    """Abstract base class for all pmGPT data connectors."""

    # Subclasses must set this to match the key in pmgpt.config.yaml
    name: str = ""

    def __init__(self, config: dict[str, Any]) -> None:
        """
        Args:
            config: The connector's section from pmgpt.config.yaml,
                    with environment variables already resolved.
        """
        self.config = config
        self._validate_config()

    def _validate_config(self) -> None:
        """Override to validate required config keys on startup."""

    @abstractmethod
    async def fetch(self, query: str, **kwargs: Any) -> list[dict[str, Any]]:
        """
        Fetch records relevant to the given query.

        Returns:
            List of record dicts. Field names must match field_schema() keys.
        """

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True if the connector can reach its upstream service."""

    @abstractmethod
    def field_schema(self) -> dict[str, str]:
        """
        Return a mapping of field_name → sensitivity_level for this connector.
        Example: {"summary": "internal", "assignee": "confidential"}

        This is used by the classifier as a runtime override if not defined
        in pmgpt.config.yaml.
        """

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.name!r}>"
