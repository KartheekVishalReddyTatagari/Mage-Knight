"""
Movement rules — terrain costs, reveal logic, illegal-move detection.
(FR-WORLD-03, FR-WORLD-05, FR-WORLD-06)

This module is PURE — no I/O, no randomness, just calculations.
All functions take state and return a result (no side effects).
"""
from __future__ import annotations

from mk_rules.state import HexCoord, Map, MageKnight, TerrainType, Tile


# ─────────────────────────────────────────────────────────────────────────────
# TERRAIN MOVEMENT COSTS  (FR-WORLD-05)
# ─────────────────────────────────────────────────────────────────────────────

# A dictionary mapping TerrainType → movement points needed to enter.
# Think of it like a table: Plains is easy (1 pt), Mountains are hard (3 pts).
TERRAIN_COST: dict[TerrainType, int] = {
    TerrainType.PLAINS:    1,
    TerrainType.FOREST:    2,
    TerrainType.HILLS:     2,
    TerrainType.MOUNTAINS: 3,
    TerrainType.LAKE:      999,  # impassable (effectively infinite cost)
    TerrainType.DESERT:    2,
    TerrainType.SWAMP:     3,
}

# Night phase increases some terrain costs (FR-WORLD-07)
# TODO (TASK T-01-03): create a TERRAIN_COST_NIGHT dict with increased values for some terrains

REVEAL_RANGE = 1   # tiles within this many steps are revealed when you enter a hex


def movement_cost(terrain: TerrainType, is_night: bool = False) -> int:
    """
    How many movement points does it cost to enter this terrain?

    HINT: look up TERRAIN_COST[terrain], then add a penalty if is_night
    and the terrain has increased night cost.

    Example:
        cost = TERRAIN_COST[terrain]
        if is_night and terrain in NIGHT_PENALTY:
            cost += NIGHT_PENALTY[terrain]
        return cost
    """
    # TODO: implement with day/night logic
    return TERRAIN_COST[terrain]   # placeholder — ignores night for now


def is_passable(terrain: TerrainType) -> bool:
    """
    Can a MageKnight enter this terrain at all?
    HINT: return movement_cost(terrain) < 999
    """
    # TODO: implement
    raise NotImplementedError


def can_move(mk: MageKnight, destination: HexCoord, map_: Map,
             available_movement: int, is_night: bool = False) -> tuple[bool, str]:
    """
    Check whether a move is legal. Returns (allowed, reason_if_not).

    Rules to check (FR-WORLD-06):
    1. Is destination adjacent to current position?
       HINT: destination in mk.position.neighbors()
    2. Is there a tile at the destination?
       HINT: map_.get_tile_at(destination) is not None
    3. Is the terrain passable?
    4. Does the player have enough movement points?
       HINT: available_movement >= movement_cost(terrain, is_night)

    Return (True, "") if all checks pass.
    Return (False, "reason") if any check fails.
    """
    # TODO: implement all 4 checks in order
    raise NotImplementedError


def tiles_to_reveal(position: HexCoord, map_: Map) -> list[Tile]:
    """
    Find tiles that should now be revealed because a MageKnight
    entered 'position' (within REVEAL_RANGE steps).

    HINT:
    1. Get neighbors of position (and position itself)
    2. For each coord, check if there's an unrevealed tile at that coord
    3. Return those tiles

    Use: map_.get_tile_at(coord) for each coord in the area
    """
    # TODO: implement
    raise NotImplementedError


def reveal_tiles(tiles: list[Tile], map_: Map) -> Map:
    """
    Return a new Map where all tiles in the list are marked revealed=True.

    HINT:
    1. Build a set of ids to reveal: ids_to_reveal = {t.id for t in tiles}
    2. Rebuild the placed tuple:
       new_placed = tuple(
           replace(t, revealed=True) if t.id in ids_to_reveal else t
           for t in map_.placed
       )
    3. Return Map(placed=new_placed, unplaced=map_.unplaced)
    """
    from dataclasses import replace
    # TODO: implement
    raise NotImplementedError
