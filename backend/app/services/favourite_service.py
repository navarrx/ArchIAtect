from sqlalchemy.orm import Session
from app.models.favourite import Favourite
from app.models.generation import Generation
from app.models.user import User
from app.schemas.favourite import FavouriteOut
from typing import List
import logging

logger = logging.getLogger(__name__)

def add_favourite(db: Session, user_id: int, generation_id: int) -> FavouriteOut:
    """Agregar una generación a favoritos"""
    # Verificar que la generación existe y pertenece al usuario
    generation = db.query(Generation).filter(Generation.id == generation_id).first()
    if not generation:
        raise ValueError("La generación no existe")
    
    # Verificar que el usuario existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("El usuario no existe")
    
    # Verificar que no esté ya en favoritos
    existing_favourite = db.query(Favourite).filter(
        Favourite.user_id == user_id,
        Favourite.generation_id == generation_id
    ).first()
    
    if existing_favourite:
        raise ValueError("Esta generación ya está en tus favoritos")
    
    # Crear el favorito
    favourite = Favourite(
        user_id=user_id,
        generation_id=generation_id
    )
    
    db.add(favourite)
    db.commit()
    db.refresh(favourite)
    
    logger.info(f"✅ Favourite added: user_id={user_id}, generation_id={generation_id}")
    
    return FavouriteOut(
        id=favourite.id,
        user_id=favourite.user_id,
        generation_id=favourite.generation_id,
        created_at=favourite.created_at
    )

def remove_favourite(db: Session, user_id: int, favourite_id: int) -> bool:
    """Remover una generación de favoritos"""
    favourite = db.query(Favourite).filter(
        Favourite.id == favourite_id,
        Favourite.user_id == user_id
    ).first()
    
    if not favourite:
        raise ValueError("Favorito no encontrado o no tienes permisos para eliminarlo")
    
    db.delete(favourite)
    db.commit()
    
    logger.info(f"✅ Favourite removed: user_id={user_id}, favourite_id={favourite_id}")
    return True

def get_user_favourites(db: Session, user_id: int) -> List[FavouriteOut]:
    """Obtener todos los favoritos de un usuario con información de la generación"""
    favourites = db.query(Favourite).filter(Favourite.user_id == user_id).all()
    
    return [
        FavouriteOut(
            id=fav.id,
            user_id=fav.user_id,
            generation_id=fav.generation_id,
            created_at=fav.created_at
        )
        for fav in favourites
    ]

def get_user_favourites_with_generations(db: Session, user_id: int) -> List[dict]:
    """Obtener favoritos con información completa de las generaciones"""
    favourites = db.query(Favourite).filter(Favourite.user_id == user_id).all()
    
    result = []
    for fav in favourites:
        generation = db.query(Generation).filter(Generation.id == fav.generation_id).first()
        if generation:
            result.append({
                "id": fav.id,
                "user_id": fav.user_id,
                "generation_id": fav.generation_id,
                "created_at": fav.created_at,
                "generation": {
                    "id": generation.id,
                    "prompt": generation.prompt,
                    "layout_image_url": generation.layout_image_url,
                    "sd_image_url": generation.sd_image_url,
                    "status": generation.status,
                    "error_message": generation.error_message,
                    "created_at": generation.created_at
                }
            })
    
    return result

def is_favourite(db: Session, user_id: int, generation_id: int) -> bool:
    """Verificar si una generación está en favoritos del usuario"""
    favourite = db.query(Favourite).filter(
        Favourite.user_id == user_id,
        Favourite.generation_id == generation_id
    ).first()
    
    return favourite is not None
