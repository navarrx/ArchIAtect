from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any
from google.oauth2 import id_token
from google.auth.transport import requests
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.core.exceptions import UserNotFoundError
from app.schemas.user import UserCreate
from app.schemas.token import Token
from app.schemas.user import UserUpdate
from app.services.user_service import authenticate_user, UserService
from app.db.session import get_db, SessionLocal
from sqlalchemy.orm import Session
import httpx
import logging
import time
import asyncio

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    try:
        user = await authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(subject=user.id)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_picture_url": user.profile_picture_url
            }
        }
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/register")
async def register_user(user_in: UserCreate):
    """
    Register a new user with email and password.
    """
    db = SessionLocal()
    try:
        user_service = UserService(db)
        
        # Check if user already exists
        try:
            existing_user = await user_service.get_user_by_email(user_in.email)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado"
            )
        except UserNotFoundError:
            pass  # User doesn't exist, we can create it
        
        # Validate password
        if not user_in.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña es requerida"
            )
        
        # Handle name field - split into first_name and last_name if provided
        first_name = user_in.first_name
        last_name = user_in.last_name
        if user_in.name and not (first_name or last_name):
            name_parts = user_in.name.split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        # Create user data with hashed password
        user_data = {
            "email": user_in.email,
            "first_name": first_name,
            "last_name": last_name,
            "password_hash": get_password_hash(user_in.password),
            "is_active": True
        }
        
        user = await user_service.create_user(user_data)
        
        # Create access token
        access_token = create_access_token(subject=user.id)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_picture_url": user.profile_picture_url
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al registrar el usuario"
        )
    finally:
        db.close()


@router.get("/google/login")
async def google_login():
    """
    Generate Google OAuth login URL
    """
    return {
        "url": f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=email profile&"
        f"access_type=offline&"
        f"prompt=consent"
    }

@router.post("/google/callback")
async def google_callback(request: Request):
    """
    Handle Google OAuth callback and create/update user.
    """
    try:
        # Get code from request body
        body = await request.json()
        code = body.get("code")
        if not code:
            raise HTTPException(
                status_code=422,
                detail="Code is required"
            )

        # Get token from Google
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            token_response.raise_for_status()
            token_info = token_response.json()
            
            # Add a small delay to handle clock skew
            await asyncio.sleep(1)
            
            # Verify token with Google
            id_token_str = token_info["id_token"]
            try:
                idinfo = id_token.verify_oauth2_token(
                    id_token_str,
                    requests.Request(),
                    settings.GOOGLE_CLIENT_ID,
                    clock_skew_in_seconds=10
                )
            except ValueError as e:
                logger.error(f"Token verification failed: {str(e)}")
                raise HTTPException(
                    status_code=400,
                    detail="Invalid token"
                )

            if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid issuer"
                )

            # Get user info from Google
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {"Authorization": f"Bearer {token_info['access_token']}"}
            async with httpx.AsyncClient() as client:
                userinfo_response = await client.get(userinfo_url, headers=headers)
                userinfo_response.raise_for_status()
                userinfo = userinfo_response.json()

            # Get or create user
            db = SessionLocal()
            try:
                user_service = UserService(db)
                
                # Check if user exists
                try:
                    user = await user_service.get_user_by_email(userinfo["email"])
                    # Update user info if needed
                    if user.google_id != userinfo["sub"]:
                        user.google_id = userinfo["sub"]
                        user.profile_picture_url = userinfo.get("picture")
                        db.commit()
                except UserNotFoundError:
                    # Split name into first and last name
                    name_parts = userinfo.get("name", "").split(" ", 1)
                    first_name = name_parts[0]
                    last_name = name_parts[1] if len(name_parts) > 1 else ""
                    
                    # Create new user
                    user_data = {
                        "email": userinfo["email"],
                        "first_name": first_name,
                        "last_name": last_name,
                        "google_id": userinfo["sub"],
                        "profile_picture_url": userinfo.get("picture"),
                        "is_active": True
                    }
                    user = await user_service.create_user(user_data)
                
                # Create access token
                access_token = create_access_token(
                    subject=user.id
                )
                
                return {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "profile_picture_url": user.profile_picture_url
                    }
                }
            finally:
                db.close()
                
    except Exception as e:
        logger.error(f"Error in Google callback: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.post("/reset-password")
async def reset_password(
    email: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
) -> Any:
    """
    Reset user password.
    """
    db = SessionLocal()
    try:
        user_service = UserService(db)
        try:
            user = await user_service.get_user_by_email(email)
        except UserNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El correo electrónico no está registrado"
            )
        
        # Update password
        user_update = UserUpdate(password=new_password)
        await user_service.update_user(user.id, user_update)
        
        return {"message": "Contraseña actualizada correctamente"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al actualizar la contraseña"
        )
    finally:
        db.close()
