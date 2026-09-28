import logging
import numpy as np
from typing import Dict, Any, Optional, List
from app.models.base import BaseModel
from app.remote_sensing.preprocessing import convert_array_to_base64_png, normalize_to_uint8

logger = logging.getLogger("satquery.grounding")

class BaseGrounder(BaseModel):
    """Abstract base class for visual grounding models."""
    def __init__(self, model_name: str, implementation_status: str = "baseline"):
        super().__init__(
            model_name=model_name,
            task_type="grounding",
            implementation_status=implementation_status,
            is_trained=False,
            is_remote_sensing_adapted=False
        )

class ClassicalBaselineGrounder(BaseGrounder):
    """
    Classical spectral thresholding baseline for remote sensing feature localization.
    Transparently labeled: NOT a deep neural vision-language grounding model.
    Extracts candidate regions via spectral heuristics and OpenCV / SciPy connected components.
    """
    def __init__(self):
        super().__init__(
            model_name="ClassicalBaselineGrounder",
            implementation_status="baseline"
        )

    def predict(
        self, 
        images: List[np.ndarray], 
        query: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not images:
            raise ValueError("Grounding task requires an input satellite image.")

        img = images[0]
        q = (query or "water body").lower().strip()
        h, w = img.shape[:2]
        img_uint8 = normalize_to_uint8(img)

        # Convert to grayscale for thresholding
        if img_uint8.ndim == 3 and img_uint8.shape[2] >= 3:
            gray = (0.299 * img_uint8[:, :, 0] + 0.587 * img_uint8[:, :, 1] + 0.114 * img_uint8[:, :, 2]).astype(np.uint8)
        else:
            gray = img_uint8 if img_uint8.ndim == 2 else img_uint8[:, :, 0]

        boxes = []
        mask = np.zeros((h, w), dtype=np.uint8)

        if any(w_kw in q for w_kw in ["water", "river", "lake", "ocean", "pond"]):
            mask = np.where(gray < 70, 255, 0).astype(np.uint8)
            label = "Low Reflectance / Water Candidate"
        elif any(v_kw in q for v_kw in ["vegetation", "crop", "forest", "tree", "plant", "agriculture"]):
            if img_uint8.ndim == 3 and img_uint8.shape[2] >= 3:
                g = img_uint8[:, :, 1].astype(float)
                r = img_uint8[:, :, 0].astype(float)
                mask = np.where((g - r) > 8, 255, 0).astype(np.uint8)
            else:
                mask = np.where(gray > 120, 255, 0).astype(np.uint8)
            label = "High Green Band Differential / Vegetation"
        else:
            mask = np.where((gray > 80) & (gray < 220), 255, 0).astype(np.uint8)
            label = "Mid-Tone Texture / Structure Candidate"

        # Extract bounding boxes from connected components / contours
        try:
            import cv2
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for c in contours:
                if cv2.contourArea(c) > (h * w * 0.005):
                    x, y, bw, bh = cv2.boundingRect(c)
                    boxes.append({
                        "xmin": float(x),
                        "ymin": float(y),
                        "xmax": float(x + bw),
                        "ymax": float(y + bh),
                        "label": label,
                        "confidence": None
                    })
        except ImportError:
            from scipy import ndimage
            labeled_array, num_features = ndimage.label(mask)
            slices = ndimage.find_objects(labeled_array)
            for sl in slices:
                y_slice, x_slice = sl
                area = (y_slice.stop - y_slice.start) * (x_slice.stop - x_slice.start)
                if area > (h * w * 0.005):
                    boxes.append({
                        "xmin": float(x_slice.start),
                        "ymin": float(y_slice.start),
                        "xmax": float(x_slice.stop),
                        "ymax": float(y_slice.stop),
                        "label": label,
                        "confidence": None
                    })

        # Render overlay image
        overlay = img_uint8.copy()
        if overlay.ndim == 2:
            overlay = np.stack([overlay]*3, axis=-1)
        
        mask_overlay = overlay.copy()
        mask_overlay[:, :, 0] = np.clip(mask_overlay[:, :, 0].astype(int) + mask.astype(int), 0, 255)
        overlay = (0.7 * overlay + 0.3 * mask_overlay).astype(np.uint8)

        overlay_b64 = convert_array_to_base64_png(overlay)
        mask_b64 = convert_array_to_base64_png(mask)

        answer = (
            f"Classical heuristic baseline localized {len(boxes)} candidate region(s) "
            f"for query criteria '{q}'. (Method: spectral threshold + morphological contouring)."
        )

        evidence = [
            {
                "id": "ev_grounding_overlay",
                "type": "overlay",
                "title": f"Heuristic Candidate Overlay — {label}",
                "description": f"Threshold-derived spatial region markers for target: '{q}'",
                "data_base64": overlay_b64,
                "boxes": boxes
            },
            {
                "id": "ev_grounding_mask",
                "type": "mask",
                "title": f"Spectral Threshold Mask — {label}",
                "description": "Binary pixel mask generated via classical spectral thresholding baseline.",
                "data_base64": mask_b64,
                "statistics": {
                    "grounded_pixels": int(np.count_nonzero(mask)),
                    "total_pixels": h * w,
                    "grounded_area_percent": f"{(np.count_nonzero(mask)/(h*w))*100:.2f}%",
                    "detection_method": "classical_spectral_thresholding"
                }
            }
        ]

        return {
            "answer": answer,
            "boxes": boxes,
            "model_type": "classical_baseline",
            "implementation_status": "baseline",
            "confidence": None,
            "confidence_label": "Not available (Classical Threshold Baseline)",
            "models": [self.model_name],
            "evidence": evidence
        }

# Backwards compatibility alias
RemoteSensingGrounder = ClassicalBaselineGrounder
