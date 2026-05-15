# ADR-0002: Python + FastAPI for the Server

- **Status:** Accepted
- **Date:** 2026-05-15
- **SRS refs:** §2.4 (Linux container deploy), §5.3, NFR-PERF-04/05, NFR-MAINT-01..05, NFR-PORT-02

## Context

The SRS does not mandate a server language. It requires deployability to Linux container orchestration (Kubernetes / Nomad), a versioned REST + WebSocket API, ≥ 500 concurrent sessions per instance, ≥ 80 % unit-test coverage on rules, and automated CI/CD. The candidates considered were Node.js + TypeScript, Python + FastAPI, and Java + Spring Boot.

The rules engine is the architecturally critical component (§6.1, §6.2). It must be expressive, easy to test, and easy to read for the assignment review. The transport layer must be async to meet latency targets (NFR-PERF-01).

## Decision

The server is implemented in **Python 3.12+ with FastAPI** for the transport layer.

Stack components:
- **FastAPI** — REST + native WebSocket support, async, OpenAPI generated from route definitions (NFR-MAINT-03).
- **Pydantic v2** — schema validation for all wire messages (NFR-SEC-03) and content packs.
- **SQLAlchemy 2.0 + Alembic** — ORM and migrations for Postgres.
- **redis-py (asyncio)** — Redis client for session store.
- **passlib[argon2]** — Argon2id password hashing (NFR-SEC-02).
- **python-jose** — JWT access + refresh tokens.
- **structlog** — structured logging (NFR-OBS-01).
- **OpenTelemetry SDK** — traces + metrics (NFR-OBS-02/03).
- **pytest + pytest-asyncio + hypothesis** — testing.
- **uvicorn** behind **gunicorn** workers in production.

## Consequences

### Positive
- Clean syntax for the rules engine — easy to read and reason about during architecture review.
- Pydantic provides one schema definition that doubles as wire validator, OpenAPI source, and JSON-Schema export for client-type generation (see ADR-0007).
- Hypothesis enables property-based testing of invariants (card-count conservation, etc.) — a strong fit for a rules engine.
- Large ecosystem for AI heuristics (numpy, networkx) when implementing FR-AI-01..04.
- FastAPI's async stack handles WebSocket fan-out well within the 200 ms p95 budget.

### Negative / Trade-offs
- Python is slower per-CPU-cycle than Node or JVM languages. Mitigated by: state lives in Redis (not Python), rules engine is pure data manipulation (no heavy compute), and we scale horizontally (NFR-SCALE-01).
- Schemas live in Python; the React client needs a TypeScript representation. Solved in ADR-0007 by generating TS types from the exported JSON Schema.
- GIL limits true parallelism per worker process. Mitigated by running multiple uvicorn workers (gunicorn) and CPU-bound work being negligible.

### Neutral
- The web client remains React + TypeScript regardless — no realistic alternative for the browser SPA.

## Alternatives Considered

### Option A — Node.js + TypeScript
Same language across stack; native JSON. **Rejected:** user prefers Python; rules-engine code reads less cleanly; no property-based testing library as mature as Hypothesis.

### Option B — Java + Spring Boot
Strong typing, JVM performance, enterprise-grade. **Rejected:** heavy scaffolding slows iteration; WebSocket support is solid but more verbose; tests are slower to write; doesn't match user preference.

### Option C — Go
Excellent concurrency, fast. **Rejected:** type system is too thin for expressive domain modeling; smaller property-based testing ecosystem; user did not select.

## References
- SRS §5.3, §6.1, NFR-MAINT-01..05
- ADR-0007 (shared schemas)
