# ADR-0006: REST + WebSocket Transport

- **Status:** Accepted
- **Date:** 2026-05-15
- **SRS refs:** §5.3, §5.4, NFR-PERF-01, NFR-PORT-03, NFR-SEC-01

## Context

Two distinct communication patterns exist:

1. **Stateless, request/response** — registration, login, profile read/write, lobby browsing, scenario catalogue. Cacheable, idempotent where possible.
2. **Stateful, low-latency, bidirectional** — in-session: pushing state deltas, receiving action intents, presence, chat. Must hit p95 ≤ 200 ms (NFR-PERF-01).

A single protocol forced to cover both either pays the wrong cost (long-polling REST is slow; WebSocket-only loses HTTP cacheability and complicates OpenAPI tooling).

## Decision

Two complementary transports, both on port 443 over TLS 1.2+:

| Channel | Use | Protocol |
|---|---|---|
| **REST** over HTTPS | Auth, profile, lobby list, session create/join, scenario catalogue, replays | JSON, OpenAPI documented |
| **WebSocket** over WSS | All in-session traffic: state deltas → client, intents ← client, chat, presence | JSON frames, schema-versioned |

Both share Pydantic schemas (ADR-0007). Every frame and request carries an explicit `v` field. The server publishes `min_supported_version`; the WS handshake rejects mismatched clients with a clear error code (NFR-PORT-03).

WebSocket frame types are a discriminated union (`type` field). Each variant has its own Pydantic model. Validation happens before any application logic touches the payload (NFR-SEC-03).

## Consequences

### Positive
- REST OpenAPI doc covers everything except in-session messaging, which is documented as a separate WS message catalogue. Both auto-generated from Pydantic.
- HTTP semantics for auth/profile mean standard middleware (CORS, rate limiting, caching) just works.
- WebSocket gives the latency required for combat phases.

### Negative / Trade-offs
- Two surfaces to secure, version, and document. Mitigated by sharing schemas (ADR-0007).
- Some clients sit behind proxies that mishandle WSS — accept and document; SRS §2.6 already assumes modern infrastructure.

### Neutral
- Could later add gRPC for server-internal communication; not in scope for MVP.

## Alternatives Considered

### Option A — WebSocket only
Single connection per client; everything multiplexed. **Rejected:** complicates HTTP-style features (caching, CDN, third-party REST clients for admin tools); no benefit for stateless flows.

### Option B — REST only with long-polling for updates
**Rejected:** can't meet 200 ms p95 latency budget under load; high overhead per update.

### Option C — Server-Sent Events for downstream + REST for upstream
**Rejected:** SSE is unidirectional; we still need a WS-like upstream for intent submission. Adds complexity without removing it.

## References
- SRS §5.3, §5.4, NFR-PERF-01
- ADR-0007 (schemas)
