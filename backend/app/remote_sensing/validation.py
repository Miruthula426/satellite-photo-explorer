import base64
import logging
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

logger = logging.getLogger("satquery.validation")

class ValidationError(ValueError):
    """Custom exception for geospatial and image validation errors."""
    pass

class InputValidator:
    """
    Geospatial Input Validation Layer.
    Validates file formats, MIME types, payload size, dimensions, CRS compatibility,
    spatial overlap, and dual-image comparability.
    """

    MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB limit
    ALLOWED_MIME_TYPES = {
        "image/png", "image/jpeg", "image/jpg", 
        "image/tiff", "image/tif", "image/geotiff",
        "application/octet-stream"
    }

    @classmethod
    def validate_image_payload(cls, data_b64: str, mime_type: str, filename: Optional[str] = None) -> int:
        """
        Validates Base64 data string, size limit, and MIME type.
        Returns size in bytes.
        """
        if not data_b64 or not data_b64.strip():
            raise ValidationError("Image payload is empty or invalid.")

        clean_b64 = data_b64.split(",")[-1]
        try:
            raw_bytes = base64.b64decode(clean_b64, validate=True)
        except Exception:
            raise ValidationError("Failed to decode base64 image data: malformed encoding.")

        size = len(raw_bytes)
        if size == 0:
            raise ValidationError("Uploaded file contains 0 bytes.")

        if size > cls.MAX_FILE_SIZE_BYTES:
            raise ValidationError(
                f"File size ({size / (1024*1024):.1f}MB) exceeds the maximum allowed limit of 50MB."
            )

        norm_mime = mime_type.lower().strip()
        if norm_mime not in cls.ALLOWED_MIME_TYPES:
            fname = (filename or "").lower()
            if not (fname.endswith(".png") or fname.endswith(".jpg") or fname.endswith(".jpeg") or fname.endswith(".tif") or fname.endswith(".tiff")):
                raise ValidationError(
                    f"Unsupported file format '{mime_type}'. Supported formats: GeoTIFF (.tif, .tiff), PNG, JPEG."
                )

        return size

    @classmethod
    def validate_dual_scenes(
        cls, 
        meta_a: Dict[str, Any], 
        meta_b: Dict[str, Any], 
        mode: str = "bitemporal"
    ) -> Dict[str, Any]:
        """
        Validates spatial and temporal compatibility between two satellite scenes.
        Examines CRS, bounds, resolution, and dimensions.
        """
        w_a, h_a = meta_a.get("width", 0), meta_a.get("height", 0)
        w_b, h_b = meta_b.get("width", 0), meta_b.get("height", 0)

        if w_a == 0 or h_a == 0 or w_b == 0 or h_b == 0:
            raise ValidationError("Unable to determine spatial dimensions of one or both scenes.")

        crs_a = meta_a.get("crs")
        crs_b = meta_b.get("crs")
        bounds_a = meta_a.get("bounds")
        bounds_b = meta_b.get("bounds")

        validation_report = {
            "valid": True,
            "crs_compatible": True,
            "overlap_detected": True,
            "warnings": []
        }

        # CRS validation
        if crs_a and crs_b and crs_a != crs_b:
            validation_report["crs_compatible"] = False
            msg = f"CRS mismatch: Primary scene is {crs_a}, Secondary scene is {crs_b}. Different UTM projections cannot be treated as aligned."
            validation_report["warnings"].append(msg)
            logger.warning(msg)

        # Spatial overlap check if both have bounds
        if bounds_a and bounds_b:
            left = max(bounds_a[0], bounds_b[0])
            bottom = max(bounds_a[1], bounds_b[1])
            right = min(bounds_a[2], bounds_b[2])
            top = min(bounds_a[3], bounds_b[3])
            if right <= left or top <= bottom:
                validation_report["overlap_detected"] = False
                msg = f"Zero spatial geographic overlap between scenes: bounds_a={bounds_a}, bounds_b={bounds_b}."
                validation_report["warnings"].append(msg)
                logger.warning(msg)

        # Resolution check
        res_a = meta_a.get("resolution")
        res_b = meta_b.get("resolution")
        if res_a and res_b:
            res_ratio = max(res_a[0], res_b[0]) / max(1e-6, min(res_a[0], res_b[0]))
            if res_ratio > 10.0:
                validation_report["warnings"].append(
                    f"Large resolution disparity ({res_ratio:.1f}x) between scenes ({res_a} vs {res_b})."
                )

        return validation_report
