# ADR-0005: Action Log as Source of Truth

- **Status:** Accepted
- **Date:** 2026-05-15
- **SRS refs:** §6.4, FR-SES-04, FR-SES-07, NFR-REL-03, NFR-SEC-08

## Context

The system must (1) resume interrupted sessions (FR-SES-04), (2) survive backend instance failure without losing any session (NFR-REL-03), (3) support replay and audit (§6.4, FR-SES-07), and (4) maintain a tamper-evident audit log for administrative actions (NFR-SEC-08).

A snapshot-only approach loses everything since the last snapshot. A state-only approach can't answer "how did we get here?" — fatal for support, debugging balance issues, and audit.

The rules engine is deterministic by design (ADR-0001): same seed + same action sequence ⇒ same final state.

## Decision

The **action log** is the canonical source of truth for every session. It is an append-only table in Postgres keyed by `(session_id, sequence_number)`, with `(actor_id, action_type, action_payload, state_delta, timestamp, content_pack_version)` per row.

Current state in Redis is a **derived cache** — if Redis is lost, state is rebuilt by replaying the action log from the last snapshot. Snapshots are written periodically (every N actions or T seconds) to bound replay time.

Each action's row also stores the RNG draws consumed during application, so replay is fully deterministic even when the action involves randomness (e.g. card draw).

For tamper-evident audit logging (NFR-SEC-08), administrative-action entries form a separate hash-chained log: each row's `prev_hash` field is `H(prev_row.payload || prev_row.prev_hash)`. Any retroactive modification breaks the chain and is detectable.

## Consequences

### Positive
- Resume from any failure point (FR-SES-04, NFR-REL-03).
- Replay for support / debugging / sharing (§6.4, post-MVP replay viewer).
- Audit log integrity (NFR-SEC-08).
- Decouples persistence: Redis becomes purely a performance cache; Postgres is the durability boundary.
- The action log doubles as training data if we later improve the AI with learning approaches.

### Negative / Trade-offs
- Storage cost grows linearly with sessions × actions. Mitigated by 90-day retention (§7.3) and compression/archival of older logs.
- Replay time grows with actions-since-snapshot. Mitigated by snapshot frequency tuned per traffic.
- Schema changes to action payloads must remain backward-compatible (or migrations applied). Mitigated by schema-versioning each action type.

### Neutral
- Forces append-only thinking; state mutation by direct write is forbidden.

## Alternatives Considered

### Option A — Snapshot only
Periodic state dumps; no log. **Rejected:** loses recent actions on failure; no audit trail.

### Option B — Event sourcing with read models
Same idea but more elaborate. **Rejected as overkill for MVP** but the current design is event-sourced in spirit and we keep the option open to add read models if a feature demands it.

## References
- SRS §6.4, FR-SES-04, FR-SES-07, NFR-REL-03, NFR-SEC-08
- ADR-0001, ADR-0004
