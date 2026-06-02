"""
FastAPI server entry point.

HOW TO RUN (after installing dependencies):
  uvicorn src.main:app --reload --port 8000

Then open: http://localhost:8000/docs  ← auto-generated API documentation!
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.infrastructure.database import Base, engine
from src.infrastructure import models  # noqa: F401 — registers ORM classes with Base
from src.transport.auth import router as auth_router
from src.transport.sessions import router as sessions_router
from src.transport.ws_gateway import router as ws_router

# ─────────────────────────────────────────────────────────────────────────────
# APP CREATION
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Mage Knight Online",
    description="Server-authoritative backend for Mage Knight Online",
    version="0.1.0",
)

# Create SQLite tables on first boot (no migrations needed for dev)
Base.metadata.create_all(bind=engine)

# ─────────────────────────────────────────────────────────────────────────────
# CORS  (allows the browser on localhost:5173 to talk to us)
# ─────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

app.include_router(auth_router,     prefix="/api/auth",     tags=["auth"])
app.include_router(sessions_router, prefix="/api/sessions", tags=["sessions"])
app.include_router(ws_router,       prefix="/ws",           tags=["websocket"])


@app.get("/healthz")
async def health_check():
    """Kubernetes liveness probe — just returns OK."""
    return {"status": "ok"}


@app.get("/readyz")
async def readiness_check():
    """
    Kubernetes readiness probe.
    TODO: check that database + Redis connections are alive.
    """
    # TODO: ping db and redis, return 503 if either is down
    return {"status": "ready"}
