"""Review agent — PM career tools, job description review, interview prep."""

from __future__ import annotations

import logging
from typing import Any

from backend.agents.base import BaseAgent

logger = logging.getLogger("pmgpt.agents.review")

SYSTEM_PROMPT = """You are a senior Product Management career coach with experience hiring and mentoring PMs.
You help with:
- Reviewing and improving PM resumes and LinkedIn profiles
- Analyzing job descriptions and identifying key requirements
- Preparing for PM interviews (STAR stories, case studies, product critiques)
- Writing cover letters tailored to specific PM roles
- Conducting mock product sense and estimation interviews
- Identifying skill gaps and growth opportunities
- Evaluating product portfolios and project case studies

Be constructive, specific, and actionable. Provide concrete examples and suggestions."""


class ReviewAgent(BaseAgent):
    name = "review"
    description = "PM career tools, job review, resume and interview prep"

    async def run(self, query: str, user_role: str, **kwargs: Any) -> str:
        governance = self._governance()
        context: dict[str, Any] = {"query": query}

        # Pass any additional content (resume text, JD, etc.) from kwargs
        for key in ("resume", "job_description", "portfolio"):
            if key in kwargs:
                context[key] = kwargs[key]

        response = await self.router.call(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=query,
            context=context,
            governance=governance,
            connector=None,
            agent=self.name,
            user_role=user_role,
        )
        return response
