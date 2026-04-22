"""Database setup — SQLAlchemy + SQLite (swap DB_URL for Postgres in prod)."""
from __future__ import annotations

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DB_URL = os.environ.get("DATABASE_URL", "sqlite:///./data/pmgpt.db")

# SQLite needs check_same_thread=False for async usage
connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}

engine = create_engine(DB_URL, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables on startup."""
    import backend.db.models  # noqa: F401 — registers models with Base
    os.makedirs("data", exist_ok=True)
    Base.metadata.create_all(bind=engine)
