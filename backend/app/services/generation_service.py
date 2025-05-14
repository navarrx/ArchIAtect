from sqlalchemy.orm import Session
from app.ml.pipeline.floorplan_pipeline import FloorPlanGenerator
from app.core.gcs import upload_to_gcs
from app.db import crud
from app.schemas.generation import GenerationResponse
import logging

logger = logging.getLogger(__name__)
generator = FloorPlanGenerator(use_stable_diffusion=True)

def generate_floorplan(db: Session, user_id: int, prompt: str) -> GenerationResponse:
    if not prompt or len(prompt.strip()) == 0:
        raise ValueError("Prompt cannot be empty")

    logger.info(f"🚀 Generating floor plan for user {user_id} with prompt: {prompt}")
    result = generator.generate_from_prompt(prompt)

    # Subir imágenes a GCS
    layout_url = upload_to_gcs(result["output_files"]["visualization"])
    sd_url = None
    if "sd_image" in result["output_files"]:
        sd_url = upload_to_gcs(result["output_files"]["sd_image"])

    # Guardar en base de datos
    generation = crud.save_generation_to_db(db, user_id, prompt, layout_url, sd_url)

    logger.info(f"✅ Floor plan generated and saved (id={generation.id})")

    return GenerationResponse(
        id=generation.id,
        prompt=prompt,
        layout_image_url=layout_url,
        sd_image_url=sd_url,
        created_at=generation.created_at,
        status=generation.status,
        error_message=generation.error_message
    )

def get_all_floorplans(db: Session, page: int = 1, limit: int = 10):
    skip = (page - 1) * limit
    generations = db.query(crud.Generation).offset(skip).limit(limit).all()

    return [
        GenerationResponse(
            id=g.id,
            prompt=g.prompt,
            layout_image_url=g.layout_image_url,
            sd_image_url=g.sd_image_url,
            created_at=g.created_at,
            status=g.status,
            error_message=g.error_message
        )
        for g in generations
    ]
