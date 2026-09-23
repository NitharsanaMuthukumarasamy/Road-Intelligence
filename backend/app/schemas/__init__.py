from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.schemas.inspection import InspectionCreate, InspectionResponse, InspectionDetailResponse, FileResponse
from app.schemas.job import JobCreateResponse, JobStatusResponse
from app.schemas.detection import DetectionCreate, DetectionResponse
from app.schemas.road_segment import RoadSegmentCreate, RoadSegmentResponse
from app.schemas.ai import AIExplainRequest, AIRecommendationResponse
from app.schemas.dispatch import DispatchUpdate, DispatchResponse
from app.schemas.report import ReportGenerateRequest, ReportResponse

__all__ = [
    "UserRegister",
    "UserLogin",
    "Token",
    "UserResponse",
    "InspectionCreate",
    "InspectionResponse",
    "InspectionDetailResponse",
    "FileResponse",
    "JobCreateResponse",
    "JobStatusResponse",
    "DetectionCreate",
    "DetectionResponse",
    "RoadSegmentCreate",
    "RoadSegmentResponse",
    "AIExplainRequest",
    "AIRecommendationResponse",
    "DispatchUpdate",
    "DispatchResponse",
    "ReportGenerateRequest",
    "ReportResponse",
]
