import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.api.v1.api import api_router
from app.core.config import settings
from app.db.session import get_db
from app.db.init_db import init_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    # Remove the prefix from OpenAPI URL to make docs accessible at /docs
    openapi_url="/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directories exist
os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIRECTORY, "uploads"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIRECTORY, "generated"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIRECTORY, "generated/thumbnails"), exist_ok=True)

# Mount static files directory for serving uploaded files
app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIRECTORY), name="static")

# Include API router without prefix
app.include_router(api_router)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "online", "message": f"{settings.PROJECT_NAME} API is running"}

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    db = next(get_db())
    init_db(db)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)