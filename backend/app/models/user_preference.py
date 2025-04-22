from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class UserPreference(Base, TimestampMixin):
    __tablename__ = "user_preferences"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Default preferences for floor plan generation
    default_preferences = Column(JSON, nullable=True)
    
    # UI preferences
    ui_theme = Column(String, nullable=True)
    ui_settings = Column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="preferences")
