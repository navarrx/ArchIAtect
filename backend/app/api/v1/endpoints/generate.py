from fastapi import APIRouter, HTTPException
from app.schemas.generation import GenerationRequest, GenerationResponse
from app.services import generation_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/generate", response_model=GenerationResponse, tags=["Generation"])
async def generate_floorplan(req: GenerationRequest):
    return await generation_service.generate(req.prompt)
    
@router.get("/history", response_model=list[GenerationResponse], tags=["Generation"])
async def get_generation_history():
    pass