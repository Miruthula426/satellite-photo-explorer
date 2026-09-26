"""
Sample GeoTIFF Generator for SatQuery AI
Generates genuine multi-band GeoTIFF test rasters with standard spatial tags:
- ModelPixelScaleTag (33550)
- ModelTiepointTag (33922)
- GeoAsciiParamsTag (34737)
Outputs are placed in data/samples/ for testing uploads and API endpoints.
"""

import os
import numpy as np
from PIL import Image
from PIL.TiffImagePlugin import ImageFileDirectory_v2

def create_geotiff(
    filepath: str,
    width: int = 256,
    height: int = 256,
    channels: int = 3,
    generator_func = None,
    pixel_scale: tuple = (10.0, 10.0, 0.0),
    origin: tuple = (432000.0, 1420000.0),
    crs_name: str = "WGS 84 / UTM zone 44N|EPSG:32644|"
):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    if generator_func:
        data = generator_func(height, width, channels)
    else:
        data = np.random.randint(40, 220, (height, width, channels), dtype=np.uint8)

    if channels == 1:
        img = Image.fromarray(data[:, :, 0] if data.ndim == 3 else data, mode="L")
    else:
        img = Image.fromarray(data, mode="RGB")

    ifd = ImageFileDirectory_v2()
    # ModelPixelScaleTag (dx, dy, dz)
    ifd[33550] = pixel_scale
    # ModelTiepointTag (I, J, K, X, Y, Z)
    ifd[33922] = (0.0, 0.0, 0.0, float(origin[0]), float(origin[1]), 0.0)
    # GeoAsciiParamsTag (CRS identifier)
    ifd[34737] = crs_name.encode("ascii")

    img.save(filepath, format="TIFF", tiffinfo=ifd)
    print(f"Generated GeoTIFF: {filepath} ({width}x{height}, {channels} bands, CRS: {crs_name.strip('|')})")

def generate_optical_urban(h, w, c):
    # Simulated urban grid with roads, buildings, and vegetation
    img = np.zeros((h, w, 3), dtype=np.uint8)
    img[:, :] = [70, 110, 60] # Base vegetation (olive green)
    # Road network
    img[h//4:h//4+8, :] = [110, 115, 120]
    img[3*h//4:3*h//4+8, :] = [110, 115, 120]
    img[:, w//2:w//2+8] = [110, 115, 120]
    # Building clusters
    for y in range(20, h - 30, 45):
        for x in range(20, w - 30, 45):
            img[y:y+25, x:x+25] = [190, 180, 170]
    # Water body
    for y in range(h):
        for x in range(w):
            if (x - 60)**2 + (y - 180)**2 < 35**2:
                img[y, x] = [20, 65, 120]
    return img

def generate_sar_flood(h, w, c):
    # Simulated C-band SAR backscatter with speckle noise
    base = np.random.gamma(shape=2.0, scale=35.0, size=(h, w)).clip(0, 255).astype(np.uint8)
    # Specular smooth water (near zero backscatter / dark)
    for y in range(h):
        for x in range(w):
            if (x - 60)**2 + (y - 180)**2 < 38**2:
                base[y, x] = max(1, min(255, int(np.random.normal(8, 3))))
    # Urban corner reflectors (bright saturation)
    for y in range(20, h - 30, 45):
        for x in range(20, w - 30, 45):
            base[y:y+8, x:x+8] = 250
    return np.stack([base, base, base], axis=-1)

def generate_temporal_t1(h, w, c):
    # T1: Pre-flood / pre-development
    img = np.zeros((h, w, 3), dtype=np.uint8)
    img[:, :] = [140, 120, 80] # Dry soil / sparse scrub
    # Narrow dry stream
    for y in range(h):
        x = int(w/2 + 20 * np.sin(y / 30.0))
        img[y, max(0, x-4):min(w, x+4)] = [90, 80, 60]
    return img

def generate_temporal_t2(h, w, c):
    # T2: Post-monsoon / flooded area
    img = np.zeros((h, w, 3), dtype=np.uint8)
    img[:, :] = [80, 130, 70] # Green vegetation surge
    # Wide inundated river/lake
    for y in range(h):
        x = int(w/2 + 20 * np.sin(y / 30.0))
        img[y, max(0, x-28):min(w, x+28)] = [25, 75, 135]
    return img

def generate_all_samples():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "samples"))
    
    # 1. Cartosat-style Optical Scene
    create_geotiff(
        os.path.join(base_dir, "cartosat_optical_bengaluru.tif"),
        generator_func=generate_optical_urban,
        pixel_scale=(2.5, 2.5, 0.0),
        origin=(432100.0, 1421000.0),
        crs_name="WGS 84 / UTM zone 44N|EPSG:32644|"
    )

    # 2. RISAT-style SAR Scene
    create_geotiff(
        os.path.join(base_dir, "risat_sar_mumbai.tif"),
        generator_func=generate_sar_flood,
        pixel_scale=(3.0, 3.0, 0.0),
        origin=(280500.0, 2101000.0),
        crs_name="WGS 84 / UTM zone 43N|EPSG:32643|"
    )

    # 3. Bi-Temporal T1 (Pre-Monsoon)
    create_geotiff(
        os.path.join(base_dir, "temporal_t1_pre_monsoon.tif"),
        generator_func=generate_temporal_t1,
        pixel_scale=(10.0, 10.0, 0.0),
        origin=(720000.0, 1850000.0),
        crs_name="WGS 84 / UTM zone 43N|EPSG:32643|"
    )

    # 4. Bi-Temporal T2 (Post-Monsoon Inundation)
    create_geotiff(
        os.path.join(base_dir, "temporal_t2_post_monsoon.tif"),
        generator_func=generate_temporal_t2,
        pixel_scale=(10.0, 10.0, 0.0),
        origin=(720000.0, 1850000.0),
        crs_name="WGS 84 / UTM zone 43N|EPSG:32643|"
    )

    print("All sample GeoTIFF files generated successfully in data/samples/")

if __name__ == "__main__":
    generate_all_samples()
