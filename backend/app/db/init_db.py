import logging
from sqlalchemy.orm import Session

from app.db.session import engine
from app.models.base import Base
from app.core.config import settings
from app.schemas.user import UserCreate
from app.services.user_service import create_user

# Import all models to ensure they are registered with SQLAlchemy
from app.models.user import User
from app.models.floor_plan import FloorPlan
from app.models.reference_image import ReferenceImage, FloorPlanReferenceImage
from app.models.user_preference import UserPreference

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
            create_user(db, user_in)
            logger.info(f"Superuser {settings.FIRST_SUPERUSER} created")
        else:
            logger.info(f"Superuser {settings.FIRST_SUPERUSER} already exists")
