from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.ai import AIExplainRequest, AIRecommendationResponse
from app.services.openrouter_service import get_ai_recommendation
from app.utils.security import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Advisory"])

@router.post("/explanation", response_model=AIRecommendationResponse)
async def explain_defect(
    data: AIExplainRequest,
    current_user = Depends(get_current_user)
):
    """
    On-demand AI explanation and maintenance recommendation using OpenRouter API
    with seamless rule-based fallback if OpenRouter is unreachable or key not set.
    """
    result = await get_ai_recommendation(
        defect_type=data.defect_type,
        severity=data.severity,
        risk_score=data.risk_score,
        confidence=data.confidence,
        road_importance=data.road_importance or "Medium",
        has_water=data.has_water or False,
        location_context=data.location_context or "Urban municipal corridor"
    )
    return AIRecommendationResponse(**result)

@router.post("/pipeline/run")
async def run_pipeline(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Executes the modular 10-node LangGraph road condition intelligence pipeline.
    Steps:
    1. Media Upload
    2. Image / Video Preprocessing
    3. YOLO Defect Detection
    4. Defect Classification
    5. Severity Assessment
    6. Risk Score Calculation
    7. GPS / Road Segment Mapping
    8. Maintenance Priority
    9. AI Maintenance Recommendation
    10. Final Report
    """
    from app.services.ai_pipeline import build_road_inspection_graph
    
    app_graph = build_road_inspection_graph()
    initial_state = {
        "media_path": data.get("media_path", ""),
        "media_type": data.get("media_type", "image"),
        "road_name": data.get("road_name", "Primary Road"),
        "segment_id": data.get("segment_id", "SEG-01"),
        "district": data.get("district", "Central"),
        "city": data.get("city", "Capital Metro"),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "inspection_date": data.get("inspection_date", ""),
        "road_importance": data.get("road_importance", "Medium"),
        "preprocessed_info": {},
        "detections": [],
        "total_defects": 0,
        "defect_counts": {},
        "highest_severity": "Low",
        "risk_score": 0.0,
        "risk_level": "Low",
        "maintenance_priority": "Monitor",
        "priority_code": "MONITOR",
        "ai_recommendation": {},
        "final_report": {},
        "current_step": "Initialized",
        "step_history": [],
        "status": "started",
        "errors": []
    }

    final_state = app_graph.invoke(initial_state)

    # If inspection_id is provided, persist detections and update inspection status in DB
    inspection_id = data.get("inspection_id")
    if inspection_id:
        from app.models.inspection import Inspection
        from app.models.detection import Detection
        insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if insp:
            # Check existing detections to prevent duplicates
            existing_count = db.query(Detection).filter(Detection.inspection_id == inspection_id).count()
            if existing_count == 0:
                for d in final_state.get("detections", []):
                    det = Detection(
                        inspection_id=inspection_id,
                        defect_type=d.get("defect_type", "Pothole"),
                        confidence=float(d.get("confidence", 0.88)),
                        x1=float(d.get("x1", 100)),
                        y1=float(d.get("y1", 100)),
                        x2=float(d.get("x2", 300)),
                        y2=float(d.get("y2", 300)),
                        image_width=int(d.get("image_width", 1280)),
                        image_height=int(d.get("image_height", 720)),
                        area_ratio=float(d.get("area_ratio", 0.05)),
                        severity=d.get("severity", "Medium"),
                        risk_score=float(d.get("risk_score", 50.0)),
                        frame_number=d.get("frame_number", 1)
                    )
                    db.add(det)

            insp.total_defects = final_state.get("total_defects", len(final_state.get("detections", [])))
            insp.highest_severity = final_state.get("highest_severity", "Medium")
            insp.highest_risk = final_state.get("risk_score", 50.0)
            insp.priority = final_state.get("maintenance_priority", "Planned Maintenance")
            insp.status = "ANALYZED"
            db.commit()

    return {
        "status": final_state.get("status", "completed"),
        "step_history": final_state.get("step_history", []),
        "final_report": final_state.get("final_report", {}),
        "detections": final_state.get("detections", []),
        "defect_counts": final_state.get("defect_counts", {}),
        "risk_score": final_state.get("risk_score", 0.0),
        "risk_level": final_state.get("risk_level", "Low"),
        "highest_severity": final_state.get("highest_severity", "Low"),
        "maintenance_priority": final_state.get("maintenance_priority", "Monitor"),
        "priority_code": final_state.get("priority_code", "MONITOR"),
        "ai_recommendation": final_state.get("ai_recommendation", {})
    }


