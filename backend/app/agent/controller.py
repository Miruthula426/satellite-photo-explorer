import uuid
import time
from datetime import datetime
import logging
from typing import Dict, Any, List

from app.schemas.analysis import AnalysisRequest, AnalysisResponseSchema, VisualEvidenceSchema
from app.remote_sensing.validation import InputValidator, ValidationError
from app.remote_sensing.geotiff import parse_geotiff_or_image
from app.remote_sensing.modality import detect_image_modality
from app.agent.router import TaskRouter
from app.agent.planner import AgentPlanner
from app.agent.trace import ExecutionTraceTracker
from app.agent.registry import model_registry

logger = logging.getLogger("satquery.agent")

class AgentController:
    """
    Main SatQuery AI Multimodal Remote Sensing Agent Controller.
    Orchestrates end-to-end task routing, geospatial preprocessing, specialist execution,
    evidence generation, and observable execution trace logging.
    """

    def process_request(self, request: AnalysisRequest) -> AnalysisResponseSchema:
        start_time = time.time()
        req_id = f"sat_{uuid.uuid4().hex[:10]}"

        # Step 1: Query received
        trace = ExecutionTraceTracker(task=request.mode)
        trace.add_step("QUERY_RECEIVED", f"Received query: '{request.query}' in mode '{request.mode}'")
        
        # Step 2: Validate inputs
        if not request.images or len(request.images) == 0:
            trace.add_step("INPUT_VALIDATED", "Input validation failed: No image provided", status="failed")
            raise ValueError("No input satellite image payload provided.")

        for idx, img_in in enumerate(request.images):
            InputValidator.validate_image_payload(img_in.data, img_in.mimeType, img_in.filename)

        trace.add_step("INPUT_VALIDATED", f"Validated {len(request.images)} input satellite image payload(s)")

        # Step 3: Parse rasters and detect modalities
        parsed_arrays = []
        metadata_list = []
        modalities = []

        for idx, img_input in enumerate(request.images):
            arr, meta = parse_geotiff_or_image(img_input.data, img_input.filename)
            modality = detect_image_modality(arr, meta, hint=img_input.role or "primary")
            meta["modality"] = modality
            
            parsed_arrays.append(arr)
            metadata_list.append(meta)
            modalities.append(modality)
            
            trace.add_step(
                "MODALITY_DETECTED", 
                f"Image [{idx+1}]: Modality={modality}, Dimensions={meta['width']}x{meta['height']}, CRS={meta.get('crs') or 'N/A'}"
            )

        if len(parsed_arrays) >= 2:
            InputValidator.validate_dual_scenes(metadata_list[0], metadata_list[1], mode=request.mode)

        # Step 4: Classify Task
        task = TaskRouter.classify_task(
            query=request.query, 
            image_count=len(parsed_arrays), 
            modalities=modalities, 
            mode_hint=request.mode
        )
        trace.task = task
        trace.add_step("TASK_CLASSIFIED", f"Routed request to specialist task pipeline: '{task.upper()}'")

        # Step 5: Select Model Adapter from Registry
        model_adapter = model_registry.get_model(task)
        trace.add_model(model_adapter.model_name)
        trace.add_step("MODEL_SELECTED", f"Selected specialist model adapter: '{model_adapter.model_name}'")

        # Step 6: Create & Execute Plan
        plan = AgentPlanner.create_plan(task, modalities, metadata_list)
        trace.set_parameters(plan)
        trace.add_step("PREPROCESSING_COMPLETE", f"Geospatial preprocessing complete. Steps: {', '.join(plan['preprocessing_steps'])}")

        # Step 7: Model Inference
        result = model_adapter.predict(parsed_arrays, query=request.query, metadata=metadata_list[0])
        trace.add_step("MODEL_EXECUTED", f"Executed model '{model_adapter.model_name}' prediction successfully")

        # Add sub-models used if returned
        for m in result.get("models", []):
            trace.add_model(m)

        # Step 8: Evidence Generation
        raw_evidence = result.get("evidence", [])
        evidence_objects = []
        for ev in raw_evidence:
            evidence_objects.append(VisualEvidenceSchema(
                id=ev["id"],
                type=ev["type"],
                title=ev["title"],
                description=ev.get("description"),
                artifact_url=ev.get("artifact_url"),
                data_base64=ev.get("data_base64"),
                boxes=ev.get("boxes"),
                statistics=ev.get("statistics")
            ))

        trace.add_step("EVIDENCE_GENERATED", f"Generated {len(evidence_objects)} visual evidence artifact(s)")

        # Step 9: Final Response Assembly
        trace.add_step("RESPONSE_GENERATED", "Assembled final agentic multimodal response")
        execution_time_ms = round((time.time() - start_time) * 1000, 2)

        return AnalysisResponseSchema(
            id=req_id,
            task=task,
            mode=request.mode,
            answer=result["answer"],
            confidence=result.get("confidence"),
            confidence_label=result.get("confidence_label", "Not available"),
            models=trace.models_selected,
            evidence=evidence_objects,
            trace=trace.to_dict(),
            metadata=metadata_list[0],
            execution_time_ms=execution_time_ms,
            created_at=datetime.utcnow().isoformat() + "Z"
        )

# Global Controller Instance
agent_controller = AgentController()
