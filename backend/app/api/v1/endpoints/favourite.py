from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.services import favourites_service
from app.schemas.favourite import FavouriteOut, FavouriteCreate

router = APIRouter()

# 🟢 Endpoint para agregar a favoritos
@router.post("/", response_model=FavouriteOut, tags=["Favourites"])
def add_favourite(fav: FavouriteCreate, db: Session = Depends(get_db)):
    try:
        return favourites_service.add_favourite(db, fav.user_id, fav.generation_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# 🟢 Endpoint para listar favoritos de un usuario
@router.get("/{user_id}", response_model=List[FavouriteOut], tags=["Favourites"])
def get_favourites(user_id: int, db: Session = Depends(get_db)):
    return favourites_service.get_user_favourites(db, user_id)

# 🟢 Endpoint para quitar de favoritos
@router.delete("/{user_id}/{favourite_id}", tags=["Favourites"])
def remove_favourite(user_id: int, favourite_id: int, db: Session = Depends(get_db)):
    favourites_service.remove_favourite(db, user_id, favourite_id)
    return {"message": "Favourite removed"}