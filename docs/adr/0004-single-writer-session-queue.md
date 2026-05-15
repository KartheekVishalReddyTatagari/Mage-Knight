# ADR-0004: Single-Writer Queue per Session

- **Status:** Accepted
- **Date:** 2026-05-15
- **SRS refs:** §6.5, FR-MP-01, FR-MP-02, NFR-PERF-01, NFR-REL-03

## Context

Multiple players can submit actions to the same session simultaneously (cooperative play, chat, real-time exploration phases per FR-MP-03). The rules engine mutates a complex state object (deck, hand, map, combat phase, etc.) and any two interleaved mutations risk producing inconsistent state — and worse, a non-replayable state, since the action log would lose causal ordering.

Standard approaches: optimistic concurrency with retries (good throughput, complex conflict resolution for compound game state), pessimistic per-entity locking (granular but locking the right set of entities for a card play is hard), or serializing all writes to a session.

The SRS itself recommends: "Each session is treated as a single-writer aggregate: actions for one session are serialized into a queue and applied in order" (§6.5).

## Decision

Each active session has one logical **session actor** with a private inbound queue. All intents for that session — from any participant, plus AI and timer-triggered events — are enqueued and processed strictly in arrival order by a single coroutine.

The actor:
1. Dequeues an intent.
2. Loads current state from Redis (or in-process cache if hot).
3. Calls `rules.apply_action(state, intent, rng)`.
4. On rejection: returns an error to the submitter only.
5. On acceptance: appends to action log (Postgres), writes new state to Redis, computes per-player views, broadcasts deltas via WebSocket fan-out.

A session actor is *logically* singular but not *physically* pinned to a backend instance — Redis pub/sub ensures only one instance owns the actor at a time (lease-based). On instance failure, another instance picks up the lease and resumes from the action log + last snapshot (NFR-REL-03).

## Consequences

### Positive
- No race conditions inside a session. Invariants in the rules engine can assume serial application.
- Action log entries have an unambiguous sequence number — replay and audit are trivial.
- Each session is independent → naturally horizontally scalable across instances by session ID (NFR-SCALE-02).
- Failure recovery is a straightforward "rebuild from log" operation.

### Negative / Trade-offs
- Per-session throughput is capped at single-coroutine speed. Acceptable: an MK session generates maybe one action every few seconds; ceiling is comfortably above demand.
- Lease handoff on instance failure introduces a small recovery window (target: < 5 s, well inside NFR-REL-02's 5 min MTTR).

### Neutral
- Distributed leases (Redis-based) introduce one operational concern (clock skew, lease expiry tuning) — handled by tested defaults.

## Alternatives Considered

### Option A — Pessimistic per-entity locks
Lock map, hand, deck separately. **Rejected:** card effects routinely touch all three; lock ordering becomes a nightmare; deadlocks possible.

### Option B — Optimistic concurrency with retries
Each action carries a state-version; conflicts retry. **Rejected:** game actions are not idempotent (drawing cards mutates the deck) so retries are dangerous; conflict frequency would be high in real-time exploration phases.

### Option C — Session-pinned to one server instance, no failover
Simplest. **Rejected:** violates NFR-REL-03 (zero session loss on instance failure).

## References
- SRS §6.5, NFR-REL-03, NFR-SCALE-02
- ADR-0005 (action log)
