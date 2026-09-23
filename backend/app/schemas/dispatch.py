from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DispatchUpdate(BaseModel):
    status: Optional[str] = None  # Pending, In Progress, Resolved, Dismissed
    assigned_officer_id: Optional[int] = None
    action_notes: Optional[str] = None

class DispatchResponse(BaseModel):
    id: int
    uuid: str
    inspection_id: int
    detection_id: Optional[int] = None
    assigned_officer_id: Optional[int] = None
    assigned_officer_name: Optional[str] = None
    status: str
    priority: str
    damage_summary: str
    boxed_image_path: Optional[str] = None
    action_notes: Optional[str] = None
    dispatch_time: datetime
    resolved_at: Optional[datetime] = None
    created_at: datetime
    
    # Nested inspection info
    road_name: Optional[str] = None
    road_segment_name: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True
