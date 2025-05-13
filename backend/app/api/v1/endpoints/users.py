from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, List
from sqlalchemy.orm import Session

from app.schemas.user import UserResponse, UserCreate, UserUpdate
from app.services.user_service import UserService
from app.api.deps import get_current_user, get_db

router = APIRouter()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    *,
    user_in: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Create a new user.
    """
    user_service = UserService(db)
    return await user_service.create_user(user_in)


@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_user_me(
    *,
    user_in: UserUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update current user.
    """
    user_service = UserService(db)
    return await user_service.update_user(current_user.id, user_in)
