# backend/app/services/user_service.py
from typing import Optional
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

    def create_user(self, user_in: UserCreate) -> UserResponse:
        """
        Create a new user.
        """
        try:
            # Check if user exists
            user = self.db.query(User).filter(User.email == user_in.email).first()
            if user:
                raise ValueError("User with this email already exists")

            # Create new user
            password_hash = get_password_hash(user_in.password) if user_in.password else None
            db_user = User(
                email=user_in.email,
                name=user_in.name,
                profile_picture_url=user_in.profile_picture_url,
                password_hash=password_hash,
                google_id=user_in.google_id
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
        Update user.
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise UserNotFoundError()

            update_data = user_in.model_dump(exclude_unset=True)
            if "password" in update_data:
                update_data["password_hash"] = get_password_hash(update_data.pop("password"))

            for field, value in update_data.items():
                setattr(user, field, value)

            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            return UserResponse.model_validate(user)
        finally:
            self.db.close()