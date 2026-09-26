import base64
import io
import logging
import numpy as np
from PIL import Image
from typing import Dict, Any, Tuple, Optional

logger = logging.getLogger("satquery.geotiff")

def parse_geotiff_or_image(image_base64: str, filename: Optional[str] = None) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Parses an incoming Base64 image payload. Attempts rasterio GeoTIFF parsing first.
    If rasterio is unavailable or input is standard PNG/JPEG, falls back gracefully to PIL/OpenCV.
    Preserves spatial metadata (CRS, bounds, transform, band count, nodata) wherever available.
    """
    clean_b64 = image_base64.split(",")[-1] if "," in image_base64 else image_base64
    image_bytes = base64.b64decode(clean_b64)

    metadata: Dict[str, Any] = {
        "filename": filename or "uploaded_raster.png",
        "crs": None,
        "bounds": None,
        "width": 0,
        "height": 0,
        "bands": 3,
        "dtype": "uint8",
        "nodata": None,
        "modality": "OPTICAL",
        "is_geotiff": False
    }

    # Attempt Rasterio extraction
    try:
        import rasterio
        from rasterio.io import MemoryFile

        with MemoryFile(image_bytes) as memfile:
            with memfile.open() as dataset:
                metadata["is_geotiff"] = True
                metadata["width"] = dataset.width
                metadata["height"] = dataset.height
                metadata["bands"] = dataset.count
                metadata["dtype"] = str(dataset.dtypes[0])
                metadata["nodata"] = dataset.nodata
                
                if dataset.crs:
                    metadata["crs"] = str(dataset.crs)
                if dataset.bounds:
                    b = dataset.bounds
                    metadata["bounds"] = [b.left, b.bottom, b.right, b.top]
                
                # Read array
                arr = dataset.read()
                # Transpose to (height, width, channels)
                if arr.ndim == 3:
                    arr = np.transpose(arr, (1, 2, 0))
                
                logger.info(f"Successfully read GeoTIFF with Rasterio: shape={arr.shape}, CRS={metadata['crs']}")
                return arr, metadata
    except Exception as e:
        logger.debug(f"Rasterio parse skipped or failed ({e}); using PIL fallback.")

    # Fallback: PIL standard decode
    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        arr = np.array(pil_img)
        metadata["width"] = pil_img.width
        metadata["height"] = pil_img.height
        metadata["bands"] = 3
        metadata["dtype"] = str(arr.dtype)
        metadata["is_geotiff"] = False
        return arr, metadata
    except Exception as err:
        logger.error(f"Failed to decode image payload: {err}")
        raise ValueError("Invalid satellite image payload or unsupported file format.")
