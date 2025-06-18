from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FavouriteBase(BaseModel):
    generation_id: int

class FavouriteCreate(FavouriteBase):
    pass

class FavouriteOut(FavouriteBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class GenerationInfo(BaseModel):
    id: int
    prompt: str
    layout_image_url: str
    sd_image_url: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FavouriteWithGeneration(BaseModel):
    id: int
    user_id: int
    generation_id: int
    created_at: datetime
    generation: GenerationInfo

    class Config:
        from_attributes = True