import base64
import logging
import os
import tempfile
from typing import Optional, Tuple, TYPE_CHECKING

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import NonArchitecturalPromptError
from app.core.gcs import upload_to_gcs
from app.db import crud
from app.schemas.generation import GenerationResponse

if TYPE_CHECKING:  # pragma: no cover - for type checkers only
    from app.ml.pipeline.floorplan_pipeline import FloorPlanGenerator

logger = logging.getLogger(__name__)
_generator: Optional["FloorPlanGenerator"] = None


def _get_generator() -> "FloorPlanGenerator":
    """Lazy-load the heavy pipeline only when running in local mode."""
    global _generator
    if _generator is None:
        from app.ml.pipeline.floorplan_pipeline import FloorPlanGenerator

        _generator = FloorPlanGenerator(use_stable_diffusion=True)
    return _generator


def _decode_base64_to_file(data: str, suffix: str) -> str:
    fd, path = tempfile.mkstemp(prefix="gen-", suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        f.write(base64.b64decode(data))
    return path


def _upload_images(layout_path: str, sd_path: Optional[str]) -> Tuple[str, Optional[str]]:
    layout_url = upload_to_gcs(layout_path)
    sd_url = upload_to_gcs(sd_path) if sd_path else None
    return layout_url, sd_url


def _generate_remote(prompt: str) -> Tuple[str, Optional[str]]:
    if not settings.GPU_SERVICE_URL:
        raise ValueError("GPU_SERVICE_URL must be configured for remote mode")

    headers = {}
    if settings.GPU_SERVICE_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GPU_SERVICE_TOKEN}"

    url = str(settings.GPU_SERVICE_URL).rstrip("/") + "/generate"
    try:
        response = httpx.post(
            url,
            json={"prompt": prompt},
            headers=headers,
            timeout=settings.GPU_REQUEST_TIMEOUT,
        )
        if response.status_code == 400:
            # Propagate domain errors
            detail = response.json().get("detail", "Invalid prompt")
            raise NonArchitecturalPromptError(prompt=prompt or detail)
        response.raise_for_status()
        payload = response.json()
    except NonArchitecturalPromptError:
        raise
    except Exception as exc:
        logger.error(f"Remote GPU service error: {exc}")
        raise ValueError(f"Remote GPU service error: {exc}")

    layout_b64 = payload.get("layout_image_base64")
    sd_b64 = payload.get("sd_image_base64")
    if not layout_b64:
        raise ValueError("Remote GPU service did not return layout_image_base64")

    layout_path = _decode_base64_to_file(layout_b64, suffix="-layout.png")
    sd_path = _decode_base64_to_file(sd_b64, suffix="-sd.png") if sd_b64 else None
    return layout_path, sd_path


def _generate_local(prompt: str) -> Tuple[str, Optional[str]]:
    generator = _get_generator()
    try:
        result = generator.generate_from_prompt(prompt)
    except NonArchitecturalPromptError:
        raise
    except Exception as exc:
        logger.error(f"Error generating floor plan locally: {exc}")
        raise ValueError(f"Error generating floor plan: {exc}")

    layout_path = result["output_files"]["visualization"]
    sd_path = result["output_files"].get("sd_image")
    return layout_path, sd_path


def generate_floorplan(db: Session, user_id: int, prompt: str) -> GenerationResponse:
    if not prompt or len(prompt.strip()) == 0:
        raise ValueError("Prompt cannot be empty")

    logger.info(f"🚀 Generating floor plan for user {user_id} with prompt: {prompt}")
    
    mode = settings.GPU_MODE.lower()
    layout_path: str
    sd_path: Optional[str]

    if mode == "remote":
        layout_path, sd_path = _generate_remote(prompt)
    else:
        layout_path, sd_path = _generate_local(prompt)

    layout_url, sd_url = _upload_images(layout_path, sd_path)

    generation = crud.save_generation_to_db(db, user_id, prompt, layout_url, sd_url)

    logger.info(f"✅ Floor plan generated and saved (id={generation.id}, mode={mode})")

    return GenerationResponse(
        id=generation.id,
        prompt=prompt,
        layout_image_url=layout_url,
        sd_image_url=sd_url,
        created_at=generation.created_at,
        status=generation.status,
        error_message=generation.error_message,
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
            error_message=g.error_message,
        )
        for g in generations
    ]


def get_recent_floorplans(db: Session, user_id: int, limit: int = 5):
    generations = (
        db.query(crud.Generation)
        .filter(crud.Generation.user_id == user_id)
        .order_by(crud.Generation.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        GenerationResponse(
            id=g.id,
            prompt=g.prompt,
            layout_image_url=g.layout_image_url,
            sd_image_url=g.sd_image_url,
            created_at=g.created_at,
            status=g.status,
            error_message=g.error_message,
        )
        for g in generations
    ]