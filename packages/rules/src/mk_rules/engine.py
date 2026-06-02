"""
The rules engine — the heart of the entire project.

apply_action() is the SINGLE entry point for ALL game logic.
Nothing else is allowed to modify a Session.

Pattern:
  result = apply_action(session, action, rng)
  if result.error:
      # reject the action — send error back to the player
  else:
      # result.session is the new game state
      # result.events  is the list of things that happened (for broadcast + log)

WHY A RESULT OBJECT instead of raising exceptions?
Exceptions are for unexpected errors (bugs). A player playing an illegal card
is expected — it's a game rule rejection, not a crash.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from mk_rules.actions import (
    AnyAction,
    MoveAction,
    EngageAction,
    PlayCardAction,
    EndPhaseAction,
    EndTurnAction,
    LevelUpChoiceAction,
    RetreatAction,
)
from mk_rules.events import AnyEvent
from mk_rules.rng import Rng
from mk_rules.state import Session


# ─────────────────────────────────────────────────────────────────────────────
# RESULT TYPE
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class ApplyResult:
    """
    What apply_action() returns.
    - On success: session is the NEW state, events is what happened, error is None
    - On failure: session is UNCHANGED, events is [], error describes why
    """
    session: Session
    events:  tuple[AnyEvent, ...]
    error:   Optional[str] = None   # None means success

    @property
    def ok(self) -> bool:
        return self.error is None


def _reject(session: Session, reason: str) -> ApplyResult:
    """Helper — return a failed result without changing state."""
    return ApplyResult(session=session, events=(), error=reason)


def _accept(session: Session, *events: AnyEvent) -> ApplyResult:
    """Helper — return a successful result with the new state and events."""
    return ApplyResult(session=session, events=tuple(events))


# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

def apply_action(session: Session, action: AnyAction, rng: Rng) -> ApplyResult:
    """
    Validate and apply one action to the session.
    Returns a new session + events on success, or an error on failure.

    HOW THE if/elif CHAIN WORKS:
    Python checks isinstance(action, XxxAction) to figure out which handler
    to call. This is the 'dispatch' pattern — route to the right function.

    TASK T-01-08: You need to fill in each handler function below.
    Start with _handle_move, then _handle_end_turn — these are the simplest.
    """

    # ── Guard: session must be in PLAYING state for most actions ─────────────
    from mk_rules.state import SessionState
    if session.state != SessionState.PLAYING:
        # Special case: LevelUpChoiceAction is allowed when PLAYING too —
        # the engine puts up a "waiting for level-up" flag internally.
        # For now, just reject everything if not playing.
        return _reject(session, f"Session is not in PLAYING state (current: {session.state})")

    # ── Guard: actor must be the active player (or in real-time exploration) ──
    active_mk = session.active_mage_knight()
    if action.actor_id != active_mk.id:
        # TODO: for real-time exploration phases this check is relaxed —
        # multiple players can move simultaneously. For now keep it strict.
        return _reject(session, f"It is not {action.actor_id}'s turn")

    # ── Dispatch ──────────────────────────────────────────────────────────────
    if isinstance(action, MoveAction):
        return _handle_move(session, action, rng)

    elif isinstance(action, EngageAction):
        return _handle_engage(session, action, rng)

    elif isinstance(action, PlayCardAction):
        return _handle_play_card(session, action, rng)

    elif isinstance(action, EndPhaseAction):
        return _handle_end_phase(session, action, rng)

    elif isinstance(action, EndTurnAction):
        return _handle_end_turn(session, action, rng)

    elif isinstance(action, LevelUpChoiceAction):
        return _handle_level_up_choice(session, action, rng)

    elif isinstance(action, RetreatAction):
        return _handle_retreat(session, action, rng)

    else:
        return _reject(session, f"Unknown action type: {type(action).__name__}")


# ─────────────────────────────────────────────────────────────────────────────
# ACTION HANDLERS  — one function per action type
# ─────────────────────────────────────────────────────────────────────────────

def _handle_move(session: Session, action: MoveAction, rng: Rng) -> ApplyResult:
    """
    Move a MageKnight to a new hex.

    Steps to implement (TASK T-01-03):
    1. Get the active MageKnight
    2. Import movement.can_move() and movement.movement_cost() from mk_rules.movement
    3. Check if the destination is a neighbor of current position
    4. Check if the player has enough movement points (track them in Session or per-turn state)
    5. Move the MageKnight: create a new MageKnight with updated position
    6. Check if any new tiles should be revealed (call movement.tiles_to_reveal())
    7. Build the updated Session using session.replace_mage_knight(new_mk)
    8. Build the events: [MageKnightMoved(...), TileRevealed(...) for each new tile]
    9. Return _accept(new_session, *events)

    HINT for step 5 — replacing an immutable object:
        from dataclasses import replace
        new_mk = replace(active_mk, position=action.destination)
    """
    # TODO: implement steps 1–9 above
    raise NotImplementedError("_handle_move not yet implemented")


def _handle_engage(session: Session, action: EngageAction, rng: Rng) -> ApplyResult:
    """
    Start a combat encounter.

    Steps (TASK T-01-05):
    1. Find the encounter by action.encounter_id on the current tile
    2. Reject if no encounter found, or if already in combat
    3. Create a Combat object with the enemy units from the encounter
    4. Use dataclasses.replace() to add the combat to the session
    5. Return _accept with CombatStarted event
    """
    # TODO: implement
    raise NotImplementedError("_handle_engage not yet implemented")


def _handle_play_card(session: Session, action: PlayCardAction, rng: Rng) -> ApplyResult:
    """
    Play a card from hand into the current phase.

    Steps (TASK T-01-05 / T-01-06):
    1. Reject if session.combat is None (can only play cards in combat or during move)
    2. Find the card in the active MageKnight's hand by instance_id
    3. Reject if card not found
    4. If action.powered, check mana cost (tracked in per-turn resources)
    5. Remove the card from hand → add to discard (call deck.play_card())
    6. Apply the card's effect (call effects.apply_effect())
    7. Return _accept with CardPlayed event
    """
    # TODO: implement
    raise NotImplementedError("_handle_play_card not yet implemented")


def _handle_end_phase(session: Session, action: EndPhaseAction, rng: Rng) -> ApplyResult:
    """
    Advance the combat phase (Ranged → Block → Attack → Damage → Done).

    Steps (TASK T-01-05):
    1. Reject if not in combat
    2. Get next phase from combat.phase (use CombatPhase enum ordering)
    3. If phase becomes DAMAGE: calculate whether enemies are blocked, deal damage
    4. If phase becomes DONE: resolve combat, award fame/loot, clear combat from session
    5. Return _accept with CombatPhaseAdvanced event (and EnemyDefeated / DamageDealt if applicable)

    HINT for advancing the phase:
        phases = list(CombatPhase)
        current_index = phases.index(session.combat.phase)
        next_phase = phases[current_index + 1]
    """
    # TODO: implement
    raise NotImplementedError("_handle_end_phase not yet implemented")


def _handle_end_turn(session: Session, action: EndTurnAction, rng: Rng) -> ApplyResult:
    """
    End the active player's turn.

    Steps (TASK T-01-04):
    1. Apply hand-size limit: discard the cards in action.cards_to_discard
    2. Verify final hand size ≤ hand_size_max (reject if player tries to keep too many)
    3. Advance current_turn_index → next player
    4. If all players have gone → start new round (increment round_number, flip day/night if needed)
    5. Draw back up to hand size for the NEXT player (call deck.draw_to_hand())
    6. Return _accept with TurnEnded, TurnStarted events

    HINT for advancing the turn index with wraparound:
        next_index = (session.current_turn_index + 1) % len(session.mage_knights)
    """
    # TODO: implement
    raise NotImplementedError("_handle_end_turn not yet implemented")


def _handle_level_up_choice(session: Session, action: LevelUpChoiceAction, rng: Rng) -> ApplyResult:
    """
    Apply the player's level-up choices.

    Steps (TASK T-01-07):
    1. Verify a level-up is actually pending for this MageKnight
    2. Apply stat increases (armor, hand size, command) if chosen
    3. Add the chosen skill / card to the MageKnight
    4. Return _accept with LevelUpResolved event
    """
    # TODO: implement
    raise NotImplementedError("_handle_level_up_choice not yet implemented")


def _handle_retreat(session: Session, action: RetreatAction, rng: Rng) -> ApplyResult:
    """
    Retreat from combat with penalties.

    Steps (TASK T-01-05):
    1. Reject if not in combat, or combat phase doesn't allow retreat
    2. Clear the combat from session
    3. Add wound cards to the retreating MageKnight
    4. Move MageKnight to action.retreat_to if it's a valid destination
    5. Return _accept with CombatEnded(outcome="retreat") event
    """
    # TODO: implement
    raise NotImplementedError("_handle_retreat not yet implemented")
