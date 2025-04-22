from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status, Query
from sqlalchemy.orm import Session
from typing import Any, List, Optional

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.floor_plan import FloorPlanRequest, FloorPlanResponse, FloorPlanList
from app.services.floor_plan_service import (
    generate_floor_plan, 
    save_reference_image, 
    get_floor_plan_history,
    get_floor_plan_by_id,
    delete_floor_plan
)

router = APIRouter()


@router.post("/generate", response_model=FloorPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_floor_plan(
    *,
    floor_plan_in: FloorPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Generate a new floor plan based on the provided parameters.
    """
    try:
        result = await generate_floor_plan(
            room_count=floor_plan_in.room_count,
            square_footage=floor_plan_in.square_footage,
            preferences=floor_plan_in.preferences,
            additional_parameters=floor_plan_in.additional_parameters,
            reference_image_ids=floor_plan_in.reference_image_ids,
            user_id=current_user.id,
            db=db
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating floor plan: {str(e)}"
        )


@router.post("/upload-reference", status_code=status.HTTP_200_OK)
async def upload_reference(
    *,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Upload a reference image to influence the floor plan generation.
    """
    try:
        file_id = await save_reference_image(
            file=file,
            user_id=current_user.id,
            db=db
        )
        return {"message": "Reference image uploaded successfully", "file_id": file_id}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading reference image: {str(e)}"
        )


@router.get("/history", response_model=List[FloorPlanList])
async def get_history(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve the history of generated floor plans for the current user.
    """
    return await get_floor_plan_history(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        db=db
    )


@router.get("/{floor_plan_id}", response_model=FloorPlanResponse)
async def get_floor_plan(
    floor_plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve a specific floor plan by ID.
    """
    floor_plan = await get_floor_plan_by_id(
        floor_plan_id=floor_plan_id,
        user_id=current_user.id,
        db=db
    )
    
    if not floor_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Floor plan not found"
        )
    
    return floor_plan


@router.delete("/{floor_plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_floor_plan(
    floor_plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:  # Changed return type to None
    """
    Delete a floor plan.
    """
    success = await delete_floor_plan(
        floor_plan_id=floor_plan_id,
        user_id=current_user.id,
        db=db
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Floor plan not found"
        )
    
    # Return None explicitly for 204 No Content
    return None