from sqlalchemy import Column, String, Float, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class FloorPlan(Base, TimestampMixin):
    __tablename__ = "floor_plans"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Metadata
    room_count = Column(Integer, nullable=False)
    square_footage = Column(Float, nullable=False)
    
    # Storage information
    storage_path = Column(String, nullable=False)  # Path in Google Cloud Storage
    public_url = Column(String, nullable=False)    # Public URL for the image
    thumbnail_path = Column(String, nullable=True) # Path to thumbnail in GCS
    thumbnail_url = Column(String, nullable=True)  # Public URL for thumbnail
    
    # Generation parameters
    preferences = Column(JSON, nullable=True)      # Stored as JSON
    generation_time = Column(Float, nullable=True) # Time in seconds
    
    # Relationships
    user = relationship("User", back_populates="floor_plans")
    reference_images = relationship("FloorPlanReferenceImage", back_populates="floor_plan")
