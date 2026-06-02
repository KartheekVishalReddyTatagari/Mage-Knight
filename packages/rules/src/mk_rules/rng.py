"""
Server-side randomness — seeded per session for deterministic replay.
(SRS §6.4, FR-CARD-02)

WHY WRAP random.Random?
Python's built-in random module has a global state — if two sessions
use it at the same time, they interfere with each other.
By creating one Random instance PER SESSION (seeded with the session seed),
each session's randomness is isolated and reproducible.
"""
from __future__ import annotations

import random
import secrets
from typing import TypeVar

T = TypeVar("T")


class Rng:
    """
    A per-session random number generator.
    Created once when the session starts; passed into every function that needs randomness.
    """

    def __init__(self, seed: int) -> None:
        # random.Random(seed) creates an isolated RNG instance with that seed.
        # Two Rng objects with the same seed will produce IDENTICAL sequences.
        self._rng = random.Random(seed)

    def shuffle(self, items: list) -> None:
        """Shuffle a list IN PLACE (modifies the list directly)."""
        self._rng.shuffle(items)

    def choice(self, items: list[T]) -> T:
        """Pick one random item from a list."""
        return self._rng.choice(items)

    def randint(self, lo: int, hi: int) -> int:
        """Return a random integer between lo and hi (inclusive)."""
        return self._rng.randint(lo, hi)

    def sample(self, items: list[T], k: int) -> list[T]:
        """Return k unique random items from the list (no repeats)."""
        return self._rng.sample(items, k)


def new_session_seed() -> int:
    """
    Generate a cryptographically random seed for a new session.
    secrets.randbits(64) uses the OS's secure random source —
    much stronger than random.randint() for this purpose.
    """
    return secrets.randbits(64)
