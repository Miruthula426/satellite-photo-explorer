# SatQuery AI — Interactive Multimodal Remote Sensing Intelligence

**ISRO Problem Statement 26167:** SatQuery AI — An Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries  
**Repository:** `Miruthula426/satellite-photo-explorer`

---

## 🛰️ Executive Overview

**SatQuery AI** is an agentic, multimodal remote sensing vision-language platform engineered for Earth observation satellite imagery analysis. It supports **single-image VQA, captioning, and visual grounding**, **bi-temporal change detection & change VQA**, and **co-registered Optical + SAR joint cross-modal fusion**.

---

## ⚡ Core Capabilities

1. **Agentic Task Routing:** Auto-classifies queries into specialist workflows (`vqa`, `captioning`, `grounding`, `change_detection`, `change_vqa`, `optical_sar`) with observable execution trace logging.
2. **Geospatial Raster Engine:** Preserves GeoTIFF metadata (Coordinate Reference System, affine transform matrix, spatial bounds, band counts, multi-bit uint16/float32 dynamic range normalization).
3. **Visual Evidence Engine:** Interactive multi-layer evidence viewer supporting binary segmentation masks, bounding box overlays, difference change maps, and derived geospatial statistics.
4. **Decoupled Model Registry:** Specialist model adapters (`SatQueryVQA-RSAdapter`, `SatCaptioner-ViT-RS`, `SatGrounder-Segmenter`, `SatChangeDetector-BiTemporal`, `SatChangeVQA-RSNet`, `SatFusionNet-OpticalSAR`).
5. **Benchmark & Evaluation Suite:** Evaluation metrics for RSVQA, VRSBench, CDVQA, and ISRO Cartosat-2S + RISAT-1A co-registered scenes.
6. **Report Generation:** Downloadable PDF and JSON summary reports.

---

## 📁 Repository Structure

```
satellite-photo-explorer/
├── frontend/             # React + Vite + TypeScript Frontend Application
│   ├── src/
│   │   ├── components/   # Header, ImageUploader, QuestionPanel, EvidenceViewer, etc.
│   │   ├── pages/        # WorkspacePage, BenchmarksPage, ModelRegistryPage, ArchitecturePage
│   │   ├── services/     # API Client Services
│   │   ├── types/        # TypeScript Definitions
│   │   └── utils/        # Presets & Conversion Helpers
│   ├── package.json
│   └── vite.config.ts
├── backend/              # Python FastAPI Backend Service
│   ├── app/
│   │   ├── main.py       # FastAPI Entry Point
│   │   ├── api/          # REST Endpoint Routes
│   │   ├── agent/        # Agent Controller, Task Router, Planner, Trace Tracker
│   │   ├── models/       # Specialist Model Adapters (VQA, Captioning, Grounding, Change, Fusion)
│   │   ├── remote_sensing/ # GeoTIFF, Modality Detection, Preprocessing, Registration
│   │   ├── evidence/     # Overlays, Masks, Boxes, Change Maps
│   │   ├── reports/      # PDF & JSON Report Generation
│   │   └── tests/        # Pytest Unit & API Tests
│   ├── requirements.txt
│   └── Dockerfile
├── training/             # Google Colab Fine-Tuning & Adaptation Subsystem
│   ├── notebooks/        # Reproducible Jupyter Notebooks (01-05)
│   ├── scripts/          # Adapter Training & Evaluation Scripts
│   └── configs/          # LoRA Training YAML Configs
├── docs/                 # Architecture, Model Registry, Training, & Deployment Docs
├── docker-compose.yml
└── README.md
```

---

## 🛠️ Quickstart Guide

### 1. Backend Setup (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Access the SatQuery AI Workspace at `http://localhost:3000`.

### 3. Run Verification Tests
```bash
python -m pytest backend/app/tests/test_api.py
```

---

## 📄 License & ISRO PS 26167 Compliance
Developed for ISRO / SAC Problem Statement 26167 research prototype evaluation.
