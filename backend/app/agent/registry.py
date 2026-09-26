import logging
from typing import Dict, Any, Optional
from app.models.base import BaseModel
from app.models.vqa.vqa_model import RemoteSensingVQAAdapter
from app.models.captioning.captioner import RemoteSensingCaptioner
from app.models.grounding.grounder import RemoteSensingGrounder
from app.models.change_detection.change_detector import ChangeDetector
from app.models.change_vqa.change_vqa import ChangeVQA
from app.models.optical_sar.optical_sar_fusion import OpticalSARAnalyzer

logger = logging.getLogger("satquery.registry")

class ModelRegistry:
    def __init__(self):
        self._models: Dict[str, BaseModel] = {}
        self._init_registry()

    def _init_registry(self):
        """Register all specialist remote-sensing model adapters lazily."""
        self.register("vqa", RemoteSensingVQAAdapter())
        self.register("captioning", RemoteSensingCaptioner())
        self.register("grounding", RemoteSensingGrounder())
        self.register("change_detection", ChangeDetector())
        self.register("change_vqa", ChangeVQA())
        self.register("optical_sar", OpticalSARAnalyzer())

    def register(self, task_type: str, model: BaseModel):
        self._models[task_type] = model
        logger.info(f"Registered model adapter '{model.model_name}' for task '{task_type}'")

    def get_model(self, task_type: str) -> BaseModel:
        if task_type not in self._models:
            raise KeyError(f"No specialist model registered for task type '{task_type}'")
        
        model = self._models[task_type]
        if not model.is_loaded:
            logger.info(f"Lazy loading model weights for task '{task_type}' ({model.model_name})...")
            model.load()
        return model

    def list_models(self) -> Dict[str, str]:
        return {task: model.model_name for task, model in self._models.items()}

# Global Registry Instance
model_registry = ModelRegistry()
