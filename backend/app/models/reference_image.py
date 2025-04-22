from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class ReferenceImage(Base, TimestampMixin):
    __tablename__ = "reference_images"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Original filename
    original_filename = Column(String, nullable=False)
    
    # Storage information
    storage_path = Column(String, nullable=False)  # Path in Google Cloud Storage
    public_url = Column(String, nullable=False)    # Public URL for the image
    
    # MIME type
    content_type = Column(String, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="reference_images")
    floor_plans = relationship("FloorPlanReferenceImage", back_populates="reference_image")


class FloorPlanReferenceImage(Base, TimestampMixin):
    """Association table between floor plans and reference images"""
    __tablename__ = "floor_plan_reference_images"

    id = Column(String, primary_key=True, index=True)
    floor_plan_id = Column(String, ForeignKey("floor_plans.id"), nullable=False)
    reference_image_id = Column(String, ForeignKey("reference_images.id"), nullable=False)
    
    # Relationships
    floor_plan = relationship("FloorPlan", back_populates="reference_images")
    reference_image = relationship("ReferenceImage", back_populates="floor_plans")
