"""
Connector registry — auto-discovers and loads connectors from config.

How discovery works:
  1. Reads `connectors.enabled` list from pmgpt.config.yaml.
  2. For each name, imports `backend.connectors.<name>` and finds the
     subclass of BaseConnector whose `.name` attribute matches.
  3. Instantiates it with the resolved config (env vars expanded).
  4. Registers the instance under its name.
"""

from __future__ import annotations

import importlib
import inspect
import logging
import os
from typing import Any

import yaml

from backend.connectors.base import BaseConnector

logger = logging.getLogger("pmgpt.registry")


def _resolve_env_vars(connector_cfg: dict[str, Any]) -> dict[str, Any]:
    """Replace *_env keys with the actual environment variable values."""
    resolved: dict[str, Any] = {}
    for key, value in connector_cfg.items():
        if key.endswith("_env") and isinstance(value, str):
            env_val = os.environ.get(value, "")
            real_key = key[: -len("_env")]
            resolved[real_key] = env_val
        else:
            resolved[key] = value
    return resolved


class ConnectorRegistry:
    def __init__(self, config_path: str = "pmgpt.config.yaml") -> None:
        with open(config_path) as f:
            self._config = yaml.safe_load(f)

        self._connectors: dict[str, BaseConnector] = {}
        self._load_connectors()

    def _load_connectors(self) -> None:
        connectors_cfg = self._config.get("connectors", {})
        enabled: list[str] = connectors_cfg.get("enabled", [])

        for name in enabled:
            try:
                module = importlib.import_module(f"backend.connectors.{name}")
            except ModuleNotFoundError:
                logger.warning("Connector module not found: backend.connectors.%s", name)
                continue

            # Find the BaseConnector subclass in the module
            cls = None
            for _, obj in inspect.getmembers(module, inspect.isclass):
                if (
                    issubclass(obj, BaseConnector)
                    and obj is not BaseConnector
                    and obj.name == name
                ):
                    cls = obj
                    break

            if cls is None:
                logger.warning(
                    "No BaseConnector subclass with name=%r found in module %s",
                    name,
                    module.__name__,
                )
                continue

            raw_cfg = connectors_cfg.get(name, {})
            resolved_cfg = _resolve_env_vars(raw_cfg)

            try:
                instance = cls(resolved_cfg)
                self._connectors[name] = instance
                logger.info("Loaded connector: %s", name)
            except Exception as exc:
                logger.error("Failed to instantiate connector %s: %s", name, exc)

    def get(self, name: str) -> BaseConnector | None:
        return self._connectors.get(name)

    def all(self) -> dict[str, BaseConnector]:
        return dict(self._connectors)

    async def health_check_all(self) -> dict[str, bool]:
        results: dict[str, bool] = {}
        for name, connector in self._connectors.items():
            try:
                results[name] = await connector.health_check()
            except Exception as exc:
                logger.error("Health check failed for %s: %s", name, exc)
                results[name] = False
        return results
