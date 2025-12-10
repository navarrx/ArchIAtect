import base64
import os
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel

from app.core.exceptions import NonArchitecturalPromptError
from app.ml.pipeline.floorplan_pipeline import FloorPlanGenerator

GPU_SERVICE_TOKEN = os.getenv("GPU_SERVICE_TOKEN")
ENABLE_SD = os.getenv("GPU_ENABLE_SD", "true").lower() == "true"
PORT = int(os.getenv("PORT", "8001"))

app = FastAPI(title="ArchIAtect GPU Service", version="1.0.0")
generator = FloorPlanGenerator(use_stable_diffusion=ENABLE_SD)


class GenerateRequest(BaseModel):
    prompt: str


class GenerateResponse(BaseModel):
    layout_image_base64: str
    sd_image_base64: Optional[str] = None


def verify_token(authorization: Optional[str] = Header(None)):
    if not GPU_SERVICE_TOKEN:
        return
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    token = authorization.split(" ", 1)[1]
    if token != GPU_SERVICE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid GPU service token"
        )


def _encode_file(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest, _=Depends(verify_token)):
    try:
        result = generator.generate_from_prompt(req.prompt)
        layout_path = result["output_files"]["visualization"]
        sd_path = result["output_files"].get("sd_image")
        return GenerateResponse(
            layout_image_base64=_encode_file(layout_path),
            sd_image_base64=_encode_file(sd_path) if sd_path else None,
        )
    except NonArchitecturalPromptError as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.gpu_service.main:app", host="0.0.0.0", port=PORT, reload=False)


