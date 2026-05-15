# Mage Knight Online — Domain Model

> Companion to `ARCHITECTURE.md`. Captures the **conceptual model** of the game domain — entities, relationships, value objects, aggregates, invariants, and the key state machines. Not yet a database schema; the domain layer (`packages/rules`) implements this model with immutable Python types.

This document follows Domain-Driven Design vocabulary:

- **Entity** — has identity that persists across state changes (e.g. a Mage Knight).
- **Value Object** — defined by its attributes; interchangeable when equal (e.g. a HexCoord).
- **Aggregate** — cluster of entities + value objects treated as one consistency boundary; mutated via the aggregate **root**.
- **Domain Event** — something that happened in the domain; immutable, named in past tense.
- **Invariant** — a rule that must always hold.

---

## 1. Bounded Contexts

The system splits cleanly into four bounded contexts. Each owns its model; they communicate via well-defined events / DTOs at the boundaries.

```
┌────────────────────┐    ┌────────────────────┐
│   IDENTITY         │    │   PROGRESSION      │
│   (Player Account) │───>│   (Lifetime stats, │
│                    │    │   achievements)    │
└────────────────────┘    └────────────────────┘
          │                          ▲
          ▼                          │
┌────────────────────┐    ┌────────────────────┐
│   MATCHMAKING      │───>│   GAMEPLAY         │
│   (Lobby, session  │    │   (Session, map,   │
│   creation/join)   │    │   combat, cards)   │
└────────────────────┘    └────────────────────┘
```

| Context | Owns | Primary Aggregates |
|---|---|---|
| **Identity** | accounts, credentials, profiles | `PlayerAccount` |
| **Matchmaking** | lobby, session creation | `Lobby`, `SessionDescriptor` |
| **Gameplay** | active session, map, combat, cards | `Session` (root), `MageKnight`, `Map`, `Combat` |
| **Progression** | lifetime stats, achievements | `PlayerProgress`, `Achievement` |

The **Gameplay context** is the heart of the domain — and where the rules engine lives.

---

## 2. Conceptual Class Diagram (Gameplay Context)

```
                          ┌─────────────────┐
                          │   Session       │  «Aggregate Root»
                          ├─────────────────┤
                          │ id              │
                          │ mode            │  enum {Solo, Coop, Versus}
                          │ scenario        │
                          │ round_number    │
                          │ day_phase       │  enum {Day, Night}
                          │ state           │  enum {Lobby, Playing, Ended}
                          │ rng_seed        │
                          │ created_at      │
                          └─────────────────┘
                                 │ 1
                                 │ owns 1..* MageKnight
                                 │ owns 1   Map
                                 │ owns 0..1 Combat (at most one in-flight)
                                 │ owns *   ActionLogEntry
            ┌────────────────────┼──────────────────┬────────────────────┐
            ▼                    ▼                  ▼                    ▼
   ┌────────────────┐  ┌──────────────────┐  ┌─────────────┐  ┌───────────────────┐
   │  MageKnight    │  │      Map         │  │   Combat    │  │ ActionLogEntry    │
   ├────────────────┤  ├──────────────────┤  ├─────────────┤  ├───────────────────┤
   │ id             │  │ id               │  │ id          │  │ sequence_no       │
   │ owner_account  │  │ shape            │  │ phase       │  │ actor_id          │
   │ name           │  │ revealed_tiles[] │  │ attackers[] │  │ action_type       │
   │ level          │  │ unrevealed_pool[]│  │ defenders[] │  │ payload           │
   │ fame           │  │ position_index   │  │ pending_fx[]│  │ state_delta       │
   │ reputation     │  └──────────────────┘  └─────────────┘  │ rng_draws[]       │
   │ armor          │           │ owns *                       │ timestamp         │
   │ hand_size_max  │           ▼                              │ content_pack_ver  │
   │ command_max    │   ┌──────────────────┐                  └───────────────────┘
   │ position       │   │      Tile        │
   │ wounds         │   ├──────────────────┤
   └────────────────┘   │ id               │
        │  owns 1..*    │ type             │  enum {Country, Core, City}
        ▼               │ position (HexCoord)│
 ┌───────────────────┐  │ rotation         │
 │ DeckZone          │  │ hexes[7]         │  TerrainHex[]
 ├───────────────────┤  │ encounters[]     │  Encounter[]
 │ kind              │  │ revealed_at_round│
 │ cards[] (ordered) │  └──────────────────┘
 └───────────────────┘            │ owns 7 TerrainHex
        │ kind ∈ {Deck, Hand,     ▼
        │   Discard, Spells,    ┌──────────────────┐
        │   AdvActions,         │ TerrainHex       │  «Value Object»
        │   Artifacts, Units}   ├──────────────────┤
        │ contains *            │ coord (HexCoord) │
        ▼                       │ terrain          │  enum {Plains, Forest,
 ┌───────────────────┐          └──────────────────┘    Hills, Mountains,
 │   Card            │                                  Lake, Desert, Swamp}
 ├───────────────────┤
 │ id (card_def_id)  │      ┌──────────────────┐
 │ instance_id       │      │  Encounter       │  abstract
 │ basic_effect      │      ├──────────────────┤
 │ powered_effect    │      │ id               │
 │ cost              │      │ tile_id          │
 │ color             │      │ position         │
 └───────────────────┘      └──────────────────┘
                                     ▲
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
   ┌──────────────────┐    ┌───────────────────┐    ┌────────────────┐
   │ EnemyEncounter   │    │ SiteEncounter     │    │ CityEncounter  │
   ├──────────────────┤    ├───────────────────┤    ├────────────────┤
   │ enemy_unit_ids[] │    │ site_type         │    │ city_level     │
   │ enemy_pool       │    │ rewards[]         │    │ garrison[]     │
   └──────────────────┘    └───────────────────┘    └────────────────┘
```

---

## 3. Aggregates and Their Roots

The **Session** is the *only* aggregate root in the Gameplay context. Every gameplay mutation goes through `apply_action(session, action) → (session', events)`. This matches ADR-0004 (single-writer queue): one consistency boundary per session, serialized writes.

| Aggregate Root | Contents | Mutated via |
|---|---|---|
| `Session` (Gameplay) | `MageKnight[]`, `Map`, `Combat?`, `ActionLogEntry[]` | `apply_action(session, action)` |
| `PlayerAccount` (Identity) | profile, credentials | `register`, `update_profile`, `change_password` |
| `Lobby` (Matchmaking) | open `SessionDescriptor[]` | `open_session`, `join`, `leave` |
| `PlayerProgress` (Progression) | lifetime stats, `Achievement[]` | `record_session_outcome`, `unlock_achievement` |

Cross-aggregate communication uses **domain events** (see §5), never direct references.

---

## 4. Value Objects

Value objects are immutable, equality-by-value, and cheap to copy.

| Value Object | Attributes | Notes |
|---|---|---|
| `HexCoord` | `q: int`, `r: int` | Axial coordinates for hex grid. |
| `TerrainHex` | `coord: HexCoord`, `terrain: TerrainType` | One of seven hexes on a tile. |
| `CardEffect` | discriminated union of effect descriptors | Effect DSL from ADR-0003. |
| `Damage` | `amount: int`, `kind: DamageKind`, `attributes: set[DamageAttr]` | DamageKind ∈ {Physical, Fire, Ice, ColdFire}. |
| `Resource` | `mana_pool: dict[ManaColor, int]`, `move: int`, `influence: int`, `attack: int`, `block: int` | Per-turn currencies. |
| `LevelUpOffer` | `armor_increase: bool`, `hand_size_increase: bool`, `command_increase: bool`, `skill_choices[]`, `card_choices[]` | What the player picks from on level-up. |
| `CombatPhase` | enum: `Ranged`, `Block`, `Attack`, `Damage`, `Done` | Combat state-machine state. |
| `DayPhase` | enum: `Day`, `Night` | Affects movement/visibility (FR-WORLD-07). |
| `SchemaVersion` | `(major: int, minor: int)` | For protocol + content versioning. |

---

## 5. Domain Events

Events are emitted by `apply_action`. They drive: WebSocket broadcasts, action-log entries, cross-context updates (e.g. `SessionEnded` → Progression context updates lifetime stats).

| Event | Carried Data | Triggered By |
|---|---|---|
| `SessionCreated` | session_id, mode, scenario | matchmaking |
| `PlayerJoined` / `PlayerLeft` | session_id, player_id | matchmaking |
| `RoundStarted` | session_id, round_number, day_phase | end of previous round |
| `TileRevealed` | session_id, tile_id, position, encounters | movement onto reveal-range hex |
| `MageKnightMoved` | session_id, mage_knight_id, from, to, move_cost | `MoveAction` |
| `CardDrawn` | session_id, mage_knight_id, card_instance_id, card_def_id | end of turn, effect, level-up |
| `CardPlayed` | session_id, mage_knight_id, card_instance_id, mode (basic/powered), targets | `PlayCardAction` |
| `CombatStarted` | session_id, attackers, defenders | engagement |
| `CombatPhaseAdvanced` | session_id, new_phase | phase transition |
| `DamageDealt` | session_id, target_id, damage | combat resolution |
| `EnemyDefeated` | session_id, enemy_id, rewards (fame, loot) | combat |
| `MageKnightWounded` | session_id, mage_knight_id, wound_count | damage > armor |
| `CombatEnded` | session_id, outcome | end of combat |
| `LevelUpOffered` | mage_knight_id, offer | fame threshold crossed |
| `LevelUpResolved` | mage_knight_id, choices | player picks |
| `SessionEnded` | session_id, scores | victory condition or timeout |

---

## 6. Invariants (Domain Rules)

These are the rules the engine must *never* violate. They drive both implementation and property-based tests (`hypothesis`).

### 6.1 Card Conservation
For each Mage Knight, **the multiset of card instances across `Deck ∪ Hand ∪ Discard ∪ inPlay` is constant** within a session (modulo explicit acquisition events). Property test: after every action, sum card counts per Mage Knight; must match `initial_count + acquired - destroyed`.

### 6.2 Hand-Size Limit
At end of turn, `len(MageKnight.hand) ≤ MageKnight.hand_size_max`. Cards beyond the limit are discarded according to canonical rules. (FR-CARD-03)

### 6.3 Command Limit
`count(MageKnight.units) ≤ MageKnight.command_max` at all times. Recruitment fails if it would breach this. (FR-CARD-06)

### 6.4 Authoritative Action Authorship
A `PlayCardAction` from player A targeting Mage Knight B (B ≠ A) is **rejected**. Only the owner may act on their Mage Knight. (SRS §7.2)

### 6.5 Phase-Legal Card Play
A card may only be played in phases where its effects are legal (e.g. a Block card can't be played in the Damage phase). The rules engine enforces this; illegal plays return an error event, not state change. (FR-COMB-04)

### 6.6 Resource Conservation per Turn
Mana, movement, influence, attack, and block values accumulate from card plays and are spent on actions; they cannot go negative; they reset at end of turn (with some specific exceptions encoded as effect types).

### 6.7 Reveal Monotonicity
A revealed tile never becomes unrevealed within the same session. The map only grows. (FR-WORLD-03)

### 6.8 Action-Log Append-Only
No action-log entry is ever modified or deleted by gameplay logic. (ADR-0005)

### 6.9 Determinism Under Replay
Given the same `(initial_state, rng_seed, action_sequence)`, the engine produces an identical final state. Verified by replay tests. (§6.4)

### 6.10 Fame & Reputation Monotonicity (within a session)
Fame is monotonically non-decreasing; reputation can move in either direction but is bounded to `[-7, +7]`. (Mage Knight rulebook.)

### 6.11 View-Filter Soundness
The per-player filtered view of state contains **no information** that the receiving player is not entitled to see (hidden tiles, opponent hands, AI deliberation). Tested separately at the transport boundary. (NFR-SEC-04)

---

## 7. State Machines

### 7.1 Session Lifecycle

```
   Created
      │
      │ host configures scenario / players join
      ▼
   Lobby ──────────────────────┐
      │                        │ all leave / timeout
      │ host clicks "Start"    ▼
      ▼                     Abandoned
   Playing ◄──── Paused ◄─── (disconnect grace)
      │  │                ▲
      │  └────────────────┘ reconnect
      │
      │ victory cond. / final round / forfeit
      ▼
   Ended
```

Drives FR-SES-01..06, FR-MP-06.

### 7.2 Round Structure (within `Playing`)

```
   RoundStart ──> for each player in turn order:
        │             ┌─> StartOfTurn (draw to hand size, refresh mana source)
        │             │
        │             ├─> MainPhase  (move / interact / engage)
        │             │       │
        │             │       └─> Combat (sub-machine, §7.3) if engagement
        │             │
        │             └─> EndOfTurn (apply hand-size limit, advance turn)
        │
        ▼ all players done
   EndOfRound ──> day/night flip if needed ──> next RoundStart
                                            └─> EndGame if final round / win cond.
```

### 7.3 Combat Phase Machine (FR-COMB-02)

```
              ┌──────────────────────────────────┐
              ▼                                  │
   CombatStart ──> RangedAttack                  │ (retreat allowed
                       │                         │  in defined phases)
                       ▼                         │
                   Block ─────────► Attack       │
                       │              │          │
                       │              ▼          │
                       └──────► Damage ──────────┘
                                  │
                                  ▼
                              CombatEnd
                              (award fame, loot)
```

- Each phase: player plays 0..n cards (FR-COMB-03); engine validates each (FR-COMB-04).
- Enemy abilities (fortified, brutal, swift, etc.) modify which actions are legal and how damage is computed (FR-COMB-06).
- Retreat (FR-COMB-08) is a transition out of Block / Attack with associated penalties.

### 7.4 Mage Knight Progression (FR-PROG-01..04)

```
   FameChanged ──> if fame crosses level threshold:
                     │
                     ▼
                  LevelUpOffered (skill/advanced action/armor/hand/command)
                     │
                     ▼ player chooses
                  LevelUpResolved ──> apply changes ──> back to play
```

---

## 8. Cross-Context Integration

| From | To | Mechanism |
|---|---|---|
| Identity → Matchmaking | "this account_id is authenticated" | JWT claim |
| Matchmaking → Gameplay | "create session with these participants and scenario" | `CreateSessionCommand` |
| Gameplay → Progression | `SessionEnded` event with final scores | async; if Progression is down, gameplay still completes (NFR-REL-05) |
| Progression → Identity | none directly | profile pages query Progression read-side |

---

## 9. Mapping to Code (Where Each Class Lives)

| Concept | Module | Notes |
|---|---|---|
| `Session`, `MageKnight`, `Map`, `Tile`, `Combat`, `Card`, `DeckZone` | `packages/rules/src/mk_rules/state.py` | Immutable dataclasses / Pydantic frozen models. |
| Actions (discriminated union) | `packages/rules/src/mk_rules/actions.py` | `MoveAction`, `PlayCardAction`, `EngageAction`, … |
| `apply_action(state, action, rng) -> ApplyResult` | `packages/rules/src/mk_rules/engine.py` | Pure function. |
| Combat sub-engine | `packages/rules/src/mk_rules/combat.py` | |
| Movement | `packages/rules/src/mk_rules/movement.py` | |
| Deck zone operations | `packages/rules/src/mk_rules/deck.py` | |
| Domain events | `packages/rules/src/mk_rules/events.py` | |
| Card / enemy / tile definitions | `packages/content/*.json` | Loaded by `ContentLoader`. |
| `PlayerAccount`, auth | `apps/server/src/application/auth.py` | |
| `Lobby`, session creation | `apps/server/src/application/sessions.py` | |
| `PlayerProgress`, achievements | `apps/server/src/application/progression.py` | Subscribes to `SessionEnded` events. |

---

## 10. Ubiquitous Language (Glossary)

| Term | Meaning |
|---|---|
| **Mage Knight** | Player's avatar — has level, fame, reputation, deck. |
| **Fame** | Accumulated reputation for slaying enemies; gates level-up. |
| **Reputation** | Standing with friendly NPCs; affects influence costs. |
| **Influence** | Resource for negotiation actions (recruit, heal). |
| **Mana** | Resource for empowering cards (basic → powered effect). |
| **Tile** | A hex region of the map containing 7 terrain hexes + encounters. |
| **Encounter** | A monster group, ruin, monastery, marketplace, or city on a tile. |
| **Hand** | Cards available to play this turn. |
| **Deck** | Draw pile (face-down, ordered). |
| **Side Decks** | Pools of acquirable cards: Advanced Actions, Spells, Artifacts, Units. |
| **Follower / Unit** | A recruited NPC card with persistent effects. |
| **Basic Effect** | Default play of a card. |
| **Powered Effect** | Enhanced play, paid for with matching mana. |
| **Round** | One cycle through all players' turns + an end-of-round bookkeeping step. |
| **Day / Night** | Round-level mode that changes some rules (visibility, movement). |
| **Engagement** | Initiating combat with one or more enemies on a tile. |

---

## 11. Why This Model

The model is **immutable + event-emitting + aggregate-rooted-at-Session** because that combination is what makes the rest of the architecture work:

- *Immutability* → pure rules engine → deterministic replay (ADR-0005) → property-based testing → cheap horizontal scale (ADR-0004).
- *Events* → audit, replay, cross-context integration, observability.
- *Session-as-aggregate-root* → one consistency boundary → simple invariants → single-writer queue (ADR-0004) is sufficient.

Every modeling choice traces back to a SRS requirement; see [`REQUIREMENTS_TRACEABILITY.md`](REQUIREMENTS_TRACEABILITY.md).
