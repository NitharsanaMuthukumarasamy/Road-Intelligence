from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.inspection import Inspection
from app.models.file import FileRecord
from app.models.detection import Detection
from app.models.maintenance_recommendation import MaintenanceRecommendation
from app.schemas.inspection import (
    InspectionCreate,
    InspectionResponse,
    InspectionDetailResponse,
    InspectionSummaryResponse,
)
from app.services.inspection_summary_service import get_inspection_summary
from app.utils.security import get_current_user

router = APIRouter(prefix="/inspections", tags=["Inspections"])

@router.post("", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
def create_inspection(
    data: InspectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new inspection record."""
    inspection = Inspection(
        title=data.title,
        description=data.description,
        user_id=current_user.id,
        road_segment_id=data.road_segment_id,
        road_segment_name=data.road_segment_name,
        road_name=data.road_name,
        district=data.district,
        city=data.city,
        state=data.state,
        latitude=data.latitude,
        longitude=data.longitude,
        status="queued"
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    return InspectionResponse.from_orm(inspection)

@router.get("", response_model=List[InspectionResponse])
def list_inspections(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists inspections. Citizens see their own; Government/Admin officers see all inspections.
    """
    query = db.query(Inspection)
    if current_user.role == "Citizen":
        query = query.filter(Inspection.user_id == current_user.id)

    if status:
        query = query.filter(Inspection.status == status)
    if severity:
        query = query.filter(Inspection.highest_severity == severity)

    inspections = query.order_by(Inspection.created_at.desc()).offset(offset).limit(limit).all()
    return [InspectionResponse.from_orm(i) for i in inspections]

@router.get("/{id}", response_model=InspectionDetailResponse)
def get_inspection(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves full inspection details including detections, bounding boxes, and recommendations."""
    insp = db.query(Inspection).filter(Inspection.id == id).first()
    if not insp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inspection not found.")

    if current_user.role == "Citizen" and insp.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this inspection.")

    return InspectionDetailResponse.from_orm(insp)

@router.get("/{id}/summary", response_model=InspectionSummaryResponse)
def get_inspection_summary_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns exact calculated detection summary for the selected inspection:
    - total_defects
    - potholes
    - cracks
    - water_accumulation
    - damaged_surfaces
    - other_defects
    - critical_defects
    - average_risk_score
    - maximum_risk_score
    """
    insp = db.query(Inspection).filter(Inspection.id == id).first()
    if not insp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inspection not found.")

    if current_user.role == "Citizen" and insp.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this inspection.")

    summary = get_inspection_summary(db=db, inspection_id=id)
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found.")

    return InspectionSummaryResponse(**summary)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inspection(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes an inspection and related records."""
    insp = db.query(Inspection).filter(Inspection.id == id).first()
    if not insp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inspection not found.")

    if current_user.role == "Citizen" and insp.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this inspection.")

    db.delete(insp)
    db.commit()
    return None
