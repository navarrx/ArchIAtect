import io
import uuid
from datetime import datetime
from fastapi import UploadFile, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from PIL import Image

from app.core.config import settings
from app.db.session import get_db
from app.models.floor_plan import FloorPlan
from app.models.reference_image import ReferenceImage, FloorPlanReferenceImage
from app.schemas.floor_plan import FloorPlanResponse, FloorPlanList
from app.utils.storage import storage

# This would be your actual model import
# from app.ml.floor_plan_model import generate_floor_plan_image


async def generate_floor_plan(
    room_count: int,
    square_footage: float,
    preferences: Dict[str, Any],
    additional_parameters: Optional[Dict[str, Any]] = None,
    user_id: str = None,
    reference_image_ids: Optional[List[str]] = None,
    db: Session = Depends(get_db)
) -> FloorPlanResponse:
    """
    Generate a floor plan using the AI model
    Returns a FloorPlanResponse with base64 encoded image
    """
    # Validate parameters
    if room_count < 1 or room_count > settings.MODEL_MAX_ROOM_COUNT:
        raise ValueError(f"Room count must be between 1 and {settings.MODEL_MAX_ROOM_COUNT}")
    
    if square_footage < settings.MODEL_MIN_SQUARE_FOOTAGE or square_footage > settings.MODEL_MAX_SQUARE_FOOTAGE:
        raise ValueError(f"Square footage must be between {settings.MODEL_MIN_SQUARE_FOOTAGE} and {settings.MODEL_MAX_SQUARE_FOOTAGE}")
    
    # This is where you would call your actual model
    # floor_plan_image = generate_floor_plan_image(
    #     room_count=room_count,
    #     square_footage=square_footage,
    #     preferences=preferences,
    #     additional_parameters=additional_parameters
    # )
    
    # For demonstration, we'll create a dummy image
    # In your actual implementation, this would be the output from your model
    dummy_image = Image.new('RGB', (800, 600), color='white')
    
    # Convert image to bytes
    img_byte_arr = io.BytesIO()
    dummy_image.save(img_byte_arr, format='PNG')
    img_bytes = img_byte_arr.getvalue()
    
    # Generate a unique ID for the floor plan
    floor_plan_id = str(uuid.uuid4())
    
    # Upload the image to local storage
    storage_path, public_url = await storage.upload_bytes(
        content=img_bytes,
        filename=f"{floor_plan_id}.png",
        content_type="image/png",
        folder="generated"
    )
    
    # Create a thumbnail
    thumbnail = dummy_image.copy()
    thumbnail.thumbnail((200, 200))
    thumb_byte_arr = io.BytesIO()
    thumbnail.save(thumb_byte_arr, format='PNG')
    thumb_bytes = thumb_byte_arr.getvalue()
    
    # Upload the thumbnail
    thumbnail_path, thumbnail_url = await storage.upload_bytes(
        content=thumb_bytes,
        filename=f"{floor_plan_id}_thumb.png",
        content_type="image/png",
        folder="generated/thumbnails"
    )
    
    # Create a new floor plan record in the database
    db_floor_plan = FloorPlan(
        id=floor_plan_id,
        user_id=user_id,
        room_count=room_count,
        square_footage=square_footage,
        storage_path=storage_path,
        public_url=public_url,
        thumbnail_path=thumbnail_path,
        thumbnail_url=thumbnail_url,
        preferences=preferences,
        generation_time=0.5  # This would be the actual generation time in your implementation
    )
    
    db.add(db_floor_plan)
    
    # Associate reference images if provided
    if reference_image_ids:
        for ref_id in reference_image_ids:
            ref_image = db.query(ReferenceImage).filter(ReferenceImage.id == ref_id).first()
            if ref_image:
                db_ref_link = FloorPlanReferenceImage(
                    id=str(uuid.uuid4()),
                    floor_plan_id=floor_plan_id,
                    reference_image_id=ref_id
                )
                db.add(db_ref_link)
    
    db.commit()
    db.refresh(db_floor_plan)
    
    # Return the response
    return FloorPlanResponse(
        id=db_floor_plan.id,
        created_at=db_floor_plan.created_at,
        image_url=db_floor_plan.public_url,
        thumbnail_url=db_floor_plan.thumbnail_url,
        metadata={
            "room_count": db_floor_plan.room_count,
            "square_footage": db_floor_plan.square_footage,
            "generation_time": db_floor_plan.generation_time,
            "user_id": db_floor_plan.user_id
        }
    )


async def save_reference_image(
    file: UploadFile, 
    user_id: str = None,
    db: Session = Depends(get_db)
) -> str:
    """
    Save a reference image uploaded by the user
    Returns the file ID
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise ValueError("File must be an image")
    
    # Generate a unique file ID
    file_id = str(uuid.uuid4())
    
    # Upload to local storage
    storage_path, public_url = await storage.upload_file(
        file=file,
        folder="uploads"
    )
    
    # Create a database record
    db_ref_image = ReferenceImage(
        id=file_id,
        user_id=user_id,
        original_filename=file.filename,
        storage_path=storage_path,
        public_url=public_url,
        content_type=file.content_type
    )
    
    db.add(db_ref_image)
    db.commit()
    db.refresh(db_ref_image)
    
    return file_id


async def get_floor_plan_history(
    user_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[FloorPlanList]:
    """
    Get the floor plan history for a user
    """
    floor_plans = db.query(FloorPlan).filter(
        FloorPlan.user_id == user_id
    ).order_by(
        FloorPlan.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return [
        FloorPlanList(
            id=plan.id,
            created_at=plan.created_at,
            room_count=plan.room_count,
            square_footage=plan.square_footage,
            thumbnail_url=plan.thumbnail_url
        ) for plan in floor_plans
    ]


async def get_floor_plan_by_id(
    floor_plan_id: str,
    user_id: str = None,
    db: Session = Depends(get_db)
) -> Optional[FloorPlanResponse]:
    """
    Get a floor plan by ID
    """
    query = db.query(FloorPlan).filter(FloorPlan.id == floor_plan_id)
    
    # If user_id is provided, ensure the floor plan belongs to the user
    if user_id:
        query = query.filter(FloorPlan.user_id == user_id)
    
    floor_plan = query.first()
    
    if not floor_plan:
        return None
    
    return FloorPlanResponse(
        id=floor_plan.id,
        created_at=floor_plan.created_at,
        image_url=floor_plan.public_url,
        thumbnail_url=floor_plan.thumbnail_url,
        metadata={
            "room_count": floor_plan.room_count,
            "square_footage": floor_plan.square_footage,
            "generation_time": floor_plan.generation_time,
            "user_id": floor_plan.user_id
        }
    )


async def delete_floor_plan(
    floor_plan_id: str,
    user_id: str,
    db: Session = Depends(get_db)
) -> bool:
    """
    Delete a floor plan
    """
    floor_plan = db.query(FloorPlan).filter(
        FloorPlan.id == floor_plan_id,
        FloorPlan.user_id == user_id
    ).first()
    
    if not floor_plan:
        return False
    
    # Delete from local storage
    storage.delete_file(floor_plan.storage_path)
    if floor_plan.thumbnail_path:
        storage.delete_file(floor_plan.thumbnail_path)
    
    # Delete reference image associations
    db.query(FloorPlanReferenceImage).filter(
        FloorPlanReferenceImage.floor_plan_id == floor_plan_id
    ).delete()
    
    # Delete the floor plan record
    db.delete(floor_plan)
    db.commit()
    
    return True
