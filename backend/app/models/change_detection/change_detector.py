import logging
import numpy as np
from typing import Dict, Any, Optional, List
from app.models.base import BaseModel
from app.remote_sensing.registration import align_image_pair
from app.remote_sensing.preprocessing import convert_array_to_base64_png, normalize_to_uint8

logger = logging.getLogger("satquery.change_detection")

class BaseChangeDetector(BaseModel):
    """Abstract base adapter for bi-temporal remote sensing change detection."""
    def __init__(self, model_name: str, implementation_status: str = "baseline"):
        super().__init__(
            model_name=model_name,
            task_type="change_detection",
            implementation_status=implementation_status,
            is_trained=False,
            is_remote_sensing_adapted=False
        )

class PixelDifferenceChangeBaseline(BaseChangeDetector):
    """
    Classical pixel-difference change detection baseline.
    Computes absolute spectral delta across co-registered or rescaled rasters.
    Preserved as a reliable, honest baseline for algorithmic comparisons.
    """
    def __init__(self, difference_threshold: float = 35.0):
        super().__init__(
            model_name="PixelDifferenceChangeBaseline",
            implementation_status="baseline"
        )
        self.threshold = difference_threshold

    def predict(
        self, 
        images: List[np.ndarray], 
        query: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if len(images) < 2:
            raise ValueError("Bi-temporal change detection requires 2 image inputs (Earlier & Later).")

        meta = metadata or {}
        meta_a = meta.get("primary", {})
        meta_b = meta.get("secondary", {})

        img_a, img_b = images[0], images[1]
        img_a, img_b_aligned, reg_info = align_image_pair(img_a, img_b, meta_a, meta_b)

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

        # Compute absolute difference with configurable threshold
        diff = np.abs(gray_a.astype(float) - gray_b.astype(float)).astype(np.uint8)
        change_mask = np.where(diff > self.threshold, 255, 0).astype(np.uint8)

        # Compute change metrics
        changed_pixels = int(np.count_nonzero(change_mask))
        total_pixels = h * w
        change_ratio = (changed_pixels / total_pixels) * 100.0 if total_pixels > 0 else 0.0

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
                        "label": "Spectral Difference Cluster",
                        "confidence": None
                    })
        except ImportError:
            from scipy import ndimage
            labeled_arr, num_feats = ndimage.label(change_mask)
            slices = ndimage.find_objects(labeled_arr)
            for sl in slices:
                y_sl, x_sl = sl
                if (y_sl.stop - y_sl.start) * (x_sl.stop - x_sl.start) > (total_pixels * 0.002):
                    boxes.append({
                        "xmin": float(x_sl.start),
                        "ymin": float(y_sl.start),
                        "xmax": float(x_sl.stop),
                        "ymax": float(y_sl.stop),
                        "label": "Spectral Difference Cluster",
                        "confidence": None
                    })

        change_map_b64 = convert_array_to_base64_png(change_map)
        overlay_b64 = convert_array_to_base64_png(overlay)

        answer = (
            f"Bi-temporal spectral difference baseline evaluated across {w}x{h} scene. "
            f"Observed pixel-level spectral reflectance delta > {self.threshold} across "
            f"{change_ratio:.2f}% of the scene area ({changed_pixels:,} pixels). "
            f"Geospatial co-registration status: {reg_info.get('co_registered')}."
        )

        evidence = [
            {
                "id": "ev_change_map",
                "type": "change_map",
                "title": "Spectral Difference Change Map (Baseline)",
                "description": f"Pixel-level difference magnitude map (threshold > {self.threshold}).",
                "data_base64": change_map_b64,
                "statistics": {
                    "changed_area_percent": f"{change_ratio:.2f}%",
                    "changed_pixel_count": changed_pixels,
                    "total_scene_pixels": total_pixels,
                    "difference_threshold": self.threshold,
                    "change_cluster_count": len(boxes),
                    "co_registered": reg_info.get("co_registered"),
                    "registration_method": reg_info.get("registration_method")
                }
            },
            {
                "id": "ev_change_overlay",
                "type": "overlay",
                "title": "Spectral Shift Regions Overlay",
                "description": "Secondary scene annotated with detected spectral difference clusters.",
                "data_base64": overlay_b64,
                "boxes": boxes
            }
        ]

        return {
            "answer": answer,
            "change_mask": change_map_b64,
            "changed_area_percent": round(change_ratio, 2),
            "model_type": "baseline",
            "implementation_status": "baseline",
            "confidence": None,
            "confidence_label": "Not available (Spectral Difference Baseline)",
            "models": [self.model_name],
            "registration_info": reg_info,
            "evidence": evidence
        }

class RealRemoteSensingChangeDetector(BaseChangeDetector):
    """
    Deep Learning Remote Sensing Change Detector Adapter.
    Pluggable adapter for trained Siamese feature difference networks (e.g., BIT, ChangeFormer, SNUNet).
    Honest state: reports 'unavailable' if pretrained checkpoint is not mounted.
    """
    def __init__(self, checkpoint_path: Optional[str] = None):
        super().__init__(
            model_name="SiameseRSChangeDetector",
            implementation_status="unavailable"
        )
        self.checkpoint_path = checkpoint_path
        self._is_loaded = False

    def load(self) -> None:
        if not self.checkpoint_path:
            logger.info("No neural checkpoint path configured for SiameseRSChangeDetector.")
            self._is_loaded = False
            return
        # Load weights if path exists
        self._is_loaded = False

    def predict(
        self, 
        images: List[np.ndarray], 
        query: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self._is_loaded:
            raise RuntimeError(
                "SiameseRSChangeDetector neural weights are not mounted. "
                "Use PixelDifferenceChangeBaseline for verified testing."
            )
        return {}

# Backwards compatibility alias
ChangeDetector = PixelDifferenceChangeBaseline
