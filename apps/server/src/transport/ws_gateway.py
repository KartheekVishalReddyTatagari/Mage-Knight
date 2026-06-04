"""
WebSocket gateway — real-time in-session communication.
(FR-MP-01, FR-MP-02, FR-MP-03)

CONCEPT: WebSocket keeps an open connection between browser and server.
Unlike HTTP (request → response → close), WebSocket stays open so the
server can PUSH updates to all players whenever state changes.

Frame protocol:
  Client → Server:
    { v:1, type:"end_turn" }
    { v:1, type:"state_sync", state:{pos,fame,...}, tiles:[...] }
    { v:1, type:"full_sync", tiles:[...], state:{...} }   — host sharing map
    { v:1, type:"chat", text:"..." }

  Server → Client:
    { type:"session_info", player_id, session_id, current_turn, started, players }
    { type:"player_joined", player_id, username, player_count, all_players }
    { type:"game_start", current_turn, players }
    { type:"opponent_state", from, state, tiles? }
    { type:"full_sync", from, tiles, state }
    { type:"turn_changed", current_turn, turn_count }
    { type:"player_disconnected", player_id, username }
    { type:"chat", from, player_id, text }
    { type:"error", code, message }
"""
import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError

from src.application.auth_service import decode_token

router = APIRouter()

# session_id → {player_id: WebSocket}
_connections: dict[str, dict[str, WebSocket]] = {}

# session_id → session metadata dict
_sessions: dict[str, dict] = {}

MIN_PROTOCOL_VERSION = 1


@router.websocket("/{session_id}")
async def websocket_endpoint(session_id: str, websocket: WebSocket):
    await websocket.accept()

    # 1. Authenticate JWT from query param
    token = websocket.query_params.get("token", "")
    try:
        payload = decode_token(token)
        player_id = payload["sub"]
    except (JWTError, KeyError, Exception):
        await websocket.send_text(json.dumps({
            "type": "error", "code": "AUTH_FAILED",
            "message": "Invalid or missing token",
        }))
        await websocket.close()
        return

    # Username from query param (frontend passes it after login)
    username = websocket.query_params.get("username", player_id[:8])

    # 2. Register connection (overwrites stale socket on reconnect)
    if session_id not in _connections:
        _connections[session_id] = {}
    _connections[session_id][player_id] = websocket

    # 3. Init session meta
    if session_id not in _sessions:
        _sessions[session_id] = {
            "players": [], "usernames": {},
            "current_turn": None, "started": False, "turn_count": 0,
        }

    meta = _sessions[session_id]
    if player_id not in meta["players"]:
        meta["players"].append(player_id)
    meta["usernames"][player_id] = username

    def player_list() -> list:
        return [
            {"id": pid, "username": meta["usernames"].get(pid, pid[:8])}
            for pid in meta["players"]
        ]

    # 4. Send session_info FIRST so the client knows their player_id
    await websocket.send_text(json.dumps({
        "type": "session_info",
        "player_id": player_id,
        "username": username,
        "session_id": session_id,
        "current_turn": meta.get("current_turn"),
        "started": meta["started"],
        "players": player_list(),
    }))

    # 5. Broadcast player_joined to everyone (including the joining player)
    await _broadcast(session_id, {
        "type": "player_joined",
        "player_id": player_id,
        "username": username,
        "player_count": len(meta["players"]),
        "all_players": player_list(),
    })

    # 6. Auto-start when 2 players are present and game hasn't started
    if len(meta["players"]) >= 2 and not meta["started"]:
        meta["started"] = True
        meta["current_turn"] = meta["players"][0]
        await _broadcast(session_id, {
            "type": "game_start",
            "current_turn": meta["current_turn"],
            "players": player_list(),
        })

    # 7. Main receive loop
    try:
        while True:
            raw = await websocket.receive_text()
            frame = json.loads(raw)

            if frame.get("v", 0) < MIN_PROTOCOL_VERSION:
                await websocket.send_text(json.dumps({
                    "type": "error", "code": "VERSION_MISMATCH",
                }))
                continue

            meta = _sessions.get(session_id, {})
            frame_type = frame.get("type")

            if frame_type == "end_turn":
                # Validate it's this player's turn, then rotate
                if meta.get("current_turn") == player_id:
                    players = meta["players"]
                    idx = players.index(player_id)
                    next_player = players[(idx + 1) % len(players)]
                    meta["current_turn"] = next_player
                    meta["turn_count"] = meta.get("turn_count", 0) + 1
                    await _broadcast(session_id, {
                        "type": "turn_changed",
                        "current_turn": next_player,
                        "turn_count": meta["turn_count"],
                    })

            elif frame_type == "state_sync":
                # Relay this player's public state + tiles to all others
                await _broadcast_except(session_id, player_id, {
                    "type": "opponent_state",
                    "from": player_id,
                    "state": frame.get("state", {}),
                    "tiles": frame.get("tiles"),
                })

            elif frame_type == "full_sync":
                # Host sharing their complete map + initial state with joining player
                await _broadcast_except(session_id, player_id, {
                    "type": "full_sync",
                    "from": player_id,
                    "tiles": frame.get("tiles", []),
                    "state": frame.get("state", {}),
                })

            elif frame_type == "chat":
                text = str(frame.get("text", ""))[:200]
                await _broadcast(session_id, {
                    "type": "chat",
                    "from": username,
                    "player_id": player_id,
                    "text": text,
                })

    except WebSocketDisconnect:
        if session_id in _connections:
            _connections[session_id].pop(player_id, None)
        await _broadcast_except(session_id, player_id, {
            "type": "player_disconnected",
            "player_id": player_id,
            "username": username,
        })


async def _broadcast(session_id: str, message: dict[str, Any]) -> None:
    """Send to ALL connected players in a session."""
    dead = []
    for pid, ws in list(_connections.get(session_id, {}).items()):
        try:
            await ws.send_text(json.dumps(message))
        except Exception:
            dead.append(pid)
    for pid in dead:
        _connections[session_id].pop(pid, None)


async def _broadcast_except(session_id: str, exclude: str, message: dict[str, Any]) -> None:
    """Send to all players EXCEPT one (used for state relay to avoid echo)."""
    dead = []
    for pid, ws in list(_connections.get(session_id, {}).items()):
        if pid == exclude:
            continue
        try:
            await ws.send_text(json.dumps(message))
        except Exception:
            dead.append(pid)
    for pid in dead:
        _connections[session_id].pop(pid, None)
