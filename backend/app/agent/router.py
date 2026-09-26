import logging
from typing import Dict, Any, List

logger = logging.getLogger("satquery.router")

class TaskRouter:
    """
    Agent Query & Modality Router.
    Inspects user natural-language query, number of input images, and detected sensor modalities
    to determine the optimal remote sensing task workflow.
    """

    @staticmethod
    def classify_task(query: str, image_count: int, modalities: List[str], mode_hint: str = "auto") -> str:
        q = (query or "").lower().strip()

        # Explicit mode overrides if user specified in UI
        if mode_hint == "optical_sar" and image_count >= 2:
            return "optical_sar"
        if mode_hint == "bitemporal" and image_count >= 2:
            if "map" in q or "detect" in q:
                return "change_detection"
            return "change_vqa"

        # Auto-routing logic
        if image_count >= 2:
            if "sar" in q or "fusion" in q or "optical and sar" in q or "multimodal" in q or "sar" in modalities:
                return "optical_sar"
            if "changed" in q or "change" in q or "increase" in q or "decrease" in q or "temporal" in q:
                return "change_vqa"
            return "change_detection"

        # Single image tasks
        if any(w in q for w in ["highlight", "detect", "ground", "find", "locate", "outline", "mask", "box"]):
            return "grounding"
        if any(w in q for w in ["describe", "caption", "summary", "overview"]):
            return "captioning"
        
        # Default single image task is RS VQA
        return "vqa"
