import os
from fastapi import APIRouter
from app.schemas.analysis import HealthResponseSchema
from app.agent.registry import model_registry

router = APIRouter()

@router.get("/health", response_model=HealthResponseSchema)
def get_health():
    try:
        import torch
        device_str = "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        device_str = "cpu (lightweight mode)"

    loaded_models = [
        name for task, model in model_registry._models.items() if model.is_loaded
        for name in [model.model_name]
    ]
    return HealthResponseSchema(
        status="ok",
        version="1.0.0",
        models_loaded=loaded_models,
        device=device_str
    )
