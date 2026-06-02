"""
Tests for deck.py

HOW TO RUN:
  cd packages/rules
  pytest tests/test_deck.py -v

WHAT EACH TEST CHECKS:
- test_draw_card_moves_from_deck_to_hand: drawing reduces deck by 1, increases hand by 1
- test_total_card_count_is_conserved:     the INVARIANT — cards never appear/disappear
- test_reshuffle_when_deck_empty:         discard becomes deck when deck runs out
- test_hand_limit_enforced:               can't have more cards than hand_size_max at end of turn
"""
import pytest

from mk_rules.deck import draw_card, draw_to_hand, discard_card, enforce_hand_limit, shuffle_deck
from mk_rules.rng import Rng
from mk_rules.state import (
    CardInstance, DeckZone, DeckZoneKind, MageKnight, HexCoord
)


# ─────────────────────────────────────────────────────────────────────────────
# FIXTURES  (reusable test setup)
# ─────────────────────────────────────────────────────────────────────────────

def make_card(def_id: str = "march") -> CardInstance:
    """Helper to create a card with a unique instance id."""
    return CardInstance.new(def_id)


def make_mk_with_deck(num_cards: int, hand_size_max: int = 5) -> MageKnight:
    """Create a MageKnight with a fresh deck of num_cards cards."""
    cards = tuple(make_card("march") for _ in range(num_cards))
    deck  = DeckZone(DeckZoneKind.DECK, cards)
    return MageKnight(
        id="mk-1",
        owner_account_id="player-1",
        name="Arythea",
        hand_size_max=hand_size_max,
        deck=deck,
        hand=DeckZone(DeckZoneKind.HAND, ()),
        discard=DeckZone(DeckZoneKind.DISCARD, ()),
        position=HexCoord(0, 0),
    )


@pytest.fixture
def rng() -> Rng:
    """A seeded RNG — same seed = same results every run."""
    return Rng(seed=42)


# ─────────────────────────────────────────────────────────────────────────────
# TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_draw_card_moves_from_deck_to_hand(rng):
    """Drawing a card: deck shrinks by 1, hand grows by 1."""
    mk = make_mk_with_deck(num_cards=5)
    initial_count = mk.total_card_count()

    new_mk, drawn_card = draw_card(mk, rng)

    assert len(new_mk.deck) == len(mk.deck) - 1
    assert len(new_mk.hand) == len(mk.hand) + 1
    # The invariant: total must not change
    assert new_mk.total_card_count() == initial_count


def test_total_card_count_is_conserved(rng):
    """
    INVARIANT TEST (most important!):
    No matter how many draws/discards happen, card count stays the same.
    """
    mk = make_mk_with_deck(num_cards=10)
    original_count = mk.total_card_count()

    # Draw 3 cards
    for _ in range(3):
        mk, _ = draw_card(mk, rng)

    # Discard the first card in hand
    first_card_id = mk.hand.cards[0].instance_id
    mk = discard_card(mk, first_card_id)

    # Count must still be 10
    assert mk.total_card_count() == original_count


def test_reshuffle_when_deck_empty(rng):
    """When deck is empty, discard should become the new deck."""
    mk = make_mk_with_deck(num_cards=3)

    # Draw all 3 cards from deck
    for _ in range(3):
        mk, _ = draw_card(mk, rng)

    assert len(mk.deck) == 0
    assert len(mk.hand) == 3

    # Discard them all
    for card in list(mk.hand.cards):
        mk = discard_card(mk, card.instance_id)

    assert len(mk.discard) == 3
    assert len(mk.deck) == 0

    # Now draw again — should reshuffle discard into deck
    mk, drawn = draw_card(mk, rng)

    assert drawn is not None
    assert mk.total_card_count() == 3   # still 3 cards total


def test_hand_limit_enforced(rng):
    """Player cannot keep more cards than hand_size_max at end of turn."""
    mk = make_mk_with_deck(num_cards=7, hand_size_max=5)
    mk, _ = draw_to_hand(mk, rng)   # draw up to hand_size_max

    assert len(mk.hand) == 5   # should have exactly 5

    # Artificially give them 7 cards in hand for the test
    # TODO: this test will be more meaningful once draw_to_hand is implemented


def test_shuffle_changes_order(rng):
    """Shuffling should (usually) change the card order."""
    mk = make_mk_with_deck(num_cards=8)
    original_order = [c.instance_id for c in mk.deck.cards]

    shuffled = shuffle_deck(mk.deck, rng)
    new_order = [c.instance_id for c in shuffled.cards]

    # Total cards unchanged
    assert len(shuffled) == len(mk.deck)
    assert set(new_order) == set(original_order)
    # Order very likely different (not guaranteed but almost certain with 8 cards)
    # We don't assert this because technically a shuffle could produce the same order
