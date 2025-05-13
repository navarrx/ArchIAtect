from typing import Optional
from pydantic import BaseModel, Field

class Token(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Type of token")

class TokenPayload(BaseModel):
    sub: Optional[int] = Field(None, description="Subject (user ID)")
    exp: Optional[int] = Field(None, description="Expiration time") 