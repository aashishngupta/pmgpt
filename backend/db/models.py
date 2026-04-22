"""SQLAlchemy ORM models."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str]           = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str]        = mapped_column(String, unique=True, nullable=False, index=True)
    name: Mapped[str]         = mapped_column(String, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # null for OAuth users
    auth_provider: Mapped[str] = mapped_column(String, default="email")  # email | google
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    is_active: Mapped[bool]   = mapped_column(Boolean, default=True)

    memberships: Mapped[List[WorkspaceMember]] = relationship("WorkspaceMember", back_populates="user")


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str]           = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str]         = mapped_column(String, nullable=False)
    slug: Mapped[str]         = mapped_column(String, unique=True, nullable=False, index=True)
    industry: Mapped[Optional[str]]   = mapped_column(String, nullable=True)
    company_size: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    plan: Mapped[str]         = mapped_column(String, default="free")  # free | pro | enterprise
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    members: Mapped[List[WorkspaceMember]] = relationship("WorkspaceMember", back_populates="workspace")
    memory: Mapped[Optional[WorkspaceMemory]] = relationship("WorkspaceMemory", back_populates="workspace", uselist=False)
    threads: Mapped[List[AgentThread]]     = relationship("AgentThread", back_populates="workspace")


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id: Mapped[str]            = mapped_column(String, primary_key=True, default=_uuid)
    workspace_id: Mapped[str]  = mapped_column(String, ForeignKey("workspaces.id"), nullable=False)
    user_id: Mapped[str]       = mapped_column(String, ForeignKey("users.id"), nullable=False)
    role: Mapped[str]          = mapped_column(String, default="pm")  # admin | pm_lead | pm | engineer | viewer
    joined_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped[User]           = relationship("User", back_populates="memberships")
    workspace: Mapped[Workspace] = relationship("Workspace", back_populates="members")


class WorkspaceMemory(Base):
    """~300 token context injected into every agent call for this workspace."""
    __tablename__ = "workspace_memory"

    id: Mapped[str]           = mapped_column(String, primary_key=True, default=_uuid)
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id"), unique=True)
    company: Mapped[Optional[str]]  = mapped_column(Text, nullable=True)
    product: Mapped[Optional[str]]  = mapped_column(Text, nullable=True)
    team: Mapped[Optional[str]]     = mapped_column(Text, nullable=True)
    sprint: Mapped[Optional[str]]   = mapped_column(Text, nullable=True)
    okrs: Mapped[Optional[str]]     = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    workspace: Mapped[Workspace] = relationship("Workspace", back_populates="memory")

    def to_context(self) -> str:
        """Render as compact string for LLM injection (~300 tokens)."""
        parts = []
        if self.company:  parts.append(f"Company: {self.company}")
        if self.product:  parts.append(f"Product: {self.product}")
        if self.team:     parts.append(f"Team: {self.team}")
        if self.sprint:   parts.append(f"Sprint: {self.sprint}")
        if self.okrs:     parts.append(f"OKRs: {self.okrs}")
        return "\n".join(parts)


class AgentThread(Base):
    """A persistent chat session — like a GPT Project."""
    __tablename__ = "agent_threads"

    id: Mapped[str]           = mapped_column(String, primary_key=True, default=_uuid)
    workspace_id: Mapped[str] = mapped_column(String, ForeignKey("workspaces.id"), nullable=False)
    user_id: Mapped[str]      = mapped_column(String, ForeignKey("users.id"), nullable=False)
    agent_id: Mapped[str]     = mapped_column(String, nullable=False)  # strategy | docs | analytics ...
    title: Mapped[str]        = mapped_column(String, default="New conversation")
    status: Mapped[str]       = mapped_column(String, default="draft")  # draft | published | archived
    artifact_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # prd | ticket | release_notes ...
    external_id: Mapped[Optional[str]]   = mapped_column(String, nullable=True)  # Jira key / Notion page ID
    created_at: Mapped[datetime]      = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime]      = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    workspace: Mapped[Workspace]  = relationship("Workspace", back_populates="threads")
    messages: Mapped[List[Message]] = relationship("Message", back_populates="thread", order_by="Message.created_at")
    artifact_memory: Mapped[Optional[ArtifactMemory]] = relationship("ArtifactMemory", back_populates="thread", uselist=False)


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str]         = mapped_column(String, primary_key=True, default=_uuid)
    thread_id: Mapped[str]  = mapped_column(String, ForeignKey("agent_threads.id"), nullable=False)
    role: Mapped[str]       = mapped_column(String, nullable=False)   # user | assistant
    content: Mapped[str]    = mapped_column(Text, nullable=False)
    agent_used: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime]   = mapped_column(DateTime, server_default=func.now())

    thread: Mapped[AgentThread] = relationship("AgentThread", back_populates="messages")


class AgentConfig(Base):
    """Per-workspace agent configuration — overrides defaults set in config.yaml."""
    __tablename__ = "agent_configs"

    id: Mapped[str]            = mapped_column(String, primary_key=True, default=_uuid)
    workspace_id: Mapped[str]  = mapped_column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    agent_id: Mapped[str]      = mapped_column(String, nullable=False)  # strategy | docs | analytics ...
    enabled: Mapped[bool]      = mapped_column(Boolean, default=True)
    llm: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    temperature: Mapped[Optional[float]]  = mapped_column(nullable=True)
    max_tokens: Mapped[Optional[int]]     = mapped_column(nullable=True)
    min_role: Mapped[Optional[str]]       = mapped_column(String, nullable=True)
    memory_enabled: Mapped[bool]          = mapped_column(Boolean, default=True)
    system_prompt: Mapped[Optional[str]]  = mapped_column(Text, nullable=True)
    behaviors: Mapped[Optional[str]]      = mapped_column(Text, nullable=True)   # JSON
    personality: Mapped[Optional[str]]    = mapped_column(Text, nullable=True)   # JSON
    connectors: Mapped[Optional[str]]     = mapped_column(Text, nullable=True)   # JSON array
    updated_at: Mapped[datetime]          = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class Alert(Base):
    """Proactive agent-generated alerts surfaced on the home screen."""
    __tablename__ = "alerts"

    id: Mapped[str]            = mapped_column(String, primary_key=True, default=_uuid)
    workspace_id: Mapped[str]  = mapped_column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    source_agent: Mapped[str]  = mapped_column(String, nullable=False)
    alert_type: Mapped[str]    = mapped_column(String, nullable=False)  # blocker | anomaly | competitive | review_needed | digest
    title: Mapped[str]         = mapped_column(String, nullable=False)
    body: Mapped[str]          = mapped_column(Text, nullable=False)
    action_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    action_label: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    dismissed: Mapped[bool]    = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ArtifactMemory(Base):
    """~800 token structured memory generated when an artifact is published."""
    __tablename__ = "artifact_memory"

    id: Mapped[str]          = mapped_column(String, primary_key=True, default=_uuid)
    thread_id: Mapped[str]   = mapped_column(String, ForeignKey("agent_threads.id"), unique=True)
    artifact_type: Mapped[str]   = mapped_column(String)   # prd | ticket | release_notes ...
    title: Mapped[str]           = mapped_column(String)
    summary: Mapped[str]         = mapped_column(Text)
    decisions: Mapped[str]       = mapped_column(Text)     # JSON array of decision strings
    open_questions: Mapped[str]  = mapped_column(Text)     # JSON array
    key_context: Mapped[str]     = mapped_column(Text)     # JSON array
    external_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime]    = mapped_column(DateTime, server_default=func.now())

    thread: Mapped[AgentThread] = relationship("AgentThread", back_populates="artifact_memory")

    def to_context(self) -> str:
        """Render as compact string for LLM injection (~800 tokens)."""
        import json
        decisions = json.loads(self.decisions or "[]")
        questions = json.loads(self.open_questions or "[]")
        context   = json.loads(self.key_context or "[]")
        parts = [
            f"Artifact: {self.artifact_type} — {self.title}",
            f"Summary: {self.summary}",
        ]
        if decisions:
            parts.append("Decisions made:\n" + "\n".join(f"- {d}" for d in decisions))
        if questions:
            parts.append("Open questions:\n" + "\n".join(f"- {q}" for q in questions))
        if context:
            parts.append("Key context:\n" + "\n".join(f"- {c}" for c in context))
        return "\n".join(parts)
