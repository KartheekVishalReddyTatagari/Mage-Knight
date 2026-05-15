# ADR-0001: Server-Authoritative Game Logic

- **Status:** Accepted
- **Date:** 2026-05-15
- **SRS refs:** §2.5, §6.2, FR-COMB-04, NFR-SEC-03, NFR-SEC-04, §9.1

## Context

The SRS is explicit that "no client may unlawfully interfere with the server" (brief), that "all authoritative game logic shall run on the server" (§2.5), and that "the server shall validate every inbound message against an expected schema and current game state" (NFR-SEC-03). In a card-and-dice game with persistent progression and ranked competitive play, any client-trusted state opens the door to cheating that undermines the entire product.

Two extreme alternatives exist: a thick client that simulates rules locally and reports outcomes (cheap on server, impossible to secure), or a thin client that submits intents and renders authoritative state (more server load, but secure by design).

## Decision

The server is the single source of truth for all game state. The client submits **intents** (e.g. "play card X on target Y"), never **outcomes**. The server's rules engine validates the intent against current state, applies it if legal, persists the result, and broadcasts deltas. The client renders authoritative state and may show optimistic feedback that the server can correct.

All randomness (card draws, tile reveals, dice) is generated server-side from a per-session cryptographic seed (also stored, for replay).

The rules engine itself lives in a separate pure module (`packages/rules`) with no I/O — see ADR-0005 for how this enables the action log and ADR-0004 for how the single-writer queue interacts with it.

## Consequences

### Positive
- Cheating via crafted client messages is structurally impossible (per SRS §9.4 risk row).
- Determinism: same seed + same action sequence ⇒ same state. Enables replay, debugging, support.
- The same rules engine drives AI opponents (FR-AI-01) — humans and AI play identical rules by construction.

### Negative / Trade-offs
- Higher server CPU per session. Mitigated by efficient rules engine + horizontal scaling (NFR-SCALE-01).
- Latency floor on every interaction (round-trip). Mitigated by optimistic UI for non-rule-affecting feedback and by p95 ≤ 200 ms target (NFR-PERF-01).
- More server tests required to reach 80 % rules coverage (NFR-MAINT-02). Accepted as worth it.

### Neutral
- Forces a clean separation between domain and presentation layers, which also benefits maintainability.

## Alternatives Considered

### Option A — Thick-client P2P with cryptographic commitment schemes
Clients simulate locally; commit-reveal RNG; consensus on outcomes. **Rejected:** complex, hard to test, doesn't match the SRS mandate, and competitive integrity is still difficult to guarantee.

### Option B — Server validation but client-local randomness
Server validates legality but trusts client-rolled outcomes. **Rejected:** opens an obvious cheat vector; contradicts §2.5.

## References
- SRS §2.5, §6.2, FR-COMB-04, NFR-SEC-03, NFR-SEC-04
- ADR-0004 (single-writer queue), ADR-0005 (action log)
