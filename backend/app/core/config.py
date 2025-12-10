import os
import secrets
from dotenv import load_dotenv
from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Cargar el archivo .env desde la raíz del proyecto
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env")
load_dotenv(dotenv_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "ArchIAtect"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    DATABASE_URL: Optional[str] = None  # Compatible with Railway/Heroku style URLs
    POSTGRES_SERVER: Optional[str] = None
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_DB: Optional[str] = None

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            # Normalize common postgres:// prefix to postgresql:// for SQLAlchemy
            return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
        required = [self.POSTGRES_SERVER, self.POSTGRES_USER, self.POSTGRES_PASSWORD, self.POSTGRES_DB]
        if not all(required):
            raise ValueError("Database configuration is missing. Set DATABASE_URL or POSTGRES_* variables.")
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

    PROJECT_DESCRIPTION: str = "API for generating floor plan sketches based on input parameters"

    # Configuración de la carpeta de uploads
    UPLOAD_DIRECTORY: str = "uploads"

    # Configuración del superusuario inicial
    FIRST_SUPERUSER: Optional[str] = None
    FIRST_SUPERUSER_PASSWORD: Optional[str] = None

    # Google OAuth settings
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/google/callback"

    # GPU service (remote/local)
    GPU_MODE: str = "local"  # options: local (run in-process), remote (tunnel)
    GPU_SERVICE_URL: Optional[AnyHttpUrl] = None
    GPU_SERVICE_TOKEN: Optional[str] = None
    GPU_REQUEST_TIMEOUT: int = 120  # seconds

    model_config = SettingsConfigDict(env_file=".env")

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[str, List[str]]:
        if isinstance(v, str) and not v.startswith("["):
            # Parse comma-separated string
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

settings = Settings()