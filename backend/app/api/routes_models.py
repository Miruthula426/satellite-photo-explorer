from fastapi import APIRouter
from app.agent.registry import model_registry

router = APIRouter()

@router.get("/models")
def list_models():
    return {
        "registered_models": model_registry.list_models(),
        "status": "active"
    }
