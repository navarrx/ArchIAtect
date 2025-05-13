from fastapi import APIRouter

from app.api.v1.endpoints import floorplans, users, auth, generate

api_router = APIRouter()
# Update the prefixes to remove /api/v1
api_router.include_router(floorplans.router, prefix="/floorplans", tags=["floor-plans"])
api_router.include_router(generate.router, prefix="/generate", tags=["generate"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])