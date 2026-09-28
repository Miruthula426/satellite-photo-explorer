import logging
import os
from typing import Dict, Any, Optional, List
import numpy as np
from app.models.base import BaseModel
from app.remote_sensing.preprocessing import convert_array_to_base64_png, normalize_to_uint8

logger = logging.getLogger("satquery.vqa")

class BaseVQAAdapter(BaseModel):
    """Abstract base adapter for VQA models."""
    def __init__(self, model_name: str, implementation_status: str = "baseline"):
        super().__init__(
            model_name=model_name,
            task_type="vqa",
            implementation_status=implementation_status,
            is_trained=False,
            is_remote_sensing_adapted=False
        )

class GenericVLMSynthesisAdapter(BaseVQAAdapter):
    """
    VQA adapter using foundation VLM APIs (Gemini) with prompt engineering,
    OR local spectral statistics baseline when API key is unavailable.
    
    CRITICAL POLICY: Truthfully distinguishes GENERIC_LLM_SYNTHESIS from
    domain-adapted REMOTE_SENSING_VLM. Never claims domain adaptation without authentic fine-tuning.
    """
    def __init__(self):
        super().__init__(
            model_name="GenericVLMOrchestrator",
            implementation_status="demo"
        )

    def predict(
        self, 
        images: List[np.ndarray], 
        query: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not images or len(images) == 0:
            raise ValueError("VQA task requires at least 1 image input.")
        
        img = images[0]
        q = query or "Describe the remote sensing features in this image."
        meta = metadata or {}
        crs_display = meta.get("crs_display") or meta.get("crs") or "CRS unavailable"
        
        # Check Gemini API Key
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                from google import genai
                client = genai.Client(api_key=api_key)
                b64_data = convert_array_to_base64_png(img).split(",")[-1]
                
                system_prompt = (
                    "You are an assistant analyzing satellite imagery. "
                    "Analyze the provided satellite raster scene. Provide direct answers grounded in visual features. "
                    "Acknowledge that this is generic vision-language synthesis, not a domain-fine-tuned weights checkpoint."
                )
                
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[
                        {"inline_data": {"mime_type": "image/png", "data": b64_data}},
                        {"text": f"Question: {q}\nCRS/Metadata: {crs_display}. Answer concisely based only on observable features."}
                    ],
                    config={"system_instruction": system_prompt}
                )
                answer_text = response.text.strip()
                
                return {
                    "answer": answer_text,
                    "model_type": "GENERIC_LLM_SYNTHESIS",
                    "is_remote_sensing_adapted": False,
                    "evidence_based": False,
                    "implementation_status": "demo",
                    "confidence": None,
                    "confidence_label": "Not calibrated (Generic Foundation VLM)",
                    "models": [self.model_name, "Gemini-2.5-Flash"],
                    "metadata": meta,
                    "evidence": []
                }
            except Exception as e:
                logger.warning(f"Gemini API call in VQA adapter failed ({e}). Falling back to local spectral baseline.")

        # Local spectral statistics baseline
        img_u8 = normalize_to_uint8(img)
        h, w = img_u8.shape[:2]
        mean_intensity = float(np.mean(img_u8))
        std_intensity = float(np.std(img_u8))

        answer = (
            f"Local Spectral Baseline ({w}x{h} px, {crs_display}): "
            f"Image exhibits mean pixel intensity {mean_intensity:.1f} and standard deviation {std_intensity:.1f}. "
            f"Query: '{q}'. NOTE: No external VLM API configured and no fine-tuned RS VLM weights mounted."
        )

        return {
            "answer": answer,
            "model_type": "SPECTRAL_STATISTICS_BASELINE",
            "is_remote_sensing_adapted": False,
            "evidence_based": True,
            "implementation_status": "baseline",
            "confidence": None,
            "confidence_label": "Not available (Local Baseline)",
            "models": [self.model_name],
            "metadata": meta,
            "evidence": []
        }

# Backwards compatibility alias
RemoteSensingVQAAdapter = GenericVLMSynthesisAdapter
