"""
State types for Mage Knight Online — the game world in pure data.

KEY CONCEPT: every class here is IMMUTABLE (frozen=True on the dataclass).
This means once a Session is created, you can never change it in place.
Instead the rules engine creates a BRAND NEW Session with the change applied.
This is what makes replay and testing easy — you always have a clean copy.

HOW TO READ THIS FILE:
- @dataclass(frozen=True)  → an immutable data container (like a record/struct)
- Enum                      → a fixed set of named values (like a dropdown)
- tuple[X, ...]             → an immutable list of X items (tuples can't be changed)
- X | None                  → either an X or nothing (None = "not set yet")
- raise NotImplementedError → YOUR JOB: replace this with real logic
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from enum import Enum, auto


# ─────────────────────────────────────────────────────────────────────────────
# ENUMERATIONS  (fixed sets of allowed values)
# ─────────────────────────────────────────────────────────────────────────────

class TerrainType(Enum):
    """The 7 terrain types from the SRS (FR-WORLD-02)."""
    PLAINS    = auto()
    FOREST    = auto()
    HILLS     = auto()
    MOUNTAINS = auto()
    LAKE      = auto()
    DESERT    = auto()
    SWAMP     = auto()


class DayPhase(Enum):
    """Whether it is currently day or night (FR-WORLD-07)."""
    DAY   = auto()
    NIGHT = auto()


class SessionMode(Enum):
    """The three game modes a session can be created in (FR-SES-01)."""
    SOLO    = auto()
    COOP    = auto()
    VERSUS  = auto()


class SessionState(Enum):
    """The lifecycle state of a session (FR-SES-01..06)."""
    LOBBY   = auto()
    PLAYING = auto()
    PAUSED  = auto()
    ENDED   = auto()


class CombatPhase(Enum):
    """
    The four phases of a combat encounter (FR-COMB-02).
    Combat always moves forward through these phases — never backwards.
    """
    RANGED = auto()   # player can play ranged-attack cards
    BLOCK  = auto()   # player can play block cards to reduce enemy attack
    ATTACK = auto()   # player attacks with remaining cards
    DAMAGE = auto()   # damage is calculated and applied
    DONE   = auto()   # combat is resolved


class DeckZoneKind(Enum):
    """
    Which zone a card is currently in.
    Cards must always be in exactly ONE zone — this is Invariant 6.1.
    """
    DECK             = auto()
    HAND             = auto()
    DISCARD          = auto()
    ADVANCED_ACTIONS = auto()
    SPELLS           = auto()
    ARTIFACTS        = auto()
    UNITS            = auto()


class CardColor(Enum):
    """Card colours affect which mana type can power them."""
    WHITE = auto()
    BLUE  = auto()
    RED   = auto()
    GREEN = auto()
    GOLD  = auto()   # wound cards and special cards


# ─────────────────────────────────────────────────────────────────────────────
# VALUE OBJECTS  (no identity — equal when all fields are equal)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class HexCoord:
    """
    Axial coordinates for the hex grid.
    See: https://www.redblobgames.com/grids/hexagons/ for the math.

    TASK T-01-03: You will use this in movement.py
    """
    q: int
    r: int

    def neighbors(self) -> list[HexCoord]:
        """
        Return the 6 tiles that share an edge with this one.

        HINT: In axial coordinates the 6 directions are offsets:
          (1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)
        Use a list comprehension:
          [HexCoord(self.q + dq, self.r + dr) for dq, dr in DIRECTIONS]
        """
        # TODO: define DIRECTIONS as a list of (dq, dr) tuples, then return neighbors
        raise NotImplementedError

    def distance_to(self, other: HexCoord) -> int:
        """
        Hex distance using the axial formula.

        HINT: the formula is:
          (abs(self.q - other.q)
           + abs(self.q + self.r - other.q - other.r)
           + abs(self.r - other.r)) // 2
        """
        # TODO: implement this formula
        raise NotImplementedError


@dataclass(frozen=True)
class TerrainHex:
    """One of the 7 hex cells that make up a tile."""
    coord:   HexCoord
    terrain: TerrainType


@dataclass(frozen=True)
class CardDef:
    """
    The 'blueprint' for a card — loaded from packages/content/cards/*.json.
    Multiple CardInstances can share the same CardDef (you own 3 "March" cards,
    all with card_def_id="march" but different instance_ids).
    """
    id:             str        # e.g. "march"
    name:           str        # e.g. "March"
    color:          CardColor
    basic_effect:   tuple      # list of effect descriptors (see ADR-0003)
    powered_effect: tuple      # enhanced version when mana is spent
    cost:           int        # mana needed to power (0 = can't be powered)


@dataclass(frozen=True)
class CardInstance:
    """
    One physical copy of a card belonging to a MageKnight.
    The instance_id is unique; the card_def_id says what kind of card it is.
    """
    instance_id:  str
    card_def_id:  str

    @staticmethod
    def new(card_def_id: str) -> CardInstance:
        """Create a new card instance with a random unique ID."""
        # uuid4() generates a random unique string — safe to use as an ID
        return CardInstance(instance_id=str(uuid.uuid4()), card_def_id=card_def_id)


@dataclass(frozen=True)
class DeckZone:
    """
    A collection of cards in one zone (e.g. your Hand or your Deck).

    IMPORTANT: Because this is frozen (immutable), you can never do:
        zone.cards.append(card)   ← this would crash!
    Instead every "change" returns a NEW DeckZone:
        new_zone = zone.add(card)
    """
    kind:  DeckZoneKind
    cards: tuple[CardInstance, ...]  # tuple = immutable list

    def add(self, card: CardInstance) -> DeckZone:
        """
        Return a new DeckZone that contains this card added at the end.

        HINT: you can concatenate tuples with +:
            self.cards + (card,)      ← note the trailing comma — (card,) is a 1-element tuple
        Then wrap it in DeckZone(kind=self.kind, cards=...)
        """
        return DeckZone(kind=self.kind, cards=self.cards + (card,))

    def remove(self, instance_id: str) -> tuple[DeckZone, CardInstance]:
        """
        Remove the card with the given instance_id.
        Returns (new_zone_without_the_card, the_removed_card).
        Raises ValueError if the card is not found.

        HINT:
          1. Use next() with a generator to find the card
          2. Build a new tuple excluding it:
             remaining = tuple(c for c in self.cards if c.instance_id != instance_id)
        """
        card = next((c for c in self.cards if c.instance_id == instance_id), None)
        if card is None:
            raise ValueError(f"Card {instance_id!r} not found in zone")
        remaining = tuple(c for c in self.cards if c.instance_id != instance_id)
        return DeckZone(kind=self.kind, cards=remaining), card

    def __len__(self) -> int:
        return len(self.cards)

    def is_empty(self) -> bool:
        return len(self.cards) == 0


# ─────────────────────────────────────────────────────────────────────────────
# ENTITIES  (have a unique identity that persists across state changes)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class EnemyUnit:
    """An enemy — loaded from packages/content/enemies/*.json."""
    id:           str
    name:         str
    attack:       int
    armor:        int
    fame_reward:  int
    abilities:    tuple[str, ...]   # e.g. ("fortified",) or ("brutal", "swift")


@dataclass(frozen=True)
class Encounter:
    """An encounter on a tile — a group of enemies (or a site) waiting to be engaged."""
    id:       str
    tile_id:  str
    position: HexCoord
    enemies:  tuple[EnemyUnit, ...]


@dataclass(frozen=True)
class Tile:
    """
    One hex region of the game map.
    Each tile has exactly 7 terrain hexes and 0..n encounters.
    'revealed' starts False; becomes True when a MageKnight enters reveal range.
    """
    id:         str
    type:       str               # "country" | "core" | "city"
    position:   HexCoord
    rotation:   int               # 0–5
    hexes:      tuple[TerrainHex, ...]   # always 7
    encounters: tuple[Encounter, ...]
    revealed:   bool = False


@dataclass(frozen=True)
class Map:
    """
    The game world — placed tiles (visible) + unplaced pool (draw pile).
    """
    placed:   tuple[Tile, ...]   # tiles on the board
    unplaced: tuple[Tile, ...]   # tiles still in the bag

    def get_tile_at(self, coord: HexCoord) -> Tile | None:
        """
        Find a placed tile by its board position.

        HINT: use a for loop or next() with a generator expression:
            next((t for t in self.placed if t.position == coord), None)
        The None at the end means "return None if nothing is found".
        """
        # TODO: find and return the tile, or None if not there
        raise NotImplementedError

    def revealed_tiles(self) -> tuple[Tile, ...]:
        """Return only the tiles that have been revealed."""
        # HINT: tuple(t for t in self.placed if t.revealed)
        # TODO: implement
        raise NotImplementedError


@dataclass(frozen=True)
class Combat:
    """
    An in-progress combat encounter. At most one exists per session.
    The phase advances as players commit cards (FR-COMB-02).
    """
    id:                str
    attacker_ids:      tuple[str, ...]      # MageKnight ids involved
    defending_enemies: tuple[EnemyUnit, ...]
    phase:             CombatPhase = CombatPhase.RANGED
    total_block:       int = 0
    total_attack:      int = 0
    damage_to_players: int = 0


@dataclass(frozen=True)
class MageKnight:
    """
    The player's avatar — contains all in-session state for one player.
    Bound to a session; NOT persisted across sessions (FR-PROG-05 is handled
    by the ProgressionService which reads the SessionEnded event).
    """
    id:               str
    owner_account_id: str
    name:             str

    # Progression (grows as you gain fame)
    level:        int = 1
    fame:         int = 0
    reputation:   int = 0    # clamped to [-7, +7]

    # Combat stats — increase on level-up (FR-PROG-04)
    armor:          int = 2
    hand_size_max:  int = 5
    command_max:    int = 2

    # Position on the map
    position: HexCoord = field(default_factory=lambda: HexCoord(0, 0))
    wounds:   int = 0

    # Card zones
    deck:    DeckZone = field(default_factory=lambda: DeckZone(DeckZoneKind.DECK, ()))
    hand:    DeckZone = field(default_factory=lambda: DeckZone(DeckZoneKind.HAND, ()))
    discard: DeckZone = field(default_factory=lambda: DeckZone(DeckZoneKind.DISCARD, ()))
    # TODO: add advanced_actions, spells, artifacts, units zones

    def is_knocked_out(self) -> bool:
        """
        A MageKnight is knocked out when wounds fill all hand slots.
        HINT: return self.wounds >= self.hand_size_max
        """
        return self.wounds >= self.hand_size_max

    def total_card_count(self) -> int:
        """
        Total cards across ALL zones. Must stay constant — Invariant 6.1.
        HINT: sum up len(self.deck) + len(self.hand) + len(self.discard)
        """
        return len(self.deck) + len(self.hand) + len(self.discard)

    def replace_zone(self, new_zone: DeckZone) -> MageKnight:
        """
        Return a new MageKnight with one zone replaced.
        This is how we 'mutate' an immutable object — replace and return new.

        HINT: use dataclasses.replace():
            from dataclasses import replace
            if new_zone.kind == DeckZoneKind.HAND:
                return replace(self, hand=new_zone)
            elif new_zone.kind == DeckZoneKind.DECK:
                return replace(self, deck=new_zone)
            # etc.
        """
        from dataclasses import replace
        if new_zone.kind == DeckZoneKind.DECK:
            return replace(self, deck=new_zone)
        if new_zone.kind == DeckZoneKind.HAND:
            return replace(self, hand=new_zone)
        if new_zone.kind == DeckZoneKind.DISCARD:
            return replace(self, discard=new_zone)
        raise ValueError(f"Unsupported zone kind: {new_zone.kind}")


@dataclass(frozen=True)
class Session:
    """
    THE aggregate root. All gameplay state lives here.
    apply_action() in engine.py is the ONLY way to create a new Session.
    Direct mutation is forbidden — the frozen dataclass enforces this.
    """
    id:           str
    mode:         SessionMode
    scenario_id:  str

    mage_knights: tuple[MageKnight, ...]
    map:          Map
    combat:       Combat | None = None   # None when not in combat

    round_number:        int = 1
    day_phase:           DayPhase = DayPhase.DAY
    current_turn_index:  int = 0
    state:               SessionState = SessionState.LOBBY
    rng_seed:            int = 0

    def active_mage_knight(self) -> MageKnight:
        """
        The MageKnight whose turn it currently is.
        HINT: self.mage_knights[self.current_turn_index]
        """
        # TODO: implement
        raise NotImplementedError

    def get_mage_knight(self, mk_id: str) -> MageKnight | None:
        """
        Find a MageKnight by their id, or return None.
        HINT: next((mk for mk in self.mage_knights if mk.id == mk_id), None)
        """
        # TODO: implement
        raise NotImplementedError

    def replace_mage_knight(self, updated_mk: MageKnight) -> Session:
        """
        Return a new Session with one MageKnight replaced (same id, new data).
        HINT:
          new_mks = tuple(
              updated_mk if mk.id == updated_mk.id else mk
              for mk in self.mage_knights
          )
          from dataclasses import replace
          return replace(self, mage_knights=new_mks)
        """
        # TODO: implement
        raise NotImplementedError
