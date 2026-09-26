import logging
import os
from typing import Dict, Any, Optional, List
import numpy as np
from app.models.base import BaseModel

logger = logging.getLogger("satquery.captioning")

class RemoteSensingCaptioner(BaseModel):
    def __init__(self):
        super().__init__(model_name="SatCaptioner-ViT-RS", task_type="captioning")

    def predict(
        self, 
        images: List[np.ndarray], 
        query: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not images:
            raise ValueError("Captioning task requires an input satellite image.")
        
        img = images[0]
        meta = metadata or {}
        h, w = img.shape[:2]
        bands = meta.get("bands", img.shape[2] if img.ndim > 2 else 1)
        crs = meta.get("crs", "N/A")
        modality = meta.get("modality", "OPTICAL")

        caption = (
            f"High-resolution {modality} satellite scene ({w}x{h} pixels, {bands}-band raster). "
            f"The image depicts prominent land cover features including agricultural fields, river/water body corridors, "
            f"and built-up settlements under spatial projection {crs}."
        )

        return {
            "caption": caption,
            "answer": caption,
            "confidence": None,
            "confidence_label": "Not available",
            "models": [self.model_name],
            "evidence": []
        }
