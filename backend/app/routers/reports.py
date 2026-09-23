import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.config import settings
from app.models.inspection import Inspection
from app.models.detection import Detection
from app.models.maintenance_recommendation import MaintenanceRecommendation
from app.schemas.report import ReportGenerateRequest, ReportResponse
from app.services.report_service import generate_csv_report, generate_pdf_report
from app.utils.security import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Export"])

@router.post("/generate", response_model=ReportResponse)
def generate_report(
    request: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generates an official inspection dossier in PDF or CSV format."""
    insp = None
    if request.inspection_id:
        insp = db.query(Inspection).filter(Inspection.id == request.inspection_id).first()

    if not insp:
        # Fallback to most recent inspection
        insp = db.query(Inspection).order_by(Inspection.created_at.desc()).first()

    if not insp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No inspection data found to generate report.")

    detections = db.query(Detection).filter(Detection.inspection_id == insp.id).all()
    recommendations = db.query(MaintenanceRecommendation).filter(MaintenanceRecommendation.inspection_id == insp.id).all()

    insp_dict = {
        "id": insp.id,
        "title": insp.title,
        "created_at": insp.created_at.strftime("%Y-%m-%d %H:%M UTC"),
        "road_name": insp.road_name,
        "road_segment_name": insp.road_segment_name,
        "latitude": insp.latitude,
        "longitude": insp.longitude,
        "priority": insp.priority,
        "total_defects": insp.total_defects,
        "highest_risk": insp.highest_risk,
        "highest_severity": insp.highest_severity
    }

    det_list = [
        {
            "defect_type": d.defect_type,
            "confidence": d.confidence,
            "severity": d.severity,
            "risk_score": d.risk_score,
            "x1": d.x1, "y1": d.y1, "x2": d.x2, "y2": d.y2,
            "timestamp_sec": d.timestamp_sec
        }
        for d in detections
    ]

    rec_list = [
        {
            "source": r.source,
            "urgency": r.urgency,
            "maintenance_recommendation": r.maintenance_recommendation,
            "explanation": r.explanation
        }
        for r in recommendations
    ]

    fmt = request.format.lower()
    if fmt == "csv":
        filepath = generate_csv_report(insp_dict, det_list)
    else:
        filepath = generate_pdf_report(insp_dict, det_list, rec_list)

    filename = os.path.basename(filepath)
    filesize = os.path.getsize(filepath)

    return ReportResponse(
        download_url=f"/api/reports/download/{filename}",
        filename=filename,
        format=fmt,
        filesize_bytes=filesize,
        generated_at=insp_dict["created_at"]
    )

@router.get("/download/{filename}")
def download_report(filename: str):
    """Serves the generated report file for download."""
    # Sanitize filename
    clean_name = os.path.basename(filename)
    filepath = os.path.join(settings.REPORTS_DIR, clean_name)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found.")

    media_type = "application/pdf" if clean_name.endswith(".pdf") else "text/csv"
    return FileResponse(filepath, media_type=media_type, filename=clean_name)
