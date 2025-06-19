from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api import deps
from app.schemas.rating import Rating, RatingCreate, RatingUpdate
from app.services.rating_service import RatingService
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=Rating)
def create_rating(
    rating: RatingCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Create a new rating for a generation.
    """
    rating_service = RatingService(db)
    
    # Check if user already rated this generation
    existing_rating = rating_service.get_rating_by_user_and_generation(
        current_user.id, rating.generation_id
    )
    if existing_rating:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already rated this generation"
        )
    
    return rating_service.create_rating(rating, current_user.id)

@router.get("/generation/{generation_id}", response_model=List[Rating])
def get_ratings_by_generation(
    generation_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get all ratings for a specific generation.
    """
    rating_service = RatingService(db)
    return rating_service.get_ratings_by_generation(generation_id)

@router.get("/generation/{generation_id}/average")
def get_average_rating_for_generation(
    generation_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get average rating for a specific generation.
    """
    rating_service = RatingService(db)
    average = rating_service.get_average_rating_for_generation(generation_id)
    return {"average_rating": average}

@router.get("/my-ratings", response_model=List[Rating])
def get_my_ratings(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get all ratings created by the current user.
    """
    rating_service = RatingService(db)
    return rating_service.get_ratings_by_user(current_user.id)

@router.get("/my/generation/{generation_id}", response_model=Optional[Rating])
def get_my_rating_for_generation(
    generation_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get the current user's rating for a specific generation.
    """
    rating_service = RatingService(db)
    return rating_service.get_rating_by_user_and_generation(current_user.id, generation_id)

@router.put("/{rating_id}", response_model=Rating)
def update_rating(
    rating_id: int,
    rating_update: RatingUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update a rating (only by the user who created it).
    """
    rating_service = RatingService(db)
    db_rating = rating_service.get_rating_by_id(rating_id)
    
    if not db_rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )
    
    if db_rating.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this rating"
        )
    
    updated_rating = rating_service.update_rating(rating_id, rating_update)
    if not updated_rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )
    
    return updated_rating

@router.delete("/{rating_id}")
def delete_rating(
    rating_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Delete a rating (only by the user who created it).
    """
    rating_service = RatingService(db)
    db_rating = rating_service.get_rating_by_id(rating_id)
    
    if not db_rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )
    
    if db_rating.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this rating"
        )
    
    success = rating_service.delete_rating(rating_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )
    
    return {"message": "Rating deleted successfully"} 