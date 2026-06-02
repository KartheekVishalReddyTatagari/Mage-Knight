"""
Action types — the things a player (or AI) can DO on their turn.

KEY CONCEPT: A 'discriminated union' means one type that can be ANY of several
sub-types. In Python we do this with:
  - A base dataclass (Action)
  - Subclasses for each specific action type
  - Union[MoveAction, PlayCardAction, ...] to say "any of these"

The rules engine receives ONE action at a time and switches on its type.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Union

from mk_rules.state import HexCoord


# ─────────────────────────────────────────────────────────────────────────────
# BASE  (all actions share these fields)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class Action:
    """
    Every action has:
    - session_id: which game this belongs to
    - actor_id:   which MageKnight is doing it (the server checks this matches the active player)
    """
    session_id: str
    actor_id:   str   # MageKnight id


# ─────────────────────────────────────────────────────────────────────────────
# EXPLORATION ACTIONS
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class MoveAction(Action):
    """
    Move a MageKnight to an adjacent hex.
    The engine will check:
      - Is destination adjacent?
      - Does the player have enough movement points?
      - Is it passable terrain?
      - Does moving here reveal a new tile?
    """
    destination: HexCoord


@dataclass(frozen=True)
class EngageAction(Action):
    """
    Initiate combat with enemies at the current hex.
    Transitions the session into a Combat state (FR-COMB-01).
    """
    encounter_id: str


@dataclass(frozen=True)
class InteractAction(Action):
    """
    Interact with a site (monastery, marketplace, ruin).
    Used for shopping, healing, and exploring sites.
    """
    encounter_id: str
    interaction_type: str   # "shop" | "heal" | "explore"


# ─────────────────────────────────────────────────────────────────────────────
# CARD ACTIONS
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class PlayCardAction(Action):
    """
    Play a card from hand into the current phase.
    powered=False → use basic_effect
    powered=True  → spend mana, use powered_effect  (FR-CARD-04)
    """
    card_instance_id: str
    powered:          bool = False
    target_id:        str | None = None   # optional: which enemy/hex to target


@dataclass(frozen=True)
class EndPhaseAction(Action):
    """
    Declare that you are done playing cards in the current combat phase.
    The engine will advance CombatPhase to the next step.
    """
    pass   # no extra fields needed — actor_id says who is ending their phase


@dataclass(frozen=True)
class EndTurnAction(Action):
    """
    End your entire turn.
    The engine will:
      1. Apply the hand-size limit (discard down to hand_size_max) — FR-CARD-03
      2. Move current_turn_index to the next player
      3. Start a new round if all players have gone
    """
    cards_to_discard: tuple[str, ...]   # instance_ids to discard if over limit


# ─────────────────────────────────────────────────────────────────────────────
# PROGRESSION ACTIONS
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class LevelUpChoiceAction(Action):
    """
    Player picks their level-up rewards (FR-PROG-03).
    The engine checks that the choices are valid for the current offer.
    """
    chosen_skill_id:       str | None = None
    chosen_card_def_id:    str | None = None
    take_armor_increase:   bool = False
    take_hand_increase:    bool = False
    take_command_increase: bool = False


@dataclass(frozen=True)
class AcquireCardAction(Action):
    """
    Acquire a new card from an offer row at a site (FR-CARD-05).
    """
    card_def_id:   str
    target_zone:   str   # "advanced_actions" | "spells" | "artifacts"


@dataclass(frozen=True)
class RecruitUnitAction(Action):
    """
    Recruit a follower unit up to command_max (FR-CARD-06).
    """
    unit_def_id: str


@dataclass(frozen=True)
class RetreatAction(Action):
    """
    Retreat from combat under defined conditions (FR-COMB-08).
    Incurs movement/wound penalties.
    """
    retreat_to: HexCoord


# ─────────────────────────────────────────────────────────────────────────────
# TYPE ALIAS — use this everywhere instead of listing all types
# ─────────────────────────────────────────────────────────────────────────────

AnyAction = Union[
    MoveAction,
    EngageAction,
    InteractAction,
    PlayCardAction,
    EndPhaseAction,
    EndTurnAction,
    LevelUpChoiceAction,
    AcquireCardAction,
    RecruitUnitAction,
    RetreatAction,
]
