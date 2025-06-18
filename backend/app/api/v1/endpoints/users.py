from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import Any, List
from sqlalchemy.orm import Session

from app.schemas.user import UserResponse, UserCreate, UserUpdate
from app.services.user_service import UserService
from app.api.deps import get_current_user, get_db
from app.core.exceptions import UserNotFoundError
from app.core.security import verify_password, get_password_hash
from app.models.user import User

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


@router.put("/me/password")
async def update_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update user password.
    """
    if not verify_password(current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )
    
    current_user.password_hash = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada correctamente"}


@router.post("/check-email")
async def check_email(
    email: str = Body(..., embed=True),
    db: Session = Depends(get_db)
) -> Any:
    """
    Check if an email exists in the database.
    """
    try:
        user_service = UserService(db)
        await user_service.get_user_by_email(email)
        return {"exists": True}
    except UserNotFoundError:
        return {"exists": False}
