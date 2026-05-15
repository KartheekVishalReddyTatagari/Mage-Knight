# ADR-0003: Data-Driven Content Packs

- **Status:** Accepted
- **Date:** 2026-05-15
- **SRS refs:** §6.6, NFR-MAINT-04, FR-CARD-01..06, FR-WORLD-01/02/04, FR-COMB-06

## Context

Mage Knight has hundreds of cards, dozens of enemy types, multiple terrain types, and scenario definitions. The SRS requires that "a change in a game rule (e.g., a card effect) shall be implementable and deployable without changing the protocol or client" (NFR-MAINT-04) and that "card effects, enemy abilities, terrain rules, and scenarios should be data-driven where feasible, configured in versioned content packs" (§6.6).

Two extremes: (1) hardcode each card as a Python class — fast but every balance tweak is a code change; (2) make everything fully scriptable at runtime (e.g. Lua) — flexible but a security and testing burden.

## Decision

Game content is expressed as **versioned JSON content packs** in `packages/content/`, loaded at startup (and hot-reloadable in development). Each card / enemy / tile / scenario is a JSON document validated by a Pydantic schema.

Card and enemy *effects* are expressed as a small declarative **effect DSL** — a list of typed effect descriptors (`{"type": "deal_damage", "amount": 3, "target": "selected_enemy"}`, `{"type": "draw_cards", "amount": 2}`, etc.) — interpreted by the rules engine. New effect types require a Python change; new combinations of existing effects do not.

Each content pack carries a `schema_version` and `content_version`. The server logs the loaded pack version with every action.

## Consequences

### Positive
- Balance tweaks ship as content updates without rebuilding the client (NFR-MAINT-04).
- Same JSON drives both production runtime and test fixtures — tests cannot drift from production data.
- Easy to add scenarios; positions the codebase well for the post-MVP scenario editor (FR-CUST-02).
- Versioning the pack means we can attribute bugs to a specific content version when replaying old sessions.

### Negative / Trade-offs
- Adding a *new kind* of effect requires a Python change and a schema-version bump. Acceptable: it forces effects to be reviewed and tested.
- The effect DSL is a small bespoke language — needs documentation. Mitigated by exhaustive enumeration of effect types in the schema and unit tests per type.

### Neutral
- The line between "data" and "code" is a judgment call. Rule: deterministic effects expressible as data; conditional control flow that spans phases stays in code.

## Alternatives Considered

### Option A — One Python class per card
Direct, explicit. **Rejected:** violates NFR-MAINT-04; every balance change is a deploy.

### Option B — Embedded scripting (Lua / Python sandbox)
Maximum flexibility. **Rejected:** security risk (sandbox escapes are a serious failure mode), harder to test exhaustively, harder to enforce determinism.

## References
- SRS §6.6, NFR-MAINT-04
- ADR-0007 (Pydantic schemas)
