import logging
from sqlalchemy.orm import Session

from app.db.session import engine
from app.models.base import Base
from app.core.config import settings
from app.schemas.user import UserCreate
from app.services.user_service import UserService

# Import all models to ensure they are registered with SQLAlchemy
from app.models.user import User
from app.models.generation import Generation
from app.models.favourite import Favourite

logger = logging.getLogger(__name__)

def init_db(db: Session) -> None:
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create initial superuser if configured
    if settings.FIRST_SUPERUSER:
        user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER).first()
        if not user:
            user_in = UserCreate(
                email=settings.FIRST_SUPERUSER,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                is_superuser=True,
                full_name="Initial Superuser",
            )
            user_service = UserService(db)
            user_service.create_user(user_in)
            logger.info(f"Superuser {settings.FIRST_SUPERUSER} created")
        else:
            logger.info(f"Superuser {settings.FIRST_SUPERUSER} already exists")
