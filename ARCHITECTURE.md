# Mage Knight Online — Architecture

> Companion to `Mage_Knight_Online_SRS.pdf` (v1.0 Draft, May 2026).
> This document records *how* the system is structured to satisfy the SRS. Decisions are recorded as ADRs under [`docs/adr/`](docs/adr/).

---

## 1. Architectural Drivers

The architecture is shaped by these top-priority quality attributes from the SRS:

| Driver | Source | Implication |
|---|---|---|
| **Rule integrity / fairness** | SRS §2.5, §6.2, FR-COMB-04, NFR-SEC-03 | Server is the single source of truth; client is untrusted. |
| **Testability of rules** | NFR-MAINT-02 (≥ 80 % unit coverage) | Rules engine is pure (no I/O), separated from transport and persistence. |
| **Horizontal scalability** | NFR-SCALE-01..03, NFR-PERF-04/05 | Backend instances are stateless; session state lives in a replicated store. |
| **Resilience** | NFR-REL-03 (zero session loss on failure) | Action log + snapshots enable replay-based recovery. |
| **Maintainability of game content** | NFR-MAINT-04 | Cards, enemies, tiles, scenarios are data, not code. |
| **Security** | NFR-SEC-01..08 | TLS everywhere; schema + state validation on every inbound message; per-player view filtering. |

---

## 2. Layered Structure

The system follows a strict layered architecture. Higher layers depend on lower; lower layers know nothing about higher.

```
┌──────────────────────────────────────────────────────────────┐
│  Presentation Layer       (React SPA — apps/web)             │
│  • Renders authoritative state                               │
│  • Submits intents                                           │
└──────────────────────────────────────────────────────────────┘
                          ▲    ▼   HTTPS / WSS  (JSON)
┌──────────────────────────────────────────────────────────────┐
│  Transport Layer          (FastAPI routers, WS gateway)      │
│  • REST endpoints, WebSocket gateway                         │
│  • Schema validation (Pydantic), auth, rate limits           │
│  • Per-player view filtering (NFR-SEC-04)                    │
└──────────────────────────────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────┐
│  Application Layer        (use-case services)                │
│  • Session lifecycle, lobby, matchmaking                     │
│  • Auth, profile, progression services                       │
│  • Coordinates rules engine with persistence + transport     │
└──────────────────────────────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────┐
│  Domain Layer             (PURE rules engine)                │
│  • applyAction(state, action) → (state', events) | error     │
│  • No I/O. No randomness (RNG is injected).                  │
│  • 100 % deterministic. Reused by server + AI.               │
└──────────────────────────────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────┐
│  Infrastructure Layer     (adapters)                         │
│  • Postgres (accounts, progression, action log, replays)     │
│  • Redis (active session state, pub/sub for fan-out)         │
│  • Content-pack loader (JSON catalogues)                     │
│  • Observability (OTEL, Prom metrics, structured logs)       │
└──────────────────────────────────────────────────────────────┘
```

Maps to SRS §6.1 (layered, service-oriented) and NFR-MAINT-01.

---

## 3. Repository Layout

```
Mage-Knight/
├─ ARCHITECTURE.md                  # this file
├─ Mage_Knight_Online_SRS.pdf       # source of truth
├─ docs/
│  ├─ adr/                          # Architecture Decision Records
│  │  ├─ 0000-template.md
│  │  ├─ 0001-server-authoritative-game-logic.md
│  │  ├─ 0002-python-fastapi-server-stack.md
│  │  ├─ 0003-data-driven-content-packs.md
│  │  ├─ 0004-single-writer-session-queue.md
│  │  ├─ 0005-action-log-as-source-of-truth.md
│  │  ├─ 0006-rest-plus-websocket-transport.md
│  │  └─ 0007-shared-schemas-pydantic-openapi.md
│  └─ REQUIREMENTS_TRACEABILITY.md  # FR/NFR → component mapping
├─ apps/
│  ├─ server/                       # FastAPI application
│  │  ├─ src/
│  │  │  ├─ transport/              # routers, ws gateway, middleware
│  │  │  ├─ application/            # use-case services
│  │  │  ├─ infrastructure/         # db, redis, content loader, telemetry
│  │  │  └─ main.py
│  │  ├─ tests/
│  │  └─ pyproject.toml
│  └─ web/                          # React + TS + Vite SPA
│     ├─ src/
│     │  ├─ pages/                  # /login, /lobby, /game, /profile
│     │  ├─ features/               # board, hand, combat, chat
│     │  ├─ net/                    # REST + WS clients, generated types
│     │  └─ main.tsx
│     └─ package.json
├─ packages/
│  ├─ rules/                        # pure Python rules engine (no I/O)
│  │  ├─ src/mk_rules/
│  │  │  ├─ state.py                # immutable state types
│  │  │  ├─ actions.py              # action types (discriminated union)
│  │  │  ├─ engine.py               # apply_action(state, action) -> result
│  │  │  ├─ combat.py
│  │  │  ├─ movement.py
│  │  │  └─ deck.py
│  │  └─ tests/                     # unit + property-based (hypothesis)
│  ├─ shared/                       # Pydantic schemas shared by app + transport
│  └─ content/                      # data-driven JSON content packs
│     ├─ cards/
│     ├─ enemies/
│     ├─ tiles/
│     └─ scenarios/
├─ infra/
│  ├─ docker-compose.yml            # local dev: server + postgres + redis
│  ├─ Dockerfile.server
│  ├─ Dockerfile.web
│  └─ k8s/                          # production manifests
└─ .github/workflows/               # CI/CD (lint, typecheck, test, build, deploy)
```

---

## 4. Component Catalogue (server side)

| Component | Layer | Responsibility | Key SRS refs |
|---|---|---|---|
| **`packages/rules`** | Domain | Pure rules engine: `apply_action`. Stateless. Receives RNG as a parameter. | FR-COMB-*, FR-CARD-*, FR-WORLD-05/06, FR-AI-01, NFR-MAINT-02/04 |
| **`SessionService`** | Application | Create/join/leave/resume sessions; matchmaking. | FR-SES-01..07 |
| **`SessionActor`** | Application | One in-memory single-writer queue per session. Serializes actions → calls rules engine → persists log → broadcasts deltas. | §6.5, FR-MP-01/02 |
| **`AuthService`** | Application | Register, login, refresh, password reset, rate limiting. | FR-AUTH-01..06, NFR-SEC-02/06 |
| **`ProgressionService`** | Application | Lifetime stats, achievements, ranking. | FR-PROG-05, FR-CUST-04 |
| **`AIPlayer`** | Application | Wraps rules engine; selects actions within decision-time budget. | FR-AI-01..04 |
| **`ContentLoader`** | Infrastructure | Loads versioned JSON content packs at startup. Hot-reloadable. | NFR-MAINT-04, §6.6 |
| **`SessionStore`** (Redis) | Infrastructure | Active session state, addressable by session ID. Replicated. | NFR-SCALE-02, NFR-REL-03, §6.3 |
| **`Repository`** (Postgres) | Infrastructure | Accounts, progression, action log, snapshots, audit. | FR-SES-04/07, NFR-REL-04, NFR-SEC-08 |
| **`WSGateway`** | Transport | WebSocket: authenticate, join session, deliver per-player-filtered deltas, receive intents. | FR-MP-01..03, NFR-SEC-04, §5.4 |
| **`REST routers`** | Transport | Auth, lobby, profile, scenario catalogue. OpenAPI generated. | §5.3, NFR-MAINT-03 |
| **`PerPlayerViewFilter`** | Transport | Strips hidden state from broadcasts. Tested separately. | NFR-SEC-04 |
| **`RateLimiter`** | Transport | Throttles auth and action submission. | NFR-SEC-06 |
| **`Telemetry`** | Infrastructure | OpenTelemetry traces; Prometheus metrics; structured logs. | NFR-OBS-01..04 |

---

## 5. End-to-End Action Flow

Walking through what happens when a player plays a card in combat:

```
1. Player drags card onto target in browser.
2. Web client sends WS frame:
   { v: "1.0", type: "play_card", sessionId, cardId, targetId, phase }
3. WSGateway:
   a. Authenticates the connection (JWT)
   b. Validates schema (Pydantic model for "play_card")
   c. Rate-limits per player
   d. Enqueues the intent on the session's SessionActor
4. SessionActor (single-writer):
   a. Loads current session state from Redis
   b. Calls rules.apply_action(state, action, rng)
   c. If rejected → emits error frame back to the submitter only
   d. If accepted →
      - Persists action + delta to action log (Postgres, append-only)
      - Writes new state to Redis (with TTL refresh)
      - Computes per-player views via PerPlayerViewFilter
      - Broadcasts deltas to each connected participant
5. Web client applies delta to local view; renders feedback.
```

The single-writer queue (ADR-0004) means no two actions for one session ever race. The action log (ADR-0005) means we can replay or resume any session deterministically.

---

## 6. Data Flow & Persistence

| Data | Where it lives | Retention | SRS ref |
|---|---|---|---|
| Account credentials, profile | Postgres | Until user deletion | FR-AUTH-*, §7.3 |
| Lifetime stats, achievements | Postgres | Lifetime of account | FR-PROG-05, §7.3 |
| Active session state | Redis (replicated), Postgres snapshots every N actions | Until session ends + 24 h | FR-SES-04, NFR-REL-03 |
| Action log | Postgres (append-only) | ≥ 90 days | FR-SES-07, §7.3 |
| Audit log (admin) | Postgres (tamper-evident: hash-chained) | ≥ 1 year | NFR-SEC-08, §7.3 |
| Content packs | Filesystem / OCI image | Versioned with deploy | NFR-MAINT-04 |

---

## 7. Cross-Cutting Concerns

### 7.1 Security (NFR-SEC-01..08)

- **TLS 1.2+** for both REST and WebSocket; HSTS in production.
- **Argon2id** password hashing via `passlib`.
- **JWT** access tokens (short-lived, ~15 min) + refresh tokens (rotating, server-tracked, revocable).
- **Schema validation** on every inbound message via Pydantic.
- **State validation** on every action via the rules engine before any mutation.
- **Per-player view filtering** is the *only* path from server state to the wire — there is no code path that broadcasts raw state.
- **Rate limiting**: login (per-IP and per-account), action submission (per-session-per-player), reset endpoints.
- **OWASP**: parameterized queries (SQLAlchemy); CSP headers; CSRF tokens on state-changing REST routes; output escaping is React's default.
- **Audit log** with hash-chained entries for admin actions.
- **GDPR**: account-deletion endpoint, data-export endpoint, minimal PII in logs.

### 7.2 Observability (NFR-OBS-01..04)

- **Structured logs** (JSON via `structlog` or `loguru`) with request ID + session ID context.
- **Metrics** (Prometheus): action latency histograms, session count gauges, error rates, AI decision time.
- **Traces** (OpenTelemetry): client request → REST handler → app service → Redis/Postgres spans.
- **Alerting** on SLO breaches: p95 action latency > 200 ms, error rate, AI timeouts, session-store unavailability.

### 7.3 Performance Budgets (NFR-PERF-01..06)

| Path | Budget | Tactic |
|---|---|---|
| Player action → broadcast | ≤ 200 ms p95 | Async I/O, Redis-resident state, single-writer queue avoids locks. |
| Tile reveal render | ≤ 500 ms p95 | Pre-generated content pack lookups; client side rendering cached. |
| AI decision | ≤ 3 s (Normal), ≤ 8 s (Hard) | Bounded MCTS/minimax with strict time budget. |
| Sessions / instance | ≥ 500 | Co-routine-based concurrency; sessions live in Redis, not process memory. |
| Concurrent players | ≥ 10 000 | Horizontal scale of stateless backends; load balancer. |

### 7.4 Reliability (NFR-REL-01..05)

- **Stateless backends** → any instance serves any session.
- **Replicated Redis** session store (Sentinel / Cluster).
- **Periodic snapshots** to Postgres (every N actions or T seconds).
- **Action-log replay** restores between snapshot and last applied action.
- **Health probes** (`/healthz`, `/readyz`) for Kubernetes.
- **Graceful degradation**: if chat or achievements service is down, gameplay still works.

---

## 8. Protocol Versioning (NFR-PORT-03)

- Every WS / REST message carries a `v` field.
- Server publishes `min_supported_version`; mismatched clients receive a clear error and a hint to refresh.
- Pydantic schemas live in `packages/shared` and emit a JSON Schema artifact per release; client TS types are generated from it (single source of truth).

---

## 9. Testing Strategy (mirrors SRS §10)

| Test type | Target | Tooling |
|---|---|---|
| Unit | Every card effect, enemy ability, rules helper | `pytest` |
| Property-based | Invariants: card-count conservation, hand-size limit, fame thresholds | `hypothesis` |
| Integration | API boundary; scripted full sessions | `pytest` + `httpx` + WS test client |
| Adversarial | Malformed / out-of-phase / forged messages | `pytest` parameterized |
| Load | NFR-PERF targets | `k6` |
| Chaos | Kill backend mid-session → confirm zero loss | scripted in CI |
| Security | OWASP Top 10 + protocol fuzz | `bandit`, `safety`, custom fuzzers |
| E2E | Browser flows | `Playwright` |

Coverage target: **≥ 80 % statement on `packages/rules`** (NFR-MAINT-02).

---

## 10. Open Questions

These need answers before Phase 2; tracked here so they don't get lost:

1. Which Postgres-flavored cloud? (Defines connection-pooling tactic.)
2. Redis: Sentinel or Cluster mode? (Affects key naming for hash-slot affinity.)
3. Federated login (OAuth) — in MVP or post?
4. Hex-rendering library: PixiJS vs Konva vs raw Canvas/SVG?
5. Localization scope at MVP — EN only, or EN + DE per NFR-USE-05?

---

## 11. Where to Look Next

- **ADRs** in [`docs/adr/`](docs/adr/) for the *why* behind each decision.
- **Traceability matrix** in [`docs/REQUIREMENTS_TRACEABILITY.md`](docs/REQUIREMENTS_TRACEABILITY.md) for FR/NFR → component mapping.
- **SRS** in `Mage_Knight_Online_SRS.pdf` for the authoritative requirements.
