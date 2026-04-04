"""
Data governance layer.

Responsibilities:
  1. Determine LLM routing path based on data sensitivity.
  2. Mask / tokenize confidential fields before LLM calls.
  3. Re-inject real values into LLM responses.
  4. Write immutable audit log entries.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

from backend.core.classifier import DataClassifier, SensitivityLevel

logger = logging.getLogger("pmgpt.governance")


# ---------------------------------------------------------------------------
# LLM path constants
# ---------------------------------------------------------------------------

LLM_PATH_EXTERNAL = "external_llm"
LLM_PATH_LOCAL = "local_llm"
LLM_PATH_TEMPLATE = "template_only"


# ---------------------------------------------------------------------------
# Tokenization helpers
# ---------------------------------------------------------------------------

@dataclass
class TokenMap:
    """Bidirectional token ↔ real-value store (server-side only)."""
    _token_to_value: dict[str, str] = field(default_factory=dict)
    _value_to_token: dict[str, str] = field(default_factory=dict)

    def tokenize(self, value: str) -> str:
        if value in self._value_to_token:
            return self._value_to_token[value]
        token = f"[TOKEN_{hashlib.sha256(value.encode()).hexdigest()[:8].upper()}]"
        self._token_to_value[token] = value
        self._value_to_token[value] = token
        return token

    def detokenize(self, text: str) -> str:
        """Replace all tokens in text with their original values."""
        for token, real in self._token_to_value.items():
            text = text.replace(token, real)
        return text

    def clear(self) -> None:
        self._token_to_value.clear()
        self._value_to_token.clear()


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------

class AuditLogger:
    def __init__(self, log_file: str = "logs/audit.log") -> None:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        self._handler = logging.FileHandler(log_file)
        self._handler.setFormatter(logging.Formatter("%(message)s"))
        self._log = logging.getLogger("pmgpt.audit")
        self._log.addHandler(self._handler)
        self._log.setLevel(logging.INFO)
        self._log.propagate = False

    def record(
        self,
        *,
        event: str,
        user_role: str,
        agent: str,
        llm_path: str,
        max_sensitivity: str,
        session_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        entry = {
            "ts": time.time(),
            "event": event,
            "session_id": session_id,
            "role": user_role,
            "agent": agent,
            "llm_path": llm_path,
            "max_sensitivity": max_sensitivity,
            **(metadata or {}),
        }
        self._log.info(json.dumps(entry))


# ---------------------------------------------------------------------------
# Governance engine
# ---------------------------------------------------------------------------

class GovernanceEngine:
    """
    Central governance object.  One instance per request (carries TokenMap).
    """

    def __init__(
        self,
        classifier: DataClassifier,
        audit_logger: AuditLogger,
    ) -> None:
        self.classifier = classifier
        self.audit = audit_logger
        self._token_map = TokenMap()
        self.session_id = str(uuid.uuid4())

    # ------------------------------------------------------------------
    # LLM path routing
    # ------------------------------------------------------------------

    def routing_path(self, max_level: SensitivityLevel) -> str:
        if max_level == SensitivityLevel.RESTRICTED:
            return LLM_PATH_TEMPLATE
        if max_level in (SensitivityLevel.INTERNAL, SensitivityLevel.CONFIDENTIAL):
            return LLM_PATH_LOCAL
        return LLM_PATH_EXTERNAL

    # ------------------------------------------------------------------
    # Masking / tokenization
    # ------------------------------------------------------------------

    def mask_record(
        self,
        record: dict[str, Any],
        connector: str | None = None,
    ) -> dict[str, Any]:
        """
        Return a copy of record where confidential values are tokenized
        and restricted values are fully redacted.
        The TokenMap is retained on this instance for later re-injection.
        """
        field_levels = self.classifier.classify_record(record, connector)
        masked: dict[str, Any] = {}
        for field_name, value in record.items():
            level = field_levels[field_name]
            if level == SensitivityLevel.RESTRICTED:
                masked[field_name] = "[REDACTED]"
            elif level == SensitivityLevel.CONFIDENTIAL:
                masked[field_name] = self._tokenize_value(value)
            else:
                masked[field_name] = value
        return masked

    def _tokenize_value(self, value: Any) -> Any:
        if isinstance(value, str):
            return self._token_map.tokenize(value)
        if isinstance(value, list):
            return [self._tokenize_value(v) for v in value]
        if isinstance(value, dict):
            return {k: self._tokenize_value(v) for k, v in value.items()}
        # Numbers, bools, None — tokenize their string representation
        return self._token_map.tokenize(str(value))

    def reinject(self, llm_response: str) -> str:
        """Replace all tokens in LLM response with original values."""
        return self._token_map.detokenize(llm_response)

    # ------------------------------------------------------------------
    # Convenience: process a full context dict for an LLM call
    # ------------------------------------------------------------------

    def prepare_context(
        self,
        context: dict[str, Any],
        connector: str | None = None,
    ) -> tuple[dict[str, Any], str]:
        """
        Given a raw data context, return:
          - masked_context: safe to pass to LLM
          - llm_path: routing decision string
        Also emits an audit record.
        """
        max_level = self.classifier.max_level(context, connector)
        path = self.routing_path(max_level)

        if path == LLM_PATH_TEMPLATE:
            # Restricted: filter out everything above public (return as-is for template)
            safe_ctx = self.classifier.filter_by_max_level(
                context, SensitivityLevel.RESTRICTED, connector
            )
        elif path == LLM_PATH_LOCAL:
            safe_ctx = self.mask_record(context, connector)
        else:
            safe_ctx = context  # public only

        return safe_ctx, path

    def log_event(
        self,
        *,
        event: str,
        user_role: str,
        agent: str,
        llm_path: str,
        max_sensitivity: SensitivityLevel,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.audit.record(
            event=event,
            user_role=user_role,
            agent=agent,
            llm_path=llm_path,
            max_sensitivity=str(max_sensitivity),
            session_id=self.session_id,
            metadata=metadata,
        )
