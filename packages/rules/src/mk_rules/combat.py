"""
Combat resolution — the four-phase system from the board game.
(FR-COMB-01 through FR-COMB-08)

The combat state machine:
  RANGED → BLOCK → ATTACK → DAMAGE → DONE

Each phase: players play cards, then call EndPhaseAction to advance.
This module handles the CALCULATIONS for each transition.
"""
from __future__ import annotations

from dataclasses import replace

from mk_rules.state import Combat, CombatPhase, EnemyUnit, MageKnight


# ─────────────────────────────────────────────────────────────────────────────
# ENEMY ABILITY CONSTANTS  (FR-COMB-06)
# ─────────────────────────────────────────────────────────────────────────────

# Ability names as strings (loaded from content pack for each enemy)
ABILITY_FORTIFIED = "fortified"   # needs 2x block to stop
ABILITY_BRUTAL    = "brutal"      # damage that gets through is doubled
ABILITY_SWIFT     = "swift"       # attacks in the RANGED phase too
ABILITY_FIRE      = "fire"        # physical block has no effect
ABILITY_ICE       = "ice"         # fire block has no effect
ABILITY_POISON    = "poison"      # adds wound cards even if blocked


def enemy_attack_total(enemies: tuple[EnemyUnit, ...], phase: CombatPhase) -> int:
    """
    Total attack power of all enemies combined in this phase.

    HINT:
    - In RANGED phase: only enemies with SWIFT ability attack
    - In ATTACK phase: all enemies attack
    - Otherwise: 0

    Use a generator expression to sum:
        sum(e.attack for e in enemies if ...)
    """
    # TODO: implement
    raise NotImplementedError


def block_needed(enemies: tuple[EnemyUnit, ...]) -> int:
    """
    How much total block value is needed to fully stop the enemy attack.

    HINT: FORTIFIED enemies need double block.
    Sum up: e.attack * 2 if FORTIFIED in e.abilities else e.attack
    """
    return sum(
        e.attack * 2 if ABILITY_FORTIFIED in e.abilities else e.attack
        for e in enemies
    )


def compute_damage_to_player(
    combat: Combat,
    total_block_played: int,
) -> int:
    """
    How much damage does the player take?

    Rule:
    - If total_block_played >= block_needed(enemies): no damage
    - Otherwise: unblocked damage = enemy_attack_total() - total_block_played
    - If any enemy has BRUTAL: unblocked damage is doubled

    HINT:
        needed = block_needed(combat.defending_enemies)
        unblocked = max(0, needed - total_block_played)
        if any(ABILITY_BRUTAL in e.abilities for e in combat.defending_enemies):
            unblocked *= 2
        return unblocked
    """
    needed = block_needed(combat.defending_enemies)
    unblocked = max(0, needed - total_block_played)
    if any(ABILITY_BRUTAL in e.abilities for e in combat.defending_enemies):
        unblocked *= 2
    return unblocked


def damage_to_wounds(damage: int, armor: int) -> int:
    """
    Convert raw damage to wound cards.
    Each point of damage above armor = 1 wound card.
    Minimum 0 wounds.

    HINT: max(0, damage - armor)
    """
    return max(0, damage - armor)


def can_defeat_enemies(attack_total: int, enemies: tuple[EnemyUnit, ...]) -> bool:
    """
    Can the player's combined attack defeat all enemies?
    An enemy is defeated if attack >= its armor.
    (In the real game you assign attack to individual enemies — simplify for MVP)

    HINT: return attack_total >= sum(e.armor for e in enemies)
    """
    return attack_total >= sum(e.armor for e in enemies)


def resolve_ranged_phase(combat: Combat, ranged_attack_played: int) -> Combat:
    """
    Handle the RANGED phase → advance to BLOCK.
    Ranged attack can defeat SWIFT enemies before they strike.

    Returns updated Combat with phase = BLOCK.
    TODO: implement ranged enemy kill logic
    """
    # TODO: filter out SWIFT enemies defeated by ranged attack
    return replace(combat, phase=CombatPhase.BLOCK)


def resolve_block_phase(combat: Combat, total_block: int) -> Combat:
    """
    Record how much block was played → advance to ATTACK.
    """
    return replace(combat, total_block=total_block, phase=CombatPhase.ATTACK)


def resolve_attack_phase(combat: Combat, total_attack: int) -> Combat:
    """
    Record how much attack was played → advance to DAMAGE.
    """
    return replace(combat, total_attack=total_attack, phase=CombatPhase.DAMAGE)


def resolve_damage_phase(
    combat: Combat,
    mage_knights: list[MageKnight],
) -> tuple[Combat, list[MageKnight], int, list[str]]:
    """
    Apply damage to players and check if enemies are defeated.
    Returns (updated_combat, updated_mks, fame_earned, list_of_defeated_enemy_ids).

    Steps:
    1. Compute damage to player using compute_damage_to_player()
    2. Convert damage to wounds using damage_to_wounds()
    3. Add wounds to each affected MageKnight
    4. Check if enemies are defeated using can_defeat_enemies()
    5. Calculate fame from defeated enemies
    6. Return (replace(combat, phase=CombatPhase.DONE), updated_mks, fame, defeated_ids)
    """
    # TODO: implement
    raise NotImplementedError


def next_phase(current: CombatPhase) -> CombatPhase:
    """
    Get the next combat phase in sequence.
    Raises ValueError if called on DONE (can't advance past the end).

    HINT:
        phases = [CombatPhase.RANGED, CombatPhase.BLOCK,
                  CombatPhase.ATTACK, CombatPhase.DAMAGE, CombatPhase.DONE]
        idx = phases.index(current)
        if idx + 1 >= len(phases):
            raise ValueError("Already at final phase")
        return phases[idx + 1]
    """
    phases = [
        CombatPhase.RANGED, CombatPhase.BLOCK,
        CombatPhase.ATTACK, CombatPhase.DAMAGE, CombatPhase.DONE,
    ]
    idx = phases.index(current)
    if idx + 1 >= len(phases):
        raise ValueError(f"Already at final phase: {current}")
    return phases[idx + 1]
