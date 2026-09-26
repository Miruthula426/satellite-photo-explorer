from fastapi import APIRouter, HTTPException
from app.schemas.analysis import AnalysisRequest, AnalysisResponseSchema
from app.agent.controller import agent_controller

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResponseSchema)
def analyze_imagery(request: AnalysisRequest):
    try:
        return agent_controller.process_request(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/analyze/vqa", response_model=AnalysisResponseSchema)
def analyze_vqa(request: AnalysisRequest):
    request.mode = "single"
    return analyze_imagery(request)

@router.post("/analyze/caption", response_model=AnalysisResponseSchema)
def analyze_caption(request: AnalysisRequest):
    request.mode = "single"
    return analyze_imagery(request)

@router.post("/analyze/grounding", response_model=AnalysisResponseSchema)
def analyze_grounding(request: AnalysisRequest):
    request.mode = "single"
    return analyze_imagery(request)

@router.post("/analyze/change", response_model=AnalysisResponseSchema)
def analyze_change(request: AnalysisRequest):
    request.mode = "bitemporal"
    return analyze_imagery(request)

@router.post("/analyze/change-vqa", response_model=AnalysisResponseSchema)
def analyze_change_vqa(request: AnalysisRequest):
    request.mode = "bitemporal"
    return analyze_imagery(request)

@router.post("/analyze/optical-sar", response_model=AnalysisResponseSchema)
def analyze_optical_sar(request: AnalysisRequest):
    request.mode = "optical_sar"
    return analyze_imagery(request)
