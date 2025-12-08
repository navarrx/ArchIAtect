# backend/app/core/exceptions.py
from fastapi import HTTPException, status

class UserNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

class InvalidCredentialsError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

class NonArchitecturalPromptError(HTTPException):
    def __init__(self, prompt: str = None):
        detail = "El prompt proporcionado no contiene información arquitectónica válida. "
        detail += "Por favor, incluye detalles sobre habitaciones, espacios o requerimientos de construcción. "
        detail += "Ejemplos de prompts válidos:\n"
        detail += "• 'Una casa con 3 dormitorios, 2 baños y una cocina'\n"
        detail += "• 'Necesito un apartamento con living room, cocina y 2 dormitorios'\n"
        detail += "• 'Diseña una casa moderna con garage, sala de estar y comedor'"
        
        if prompt:
            detail += f"\n\nPrompt recibido: '{prompt[:100]}{'...' if len(prompt) > 100 else ''}'"
        
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )