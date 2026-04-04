"""
LLM Router — selects and calls the right LLM based on governance routing path.

Three paths (set by GovernanceEngine.routing_path()):
  external_llm  → ExternalLLM (Anthropic Claude API)  — public data only
  local_llm     → LocalLLM (Ollama)                   — internal/confidential
  template_only → no LLM call at all                  — restricted data
"""

from __future__ import annotations

import logging
from typing import Any

import yaml

from backend.core.classifier import SensitivityLevel
from backend.core.governance import (
    LLM_PATH_EXTERNAL,
    LLM_PATH_LOCAL,
    LLM_PATH_TEMPLATE,
    GovernanceEngine,
)
from backend.llm.external import ExternalLLM
from backend.llm.local import LocalLLM

logger = logging.getLogger("pmgpt.llm.router")


class LLMRouter:
    def __init__(self, config_path: str = "pmgpt.config.yaml") -> None:
        with open(config_path) as f:
            config = yaml.safe_load(f)

        llm_cfg = config.get("llm", {})
        self._external = ExternalLLM(llm_cfg.get("external", {}))
        self._local = LocalLLM(llm_cfg.get("local", {}))

    async def call(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        context: dict[str, Any],
        governance: GovernanceEngine,
        connector: str | None = None,
        agent: str = "unknown",
        user_role: str = "pm",
    ) -> str:
        """
        Full round-trip:
          1. Governance prepares context (masks/tokenizes as needed).
          2. Routes to correct LLM or template renderer.
          3. Re-injects real values into the response.
          4. Emits audit log entry.
        """
        # Remove the raw query key from context before classification —
        # it is always passed directly as user_prompt, so classifying it
        # as a data field would incorrectly force every query to the local LLM.
        classifiable_ctx = {k: v for k, v in context.items() if k != "query"}

        if classifiable_ctx:
            safe_ctx, llm_path = governance.prepare_context(classifiable_ctx, connector)
            max_level = governance.classifier.max_level(classifiable_ctx, connector)
        else:
            # No connector data — treat as public, use external LLM
            safe_ctx = {}
            llm_path = LLM_PATH_EXTERNAL
            max_level = SensitivityLevel.PUBLIC

        governance.log_event(
            event="llm_call",
            user_role=user_role,
            agent=agent,
            llm_path=llm_path,
            max_sensitivity=max_level,
        )

        if llm_path == LLM_PATH_TEMPLATE:
            logger.info("Template-only path for restricted data (agent=%s)", agent)
            return self._render_template(safe_ctx)

        # Inject safe context into user prompt
        if safe_ctx:
            ctx_str = "\n".join(f"{k}: {v}" for k, v in safe_ctx.items())
            full_user_prompt = f"{user_prompt}\n\nContext:\n{ctx_str}"
        else:
            full_user_prompt = user_prompt

        try:
            if llm_path == LLM_PATH_EXTERNAL:
                raw_response = await self._external.complete(system_prompt, full_user_prompt)
            else:  # local_llm
                raw_response = await self._local.complete(system_prompt, full_user_prompt)
        except Exception as exc:
            logger.error("LLM call failed (path=%s): %s", llm_path, exc)
            if llm_path == LLM_PATH_LOCAL:
                return (
                    "**Local LLM unavailable** — Ollama is not running or unreachable at "
                    f"`{self._local.base_url}`.\n\n"
                    "To fix: `ollama serve` then `ollama pull mistral`"
                )
            return f"**LLM error:** {exc}"

        # Re-inject real values (detokenize)
        return governance.reinject(raw_response)

    def _render_template(self, context: dict[str, Any]) -> str:
        """Minimal template renderer for restricted data — no LLM involved."""
        lines = ["**Restricted data — rendered without LLM**\n"]
        for key, value in context.items():
            lines.append(f"**{key}**: {value}")
        return "\n".join(lines)

    async def health_check(self) -> dict[str, bool]:
        return {
            "local_llm": await self._local.health_check(),
            "external_llm": True,  # Anthropic API has no cheap health endpoint
        }
