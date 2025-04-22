from fastapi import APIRouter

from app.api.v1.endpoints import floor_plans, users, auth

api_router = APIRouter()
# Update the prefixes to remove /api/v1
api_router.include_router(floor_plans.router, prefix="/floor-plans", tags=["floor-plans"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])