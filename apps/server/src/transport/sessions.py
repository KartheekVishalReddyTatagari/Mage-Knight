import uuid
from typing import Optional, Literal

from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import JWTError

from src.infrastructure.database import get_db
from src.infrastructure.models import GameSession
from src.application.auth_service import decode_token

router = APIRouter()


def current_user(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    try:
        payload = decode_token(authorization.removeprefix("Bearer "))
        return payload["sub"]
    except (JWTError, KeyError):
        raise HTTPException(401, "Invalid token")


class CreateSessionRequest(BaseModel):
    mode:        Literal["solo", "coop", "versus"] = "solo"
    scenario_id: str                                = "tutorial"
    map_size:    Literal["small", "medium", "large"] = "medium"
    difficulty:  Literal["easy", "normal", "hard"]   = "normal"
    name:        Optional[str]                       = None


class SessionSummary(BaseModel):
    session_id:   str
    name:         str
    mode:         str
    state:        str
    player_count: int
    max_players:  int


def _to_summary(gs: GameSession) -> SessionSummary:
    return SessionSummary(
        session_id=gs.id, name=gs.name, mode=gs.mode,
        state=gs.state, player_count=gs.player_count, max_players=gs.max_players,
    )


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=SessionSummary)
def create_session(
    body: CreateSessionRequest,
    db:      Session = Depends(get_db),
    user_id: str     = Depends(current_user),
):
    gs = GameSession(
        id=str(uuid.uuid4()),
        name=body.name or f"{body.mode.title()} game",
        mode=body.mode,
        scenario_id=body.scenario_id,
        host_id=user_id,
        state="LOBBY",
        player_count=1,
        max_players=1 if body.mode == "solo" else 2 if body.mode == "coop" else 4,
    )
    db.add(gs)
    db.commit()
    db.refresh(gs)
    return _to_summary(gs)


@router.get("/", response_model=list[SessionSummary])
def list_open_sessions(db: Session = Depends(get_db)):
    rows = db.query(GameSession).filter(GameSession.state == "LOBBY").all()
    return [_to_summary(r) for r in rows]


@router.post("/{session_id}/join", response_model=SessionSummary)
def join_session(
    session_id: str,
    db:      Session = Depends(get_db),
    user_id: str     = Depends(current_user),
):
    gs = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not gs:
        raise HTTPException(404, "Session not found")
    if gs.player_count >= gs.max_players:
        raise HTTPException(400, "Session is full")
    gs.player_count += 1
    db.commit()
    db.refresh(gs)
    return _to_summary(gs)


@router.post("/{session_id}/start", response_model=SessionSummary)
def start_session(
    session_id: str,
    db:      Session = Depends(get_db),
    user_id: str     = Depends(current_user),
):
    gs = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not gs:
        raise HTTPException(404, "Session not found")
    if gs.host_id != user_id:
        raise HTTPException(403, "Only the host can start")
    gs.state = "PLAYING"
    db.commit()
    db.refresh(gs)
    return _to_summary(gs)
