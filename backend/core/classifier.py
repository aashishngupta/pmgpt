"""
Data sensitivity classifier.

Levels (ascending sensitivity):
  public       → safe for external LLM (Claude API)
  internal     → local LLM only (Ollama)
  confidential → tokenized before local LLM, re-injected after
  restricted   → never sent to any LLM, template rendering only

Unknown fields default to "confidential" (fail-safe, not fail-open).
"""

from __future__ import annotations

from enum import IntEnum
from typing import Any

import yaml


class SensitivityLevel(IntEnum):
    PUBLIC = 0
    INTERNAL = 1
    CONFIDENTIAL = 2
    RESTRICTED = 3

    @classmethod
    def from_str(cls, value: str) -> "SensitivityLevel":
        mapping = {
            "public": cls.PUBLIC,
            "internal": cls.INTERNAL,
            "confidential": cls.CONFIDENTIAL,
            "restricted": cls.RESTRICTED,
        }
        return mapping.get(value.lower(), cls.CONFIDENTIAL)  # fail safe

    def __str__(self) -> str:
        return self.name.lower()


class DataClassifier:
    """
    Classifies data fields based on pmgpt.config.yaml rules.
    Connector-specific field schemas take precedence over defaults.
    """

    DEFAULT_LEVEL = SensitivityLevel.CONFIDENTIAL  # fail safe

    def __init__(self, config_path: str = "pmgpt.config.yaml") -> None:
        with open(config_path) as f:
            config = yaml.safe_load(f)

        raw_default = config.get("data_classification", {}).get(
            "default_level", "confidential"
        )
        self.default_level = SensitivityLevel.from_str(raw_default)

        # Build field-level lookup per connector:
        # { "jira": { "summary": INTERNAL, "assignee": CONFIDENTIAL, ... } }
        self._connector_schemas: dict[str, dict[str, SensitivityLevel]] = {}
        connectors_cfg = config.get("connectors", {})
        for connector_name, connector_cfg in connectors_cfg.items():
            if connector_name == "enabled":
                continue
            if not isinstance(connector_cfg, dict):
                continue
            raw_fields: dict[str, str] = connector_cfg.get("field_classifications", {})
            self._connector_schemas[connector_name] = {
                field: SensitivityLevel.from_str(level)
                for field, level in raw_fields.items()
            }

    def classify_field(
        self, field_name: str, connector: str | None = None
    ) -> SensitivityLevel:
        """Return the sensitivity level for a single field."""
        if connector and connector in self._connector_schemas:
            schema = self._connector_schemas[connector]
            if field_name in schema:
                return schema[field_name]
            # Unknown field in known connector → default (fail safe)
            return self.default_level
        return self.default_level

    def classify_record(
        self, record: dict[str, Any], connector: str | None = None
    ) -> dict[str, SensitivityLevel]:
        """Return a field→level mapping for an entire record."""
        return {
            field: self.classify_field(field, connector) for field in record
        }

    def max_level(
        self, record: dict[str, Any], connector: str | None = None
    ) -> SensitivityLevel:
        """Return the highest sensitivity level found in a record."""
        levels = self.classify_record(record, connector).values()
        return max(levels, default=self.default_level)

    def filter_by_max_level(
        self,
        record: dict[str, Any],
        max_allowed: SensitivityLevel,
        connector: str | None = None,
    ) -> dict[str, Any]:
        """Return only fields at or below max_allowed level."""
        field_levels = self.classify_record(record, connector)
        return {
            field: value
            for field, value in record.items()
            if field_levels[field] <= max_allowed
        }
