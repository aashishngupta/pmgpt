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

# Rolling summary thresholds
VERBATIM_TURNS = 8   # keep this many recent messages verbatim (4 exchanges)
SUMMARY_PROMPT = (
    "Summarise the following conversation excerpt in 120 words or fewer. "
    "Preserve key decisions, facts, named entities, and any explicit user preferences. "
    "Write in third-person past tense, e.g. 'The user asked about... The assistant explained...'. "
    "Output only the summary — no preamble."
)


class LLMRouter:
    def __init__(self, config_path: str = "pmgpt.config.yaml") -> None:
        with open(config_path) as f:
            config = yaml.safe_load(f)

        llm_cfg = config.get("llm", {})
        self._external = ExternalLLM(llm_cfg.get("external", {}))
        self._local = LocalLLM(llm_cfg.get("local", {}))

    async def _compress_history(self, history: list[dict]) -> tuple[str, list[dict]]:
        """
        If history exceeds VERBATIM_TURNS, summarise the older portion.

        Returns:
            summary  — compact text of older turns (empty string if no compression needed)
            recent   — verbatim tail of history to pass to the LLM
        """
        if len(history) <= VERBATIM_TURNS:
            return "", history

        older  = history[:-VERBATIM_TURNS]
        recent = history[-VERBATIM_TURNS:]

        # Build a plain-text transcript of the older turns to summarise
        transcript = "\n".join(
            f"{t['role'].upper()}: {t['content'][:400]}" for t in older
        )
        try:
            summary = await self._external.complete(
                system=SUMMARY_PROMPT,
                user=transcript,
                history=None,
            )
            logger.info(
                "Conversation compressed: %d older turns → %d-word summary",
                len(older), len(summary.split()),
            )
        except Exception as exc:
            logger.warning("History compression failed: %s — using truncated history", exc)
            summary = ""
            recent = history[-VERBATIM_TURNS:]

        return summary.strip(), recent

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
        llm_mode: str | None = None,
        history: list[dict] | None = None,
    ) -> str:
        """
        Full round-trip:
          1. Governance prepares context (masks/tokenizes as needed).
          2. Routes to correct LLM or template renderer.
          3. Re-injects real values into the response.
          4. Emits audit log entry.
        """
        # ── Rolling conversation summary ───────────────────────────────────────
        active_history: list[dict] = []
        if history:
            conv_summary, active_history = await self._compress_history(history)
            if conv_summary:
                system_prompt = (
                    system_prompt
                    + f"\n\n---\nEarlier in this conversation:\n{conv_summary}\n---"
                )

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

        # User-selected LLM mode overrides governance routing
        if llm_mode == "external":
            llm_path = LLM_PATH_EXTERNAL
        elif llm_mode == "local":
            llm_path = LLM_PATH_LOCAL

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
                raw_response = await self._external.complete(
                    system_prompt, full_user_prompt, history=active_history
                )
            else:  # local_llm
                raw_response = await self._local.complete(
                    system_prompt, full_user_prompt, history=active_history
                )
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
