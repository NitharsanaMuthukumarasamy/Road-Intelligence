from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.road_segment import RoadSegment
from app.models.detection import Detection
from app.models.inspection import Inspection
from app.schemas.road_segment import RoadSegmentCreate, RoadSegmentResponse
from app.utils.security import get_current_user, require_roles

router = APIRouter(prefix="/road-segments", tags=["Road Segments"])

@router.get("", response_model=List[RoadSegmentResponse])
def list_road_segments(
    district: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieves road segments with defect aggregations and risk ranking."""
    query = db.query(RoadSegment)
    if district:
        query = query.filter(RoadSegment.district.ilike(f"%{district}%"))
    if priority:
        query = query.filter(RoadSegment.priority == priority)

    segments = query.order_by(RoadSegment.avg_risk.desc()).offset(offset).limit(limit).all()
    return [RoadSegmentResponse.from_orm(s) for s in segments]

@router.get("/{id}", response_model=RoadSegmentResponse)
def get_road_segment(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieves a single road segment and its condition telemetry."""
    segment = db.query(RoadSegment).filter(RoadSegment.id == id).first()
    if not segment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Road segment not found.")
    return RoadSegmentResponse.from_orm(segment)

@router.post("", response_model=RoadSegmentResponse, status_code=status.HTTP_201_CREATED)
def create_road_segment(
    data: RoadSegmentCreate,
    db: Session = Depends(get_db),
    officer_user = Depends(require_roles("Government Officer", "Admin Officer"))
):
    """Adds a new municipal road segment asset."""
    existing = db.query(RoadSegment).filter(RoadSegment.segment_code == data.segment_code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Segment code already exists.")

    segment = RoadSegment(
        segment_code=data.segment_code,
        segment_name=data.segment_name,
        road_name=data.road_name,
        district=data.district,
        city=data.city,
        state=data.state,
        start_lat=data.start_lat,
        start_lng=data.start_lng,
        end_lat=data.end_lat,
        end_lng=data.end_lng,
        length_km=data.length_km,
        road_importance=data.road_importance
    )
    db.add(segment)
    db.commit()
    db.refresh(segment)
    return RoadSegmentResponse.from_orm(segment)
