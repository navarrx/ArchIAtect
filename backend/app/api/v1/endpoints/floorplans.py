from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.services.generation_service import get_all_floorplans
from app.db.session import get_db
from app.schemas.generation import GenerationResponse
from typing import List

router = APIRouter()

@router.get("/floorplans", response_model=List[GenerationResponse])
def read_floorplans(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),  
    limit: int = Query(10, le=50),
):
    return get_all_floorplans(db, page, limit)
