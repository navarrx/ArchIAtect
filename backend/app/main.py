import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.api import api_router
from app.core.config import settings
from app.db.session import get_db
from app.db.init_db import init_db

#"La aplicación backend sigue las buenas prácticas recomendadas por FastAPI, separando la creación de la app mediante create_app(), usando lifespan para gestionar eventos de inicio/cierre y manteniendo una estructura modular escalable con routers y middlewares separados."
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup actions
    print("🔄 Initializing database...")
    db = next(get_db())
    init_db(db)
    print("✅ Database initialized.")
    yield
    # Shutdown actions (if any)
    print("🛑 Shutting down...")

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.PROJECT_DESCRIPTION,
        version=settings.VERSION,
        openapi_url="/openapi.json",
        lifespan=lifespan
    )

    # CORS configuration
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

    # Static file serving (uploads)
    app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIRECTORY), name="static")

    # API routers
    app.include_router(api_router, prefix="/api/v1")

    return app

app = create_app()

# Health check endpoint
@app.get("/")
async def root():
    return {"status": "online", "message": f"{settings.PROJECT_NAME} API is running"}

# Uvicorn entrypoint
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)