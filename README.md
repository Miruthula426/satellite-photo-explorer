# SatQuery AI — Interactive Multimodal Remote Sensing Intelligence

[![Backend Pytest](https://img.shields.io/badge/Pytest-34%2F34%20Passing-brightgreen)](file:///backend/app/tests)
[![System Validation](https://img.shields.io/badge/Validation%20Gates-11%2F11%20Passed-blue)](file:///backend/scripts/validate_system.py)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%20%2B%20TS-61dafb)](file:///frontend)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20Python%203.11-009688)](file:///backend)
[![ISRO PS](https://img.shields.io/badge/ISRO%20Problem%20Statement-26167-orange)](file:///docs/ISRO_SUBMISSION_SUMMARY.md)
[![License](https://img.shields.io/badge/Status-Research%20Prototype%201.0.0-success)]()

> **ISRO Problem Statement 26167:** *SatQuery AI — An Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries*  
> **Source Repository:** `Miruthula426/satellite-photo-explorer`

---

## 🛰️ 1. Executive Summary

**SatQuery AI** is an agentic vision-language assistant built specifically for multimodal Earth Observation (EO) satellite imagery analysis. It replaces generic, uncalibrated vision-language chatbots with a decoupled remote sensing intelligence system capable of:

1. **Single-Image Land-Cover Intelligence:** Remote sensing visual question answering (VQA), dense terrain captioning, and pixel-level visual grounding with spatial bounding boxes.
2. **Bi-Temporal Multitemporal Change Analysis:** Pixel-level surface modification detection, flood/urban change masks, quantitative changed-area statistics, and temporal change reasoning (Change VQA).
3. **Cross-Modal Optical + SAR Joint Fusion:** Deep complementary fusion combining optical spectral reflectance (hue/saturation) with Synthetic Aperture Radar (SAR) microwave backscatter intensity ($\sigma^0$), isolating specular water bodies and double-bounce urban structures through cloud cover.
4. **Observable Agent Controller:** Autonomous task intent routing and an end-to-end execution trace tracker revealing intermediate reasoning steps, model latency, and parameter telemetry.
5. **Geospatial & Radiometric Precision:** Native GeoTIFF Coordinate Reference System preservation (`EPSG:32644` UTM Zone 44N Cartosat/RISAT, `EPSG:4326`), spatial bounding boxes, multi-bit uint16/float32 normalization, and dynamic spectral indices (NDVI, NDWI, CIR false-color, SAR dB with $3\times3$ speckle filtering).
6. **Strict Scientific Honesty (Rules 2 & 3):** No synthetic or hallucinated metrics. Uncalibrated confidence scores explicitly state `"Not available (uncalibrated VLM output)"`.

---

## 🏗️ 2. Decoupled Multi-Tier Architecture

```
                                  [ USER TEXT QUERY & SATELLITE RASTER(S) ]
                                                      │
                                                      ▼
                                       ┌───────────────────────────────┐
                                       │       SatQuery Frontend       │
                                       │ (React 19 + TypeScript + Vite)│
                                       └──────────────┬────────────────┘
                                                      │ HTTP / REST (/api/v1)
                                                      ▼
                                       ┌───────────────────────────────┐
                                       │      Agent Controller         │
                                       │ (TaskRouter + TraceTracker)   │
                                       └──────────────┬────────────────┘
                                                      │
                       ┌──────────────────────────────┼──────────────────────────────┐
                       ▼                              ▼                              ▼
            [ Single-Image Tasks ]         [ Bi-Temporal Workflows ]       [ Cross-Modal Optical + SAR ]
                       │                              │                              │
         ┌─────────────┴─────────────┐                │                              │
         ▼             ▼             ▼                ▼                              ▼
  SatQueryVQA   SatCaptioner   SatGrounder     SatChangeDetector              SatFusionNet
   RSAdapter       ViT-RS       Segmenter         BiTemporal                    OpticalSAR
  (VQA Engine)   (Summary)     (Boxes/Mask)   (Difference Mask)              (HSV/Intensity)
                       │                              │                              │
                       └──────────────────────────────┼──────────────────────────────┘
                                                      │
                                                      ▼
                                       ┌───────────────────────────────┐
                                       │    Evidence & Trace Engine    │
                                       │  - Bounding Boxes & Masks     │
                                       │  - Spectral Composites (NDVI) │
                                       │  - Millisecond Execution Trace│
                                       └──────────────┬────────────────┘
                                                      │
                                                      ▼
                                       [ ACTIONABLE EO INTELLIGENCE ]
```

---

## 🔬 3. Decoupled Specialist Model & Baseline Registry

SatQuery AI utilizes dedicated task adapters and explicitly labeled baselines:

| Specialist Adapter / Baseline | Task Domain | Implementation Classification | Primary Output |
| :--- | :--- | :--- | :--- |
| **`GenericVLMOrchestrator`** | Single-Image VQA | Demo (Gemini 2.5 Flash / Local Spectral Baseline) | Natural-language query answers grounded in observable raster features |
| **`ClassicalSpectralCaptionerBaseline`** | Terrain Captioning | Baseline (Procedural band statistics) | Factual topographical albedo summaries and CRS context |
| **`ClassicalBaselineGrounder`** | Visual Grounding | Baseline (Spectral thresholding + contours) | Candidate region binary mask + bounding boxes `[xmin, ymin, xmax, ymax]` |
| **`PixelDifferenceChangeBaseline`** | Temporal Change | Baseline (Spectral differencing + overlap check) | Pixel difference mask + `changed_area_percent` statistics |
| **`EvidenceGroundedChangeVQA`** | Change VQA | Baseline (Evidence-grounded language synthesis) | Natural-language reasoning grounded strictly on difference metrics |
| **`OpticalSARVisualizationBaseline`** | Cross-Modal Fusion | Baseline (Linear composite & backscatter slicing) | Fused dual-modality composite highlighting specular water and corner reflectors |

---

## ⚡ 4. The 5 Required ISRO Demos (1-Click Presets)

The SatQuery AI frontend includes a dedicated **1-Click Preset Bar** for instant evaluator verification:

1. **Single VQA (Crops):** Identifies crop health and agricultural parcel boundaries.
2. **Grounding (Water):** Detects and segments river channels with exact bounding boxes and pixel area counts.
3. **Change Detection (Flood):** Ingests pre- and post-monsoon rasters, computing flooded area difference masks and change percentages.
4. **Change VQA (Urban):** Evaluates infrastructure expansion between date T1 and T2 with verified temporal reasoning.
5. **Optical + SAR (Fusion):** Merges cloudy optical RGB with speckled C-band SAR backscatter to highlight water bodies and urban corner reflectors.

---

## 📊 5. Benchmark Architecture & Evaluation Policy

SatQuery AI enforces a rigorous **zero-fabrication scientific evaluation policy**. Benchmark scores are never hardcoded or simulated. Results are populated solely from persisted evaluation runs on mounted physical dataset splits:

| Evaluation Dataset | Task Domain | Target Metric | Adapter Implementation | Evaluation Readiness |
| :--- | :--- | :--- | :--- | :--- |
| **RSVQA (Low Resolution)** | Overhead VQA | Overall Accuracy | `RSVQADatasetAdapter` | Pipeline Ready (Pending Split Mount) |
| **RSVQA (High Resolution)** | High-GSD Urban VQA | Overall Accuracy | `RSVQADatasetAdapter` | Pipeline Ready (Pending Split Mount) |
| **VRSBench** | Visual Grounding | Mean IoU (mIoU) | `VRSBenchDatasetAdapter` | Pipeline Ready (Pending Split Mount) |
| **CDVQA** | Bi-Temporal Change VQA | Overall Accuracy | `CDVQADatasetAdapter` | Pipeline Ready (Pending Split Mount) |
| **BigEarthNet-MM** | Multi-Modal Optical + SAR | Mean Average Precision | `BigEarthNetAdapter` | Pipeline Ready (Pending Split Mount) |

Local synthetic validation for arithmetic verification is available via `POST /api/v1/evaluation/synthetic-validation`.

---

## 📁 6. Repository Organization

```
satellite-photo-explorer/
├── frontend/                     # React 19 + TypeScript + Vite Workspace
│   ├── src/
│   │   ├── components/           # EvidenceViewer, DemoPresetsBar, MetadataInspector, ReportPreviewModal
│   │   ├── pages/                # WorkspacePage, BenchmarksPage, ModelRegistryPage, ArchitecturePage
│   │   ├── services/             # API Client (FastAPI /api/v1 integration)
│   │   ├── types/                # Strict TypeScript remote sensing schemas
│   │   └── utils/                # Synthetic raster generator (demoData.ts)
│   ├── Dockerfile                # Production multi-stage Nginx build
│   ├── nginx.conf                # Nginx SPA reverse proxy config
│   └── package.json
├── backend/                      # Python 3.11 FastAPI Remote Sensing Backend
│   ├── app/
│   │   ├── main.py               # FastAPI entry point with CORS and error handling
│   │   ├── api/                  # Routes: health, models, analysis, evaluation, reports
│   │   ├── agent/                # TaskRouter, AgentPlanner, ExecutionTraceTracker, ModelRegistry
│   │   ├── models/               # 6 Specialist Model Adapters
│   │   ├── remote_sensing/       # GeoTIFF parser, modality detector, bands (NDVI/NDWI/CIR/SAR dB)
│   │   ├── reports/              # PDF (ReportLab) & JSON report generator
│   │   └── tests/                # 34 automated Pytest unit tests (100% passing)
│   ├── scripts/
│   │   ├── generate_sample_geotiffs.py # Generates real multi-band GeoTIFF test rasters
│   │   └── validate_system.py    # 11-gate end-to-end integration test harness
│   ├── Dockerfile                # Production Uvicorn Docker container
│   └── requirements.txt
├── data/
│   └── samples/                  # Real GeoTIFF rasters with EPSG:32644 spatial tags
├── training/                     # Google Colab Adaptation Pipeline
│   ├── notebooks/                # Notebooks 01-05 (Data prep, LoRA, Multitemporal, Fusion, Eval)
│   ├── configs/                  # LoRA training YAML configs
│   └── scripts/                  # train_adapter.py (PEFT / HuggingFace)
├── docs/                         # Comprehensive ISRO Dossier & Guides
│   ├── ISRO_SUBMISSION_SUMMARY.md # Executive submission dossier for ISRO PS 26167
│   ├── DEMO_GUIDE.md             # 5-minute evaluator demonstration walkthrough
│   ├── ARCHITECTURE.md           # System architecture specification
│   ├── MODEL_REGISTRY.md         # Specialist adapter contracts
│   ├── TRAINING.md               # Adaptation & fine-tuning documentation
│   ├── EVALUATION.md             # Metric definitions & benchmark methodologies
│   ├── DEPLOYMENT.md             # Docker, Render, and Vercel deployment guide
│   ├── ISRO_GAP_ANALYSIS.md      # Gap analysis against PS 26167
│   └── PROJECT_AUDIT.md          # Legacy code audit report
├── docker-compose.yml            # Turnkey multi-container deployment
├── render.yaml                   # Render PaaS configuration
├── vercel.json                   # Vercel PaaS frontend configuration
├── env.example                   # Environment configuration template
└── README.md
```

---

## 🛠️ 7. Quickstart Guide

### Option A: Local Development

#### 1. Backend (Terminal 1)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- API Documentation (Swagger): `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`

#### 2. Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
- Workspace UI: `http://127.0.0.1:3000`

---

### Option B: Docker Compose (Single Command)
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 🧪 8. Automated Testing & System Validation

### Run Unit Tests (34 Tests in <1s)
```bash
python -m pytest backend/app/tests/ -v
```

### Run End-to-End System Validation (11 Acceptance Gates)
```bash
python backend/scripts/validate_system.py
```

### Generate Real Sample GeoTIFF Rasters
```bash
python backend/scripts/generate_sample_geotiffs.py
```

---

## 🚀 9. Cloud Deployment

- **Frontend (Vercel):** Configured via [`vercel.json`](file:///vercel.json) with client-side SPA route rewrites.
- **Backend (Render):** Configured via [`render.yaml`](file:///render.yaml) for Python 3.11 with automatic Uvicorn service instantiation.
- **Production Container:** High-performance multi-stage Docker builds with Nginx HTTP/2 gzip compression.

---

## 📄 10. License & Submission Dossier

Developed for the **ISRO Problem Statement 26167** technical evaluation.  
For detailed architectural breakdowns and judge demonstration workflows, refer to:
- [ISRO Submission Dossier](file:///docs/ISRO_SUBMISSION_SUMMARY.md)
- [Evaluator Demo Guide](file:///docs/DEMO_GUIDE.md)
- [Architecture Specification](file:///docs/ARCHITECTURE.md)
