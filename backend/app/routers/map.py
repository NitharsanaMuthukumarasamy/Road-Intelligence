from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.database import get_db
from app.models.detection import Detection
from app.models.inspection import Inspection
from app.models.maintenance_recommendation import MaintenanceRecommendation
from app.utils.security import get_current_user

router = APIRouter(prefix="/map", tags=["Interactive Road Map"])

@router.get("/detections")
def get_map_detections(
    severity: Optional[str] = None,
    defect_type: Optional[str] = None,
    road_segment_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Returns geospatial inspection marker points for Leaflet map display
    with defect attributes, severity, risk score, and recommendations.
    """
    query = (
        db.query(Detection, Inspection)
        .join(Inspection, Detection.inspection_id == Inspection.id)
        .filter(Inspection.latitude.isnot(None))
        .filter(Inspection.longitude.isnot(None))
    )

    if severity:
        query = query.filter(Detection.severity == severity)
    if defect_type:
        query = query.filter(Detection.defect_type.ilike(f"%{defect_type}%"))
    if road_segment_id:
        query = query.filter(Inspection.road_segment_id == road_segment_id)

    results = query.order_by(Detection.created_at.desc()).limit(300).all()

    markers = []
    for det, insp in results:
        # Check if recommendation exists for this detection or inspection
        rec = db.query(MaintenanceRecommendation).filter(
            MaintenanceRecommendation.inspection_id == insp.id
        ).first()

        markers.append({
            "detection_id": det.id,
            "inspection_id": insp.id,
            "title": insp.title,
            "defect_type": det.defect_type,
            "confidence": det.confidence,
            "severity": det.severity,
            "risk_score": det.risk_score,
            "priority": insp.priority,
            "latitude": insp.latitude,
            "longitude": insp.longitude,
            "road_name": insp.road_name,
            "road_segment_name": insp.road_segment_name,
            "district": insp.district,
            "created_at": det.created_at.isoformat(),
            "recommendation": rec.maintenance_recommendation if rec else "Routine monitoring",
            "urgency": rec.urgency if rec else "Within 7 Days"
        })

    return markers
