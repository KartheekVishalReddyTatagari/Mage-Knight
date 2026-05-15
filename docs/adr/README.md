# Architecture Decision Records

ADRs capture a single architectural decision, its context, and its consequences. They are append-only: an ADR is never edited after acceptance — if a decision changes, a new ADR supersedes it.

Format: Michael Nygard short-form (Context / Decision / Consequences) — see [`0000-template.md`](0000-template.md).

## Index

| # | Title | Status |
|---|---|---|
| [0001](0001-server-authoritative-game-logic.md) | Server-authoritative game logic | Accepted |
| [0002](0002-python-fastapi-server-stack.md) | Python + FastAPI for the server | Accepted |
| [0003](0003-data-driven-content-packs.md) | Data-driven content packs (JSON) | Accepted |
| [0004](0004-single-writer-session-queue.md) | Single-writer queue per session | Accepted |
| [0005](0005-action-log-as-source-of-truth.md) | Action log as source of truth | Accepted |
| [0006](0006-rest-plus-websocket-transport.md) | REST + WebSocket transport | Accepted |
| [0007](0007-shared-schemas-pydantic-openapi.md) | Shared schemas via Pydantic + OpenAPI | Accepted |
