from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class ImageInput(BaseModel):
    data: str = Field(..., description="Base64 encoded image string or URL")
    mimeType: str = Field(default="image/png", description="MIME type e.g. image/tiff, image/png")
    filename: Optional[str] = Field(default="image.png", description="Filename if provided")
    role: Optional[str] = Field(default="primary", description="Role e.g. primary, secondary, optical, sar")

class AnalysisRequest(BaseModel):
    images: List[ImageInput] = Field(..., description="List of input satellite images")
    query: str = Field(..., description="Natural language prompt / question")
    mode: str = Field(default="auto", description="Operational mode: auto, single, optical_sar, bitemporal")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class BoundingBoxSchema(BaseModel):
    xmin: float
    ymin: float
    xmax: float
    ymax: float
    label: Optional[str] = None
    confidence: Optional[float] = None

class VisualEvidenceSchema(BaseModel):
    id: str
    type: str  # original, processed, overlay, mask, boxes, change_map, fused
    title: str
    description: Optional[str] = None
    artifact_url: Optional[str] = None
    data_base64: Optional[str] = None
    boxes: Optional[List[BoundingBoxSchema]] = None
    statistics: Optional[Dict[str, Any]] = None

class TraceStepSchema(BaseModel):
    step: str
    timestamp: str
    detail: str
    status: str  # pending, active, completed, failed

class ExecutionTraceSchema(BaseModel):
    task: str
    models_selected: List[str]
    steps: List[TraceStepSchema]
    parameters: Dict[str, Any]
    execution_time_ms: float

class AnalysisResponseSchema(BaseModel):
    id: str
    task: str
    mode: str
    answer: str
    confidence: Optional[float] = None
    confidence_label: str
    models: List[str]
    implementation_status: str = Field(default="baseline", description="Status: baseline, pretrained_model, demo, etc.")
    evidence: List[VisualEvidenceSchema]
    trace: ExecutionTraceSchema
    metadata: Dict[str, Any] = Field(default_factory=dict)
    execution_time_ms: float
    created_at: str

class ModelHealthItem(BaseModel):
    name: str
    status: str  # baseline, loaded, unavailable, demo
    task: Optional[str] = None

class HealthResponseSchema(BaseModel):
    status: str
    version: str
    models_loaded: List[str] = Field(default_factory=list)
    models: List[ModelHealthItem] = Field(default_factory=list)
    device: str
