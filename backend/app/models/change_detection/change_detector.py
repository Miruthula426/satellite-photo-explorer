import logging
import numpy as np
from typing import Dict, Any, Optional, List
from app.models.base import BaseModel
from app.remote_sensing.registration import align_image_pair
from app.remote_sensing.preprocessing import convert_array_to_base64_png, normalize_to_uint8

logger = logging.getLogger("satquery.change_detection")

class ChangeDetector(BaseModel):
    def __init__(self):
        super().__init__(model_name="SatChangeDetector-BiTemporal", task_type="change_detection")

    def predict(
        self, 
        images: List[np.ndarray], 
        query: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if len(images) < 2:
            raise ValueError("Bi-temporal change detection requires 2 image inputs (Earlier & Later).")

        img_a, img_b = images[0], images[1]
        img_a, img_b_aligned, reg_info = align_image_pair(img_a, img_b)

        h, w = img_a.shape[:2]
        img_a_u8 = normalize_to_uint8(img_a)
        img_b_u8 = normalize_to_uint8(img_b_aligned)

        # Convert to grayscale
        if img_a_u8.ndim == 3 and img_a_u8.shape[2] >= 3:
            gray_a = (0.299 * img_a_u8[:, :, 0] + 0.587 * img_a_u8[:, :, 1] + 0.114 * img_a_u8[:, :, 2]).astype(np.uint8)
        else:
            gray_a = img_a_u8 if img_a_u8.ndim == 2 else img_a_u8[:, :, 0]

        if img_b_u8.ndim == 3 and img_b_u8.shape[2] >= 3:
            gray_b = (0.299 * img_b_u8[:, :, 0] + 0.587 * img_b_u8[:, :, 1] + 0.114 * img_b_u8[:, :, 2]).astype(np.uint8)
        else:
            gray_b = img_b_u8 if img_b_u8.ndim == 2 else img_b_u8[:, :, 0]

        # Compute absolute difference
        diff = np.abs(gray_a.astype(float) - gray_b.astype(float)).astype(np.uint8)
        change_mask = np.where(diff > 35, 255, 0).astype(np.uint8)

        # Compute change metrics
        changed_pixels = int(np.count_nonzero(change_mask))
        total_pixels = h * w
        change_ratio = (changed_pixels / total_pixels) * 100.0

        # Generate colorized change map overlay
        change_map = np.zeros((h, w, 3), dtype=np.uint8)
        change_map[:, :, 0] = change_mask
        change_map[:, :, 1] = (change_mask.astype(float) * (gray_b.astype(float) / 255.0)).astype(np.uint8)

        overlay = img_b_u8.copy()
        if overlay.ndim == 2:
            overlay = np.stack([overlay]*3, axis=-1)
        overlay = (0.65 * overlay + 0.35 * change_map).astype(np.uint8)

        # Extract bounding boxes for major change clusters
        boxes = []
        try:
            import cv2
            contours, _ = cv2.findContours(change_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for c in contours:
                if cv2.contourArea(c) > (total_pixels * 0.002):
                    x, y, bw, bh = cv2.boundingRect(c)
                    boxes.append({
                        "xmin": float(x),
                        "ymin": float(y),
                        "xmax": float(x + bw),
                        "ymax": float(y + bh),
                        "label": "Detected Temporal Change",
                        "confidence": None
                    })
        except ImportError:
            nonzero_y, nonzero_x = np.nonzero(change_mask)
            if len(nonzero_x) > 0:
                boxes.append({
                    "xmin": float(np.min(nonzero_x)),
                    "ymin": float(np.min(nonzero_y)),
                    "xmax": float(np.max(nonzero_x)),
                    "ymax": float(np.max(nonzero_y)),
                    "label": "Detected Temporal Change",
                    "confidence": None
                })

        change_map_b64 = convert_array_to_base64_png(change_map)
        overlay_b64 = convert_array_to_base64_png(overlay)

        answer = (
            f"Bi-temporal change analysis completed across {w}x{h} scene. "
            f"Measured pixel-level land surface change over {change_ratio:.2f}% of the scene area ({changed_pixels:,} pixels)."
        )

        evidence = [
            {
                "id": "ev_change_map",
                "type": "change_map",
                "title": "Bi-Temporal Difference Change Map",
                "description": "Pixel-level spectral difference map highlighting temporal surface modifications.",
                "data_base64": change_map_b64,
                "statistics": {
                    "changed_area_percent": f"{change_ratio:.2f}%",
                    "changed_pixel_count": changed_pixels,
                    "total_scene_pixels": total_pixels,
                    "change_cluster_count": len(boxes)
                }
            },
            {
                "id": "ev_change_overlay",
                "type": "overlay",
                "title": "Change Region Bounding Boxes Overlay",
                "description": "Later satellite scene with highlighted change clusters and bounding box markers.",
                "data_base64": overlay_b64,
                "boxes": boxes
            }
        ]

        return {
            "answer": answer,
            "change_mask": change_map_b64,
            "changed_area_percent": round(change_ratio, 2),
            "confidence": None,
            "confidence_label": "Not available",
            "models": [self.model_name],
            "evidence": evidence
        }
