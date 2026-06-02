"""
WebSocket gateway — real-time in-session communication.
(FR-MP-01, FR-MP-02, FR-MP-03)

CONCEPT: WebSocket keeps an open connection between browser and server.
Unlike HTTP (request → response → close), WebSocket stays open so the
server can PUSH updates to all players whenever state changes.

Flow:
  1. Client connects:  ws://localhost:8000/ws/{session_id}?token=<jwt>
  2. Server authenticates the JWT token from the query param
  3. Client sends action frames: {"v":1, "type":"move", "destination":{"q":1,"r":0}}
  4. Server applies action, broadcasts result to all session participants
"""
import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# Active connections per session — session_id → list of WebSockets
# TODO (TASK T-02-03): replace with Redis pub/sub for multi-instance support
_connections: dict[str, list[WebSocket]] = {}

MIN_PROTOCOL_VERSION = 1   # reject clients older than this (NFR-PORT-03)


@router.websocket("/{session_id}")
async def websocket_endpoint(session_id: str, websocket: WebSocket):
    """
    Main WebSocket handler. Each connected player has one WebSocket here.

    STEPS TO IMPLEMENT (TASK T-03-02):
    1. websocket.accept() — accept the connection
    2. Authenticate: read token from query param, verify JWT
       HINT: websocket.query_params.get("token")
    3. Register this websocket in _connections[session_id]
    4. Enter a receive loop:
         while True:
             data = await websocket.receive_text()
             frame = json.loads(data)
             # validate frame version
             # route to the right handler based on frame["type"]
    5. On WebSocketDisconnect: remove from _connections, handle disconnect
    """
    await websocket.accept()

    # TODO: authenticate
    player_id = "placeholder"   # replace with real JWT verification

    # Register connection
    if session_id not in _connections:
        _connections[session_id] = []
    _connections[session_id].append(websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            frame = json.loads(raw)

            # Version check (NFR-PORT-03)
            if frame.get("v", 0) < MIN_PROTOCOL_VERSION:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "code": "VERSION_MISMATCH",
                    "message": f"Client too old. Minimum version: {MIN_PROTOCOL_VERSION}",
                }))
                continue

            # TODO: validate frame schema with Pydantic
            # TODO: route frame["type"] to the correct application service
            # e.g. if frame["type"] == "move": call session_actor.submit(MoveAction(...))

            await _broadcast(session_id, {"type": "ack", "for": frame.get("type")})

    except WebSocketDisconnect:
        _connections[session_id].remove(websocket)
        # TODO: start disconnect grace timer (FR-MP-06)


async def _broadcast(session_id: str, message: dict[str, Any]) -> None:
    """Send a message to ALL connected players in a session."""
    dead = []
    for ws in _connections.get(session_id, []):
        try:
            await ws.send_text(json.dumps(message))
        except Exception:
            dead.append(ws)
    # Clean up broken connections
    for ws in dead:
        _connections[session_id].remove(ws)


async def _send_to_player(session_id: str, player_id: str, message: dict) -> None:
    """
    Send a message to ONE specific player.
    Used for private information (your hand, your level-up offer) — NFR-SEC-04.
    TODO: need to track which WebSocket belongs to which player_id
    """
    # TODO: implement player-specific sending
    pass
