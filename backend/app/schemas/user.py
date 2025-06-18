from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    google_id: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "email": "usuario@ejemplo.com",
                "name": "Juan Pérez",
                "profile_picture_url": "https://ejemplo.com/foto.jpg"
            }
        }

class UserCreate(UserBase):
    password: Optional[str] = None

class UserUpdate(UserBase):
    email: Optional[str] = None
    password: Optional[str] = None

class UserInDB(UserBase):
    id: int = Field(..., description="ID único del usuario")
    created_at: datetime = Field(..., description="Fecha de creación")
    is_active: bool = Field(True, description="Indica si el usuario está activo")
    is_superuser: bool = Field(False, description="Indica si el usuario es superusuario")
    hashed_password: str = Field(..., description="Contraseña hasheada")

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    created_at: datetime
    is_active: bool
    is_superuser: bool

    class Config:
        from_attributes = True