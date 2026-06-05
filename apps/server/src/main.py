"""
FastAPI server entry point.

HOW TO RUN:
  cd apps/server
  uvicorn src.main:app --reload --port 8000

Then open: http://localhost:8000/docs
"""
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text as _text

from src.application.auth_service import pwd_context as _pwd
from src.infrastructure.database import Base, engine
from src.infrastructure import models  # noqa: F401
from src.transport.auth import router as auth_router
from src.transport.sessions import router as sessions_router
from src.transport.admin import router as admin_router

app = FastAPI(
    title="Mage Knight Online",
    description="Local backend for Mage Knight",
    version="0.2.0",
)

Base.metadata.create_all(bind=engine)

# Safe migration: add is_admin column to databases that predate it
with engine.connect() as _conn:
    try:
        _conn.execute(_text("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"))
        _conn.commit()
    except Exception:
        pass  # column already exists

# Seed / sync default admin account (admin@gmail.com / admin123)
_ADMIN_HASH = _pwd.hash("admin123")
with engine.connect() as _conn:
    _exists = _conn.execute(_text("SELECT id FROM users WHERE email='admin@gmail.com'")).fetchone()
    if not _exists:
        _conn.execute(_text(
            "INSERT INTO users (id, email, username, password_hash, is_admin) "
            "VALUES (:id, :email, :username, :hash, 1)"
        ), {"id": str(uuid.uuid4()), "email": "admin@gmail.com",
            "username": "admin", "hash": _ADMIN_HASH})
    else:
        # Always sync password so changing it here takes effect immediately
        _conn.execute(_text(
            "UPDATE users SET password_hash=:hash, is_admin=1 WHERE email='admin@gmail.com'"
        ), {"hash": _ADMIN_HASH})
    _conn.commit()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,     prefix="/api/auth",     tags=["auth"])
app.include_router(sessions_router, prefix="/api/sessions", tags=["sessions"])
app.include_router(admin_router,    prefix="/api/admin",    tags=["admin"])


@app.get("/healthz")
async def health():
    return {"status": "ok"}
