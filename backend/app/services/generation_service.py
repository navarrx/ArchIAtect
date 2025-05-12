from app.ml.pipeline.floorplan_pipeline import FloorPlanGenerator
from app.db.crud import save_generation_to_db
from app.core.gcs import upload_to_gcs
from app.schemas.generation import GenerationResponse
import logging

logger = logging.getLogger(__name__)
generator = FloorPlanGenerator(use_stable_diffusion=True)

async def generate(prompt: str) -> GenerationResponse:
    if not prompt or len(prompt.strip()) == 0:
        raise ValueError("Prompt cannot be empty")

    logger.info(f"🚀 Generating floor plan for prompt: {prompt}")
    result = generator.generate_from_prompt(prompt)

    # Subir imágenes a GCS
    layout_url = upload_to_gcs(result["output_files"]["visualization"])
    sd_url = upload_to_gcs(result["output_files"].get("sd_image"))

    # Guardar en base de datos
    generation_id = save_generation_to_db(prompt, layout_url, sd_url)

    logger.info(f"✅ Floor plan generated and saved (id={generation_id})")

    return GenerationResponse(
        prompt=prompt,
        layout_image_url=layout_url,
        sd_image_url=sd_url
    )