from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, List

from app.schemas.user import User, UserCreate, UserUpdate
from app.services.user_service import create_user, get_user_by_id
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    *,
    user_in: UserCreate,
) -> Any:
    """
    Create a new user.
    """
    user = await create_user(user_in)
    return user


@router.get("/me", response_model=User)
async def read_user_me(
    current_user = Depends(get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.put("/me", response_model=User)
async def update_user_me(
    *,
    user_in: UserUpdate,
    current_user = Depends(get_current_user),
) -> Any:
    """
    Update current user.
    """
    # This would typically update the user in your database
    # For now, we'll return a placeholder
    return current_user
