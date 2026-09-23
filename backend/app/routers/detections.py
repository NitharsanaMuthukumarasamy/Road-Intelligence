from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.detection import Detection
from app.models.inspection import Inspection
from app.schemas.detection import DetectionResponse
from app.utils.security import get_current_user

router = APIRouter(prefix="/detections", tags=["Detections"])

@router.get("", response_model=List[DetectionResponse])
def list_detections(
    inspection_id: Optional[int] = None,
    defect_type: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists road defect detections with bounding boxes, severity, and risk scores."""
    query = db.query(Detection).join(Inspection, Detection.inspection_id == Inspection.id)
    if current_user.role == "Citizen":
        query = query.filter(Inspection.user_id == current_user.id)

    if inspection_id:
        query = query.filter(Detection.inspection_id == inspection_id)
    if defect_type:
        query = query.filter(Detection.defect_type.ilike(f"%{defect_type}%"))
    if severity:
        query = query.filter(Detection.severity == severity)

    detections = query.order_by(Detection.created_at.desc()).offset(offset).limit(limit).all()
    return [DetectionResponse.from_orm(d) for d in detections]

@router.get("/{id}", response_model=DetectionResponse)
def get_detection(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves specific detection details and bounding box telemetry."""
    det = db.query(Detection).filter(Detection.id == id).first()
    if not det:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Detection not found.")
    return DetectionResponse.from_orm(det)
