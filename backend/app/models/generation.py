from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(Text, nullable=False)
    image_url = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="pending")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    user = relationship("User", back_populates="generations")
    favourites = relationship("Favourite", back_populates="generation")