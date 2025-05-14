from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class GenerationBase(BaseModel):
    layout_image_url: str
    sd_image_url: Optional[str] = None
    prompt: Optional[str] = None

class GenerationCreate(GenerationBase):
    user_id: int

class GenerationRequest(BaseModel):
    prompt: str = Field(..., description="The prompt to generate the floor plan from")

class GenerationResponse(BaseModel):
    id: int = Field(..., description="Unique identifier for the generation")
    prompt: str = Field(..., description="The prompt used for generation")
    layout_image_url: str = Field(..., description="URL to the layout image in GCS")
    sd_image_url: Optional[str] = Field(None, description="URL to the SD image in GCS")
    created_at: datetime = Field(..., description="When the generation was created")
    status: str = Field(..., description="Status of the generation (success/failed)")
    error_message: Optional[str] = Field(None, description="Error message if generation failed")

class GenerationOut(GenerationBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True