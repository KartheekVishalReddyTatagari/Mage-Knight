"""
Admin API — session management and user promotion.
All endpoints require is_admin = 1 on the caller's account.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import JWTError

from src.infrastructure.database import get_db
from src.infrastructure.models import UserModel, GameSession
from src.application.auth_service import decode_token

router = APIRouter()


# ── Auth dependency ───────────────────────────────────────────────────────────

def admin_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> UserModel:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    try:
        payload = decode_token(authorization.removeprefix("Bearer "))
        user_id = payload["sub"]
    except (JWTError, KeyError):
        raise HTTPException(401, "Invalid token")
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(401, "User not found")
    if not user.is_admin:
        raise HTTPException(403, "Admin access required")
    return user


# ── Response models ───────────────────────────────────────────────────────────

class SessionDetail(BaseModel):
    session_id:   str
    name:         str
    mode:         str
    state:        str
    player_count: int
    max_players:  int
    host_id:      str
    created_at:   str


class UserDetail(BaseModel):
    id:       str
    username: str
    email:    str
    is_admin: bool


class PromoteRequest(BaseModel):
    email:    str
    is_admin: bool = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/sessions", response_model=list[SessionDetail])
def list_all_sessions(
    db:    Session  = Depends(get_db),
    admin: UserModel = Depends(admin_user),
):
    """Return ALL sessions regardless of state."""
    rows = db.query(GameSession).order_by(GameSession.created_at.desc()).all()
    return [
        SessionDetail(
            session_id=r.id, name=r.name, mode=r.mode, state=r.state,
            player_count=r.player_count, max_players=r.max_players,
            host_id=r.host_id,
            created_at=str(r.created_at),
        )
        for r in rows
    ]


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: str,
    db:    Session  = Depends(get_db),
    admin: UserModel = Depends(admin_user),
):
    """Delete a session from the database."""
    gs = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not gs:
        raise HTTPException(404, "Session not found")
    db.delete(gs)
    db.commit()


@router.get("/users", response_model=list[UserDetail])
def list_users(
    db:    Session  = Depends(get_db),
    admin: UserModel = Depends(admin_user),
):
    """List all registered users."""
    users = db.query(UserModel).order_by(UserModel.created_at).all()
    return [
        UserDetail(id=u.id, username=u.username, email=u.email, is_admin=bool(u.is_admin))
        for u in users
    ]


@router.post("/promote", response_model=UserDetail)
def promote_user(
    body:  PromoteRequest,
    db:    Session  = Depends(get_db),
    admin: UserModel = Depends(admin_user),
):
    """Grant or revoke admin access by email."""
    user = db.query(UserModel).filter(UserModel.email == body.email).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_admin = 1 if body.is_admin else 0
    db.commit()
    db.refresh(user)
    return UserDetail(id=user.id, username=user.username, email=user.email, is_admin=bool(user.is_admin))
