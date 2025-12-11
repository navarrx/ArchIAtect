from datetime import datetime, timedelta
from typing import Any, Union

from jose import jwt
import bcrypt
from passlib.context import CryptContext

from app.core.config import settings

# Ensure bcrypt exposes __about__.__version__ (some builds miss it and passlib logs errors)
if not hasattr(bcrypt, "__about__"):
    class _About:
        __version__ = getattr(bcrypt, "__version__", "unknown")
    bcrypt.__about__ = _About()

# Configure password hashing with specific bcrypt settings
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # Use a standard number of rounds
    bcrypt__ident="2b"  # Use the 2b version of bcrypt
)

ALGORITHM = "HS256"


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # bcrypt has a 72 byte limit, truncate if necessary (same as when hashing)
    password_bytes = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.verify(password_bytes, hashed_password)


def get_password_hash(password: str) -> str:
    # bcrypt has a 72 byte limit, truncate if necessary
    # Encode to bytes to properly handle unicode characters
    password_bytes = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password_bytes)
