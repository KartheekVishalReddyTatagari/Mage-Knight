"""
Domain Events — things that HAPPENED as a result of an action.

When apply_action() succeeds it returns (new_state, list_of_events).
Events are used for:
  - Broadcasting to players via WebSocket (each player gets their filtered view)
  - Writing to the action log in Postgres
  - Triggering cross-context updates (e.g. SessionEnded → Progression)

KEY CONCEPT: Events are named in PAST TENSE — they describe something that
already happened, not something that is going to happen.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Union

from mk_rules.state import HexCoord, CombatPhase, DayPhase


@dataclass(frozen=True)
class DomainEvent:
    """Base for all events. Every event knows which session it belongs to."""
    session_id: str


# ─────────────────────────────────────────────────────────────────────────────
# MOVEMENT EVENTS
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class MageKnightMoved(DomainEvent):
    mage_knight_id: str
    from_coord:     HexCoord
    to_coord:       HexCoord
    move_cost:      int


@dataclass(frozen=True)
class TileRevealed(DomainEvent):
    """Fired when a tile enters the reveal range of a moving MageKnight."""
    tile_id:     str
    position:    HexCoord
    terrain_map: dict   # coord → terrain — sent to ALL players (no secrets here)
    encounters:  list   # list of encounter summaries visible to all


# ─────────────────────────────────────────────────────────────────────────────
# CARD EVENTS
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class CardDrawn(DomainEvent):
    """
    Fired when a MageKnight draws a card.
    NOTE: card_def_id is only included in the event sent to the OWNER.
    Other players just see that a card was drawn (not which one) — NFR-SEC-04.
    """
    mage_knight_id:   str
    card_instance_id: str
    card_def_id:      str   # stripped by PerPlayerViewFilter for non-owners


@dataclass(frozen=True)
class CardPlayed(DomainEvent):
    mage_knight_id:   str
    card_instance_id: str
    card_def_id:      str
    powered:          bool
    effects_resolved: list   # list of resolved effect results


@dataclass(frozen=True)
class CardDiscarded(DomainEvent):
    mage_knight_id:   str
    card_instance_id: str


# ─────────────────────────────────────────────────────────────────────────────
# COMBAT EVENTS
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class CombatStarted(DomainEvent):
    attacker_ids:      tuple[str, ...]
    defending_enemies: list   # serialized enemy data


@dataclass(frozen=True)
class CombatPhaseAdvanced(DomainEvent):
    new_phase: CombatPhase


@dataclass(frozen=True)
class DamageDealt(DomainEvent):
    target_id:  str   # enemy id or mage_knight id
    amount:     int
    is_wounds:  bool  # True = damage exceeded armor → wound card added


@dataclass(frozen=True)
class EnemyDefeated(DomainEvent):
    enemy_id:     str
    fame_awarded: int
    loot:         list   # list of loot items


@dataclass(frozen=True)
class MageKnightWounded(DomainEvent):
    mage_knight_id: str
    wounds_added:   int
    total_wounds:   int


@dataclass(frozen=True)
class CombatEnded(DomainEvent):
    outcome:      str   # "victory" | "retreat" | "defeat"
    fame_awarded: int
    loot:         list


# ─────────────────────────────────────────────────────────────────────────────
# PROGRESSION EVENTS
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class FameChanged(DomainEvent):
    mage_knight_id: str
    delta:          int   # positive = gained fame
    new_total:      int


@dataclass(frozen=True)
class LevelUpOffered(DomainEvent):
    """Fired when fame crosses a level threshold — triggers the level-up UI."""
    mage_knight_id:    str
    new_level:         int
    skill_choices:     list
    card_choices:      list
    armor_available:   bool
    hand_available:    bool
    command_available: bool


@dataclass(frozen=True)
class LevelUpResolved(DomainEvent):
    mage_knight_id: str
    new_level:      int
    changes:        dict   # what the player chose


# ─────────────────────────────────────────────────────────────────────────────
# SESSION EVENTS
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class RoundStarted(DomainEvent):
    round_number: int
    day_phase:    DayPhase


@dataclass(frozen=True)
class TurnStarted(DomainEvent):
    mage_knight_id: str
    round_number:   int


@dataclass(frozen=True)
class TurnEnded(DomainEvent):
    mage_knight_id: str


@dataclass(frozen=True)
class SessionEnded(DomainEvent):
    """
    Fired when the game is over.
    The Progression service listens for this and writes lifetime stats.
    """
    outcome:  str    # "victory" | "defeat" | "timeout"
    scores:   dict   # mage_knight_id → final score


# ─────────────────────────────────────────────────────────────────────────────
# TYPE ALIAS
# ─────────────────────────────────────────────────────────────────────────────

AnyEvent = Union[
    MageKnightMoved, TileRevealed,
    CardDrawn, CardPlayed, CardDiscarded,
    CombatStarted, CombatPhaseAdvanced, DamageDealt,
    EnemyDefeated, MageKnightWounded, CombatEnded,
    FameChanged, LevelUpOffered, LevelUpResolved,
    RoundStarted, TurnStarted, TurnEnded, SessionEnded,
]
