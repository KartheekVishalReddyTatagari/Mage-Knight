"""Tests for combat.py"""
import pytest
from mk_rules.combat import (
    block_needed, compute_damage_to_player, damage_to_wounds,
    can_defeat_enemies, next_phase, enemy_attack_total,
)
from mk_rules.state import Combat, CombatPhase, EnemyUnit


def make_enemy(attack=3, armor=3, abilities=()):
    return EnemyUnit(id="e1", name="Orc", attack=attack, armor=armor,
                     fame_reward=2, abilities=tuple(abilities))


def make_combat(enemies, phase=CombatPhase.RANGED):
    return Combat(
        id="combat-1",
        attacker_ids=("mk-1",),
        defending_enemies=tuple(enemies),
        phase=phase,
    )


def test_block_needed_normal_enemy():
    enemy = make_enemy(attack=3)
    assert block_needed((enemy,)) == 3


def test_block_needed_fortified_enemy():
    """Fortified enemies need double block."""
    enemy = make_enemy(attack=3, abilities=("fortified",))
    assert block_needed((enemy,)) == 6


def test_no_damage_when_fully_blocked():
    enemy = make_enemy(attack=4)
    combat = make_combat([enemy])
    # Play 4 block points — exactly enough
    damage = compute_damage_to_player(combat, total_block_played=4)
    assert damage == 0


def test_damage_when_partially_blocked():
    enemy = make_enemy(attack=4)
    combat = make_combat([enemy])
    # Only 2 block played — 2 damage gets through
    damage = compute_damage_to_player(combat, total_block_played=2)
    assert damage == 2


def test_brutal_doubles_unblocked_damage():
    enemy = make_enemy(attack=4, abilities=("brutal",))
    combat = make_combat([enemy])
    # 2 unblocked × 2 (brutal) = 4
    damage = compute_damage_to_player(combat, total_block_played=2)
    assert damage == 4


def test_damage_to_wounds_below_armor():
    """Damage that doesn't exceed armor gives 0 wounds."""
    assert damage_to_wounds(damage=2, armor=2) == 0


def test_damage_to_wounds_above_armor():
    """Each point above armor = 1 wound."""
    assert damage_to_wounds(damage=5, armor=2) == 3


def test_can_defeat_enemies():
    enemy = make_enemy(armor=4)
    assert can_defeat_enemies(attack_total=4, enemies=(enemy,)) is True
    assert can_defeat_enemies(attack_total=3, enemies=(enemy,)) is False


def test_next_phase_sequence():
    assert next_phase(CombatPhase.RANGED) == CombatPhase.BLOCK
    assert next_phase(CombatPhase.BLOCK)  == CombatPhase.ATTACK
    assert next_phase(CombatPhase.ATTACK) == CombatPhase.DAMAGE
    assert next_phase(CombatPhase.DAMAGE) == CombatPhase.DONE


def test_next_phase_raises_at_done():
    with pytest.raises(ValueError):
        next_phase(CombatPhase.DONE)
