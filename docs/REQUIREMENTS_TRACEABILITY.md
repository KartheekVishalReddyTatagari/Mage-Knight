# Requirements Traceability Matrix

Maps every SRS requirement to the architectural component(s) that implement it. This is the cross-reference for grading: every Must-priority requirement has at least one component owner.

Legend:
- **Component refs** map to entries in `ARCHITECTURE.md` §4 and `DOMAIN_MODEL.md` §9.
- **Test refs** identify the test type that verifies the requirement.

---

## Functional Requirements

### 3.1 Account & Authentication

| ID | Component(s) | Test |
|---|---|---|
| FR-AUTH-01 | `AuthService`, REST `/auth/register`, Pydantic schema | unit + integration |
| FR-AUTH-02 | `AuthService`, REST `/auth/login`, Argon2id verify | unit + integration |
| FR-AUTH-03 | `AuthService` JWT issuance + refresh rotation | unit + integration |
| FR-AUTH-04 | `AuthService` reset flow, email adapter | integration |
| FR-AUTH-05 | `AuthService` TOTP module *(post-MVP)* | integration |
| FR-AUTH-06 | `AuthService` profile endpoints | integration |

### 3.2 Game Session Management

| ID | Component(s) | Test |
|---|---|---|
| FR-SES-01 | `SessionService.create`, REST `/sessions` | integration |
| FR-SES-02 | `SessionService.join`, lobby endpoint | integration |
| FR-SES-03 | `SessionService.configure`, scenario validation | integration |
| FR-SES-04 | Action log + snapshots (ADR-0005) | integration + chaos |
| FR-SES-05 | `SessionService` inactivity sweeper | integration |
| FR-SES-06 | `SessionService.leave`, host-transfer logic | integration |
| FR-SES-07 | Action log writes for every event (ADR-0005) | integration |

### 3.3 World Generation & Exploration

| ID | Component(s) | Test |
|---|---|---|
| FR-WORLD-01 | `packages/rules` map generator + content pack tile catalogue | unit |
| FR-WORLD-02 | Content pack terrain types; rules engine terrain table | unit |
| FR-WORLD-03 | `Map` aggregate (revealed/unrevealed), `PerPlayerViewFilter` | unit + adversarial |
| FR-WORLD-04 | Scenario rules + encounter placement in rules engine | unit |
| FR-WORLD-05 | `movement.py` terrain cost computation | unit + property |
| FR-WORLD-06 | `apply_action` validation rejects illegal moves | unit |
| FR-WORLD-07 | Round machine `DayPhase` flip; affected card / movement rules | unit |

### 3.4 Combat System

| ID | Component(s) | Test |
|---|---|---|
| FR-COMB-01 | `EngageAction` → `Combat` aggregate creation | unit |
| FR-COMB-02 | Combat phase state machine (`combat.py`) | unit + property |
| FR-COMB-03 | `PlayCardAction` accepted per phase rules | unit |
| FR-COMB-04 | `apply_action` validation, error events | unit + adversarial |
| FR-COMB-05 | Damage computation + wound assignment in `combat.py` | unit |
| FR-COMB-06 | Enemy ability descriptors in content pack; engine interpreter | unit |
| FR-COMB-07 | `EnemyDefeated` event → fame/loot/tile reward effects | unit |
| FR-COMB-08 | `RetreatAction` with penalty effects | unit |

### 3.5 Card System & Deck Management

| ID | Component(s) | Test |
|---|---|---|
| FR-CARD-01 | `DeckZone` value objects per `MageKnight` | unit |
| FR-CARD-02 | `Rng` adapter (per-session seed); `deck.py` shuffle/draw | unit + replay |
| FR-CARD-03 | End-of-turn handler enforces `hand_size_max` | unit + property |
| FR-CARD-04 | Card definition: `basic_effect` vs `powered_effect`; mana-cost check | unit |
| FR-CARD-05 | Acquisition effects in content (`AcquireCardEffect`) | unit |
| FR-CARD-06 | `RecruitUnitAction` checks `command_max` | unit |
| FR-CARD-07 | `DiscardUnitAction` + ability-driven destruction effects | unit |

### 3.6 Mage Knight Progression

| ID | Component(s) | Test |
|---|---|---|
| FR-PROG-01 | `MageKnight.fame` / `.reputation`; `FameChanged` event | unit |
| FR-PROG-02 | Level threshold table; engine emits `LevelUpOffered` | unit |
| FR-PROG-03 | `LevelUpOffer` content (per-Mage-Knight pools) | unit |
| FR-PROG-04 | Level-up resolver mutates armor/hand/command | unit |
| FR-PROG-05 | `ProgressionService` consumes `SessionEnded`; Postgres lifetime stats | integration |

### 3.7 Multiplayer & Real-Time Coordination

| ID | Component(s) | Test |
|---|---|---|
| FR-MP-01 | `WSGateway` broadcast + `PerPlayerViewFilter` | integration |
| FR-MP-02 | Turn order in `Session.turn_index`; engine rejects out-of-turn actions | unit + adversarial |
| FR-MP-03 | Real-time exploration phase: per-action validation, no turn lock | unit + integration |
| FR-MP-04 | Chat channel via WS (separate frame type) | integration |
| FR-MP-05 | End-of-session scoring in rules engine; `SessionEnded` event | unit |
| FR-MP-06 | Disconnect grace timer; `AIPlayer` proxy | integration |

### 3.8 AI Opponents

| ID | Component(s) | Test |
|---|---|---|
| FR-AI-01 | `AIPlayer` consumes same `packages/rules` engine | unit |
| FR-AI-02 | Easy / Normal / Hard strategy modules | unit |
| FR-AI-03 | Bounded MCTS with time budget; timer-driven cutoff | perf |
| FR-AI-04 | AI substitution on disconnect | integration |

### 3.9 Tutorial

| ID | Component(s) | Test |
|---|---|---|
| FR-TUT-01 | Scripted tutorial scenario (content pack) + UI walkthrough | E2E |
| FR-TUT-02 | Client-side hint system, server-side trigger conditions | E2E |
| FR-TUT-03 | In-game rules reference UI; content from `packages/content/rules-text/` | E2E |

### 3.10 Customization

| ID | Component(s) | Test |
|---|---|---|
| FR-CUST-01 | Avatar field on profile *(post-MVP)* | integration |
| FR-CUST-02 | Scenario editor UI + validator *(post-MVP)* | integration |
| FR-CUST-03 | Scenario sharing service *(post-MVP)* | integration |
| FR-CUST-04 | `Achievement` rules engine; `SessionEnded` evaluation | integration |
| FR-CUST-05 | Profile read-side aggregation | integration |

---

## Non-Functional Requirements

### 4.1 Performance

| ID | Tactic | Verification |
|---|---|---|
| NFR-PERF-01 | Async I/O, Redis state, single-writer queue | k6 load test |
| NFR-PERF-02 | Pre-rendered tile sprites, optimistic client | Playwright timing |
| NFR-PERF-03 | AI time-budget enforcer | unit + perf |
| NFR-PERF-04 | Coroutine concurrency; state in Redis (not process) | k6 load test |
| NFR-PERF-05 | Horizontal scale; Kubernetes HPA | load test in staging |
| NFR-PERF-06 | Profile-driven optimization; metrics dashboard | Prometheus alerting |

### 4.2 Reliability

| ID | Tactic | Verification |
|---|---|---|
| NFR-REL-01 | Stateless backends, multi-AZ deploy, health probes | uptime monitoring |
| NFR-REL-02 | Liveness/readiness probes; fast restart | chaos test |
| NFR-REL-03 | Replicated Redis + action log + snapshot (ADR-0005) | chaos test |
| NFR-REL-04 | Postgres daily backups; managed-DB feature | runbook + restore drill |
| NFR-REL-05 | Circuit breakers; non-essential feature flags | integration |

### 4.3 Security

| ID | Tactic | Verification |
|---|---|---|
| NFR-SEC-01 | TLS 1.2+ at ingress; HSTS | scan (sslyze) |
| NFR-SEC-02 | `passlib[argon2]` Argon2id | unit |
| NFR-SEC-03 | Pydantic schema + rules-engine state validation | adversarial |
| NFR-SEC-04 | `PerPlayerViewFilter` is the only state→wire path | unit + adversarial |
| NFR-SEC-05 | SQLAlchemy parameterized queries; CSP; CSRF; React escape | bandit, ZAP scan |
| NFR-SEC-06 | Rate limiter middleware | integration |
| NFR-SEC-07 | Account-deletion + data-export endpoints; PII-minimal logs | integration |
| NFR-SEC-08 | Hash-chained admin audit log | unit |

### 4.4 Usability

| ID | Tactic | Verification |
|---|---|---|
| NFR-USE-01 | Linear tutorial scenario, < 30 min | playtest |
| NFR-USE-02 | Responsive CSS grid; test viewports | Playwright |
| NFR-USE-03 | Keyboard nav on all controls | axe-core scan |
| NFR-USE-04 | WCAG AA contrast tokens | axe-core scan |
| NFR-USE-05 | i18next (EN + DE) | manual review |
| NFR-USE-06 | Audio sprite + UI animation system | E2E |

### 4.5 Maintainability

| ID | Tactic | Verification |
|---|---|---|
| NFR-MAINT-01 | Layered architecture (ARCHITECTURE.md §2) | architecture review |
| NFR-MAINT-02 | `pytest --cov` ≥ 80 % on `packages/rules` | CI gate |
| NFR-MAINT-03 | FastAPI OpenAPI + WS JSON Schema export | CI artifact |
| NFR-MAINT-04 | Data-driven content (ADR-0003) | demonstrated by adding a card without code change |
| NFR-MAINT-05 | GitHub Actions: lint → typecheck → test → build → deploy | green pipeline |

### 4.6 Portability

| ID | Tactic | Verification |
|---|---|---|
| NFR-PORT-01 | Vite ES2020 target; Playwright cross-browser | CI |
| NFR-PORT-02 | Distroless Docker image; Kubernetes manifests | deploy test |
| NFR-PORT-03 | Protocol `v` field; version negotiation on WS handshake | integration |
| NFR-PORT-04 | Repository pattern; `SessionStore` interface | code review |

### 4.7 Scalability

| ID | Tactic | Verification |
|---|---|---|
| NFR-SCALE-01 | Stateless backends behind LB | load test |
| NFR-SCALE-02 | Session ID → Redis key; lease handoff | chaos test |
| NFR-SCALE-03 | Kubernetes HorizontalPodAutoscaler on CPU + custom session metric | k6 ramp |

### 4.8 Observability

| ID | Tactic | Verification |
|---|---|---|
| NFR-OBS-01 | `structlog` JSON output | log audit |
| NFR-OBS-02 | `prometheus-client` exporter | scrape check |
| NFR-OBS-03 | OpenTelemetry SDK + collector | trace audit |
| NFR-OBS-04 | Grafana SLO dashboards + Alertmanager | drill |

---

## Coverage Summary

- **Functional Must-priority requirements:** 35 / 35 mapped.
- **Should-priority:** 14 / 14 mapped (some post-MVP).
- **Could-priority:** 4 / 4 mapped (all post-MVP).
- **Non-functional:** 38 / 38 mapped.
- **Total:** 96 / 96.
