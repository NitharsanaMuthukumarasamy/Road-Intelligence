from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.officer_dispatch import OfficerDispatch
from app.models.inspection import Inspection
from app.models.user import User
from app.schemas.dispatch import DispatchUpdate, DispatchResponse
from app.utils.security import get_current_user, require_roles

router = APIRouter(prefix="/dispatches", tags=["Officer Dispatches"])

@router.get("", response_model=List[DispatchResponse])
def list_dispatches(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists automated damage boxing dispatch tickets sent to officers.
    Government and Admin Officers can inspect and update all dispatches.
    """
    query = db.query(OfficerDispatch).join(Inspection, OfficerDispatch.inspection_id == Inspection.id)
    
    if current_user.role == "Citizen":
        query = query.filter(Inspection.user_id == current_user.id)
    elif current_user.role == "Government Officer" and status_filter == "assigned_to_me":
        query = query.filter(OfficerDispatch.assigned_officer_id == current_user.id)
        status_filter = None

    if status_filter:
        query = query.filter(OfficerDispatch.status == status_filter)
    if priority:
        query = query.filter(OfficerDispatch.priority == priority)

    dispatches = query.order_by(OfficerDispatch.created_at.desc()).offset(offset).limit(limit).all()

    results = []
    for d in dispatches:
        assigned_name = d.assigned_officer.full_name if d.assigned_officer else "Unassigned Officer Pool"
        results.append(
            DispatchResponse(
                id=d.id,
                uuid=d.uuid,
                inspection_id=d.inspection_id,
                detection_id=d.detection_id,
                assigned_officer_id=d.assigned_officer_id,
                assigned_officer_name=assigned_name,
                status=d.status,
                priority=d.priority,
                damage_summary=d.damage_summary,
                boxed_image_path=d.boxed_image_path,
                action_notes=d.action_notes,
                dispatch_time=d.dispatch_time,
                resolved_at=d.resolved_at,
                created_at=d.created_at,
                road_name=d.inspection.road_name if d.inspection else None,
                road_segment_name=d.inspection.road_segment_name if d.inspection else None,
                district=d.inspection.district if d.inspection else None,
                latitude=d.inspection.latitude if d.inspection else None,
                longitude=d.inspection.longitude if d.inspection else None
            )
        )
    return results

@router.get("/{id}", response_model=DispatchResponse)
def get_dispatch(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves an automated damage dispatch ticket by ID."""
    d = db.query(OfficerDispatch).filter(OfficerDispatch.id == id).first()
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispatch ticket not found.")

    assigned_name = d.assigned_officer.full_name if d.assigned_officer else "Unassigned Officer Pool"
    return DispatchResponse(
        id=d.id,
        uuid=d.uuid,
        inspection_id=d.inspection_id,
        detection_id=d.detection_id,
        assigned_officer_id=d.assigned_officer_id,
        assigned_officer_name=assigned_name,
        status=d.status,
        priority=d.priority,
        damage_summary=d.damage_summary,
        boxed_image_path=d.boxed_image_path,
        action_notes=d.action_notes,
        dispatch_time=d.dispatch_time,
        resolved_at=d.resolved_at,
        created_at=d.created_at,
        road_name=d.inspection.road_name if d.inspection else None,
        road_segment_name=d.inspection.road_segment_name if d.inspection else None,
        district=d.inspection.district if d.inspection else None,
        latitude=d.inspection.latitude if d.inspection else None,
        longitude=d.inspection.longitude if d.inspection else None
    )

@router.patch("/{id}/status", response_model=DispatchResponse)
def update_dispatch_status(
    id: int,
    update_data: DispatchUpdate,
    db: Session = Depends(get_db),
    officer_user: User = Depends(require_roles("Government Officer", "Admin Officer"))
):
    """Allows Government Officers to claim, update progress, or mark damage repaired."""
    d = db.query(OfficerDispatch).filter(OfficerDispatch.id == id).first()
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispatch ticket not found.")

    if update_data.status:
        d.status = update_data.status
        if update_data.status == "Resolved":
            d.resolved_at = datetime.utcnow()
    if update_data.assigned_officer_id is not None:
        d.assigned_officer_id = update_data.assigned_officer_id
    elif d.assigned_officer_id is None:
        d.assigned_officer_id = officer_user.id  # Automatically claim ticket

    if update_data.action_notes:
        d.action_notes = update_data.action_notes

    db.commit()
    db.refresh(d)

    assigned_name = d.assigned_officer.full_name if d.assigned_officer else officer_user.full_name
    return DispatchResponse(
        id=d.id,
        uuid=d.uuid,
        inspection_id=d.inspection_id,
        detection_id=d.detection_id,
        assigned_officer_id=d.assigned_officer_id,
        assigned_officer_name=assigned_name,
        status=d.status,
        priority=d.priority,
        damage_summary=d.damage_summary,
        boxed_image_path=d.boxed_image_path,
        action_notes=d.action_notes,
        dispatch_time=d.dispatch_time,
        resolved_at=d.resolved_at,
        created_at=d.created_at,
        road_name=d.inspection.road_name if d.inspection else None,
        road_segment_name=d.inspection.road_segment_name if d.inspection else None,
        district=d.inspection.district if d.inspection else None,
        latitude=d.inspection.latitude if d.inspection else None,
        longitude=d.inspection.longitude if d.inspection else None
    )
