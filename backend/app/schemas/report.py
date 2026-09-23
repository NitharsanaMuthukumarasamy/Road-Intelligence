from pydantic import BaseModel
from typing import Optional, List

class ReportGenerateRequest(BaseModel):
    format: str = "pdf"  # "pdf" or "csv"
    inspection_id: Optional[int] = None
    road_segment_id: Optional[int] = None
    title: Optional[str] = "Municipal Road Infrastructure Inspection & Maintenance Dossier"

class ReportResponse(BaseModel):
    download_url: str
    filename: str
    format: str
    filesize_bytes: int
    generated_at: str
