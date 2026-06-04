import uuid
from sqlalchemy import Column, String, Integer, DateTime, func
from src.infrastructure.database import Base


class UserModel(Base):
    __tablename__ = "users"

    id            = Column(String, primary_key=True)
    email         = Column(String, unique=True, nullable=False, index=True)
    username      = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin      = Column(Integer, default=0, nullable=False)   # 0 = regular, 1 = admin
    created_at    = Column(DateTime, server_default=func.now())


class GameSession(Base):
    __tablename__ = "game_sessions"

    id           = Column(String, primary_key=True)
    name         = Column(String, nullable=False)
    mode         = Column(String, nullable=False)
    scenario_id  = Column(String, nullable=False, default="tutorial")
    host_id      = Column(String, nullable=False)
    state        = Column(String, nullable=False, default="LOBBY")
    player_count = Column(Integer, default=1)
    max_players  = Column(Integer, default=4)
    created_at   = Column(DateTime, server_default=func.now())
