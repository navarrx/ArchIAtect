from sqlalchemy.orm import Session
from app.models.generation import Generation
from datetime import datetime

def save_generation_to_db(db: Session, prompt: str, layout_url: str, sd_url: str) -> int:
    """
    Guarda una nueva generación en la base de datos.
    """
    new_generation = Generation(
        prompt=prompt,
        layout_image_url=layout_url,
        sd_image_url=sd_url,
        generated_at=datetime.utcnow()
    )
    db.add(new_generation)
    db.commit()
    db.refresh(new_generation)
    return new_generation.id

def get_all_generations(db: Session):
    """
    Devuelve todas las generaciones.
    """
    return db.query(Generation).order_by(Generation.generated_at.desc()).all()