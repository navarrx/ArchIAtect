from sqlalchemy import Column, Integer, Stirng, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import Base
from sqlalchemy.sql import func

class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    layout_image_url = Column(Text, nullable=False)
    sd_image_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="generations")
    favourites = relationship("Favourite", back_populates="generation")