from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GenerationBase(BaseModel):
    layout_image_url: str
    sd_image_url: Optional[str] = None
    prompt: Optional[str] = None

class GenerationCreate(GenerationBase):
    pass

class GenerationRequest(BaseModel):
    prompt: str

class GenerationResponse(BaseModel):
    prompt: str
    layout_image_url: str
    sd_image_url: str
    
class GenerationOut(GenerationBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True