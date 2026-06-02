"""
Fame, reputation, and level-up rules. (FR-PROG-01 through FR-PROG-04)
"""
from __future__ import annotations

from mk_rules.state import MageKnight


# Fame thresholds per level from the Mage Knight rulebook.
# Index = level, value = total fame needed to REACH that level.
FAME_THRESHOLDS: list[int] = [
    0,    # level 1 — starting level
    3,    # level 2
    8,    # level 3
    14,   # level 4
    21,   # level 5
    30,   # level 6
    40,   # level 7 (max)
]

# Reputation bounds (SRS §7.2: "bounded to [-7, +7]")
REP_MIN = -7
REP_MAX = +7


def level_for_fame(fame: int) -> int:
    """
    Calculate what level a MageKnight should be at for a given fame total.

    HINT: loop through FAME_THRESHOLDS in reverse (from highest to lowest).
    The first threshold that is <= fame is the current level.

    Example:
        for level, threshold in reversed(list(enumerate(FAME_THRESHOLDS))):
            if fame >= threshold:
                return level + 1   # levels are 1-indexed
        return 1
    """
    # TODO: implement
    raise NotImplementedError


def add_fame(mk: MageKnight, amount: int) -> tuple[MageKnight, bool]:
    """
    Add fame to a MageKnight. Returns (new_mk, levelled_up).

    Steps:
    1. old_level = level_for_fame(mk.fame)
    2. new_fame  = mk.fame + amount
    3. new_level = level_for_fame(new_fame)
    4. levelled_up = new_level > old_level
    5. Use dataclasses.replace() to create new_mk with updated fame (and level if needed)
    6. Return (new_mk, levelled_up)
    """
    from dataclasses import replace
    # TODO: implement
    raise NotImplementedError


def clamp_reputation(rep: int) -> int:
    """
    Reputation is always between REP_MIN and REP_MAX.
    HINT: return max(REP_MIN, min(REP_MAX, rep))
    """
    # TODO: implement
    raise NotImplementedError


def add_reputation(mk: MageKnight, delta: int) -> MageKnight:
    """
    Change reputation by delta, clamped to [-7, +7].
    HINT: use clamp_reputation(mk.reputation + delta)
    """
    from dataclasses import replace
    # TODO: implement
    raise NotImplementedError
