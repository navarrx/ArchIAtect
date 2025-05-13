import logging
from app.db.session import SessionLocal
from app.db.init_db import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init() -> None:
    db = SessionLocal()
    try:
        logger.info("Creating initial data")
        init_db(db)
        logger.info("Initial data created")
    except Exception as e:
        logger.error(f"Error creating initial data: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("Creating initial data")
    init()
    logger.info("Initial data created") 