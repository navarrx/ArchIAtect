import os
import uuid
import shutil
from typing import Tuple
from fastapi import UploadFile
from fastapi.staticfiles import StaticFiles

from app.core.config import settings


class LocalStorage:
    """Utility class for local file storage operations"""
    
    def __init__(self):
        # Ensure storage directories exist
        os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)
        os.makedirs(os.path.join(settings.UPLOAD_DIRECTORY, "uploads"), exist_ok=True)
        os.makedirs(os.path.join(settings.UPLOAD_DIRECTORY, "generated"), exist_ok=True)
        os.makedirs(os.path.join(settings.UPLOAD_DIRECTORY, "generated/thumbnails"), exist_ok=True)
    
    async def upload_file(
        self, 
        file: UploadFile, 
        folder: str = "uploads"
    ) -> Tuple[str, str]:
        """
        Save a file to local storage
        Returns: (storage_path, public_url)
        """
        # Generate a unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Create full directory path
        directory_path = os.path.join(settings.UPLOAD_DIRECTORY, folder)
        os.makedirs(directory_path, exist_ok=True)
        
        # Create full file path
        storage_path = os.path.join(folder, unique_filename)
        full_path = os.path.join(settings.UPLOAD_DIRECTORY, storage_path)
        
        # Read file content
        content = await file.read()
        
        # Write to file
        with open(full_path, "wb") as f:
            f.write(content)
        
        # Generate public URL (relative to static files mount point)
        public_url = f"/static/{storage_path}"
        
        return storage_path, public_url
    
    async def upload_bytes(
        self, 
        content: bytes, 
        filename: str,
        content_type: str,
        folder: str = "generated"
    ) -> Tuple[str, str]:
        """
        Save bytes to local storage
        Returns: (storage_path, public_url)
        """
        # Create full directory path
        directory_path = os.path.join(settings.UPLOAD_DIRECTORY, folder)
        os.makedirs(directory_path, exist_ok=True)
        
        # Create full file path
        storage_path = os.path.join(folder, filename)
        full_path = os.path.join(settings.UPLOAD_DIRECTORY, storage_path)
        
        # Write to file
        with open(full_path, "wb") as f:
            f.write(content)
        
        # Generate public URL (relative to static files mount point)
        public_url = f"/static/{storage_path}"
        
        return storage_path, public_url
    
    def delete_file(self, storage_path: str) -> bool:
        """
        Delete a file from local storage
        Returns: True if successful, False otherwise
        """
        full_path = os.path.join(settings.UPLOAD_DIRECTORY, storage_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False


# Create a singleton instance
storage = LocalStorage()
