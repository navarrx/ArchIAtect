# backend/app/services/user_service.py
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password
from app.core.exceptions import UserNotFoundError, InvalidCredentialsError
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.db.session import SessionLocal

async def authenticate_user(email: str, password: str) -> Optional[User]:
    """
    Authenticate a user by email and password.
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user
    finally:
        db.close()

class UserService:
    def __init__(self, db: Session):
        self.db = db

    async def create_user(self, user_data: Dict[str, Any]) -> UserResponse:
        """
        Create a new user.
        """
        try:
            # Check if user exists
            user = self.db.query(User).filter(User.email == user_data["email"]).first()
            if user:
                raise ValueError("User with this email already exists")

            # Create new user
            db_user = User(
                email=user_data["email"],
                first_name=user_data.get("first_name"),
                last_name=user_data.get("last_name"),
                profile_picture_url=user_data.get("profile_picture_url"),
                password_hash=user_data.get("password_hash"),
                google_id=user_data.get("google_id"),
                is_active=user_data.get("is_active", True)
            )
            self.db.add(db_user)
            self.db.commit()
            self.db.refresh(db_user)
            return UserResponse.model_validate(db_user)
        finally:
            self.db.close()

    async def get_user_by_id(self, user_id: int) -> UserResponse:
        """
        Get user by ID.
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise UserNotFoundError()
            return UserResponse.model_validate(user)
        finally:
            self.db.close()

    async def get_user_by_email(self, email: str) -> UserResponse:
        """
        Get user by email.
        """
        try:
            user = self.db.query(User).filter(User.email == email).first()
            if not user:
                raise UserNotFoundError()
            return UserResponse.model_validate(user)
        finally:
            self.db.close()

    async def update_user(self, user_id: int, user_in: UserUpdate) -> UserResponse:
        """
        Update user information.
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise UserNotFoundError()

            # Update password if provided
            if user_in.password:
                user.password_hash = get_password_hash(user_in.password)

            # Update other fields if provided
            update_data = user_in.dict(exclude_unset=True, exclude={'password'})
            for field, value in update_data.items():
                if value is not None:  # Only update if value is provided
                    setattr(user, field, value)

            self.db.commit()
            self.db.refresh(user)
            return UserResponse.model_validate(user)
        finally:
            self.db.close()