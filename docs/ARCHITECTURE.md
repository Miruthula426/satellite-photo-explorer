# SatQuery AI — System Architecture Specification

**ISRO Problem Statement 26167:** SatQuery AI — Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis  
**Repository:** `Miruthula426/satellite-photo-explorer`

---

## 1. End-to-End Multimodal Pipeline

SatQuery AI is designed as a decoupled, multi-tier agentic architecture:

```
SATQUERY AI
│
├── Frontend (React + Vite + TypeScript) -> Vercel Deployment
│   ├── Workspaces (Single, Bi-Temporal, Optical+SAR)
│   ├── Visual Evidence Viewer (Overlays, Masks, Boxes, Change Maps)
│   ├── Agent Execution Trace Panel
│   └── Benchmark Dashboard
│
├── FastAPI Backend (Python 3.11 + Uvicorn) -> Render Deployment
│   ├── Geospatial Engine (Rasterio, GeoTIFF, CRS, Band Scaling)
│   ├── Task Router & Intent Classifier
│   ├── Agent Controller & Trace Tracker
│   ├── Specialist Model Registry
│   └── Evidence Generator & Report Exporter (PDF/JSON)
```

---

## 2. Agent Controller & Task Routing Rules

The `AgentController` inspects query text, image count, and detected sensor modalities (`OPTICAL`, `SAR`, `MULTISPECTRAL`). Tasks are routed according to:

| Query Intent Keywords | Input Count / Modalities | Classified Task | Specialist Model Adapter / Baseline |
| :--- | :--- | :--- | :--- |
| "describe", "caption", "summary" | 1 Image | `captioning` | `ClassicalSpectralCaptionerBaseline` |
| "highlight", "detect", "water", "crop" | 1 Image | `grounding` | `ClassicalBaselineGrounder` |
| "land cover", "what is shown" | 1 Image | `vqa` | `GenericVLMOrchestrator` |
| "what changed", "increase", "decrease" | 2 Images (T1 & T2) | `change_vqa` | `EvidenceGroundedChangeVQA` + `PixelDifferenceChangeBaseline` |
| "optical and SAR", "fusion", "SAR" | 2 Images (Opt + SAR) | `optical_sar` | `OpticalSARVisualizationBaseline` |

---

## 3. Geospatial Metadata & Raster Pipeline

- **GeoTIFF Support:** Utilizes `Rasterio` to parse `.tif`, `.tiff`, and `.geotiff` byte arrays.
- **Metadata Extraction:** Extracts spatial extent (bounds), Coordinate Reference System (`EPSG:4326`, `EPSG:32644`), affine transformation matrix, band counts, and nodata values.
- **Multi-bit Normalization:** Percentile clipping (2-98%) scales 16-bit uint16 / float32 satellite bands into 8-bit dynamic range without saturation.
- **Spatial Alignment:** Resizes and aligns bi-temporal or optical-SAR image pairs using affine scaling.
