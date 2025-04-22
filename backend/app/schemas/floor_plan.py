from pydantic import BaseModel, Field, validator, HttpUrl
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.core.config import settings


class FloorPlanRequest(BaseModel):
    """Request model for floor plan generation"""
    room_count: int = Field(..., ge=1, le=settings.MODEL_MAX_ROOM_COUNT)
    square_footage: float = Field(
        ..., 
        ge=settings.MODEL_MIN_SQUARE_FOOTAGE, 
        le=settings.MODEL_MAX_SQUARE_FOOTAGE
    )
    preferences: Dict[str, Any] = {}
    additional_parameters: Optional[Dict[str, Any]] = None
    reference_image_ids: Optional[List[str]] = None
    
    @validator('preferences')
    def validate_preferences(cls, v):
        # Add any validation logic for preferences here
        return v


class FloorPlanResponse(BaseModel):
    """Response model for floor plan generation"""
    id: str
    created_at: datetime
    image_url: HttpUrl
    thumbnail_url: Optional[HttpUrl] = None
    metadata: Dict[str, Any]

    class Config:
        orm_mode = True


class FloorPlanList(BaseModel):
    """Model for listing floor plans"""
    id: str
    created_at: datetime
    room_count: int
    square_footage: float
    thumbnail_url: HttpUrl

    class Config:
        orm_mode = True
