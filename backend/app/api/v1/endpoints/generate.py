from fastapi import APIRouter, HTTPException, Depends
from app.schemas.generation import GenerationRequest, GenerationResponse
from app.services.generation_service import generate_floorplan, get_all_floorplans
from app.db.session import get_db
from app.api.deps import get_current_user
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=GenerationResponse, tags=["Generation"])
def generate_floorplan_endpoint(
    req: GenerationRequest,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate a floor plan from a prompt.
    """
    try:
        result = generate_floorplan(db, current_user.id, req.prompt)
        return result
    except Exception as e:
        logger.error(f"Error in generate endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=list[GenerationResponse], tags=["Generation"])
def get_history(
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all generated floor plans.
    """
    try:
        return get_all_floorplans(db)
    except Exception as e:
        logger.error(f"Error in history endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint para testing sin autenticación - Sprint 1
@router.post("/test", response_model=GenerationResponse, tags=["Generation"])
def generate_floorplan_test(
    req: GenerationRequest,
    db = Depends(get_db)
):
    """
    Test endpoint for generating floor plans without authentication.
    This endpoint is temporary and should be removed before production.
    """
    try:
        # Using a default user ID of 1 for testing
        result = generate_floorplan(db, 1, req.prompt)
        return result
    except Exception as e:
        logger.error(f"Error in test generate endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))