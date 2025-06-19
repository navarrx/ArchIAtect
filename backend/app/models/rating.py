from sqlalchemy import Column, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from .base import Base

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    generation_id = Column(Integer, ForeignKey("generations.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    feedback = Column(JSON, nullable=True)  # JSON with selected criticisms and custom text

    user = relationship("User", back_populates="ratings")
    generation = relationship("Generation", back_populates="ratings") 