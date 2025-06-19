from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class RatingBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    feedback: Optional[Dict[str, Any]] = Field(None, description="JSON with selected criticisms and custom text")

class RatingCreate(RatingBase):
    generation_id: int = Field(..., description="ID of the generation being rated")

class RatingUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    feedback: Optional[Dict[str, Any]] = None

class RatingInDB(RatingBase):
    id: int
    user_id: int
    generation_id: int

    class Config:
        from_attributes = True

class Rating(RatingInDB):
    pass 