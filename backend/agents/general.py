"""General agent — searches internal repos first, answers directly."""

from __future__ import annotations

import logging
from typing import Any

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.general")

# Used when internal documents were found
SYSTEM_WITH_INTERNAL = """You are a direct, knowledgeable assistant for a product team.

Internal documents from the team's connected repositories have been retrieved and are included below as numbered references [1], [2], etc.

Instructions:
- Answer the question using the internal documents as your primary source.
- Cite document references inline: e.g. "According to our Q3 strategy doc [1], ..."
- If the internal docs don't fully answer the question, say so clearly and supplement with general knowledge.
- Be concise — lead with the answer, not a preamble.
- Do NOT fabricate document content not present in the context.
- Use markdown tables or bullets only when they genuinely help."""

# Used when no internal documents matched
SYSTEM_NO_INTERNAL = """You are a direct, knowledgeable assistant for a product team.

You searched the user's connected internal repositories (Google Drive, Confluence, Notion, Jira, Slack) but found no relevant documents for this query.

Instructions:
- Begin your response with exactly this line (formatted as a callout):
  > **No internal documents found** — I searched your connected repositories but couldn't find relevant content for this query.
- Then answer the question directly from your general knowledge.
- End with this line exactly:
  > *Want me to broaden the search to public sources, or try rephrasing?*
- Be concise. Do NOT force product management framing if the question doesn't need it.
- No filler phrases or padding."""


class GeneralAgent(BaseAgent):
    name = "general"
    description = "Searches internal repos first, then answers from general knowledge"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> tuple[str, list[dict]]:
        governance = self._governance()

        # Step 1 — retrieve from vector store (RAG) or live connectors
        connector_context, sources = await self._retrieve(query, n_results=8)

        has_internal = bool(connector_context)

        # Step 2 — build LLM context
        context: dict[str, Any] = {"query": query, **connector_context}

        # Step 3 — pick system prompt based on whether we found internal docs
        system_prompt = SYSTEM_WITH_INTERNAL if has_internal else SYSTEM_NO_INTERNAL

        # Determine which connector drove the response (first one with results)
        connector_name: str | None = (
            next(iter(connector_context)).replace("_docs", "") if has_internal else None
        )

        response = await self.router.call(
            system_prompt=system_prompt,
            user_prompt=query,
            context=context,
            governance=governance,
            connector=connector_name,
            agent=self.name,
            user_role=user_role,
            llm_mode=kwargs.get("llm_mode"),
            history=kwargs.get("history"),
        )
        return response, sources
