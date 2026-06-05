"""
Session lifecycle — create, join, leave, resume.
(FR-SES-01 through FR-SES-07)
"""
from mk_rules.state import Session, Map


class SessionService:
    """
    Manages the lifecycle of game sessions.
    Does NOT run game logic — that's the rules engine's job.
    """

    async def create(
        self,
        mode: str,
        scenario_id: str,
        host_account_id: str,
    ) -> Session:
        """
        Create a new session and put it in LOBBY state.

        Steps:
        1. Generate a session_id:  str(uuid.uuid4())
        2. Generate an rng_seed:   new_session_seed()
        3. Generate the map:       call _generate_map(scenario_id)
        4. Create initial MageKnight for the host
        5. Build the Session object
        6. Save to Redis (for fast access) AND write initial snapshot to Postgres
        7. Return the Session

        HINT for generating the session:
            return Session(
                id=str(uuid.uuid4()),
                mode=SessionMode[mode.upper()],
                scenario_id=scenario_id,
                mage_knights=(),
                map=await _generate_map(scenario_id),
                rng_seed=new_session_seed(),
                state=SessionState.LOBBY,
            )
        """
        # TODO: implement
        raise NotImplementedError

    async def join(self, session_id: str, account_id: str) -> Session:
        """
        Add a player to an existing LOBBY session.

        Steps:
        1. Load session from Redis by session_id
        2. Reject if state != LOBBY or player count >= max
        3. Create a MageKnight for the new player
        4. Add to session.mage_knights (using replace())
        5. Save updated session back to Redis
        6. Return updated session
        """
        # TODO: implement
        raise NotImplementedError

    async def resume(self, session_id: str) -> Session:
        """
        Restore a session from the action log + last snapshot. (FR-SES-04)

        Steps:
        1. Load the latest snapshot from Postgres
        2. Replay all action log entries since the snapshot
        3. Return the restored session
        """
        # TODO: implement — this is TASK T-02-03
        raise NotImplementedError

    async def list_open(self) -> list[dict]:
        """Return sessions in LOBBY state that can be joined."""
        # TODO: query Redis or Postgres for open sessions
        return []

    async def _generate_map(self, scenario_id: str) -> Map:
        """
        Load the scenario's tile configuration and generate a starting map.
        TODO: load tiles from packages/content/tiles/*.json via ContentLoader
        """
        # For now return an empty map placeholder
        return Map(placed=(), unplaced=())


def get_session_service() -> SessionService:
    """FastAPI dependency."""
    return SessionService()
