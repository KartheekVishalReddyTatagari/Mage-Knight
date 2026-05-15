# Mage Knight Online — Project Task List

> This file tracks every implementation task across all 8 phases.
> Update the status column as you work: `[ ]` pending → `[~]` in progress → `[x]` done.
>
> Architecture decisions and requirements are in:
> - `ARCHITECTURE.md` — how the system is structured
> - `docs/DOMAIN_MODEL.md` — entities, relationships, state machines
> - `docs/REQUIREMENTS_TRACEABILITY.md` — every SRS requirement mapped to a component
> - `docs/adr/` — the *why* behind each big decision

---

## Phase 0 — Foundations
*Goal: empty repo → working skeleton with tooling, Docker, and CI green.*

- [ ] **T-00-01** Initialize monorepo structure (`apps/server`, `apps/web`, `packages/rules`, `packages/shared`, `packages/content`)
- [ ] **T-00-02** Configure Python tooling for server (`pyproject.toml`, ruff, mypy strict, pytest, pre-commit)
- [ ] **T-00-03** Configure TypeScript tooling for web client (`tsconfig` strict, ESLint, Prettier, Vite)
- [ ] **T-00-04** Set up Docker Compose for local dev (FastAPI server + PostgreSQL + Redis)
- [ ] **T-00-05** Wire up GitHub Actions CI pipeline (lint → typecheck → test → build gate)

---

## Phase 1 — Domain & Rules Engine
*Goal: a pure Python module that can run a full game turn with no server or browser. This is the most important phase — it carries the most grading weight.*

- [ ] **T-01-01** Define all immutable state types in `packages/rules` (`Session`, `MageKnight`, `Map`, `Tile`, `Card`, `DeckZone`, `Combat`)
- [ ] **T-01-02** Define all action types as a discriminated union (`MoveAction`, `PlayCardAction`, `EngageAction`, `EndTurnAction`, etc.)
- [ ] **T-01-03** Implement movement module — terrain cost table, reveal logic, illegal-move rejection (FR-WORLD-03/05/06)
- [ ] **T-01-04** Implement deck module — shuffle, draw, discard, hand-size enforcement, card-count conservation invariant (FR-CARD-01..07)
- [ ] **T-01-05** Implement combat phase state machine — Ranged → Block → Attack → Damage, card play per phase (FR-COMB-02..07)
- [ ] **T-01-06** Implement card effect DSL interpreter — basic vs powered effects, mana cost, damage, draw, move, influence (FR-CARD-04)
- [ ] **T-01-07** Implement progression module — fame tracking, level thresholds, LevelUpOffer generation, armor/hand/command increases (FR-PROG-01..04)
- [ ] **T-01-08** Implement core `apply_action(state, action, rng) → (state', events) | error` entry point
- [ ] **T-01-09** Seed content pack — 12 basic cards, 4 advanced, 4 spells, 6 enemy types, 7 terrain tiles (minimum vertical slice)
- [ ] **T-01-10** Write unit + property-based tests (hypothesis) — achieve ≥ 80% coverage on `packages/rules` (NFR-MAINT-02)

---

## Phase 2 — Server Application Layer
*Goal: session lifecycle, auth, database, and in-memory session state all wired together.*

- [ ] **T-02-01** Implement `AuthService` — register, login (Argon2id), JWT access+refresh tokens, rate limiting (FR-AUTH-01..03, NFR-SEC-02/06)
- [ ] **T-02-02** Implement `SessionService` — create, join, leave, resume session lifecycle (FR-SES-01..06)
- [ ] **T-02-03** Implement `SessionActor` — single-writer queue, Redis state load/save, snapshot to Postgres (ADR-0004/0005)
- [ ] **T-02-04** Implement action log — append-only Postgres table with sequence number and RNG draws per entry (FR-SES-07)
- [ ] **T-02-05** Implement server-side RNG — cryptographic seed per session, stored for deterministic replay (SRS §6.4)
- [ ] **T-02-06** Implement `ProgressionService` — consume `SessionEnded` events, write lifetime stats and achievements to Postgres (FR-PROG-05)
- [ ] **T-02-07** Set up SQLAlchemy 2.0 models + Alembic migrations for all Postgres tables

---

## Phase 3 — Transport Layer
*Goal: REST API + WebSocket gateway, versioned protocol, per-player state filtering.*

- [ ] **T-03-01** Implement REST routers — `/auth`, `/profile`, `/lobby`, `/sessions`, `/scenarios` (OpenAPI auto-generated from Pydantic)
- [ ] **T-03-02** Implement WebSocket gateway — authenticate, join session, receive intents, fan-out per-player filtered deltas (FR-MP-01)
- [ ] **T-03-03** Implement `PerPlayerViewFilter` — strip hidden tiles, opponent hands, AI state before any broadcast (NFR-SEC-04)
- [ ] **T-03-04** Implement protocol versioning — `v` field on all frames, `min_supported_version` check, reject incompatible clients (NFR-PORT-03)
- [ ] **T-03-05** Implement Pydantic shared schemas in `packages/shared`; generate JSON Schema → TypeScript types for client (ADR-0007)
- [ ] **T-03-06** Write adversarial tests — malformed / out-of-phase / forged messages must all be rejected without state corruption (SRS §10)

---

## Phase 4 — Web Client
*Goal: playable game in the browser — hex map, hand, combat, lobby, responsive layout.*

- [ ] **T-04-01** Set up React + TS + Vite SPA with routing (`/login`, `/lobby`, `/game/:sessionId`, `/profile`, `/tutorial`)
- [ ] **T-04-02** Implement REST + WebSocket client layer using generated TS types; reconnect logic
- [ ] **T-04-03** Implement hex-map renderer with fog of war — PixiJS or Konva (tile reveal, terrain colours, encounter icons)
- [ ] **T-04-04** Implement hand UI — card display, drag-and-drop play, phase-aware highlighting of playable cards
- [ ] **T-04-05** Implement combat modal — phase indicator, card slots, target picker, enemy ability display (FR-COMB-01..08)
- [ ] **T-04-06** Implement login/register forms, lobby browser, session create/join flow (FR-AUTH-01..02, FR-SES-01..02)
- [ ] **T-04-07** Implement level-up modal, player HUD (fame/reputation/hand/armor), opponent side-panels (FR-PROG-02..04)
- [ ] **T-04-08** Implement responsive layout — 1280×720 to 2560×1440 (NFR-USE-02); keyboard navigation (NFR-USE-03); WCAG AA contrast (NFR-USE-04)
- [ ] **T-04-09** Add i18n scaffolding with i18next — EN strings wired up; DE translation file stubbed (NFR-USE-05)
- [ ] **T-04-10** Implement visual + audio feedback system for all major player actions (NFR-USE-06)

---

## Phase 5 — AI Opponents
*Goal: Easy/Normal/Hard AI that plays by the same rules as human players.*

- [ ] **T-05-01** Implement `AIPlayer` base class consuming `packages/rules` — same `apply_action` path as humans (FR-AI-01)
- [ ] **T-05-02** Implement Easy AI — deterministic rule-based heuristics (move toward encounter, play highest-value card)
- [ ] **T-05-03** Implement Normal AI — weighted action scoring with look-ahead; decision time ≤ 3s (FR-AI-02/03)
- [ ] **T-05-04** Implement Hard AI — bounded MCTS/minimax with strict time budget ≤ 8s (FR-AI-02/03)
- [ ] **T-05-05** Implement AI stand-in for disconnected players — substitute on grace-period expiry (FR-AI-04, FR-MP-06)

---

## Phase 6 — Tutorial, Polish & UX
*Goal: new-player friendly; complete profile, chat, achievements.*

- [ ] **T-06-01** Implement scripted tutorial scenario — guided exploration, first combat, first level-up (FR-TUT-01, NFR-USE-01 < 30 min)
- [ ] **T-06-02** Implement in-game rules reference panel and contextual hint system (FR-TUT-02/03)
- [ ] **T-06-03** Implement end-of-session summary screen — scoring, fame, achievements unlocked (FR-MP-05, FR-CUST-04)
- [ ] **T-06-04** Implement profile page — display name, avatar, lifetime stats, achievements (FR-AUTH-06, FR-CUST-05)
- [ ] **T-06-05** Implement in-session chat channel (FR-MP-04)

---

## Phase 7 — Quality, Security & Scale
*Goal: every NFR verified; all 96 requirements mapped to a passing test.*

- [ ] **T-07-01** Run full adversarial test suite against transport; fix any rejection failures
- [ ] **T-07-02** Security audit — OWASP Top 10 sweep (bandit, safety, CSP headers, CSRF, parameterized queries)
- [ ] **T-07-03** Set up Prometheus metrics + structlog structured logging + OpenTelemetry traces (NFR-OBS-01..03)
- [ ] **T-07-04** k6 load test — 500 sessions/instance, p95 action latency ≤ 200ms; tune until passing (NFR-PERF-01/04)
- [ ] **T-07-05** Chaos test — kill backend instance mid-session; confirm zero session loss via action log replay (NFR-REL-03)
- [ ] **T-07-06** Playwright E2E tests — register → lobby → start game → play round → end session golden path (cross-browser)
- [ ] **T-07-07** Final CI gate check — coverage ≥ 80%, all tests green, OpenAPI artifact generated, TS types in sync

---

## Summary

| Phase | Tasks | Status |
|---|---|---|
| 0 — Foundations | 5 | Not started |
| 1 — Rules Engine | 10 | Not started |
| 2 — Server App | 7 | Not started |
| 3 — Transport | 6 | Not started |
| 4 — Web Client | 10 | Not started |
| 5 — AI | 5 | Not started |
| 6 — Polish | 5 | Not started |
| 7 — Quality | 7 | Not started |
| **Total** | **55** | |

---

## Critical Path

```
Phase 0 (foundations)
  → Phase 1 (rules engine)  ← most important — test-driven, pure Python
    → Phase 2 (server app)
      → Phase 3 (transport)    \
      → Phase 4 (web client)    ├─ run in parallel once server API is stable
                               /
        → Phase 5 (AI)
          → Phase 6 (polish)
            → Phase 7 (quality gate before submission)
```

**Milestone check-ins:**
- After Phase 1: run a full game turn in a Python REPL — no browser needed yet.
- After Phase 3: play a session via Postman / wscat — still no browser.
- After Phase 4: full game loop in the browser.
- After Phase 7: every SRS requirement has a passing test.
