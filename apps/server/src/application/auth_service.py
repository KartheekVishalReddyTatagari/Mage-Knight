from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext
from jose import jwt

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

SECRET_KEY    = "CHANGE_ME_IN_PRODUCTION_USE_SECRETS_TOKEN_HEX_32"
ALGORITHM     = "HS256"
ACCESS_EXPIRE  = timedelta(minutes=15)
REFRESH_EXPIRE = timedelta(days=7)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(account_id: str) -> str:
    payload = {
        "sub":  account_id,
        "exp":  datetime.now(timezone.utc) + ACCESS_EXPIRE,
        "type": "access",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(account_id: str) -> str:
    payload = {
        "sub":  account_id,
        "exp":  datetime.now(timezone.utc) + REFRESH_EXPIRE,
        "type": "refresh",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
