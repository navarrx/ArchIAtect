from sqlalchemy.orm import Session
from app.models.generation import Generation
from datetime import datetime

def save_generation_to_db(db: Session, user_id: int, prompt: str, layout_url: str, sd_url: str = None) -> Generation:
    """
    Guarda una nueva generación en la base de datos.
    
    Args:
        db: Sesión de base de datos
        user_id: ID del usuario que generó el plano
        prompt: El prompt usado para la generación
        layout_url: URL de la imagen del layout
        sd_url: URL de la imagen de Stable Diffusion (opcional)
        
    Returns:
        Generation: El objeto de generación creado
    """
    new_generation = Generation(
        user_id=user_id,
        prompt=prompt,
        layout_image_url=layout_url,
        sd_image_url=sd_url,
        created_at=datetime.utcnow(),
        status="success"
    )
    db.add(new_generation)
    db.commit()
    db.refresh(new_generation)
    return new_generation

def get_all_generations(db: Session):
    """
    Devuelve todas las generaciones ordenadas por fecha de creación.
    """
    return db.query(Generation).order_by(Generation.created_at.desc()).all()