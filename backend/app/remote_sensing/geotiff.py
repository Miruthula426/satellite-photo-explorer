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

    # Fallback: PIL standard decode with GeoTIFF tag parsing
    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        is_tiff = pil_img.format in ("TIFF", "TIF") or (filename and (filename.lower().endswith(".tif") or filename.lower().endswith(".tiff")))
        
        if is_tiff and hasattr(pil_img, "tag_v2"):
            tags = dict(pil_img.tag_v2)
            metadata["is_geotiff"] = True
            # Check for ModelPixelScaleTag (33550) and ModelTiepointTag (33922)
            pixel_scale = tags.get(33550)
            tie_points = tags.get(33922)
            
            if pixel_scale and tie_points and len(tie_points) >= 6:
                # tie_points format: (I, J, K, X, Y, Z)
                x0 = float(tie_points[3])
                y0 = float(tie_points[4])
                dx = float(pixel_scale[0])
                dy = float(pixel_scale[1])
                w = pil_img.width
                h = pil_img.height
                left = x0
                top = y0
                right = x0 + (w * dx)
                bottom = y0 - (h * dy)
                metadata["bounds"] = [round(left, 4), round(bottom, 4), round(right, 4), round(top, 4)]
                
                # Check coordinates to infer CRS if not explicitly tagged
                if -180.0 <= left <= 180.0 and -90.0 <= bottom <= 90.0:
                    metadata["crs"] = "EPSG:4326"
                else:
                    metadata["crs"] = "EPSG:32644" # Standard Cartosat UTM Zone 44N
            
            # Check for GeoAsciiParamsTag (34737)
            ascii_params = tags.get(34737)
            if ascii_params and isinstance(ascii_params, (str, bytes)):
                ascii_str = ascii_params.decode("utf-8", errors="ignore") if isinstance(ascii_params, bytes) else ascii_params
                if "WGS" in ascii_str or "UTM" in ascii_str:
                    metadata["crs"] = ascii_str.strip().strip("|")

        # Convert to numpy array
        if pil_img.mode not in ("RGB", "L", "RGBA"):
            pil_img = pil_img.convert("RGB")
        
        arr = np.array(pil_img)
        metadata["width"] = pil_img.width
        metadata["height"] = pil_img.height
        metadata["bands"] = arr.shape[2] if arr.ndim == 3 else 1
        metadata["dtype"] = str(arr.dtype)
        if not metadata["crs"] and metadata["is_geotiff"]:
            metadata["crs"] = "EPSG:32644"
        return arr, metadata
    except Exception as err:
        logger.error(f"Failed to decode image payload: {err}")
        raise ValueError("Invalid satellite image payload or unsupported file format.")
