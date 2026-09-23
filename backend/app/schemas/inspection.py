from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.detection import DetectionResponse
from app.schemas.ai import AIRecommendationResponse

class FileResponse(BaseModel):
    id: int
    uuid: str
    original_filename: str
    storage_path: str
    processed_path: Optional[str] = None
    file_type: str
    file_size: int
    width: Optional[int] = None
    height: Optional[int] = None
    duration_seconds: Optional[float] = None

    class Config:
        from_attributes = True

class InspectionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    road_segment_id: Optional[int] = None
    road_segment_name: Optional[str] = None
    road_name: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class InspectionResponse(BaseModel):
    id: int
    uuid: str
    title: str
    description: Optional[str] = None
    user_id: int
    media_type: str
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    road_segment_name: Optional[str] = None
    road_name: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    total_defects: int
    highest_severity: str
    highest_risk: float
    priority: str
    created_at: datetime
    updated_at: datetime
    files: List[FileResponse] = []

    class Config:
        from_attributes = True

class InspectionDetailResponse(InspectionResponse):
    detections: List[DetectionResponse] = []
    recommendations: List[AIRecommendationResponse] = []

class InspectionSummaryResponse(BaseModel):
    inspection_id: int
    uuid: Optional[str] = None
    title: Optional[str] = None
    road_name: Optional[str] = None
    road_segment_name: Optional[str] = None
    district: Optional[str] = None
    status: str
    total_defects: int
    potholes: int
    cracks: int
    water_accumulation: int
    damaged_surfaces: int
    other_defects: int = 0
    critical_defects: int
    average_risk_score: float
    maximum_risk_score: float
    detections_count: Optional[int] = None

    class Config:
        from_attributes = True

