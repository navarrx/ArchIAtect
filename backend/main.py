from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import io
import base64
# You would import your AI model here
# from model import generate_floor_plan

app = FastAPI(
    title="Floor Plan Generator API",
    description="API for generating floor plan sketches based on input parameters",
    version="1.0.0"
)

# Configure CORS to allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FloorPlanRequest(BaseModel):
    """Request model for floor plan generation"""
    room_count: int
    square_footage: float
    preferences: Dict[str, Any] = {}
    additional_parameters: Optional[Dict[str, Any]] = None

class FloorPlanResponse(BaseModel):
    """Response model for floor plan generation"""
    image_data: str  # Base64 encoded image
    metadata: Dict[str, Any]

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "online", "message": "Floor Plan Generator API is running"}

@app.post("/generate-floor-plan", response_model=FloorPlanResponse)
async def generate_floor_plan(request: FloorPlanRequest):
    """Generate a floor plan based on the provided parameters"""
    try:
        # Here you would call your AI model
        # floor_plan_image = generate_floor_plan(
        #     request.room_count,
        #     request.square_footage,
        #     request.preferences,
        #     request.additional_parameters
        # )
        
        # For demonstration, we're returning a placeholder
        # In your actual implementation, you would return the image from your model
        dummy_image_data = "base64_encoded_image_data_would_go_here"
        
        return FloorPlanResponse(
            image_data=dummy_image_data,
            metadata={
                "room_count": request.room_count,
                "square_footage": request.square_footage,
                "generation_time": "0.5s",  # You would measure this in your actual implementation
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating floor plan: {str(e)}")

@app.post("/upload-reference", response_model=Dict[str, str])
async def upload_reference(file: UploadFile = File(...)):
    """Upload a reference image to influence the floor plan generation"""
    try:
        contents = await file.read()
        # Here you would process the reference image
        # and potentially store it or extract features for your model
        
        return {"message": f"Successfully uploaded reference image: {file.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading reference image: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
