"""
Deck operations — shuffle, draw, discard, hand enforcement.
(FR-CARD-01, FR-CARD-02, FR-CARD-03)

KEY INVARIANT: total card count per MageKnight never changes within a session
(except when cards are explicitly acquired or destroyed).
Every function here must preserve that invariant.
"""
from __future__ import annotations

import random

from mk_rules.rng import Rng
from mk_rules.state import (
    CardInstance, DeckZone, DeckZoneKind, MageKnight
)


def shuffle_deck(zone: DeckZone, rng: Rng) -> DeckZone:
    """
    Return a new DeckZone with cards in a random order.

    HINT:
    1. Convert the tuple to a list:  cards = list(zone.cards)
    2. Shuffle it using rng:         rng.shuffle(cards)
    3. Convert back to tuple and return DeckZone(kind=zone.kind, cards=tuple(cards))

    WHY use rng instead of random.shuffle?
    Because rng is seeded per session — so the server can always replay
    the exact same shuffle from the same seed. (See ADR-0005)
    """
    # TODO: implement
    raise NotImplementedError


def draw_card(mk: MageKnight, rng: Rng) -> tuple[MageKnight, CardInstance]:
    """
    Draw one card from the deck into the hand.
    If the deck is empty, shuffle the discard pile into a new deck first.
    Returns (new_mage_knight, the_card_that_was_drawn).

    Steps:
    1. If deck is empty AND discard is not empty → reshuffle:
         new_deck = shuffle_deck(mk.discard, rng)  ← discard becomes new deck
         mk = replace(mk, deck=new_deck, discard=DeckZone(DeckZoneKind.DISCARD, ()))
    2. If deck is STILL empty → raise ValueError("Deck is empty")
    3. Take the first card from the deck:
         card = mk.deck.cards[0]
         new_deck = DeckZone(DeckZoneKind.DECK, mk.deck.cards[1:])
    4. Add it to hand:
         new_hand = mk.hand.add(card)
    5. Return replace(mk, deck=new_deck, hand=new_hand), card
    """
    from dataclasses import replace
    # TODO: implement steps 1–5
    raise NotImplementedError


def draw_to_hand(mk: MageKnight, rng: Rng) -> tuple[MageKnight, list[CardInstance]]:
    """
    Draw cards until the hand is full (len(hand) == hand_size_max).
    Stops early if the deck + discard run out.
    Returns (new_mage_knight, list_of_drawn_cards).

    HINT: use a while loop:
        drawn = []
        while len(mk.hand) < mk.hand_size_max:
            try:
                mk, card = draw_card(mk, rng)
                drawn.append(card)
            except ValueError:
                break   # ran out of cards — stop drawing
        return mk, drawn
    """
    # TODO: implement
    raise NotImplementedError


def discard_card(mk: MageKnight, instance_id: str) -> MageKnight:
    """
    Move one card from hand to the discard pile.
    Raises ValueError if the card is not in hand.

    HINT:
    1. new_hand, card = mk.hand.remove(instance_id)
    2. new_discard = mk.discard.add(card)
    3. return replace(mk, hand=new_hand, discard=new_discard)
    """
    from dataclasses import replace
    # TODO: implement
    raise NotImplementedError


def enforce_hand_limit(mk: MageKnight, cards_to_discard: tuple[str, ...]) -> tuple[MageKnight, str | None]:
    """
    At end of turn: ensure hand size ≤ hand_size_max (FR-CARD-03).
    Player specifies which cards to discard in cards_to_discard.

    Returns (new_mk, error_message_or_None).

    Rules:
    - If len(hand) <= hand_size_max: nothing to do (ignore cards_to_discard)
    - If len(hand) > hand_size_max:
        - Player MUST discard exactly (len(hand) - hand_size_max) cards
        - If they discard too few or too many → return error message
        - Otherwise discard each card in cards_to_discard
    """
    # TODO: implement the validation + loop through cards_to_discard calling discard_card()
    raise NotImplementedError


def play_card(mk: MageKnight, instance_id: str) -> tuple[MageKnight, CardInstance]:
    """
    Remove a card from hand (goes to discard after its effect is resolved).
    Returns (new_mk_without_card_in_hand, the_card).

    HINT: same as discard_card but we call hand.remove() and add to discard.
    The card stays in play briefly while its effect is resolved in engine.py.
    """
    # TODO: implement
    raise NotImplementedError
