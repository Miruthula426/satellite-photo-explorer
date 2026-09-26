import logging
import numpy as np
from typing import Dict, Any, Optional, List
from app.models.base import BaseModel
from app.remote_sensing.preprocessing import convert_array_to_base64_png, normalize_to_uint8

logger = logging.getLogger("satquery.grounding")

class RemoteSensingGrounder(BaseModel):
    def __init__(self):
        super().__init__(model_name="SatGrounder-Segmenter", task_type="grounding")

    def predict(
        self, 
        images: List[np.ndarray], 
        query: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not images:
            raise ValueError("Grounding task requires an input satellite image.")

        img = images[0]
        q = (query or "water body").lower()
        h, w = img.shape[:2]
        img_uint8 = normalize_to_uint8(img)

        # Convert to grayscale for thresholding
        if img_uint8.ndim == 3 and img_uint8.shape[2] >= 3:
            gray = (0.299 * img_uint8[:, :, 0] + 0.587 * img_uint8[:, :, 1] + 0.114 * img_uint8[:, :, 2]).astype(np.uint8)
        else:
            gray = img_uint8 if img_uint8.ndim == 2 else img_uint8[:, :, 0]

        boxes = []
        mask = np.zeros((h, w), dtype=np.uint8)

        if "water" in q or "river" in q or "lake" in q:
            mask = np.where(gray < 70, 255, 0).astype(np.uint8)
            label = "Water Body"
        elif "vegetation" in q or "crop" in q or "forest" in q or "agriculture" in q:
            if img_uint8.ndim == 3 and img_uint8.shape[2] >= 3:
                g = img_uint8[:, :, 1].astype(float)
                r = img_uint8[:, :, 0].astype(float)
                mask = np.where((g - r) > 10, 255, 0).astype(np.uint8)
            else:
                mask = np.where(gray > 120, 255, 0).astype(np.uint8)
            label = "Vegetation Zone"
        else:
            mask = np.where((gray > 80) & (gray < 220), 255, 0).astype(np.uint8)
            label = "Built-up Structure"

        # Try OpenCV contour bounding box detection if available, else grid bounding box
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
            nonzero_y, nonzero_x = np.nonzero(mask)
            if len(nonzero_x) > 0:
                boxes.append({
                    "xmin": float(np.min(nonzero_x)),
                    "ymin": float(np.min(nonzero_y)),
                    "xmax": float(np.max(nonzero_x)),
                    "ymax": float(np.max(nonzero_y)),
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

        answer = f"Grounded and localized {len(boxes)} regions corresponding to target query '{q}'."

        evidence = [
            {
                "id": "ev_grounding_overlay",
                "type": "overlay",
                "title": f"Grounded Overlay — {label}",
                "description": f"Visual grounding mask and bounding box detection for target: '{q}'",
                "data_base64": overlay_b64,
                "boxes": boxes
            },
            {
                "id": "ev_grounding_mask",
                "type": "mask",
                "title": f"Binary Segmentation Mask — {label}",
                "description": "Pixel-level binary mask extracted by specialist RS grounder.",
                "data_base64": mask_b64,
                "statistics": {
                    "grounded_pixels": int(np.count_nonzero(mask)),
                    "total_pixels": h * w,
                    "grounded_area_percent": f"{(np.count_nonzero(mask)/(h*w))*100:.2f}%"
                }
            }
        ]

        return {
            "answer": answer,
            "boxes": boxes,
            "confidence": None,
            "confidence_label": "Not available",
            "models": [self.model_name],
            "evidence": evidence
        }
