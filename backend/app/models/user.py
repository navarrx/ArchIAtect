from sqlalchemy import Boolean, Column, String
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Relationships
    floor_plans = relationship("FloorPlan", back_populates="user")
    reference_images = relationship("ReferenceImage", back_populates="user")
    preferences = relationship("UserPreference", back_populates="user", uselist=False)
