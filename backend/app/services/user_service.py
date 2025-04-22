from typing import Optional
import uuid

from app.core.security import get_password_hash, verify_password
from app.schemas.user import UserCreate, User, UserInDB


async def get_user_by_email(email: str) -> Optional[UserInDB]:
    """
    Get a user by email.
    """
    # This would typically query your database for the user
    # For now, we'll return a placeholder user if the email matches
    if email == "user@example.com":
        return UserInDB(
            id="user123",
            email="user@example.com",
            hashed_password=get_password_hash("password"),
            is_active=True,
            is_superuser=False,
            full_name="John Doe"
        )
    return None


async def create_user(user_in: UserCreate) -> User:
    """
    Create a new user.
    """
    # Check if user with this email already exists
    existing_user = await get_user_by_email(user_in.email)
    if existing_user:
        raise ValueError("User with this email already exists")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_in.password)
    
    # This would typically save the user to your database
    # For now, we'll return a new user object
    
    return User(
        id=user_id,
        email=user_in.email,
        is_active=user_in.is_active,
        is_superuser=user_in.is_superuser,
        full_name=user_in.full_name
    )


async def authenticate_user(email: str, password: str) -> Optional[User]:
    """
    Authenticate a user by email and password.
    """
    user = await get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return User(
        id=user.id,
        email=user.email,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        full_name=user.full_name
    )


async def get_user_by_id(user_id: str) -> Optional[User]:
    """
    Get a user by ID.
    """
    # This would typically query your database for the user
    # For now, we'll return a placeholder user if the ID matches
    if user_id == "user123":
        return User(
            id="user123",
            email="user@example.com",
            is_active=True,
            is_superuser=False,
            full_name="John Doe"
        )
    return None
