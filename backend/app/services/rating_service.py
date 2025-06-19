from sqlalchemy.orm import Session
from app.models.rating import Rating
from app.schemas.rating import RatingCreate, RatingUpdate
from typing import Optional, List

class RatingService:
    def __init__(self, db: Session):
        self.db = db

    def create_rating(self, rating: RatingCreate, user_id: int) -> Rating:
        db_rating = Rating(
            user_id=user_id,
            generation_id=rating.generation_id,
            rating=rating.rating,
            feedback=rating.feedback
        )
        self.db.add(db_rating)
        self.db.commit()
        self.db.refresh(db_rating)
        return db_rating

    def get_rating_by_id(self, rating_id: int) -> Optional[Rating]:
        return self.db.query(Rating).filter(Rating.id == rating_id).first()

    def get_rating_by_user_and_generation(self, user_id: int, generation_id: int) -> Optional[Rating]:
        return self.db.query(Rating).filter(
            Rating.user_id == user_id,
            Rating.generation_id == generation_id
        ).first()

    def get_ratings_by_generation(self, generation_id: int) -> List[Rating]:
        return self.db.query(Rating).filter(Rating.generation_id == generation_id).all()

    def get_ratings_by_user(self, user_id: int) -> List[Rating]:
        return self.db.query(Rating).filter(Rating.user_id == user_id).all()

    def update_rating(self, rating_id: int, rating_update: RatingUpdate) -> Optional[Rating]:
        db_rating = self.get_rating_by_id(rating_id)
        if not db_rating:
            return None
        
        update_data = rating_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_rating, field, value)
        
        self.db.commit()
        self.db.refresh(db_rating)
        return db_rating

    def delete_rating(self, rating_id: int) -> bool:
        db_rating = self.get_rating_by_id(rating_id)
        if not db_rating:
            return False
        
        self.db.delete(db_rating)
        self.db.commit()
        return True

    def get_average_rating_for_generation(self, generation_id: int) -> Optional[float]:
        result = self.db.query(Rating.rating).filter(Rating.generation_id == generation_id).all()
        if not result:
            return None
        
        ratings = [r[0] for r in result]
        return sum(ratings) / len(ratings) 