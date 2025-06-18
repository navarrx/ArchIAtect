from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.services import favourite_service
from app.schemas.favourite import FavouriteOut, FavouriteCreate
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

# 🟢 Endpoint para agregar a favoritos
@router.post("/", response_model=FavouriteOut, tags=["Favourites"])
def add_favourite(
    fav: FavouriteCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Agregar una generación a favoritos"""
    try:
        return favourite_service.add_favourite(db, current_user.id, fav.generation_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# 🟢 Endpoint para listar favoritos de un usuario
@router.get("/my", response_model=List[dict], tags=["Favourites"])
def get_my_favourites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener mis favoritos con información completa de las generaciones"""
    return favourite_service.get_user_favourites_with_generations(db, current_user.id)

# 🟢 Endpoint para listar favoritos básicos de un usuario
@router.get("/my/basic", response_model=List[FavouriteOut], tags=["Favourites"])
def get_my_favourites_basic(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener mis favoritos (información básica)"""
    return favourite_service.get_user_favourites(db, current_user.id)

# 🟢 Endpoint para quitar de favoritos
@router.delete("/{favourite_id}", tags=["Favourites"])
def remove_favourite(
    favourite_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remover una generación de favoritos"""
    try:
        favourite_service.remove_favourite(db, current_user.id, favourite_id)
        return {"message": "Favourite removed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# 🟢 Endpoint para verificar si una generación está en favoritos
@router.get("/check/{generation_id}", tags=["Favourites"])
def check_if_favourite(
    generation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verificar si una generación está en mis favoritos"""
    is_fav = favourite_service.is_favourite(db, current_user.id, generation_id)
    return {"is_favourite": is_fav}