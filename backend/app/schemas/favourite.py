from pydantic import BaseModel
from datetime import datetime

class FavouriteBase(BaseModel):
    generation_id: int

class FavouriteCreate(FavouriteBase):
    user_id: int

class FavouriteOut(FavouriteBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True