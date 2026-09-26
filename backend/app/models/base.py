from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import numpy as np

class BaseModel(ABC):
    """
    Abstract base adapter class for all remote sensing specialist models.
    Enforces unified interface across VQA, Captioning, Grounding, Change Detection, and Optical-SAR.
    """
    def __init__(self, model_name: str, task_type: str):
        self.model_name = model_name
        self.task_type = task_type
        self._is_loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    def load(self) -> None:
        """Lazy load model parameters/weights into memory/GPU."""
        self._is_loaded = True

    @abstractmethod
    def predict(
        self, 
        images: List[np.ndarray], 
        query: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute prediction on given image array(s) and query.
        Returns a dict matching specialist output contracts:
        {
          "answer": "...",
          "confidence": float or None,
          "evidence": [...],
          "metadata": {...}
        }
        """
        pass
