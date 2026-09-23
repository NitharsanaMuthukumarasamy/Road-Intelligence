import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.inspection import Inspection
from app.models.file import FileRecord
from app.models.processing_job import ProcessingJob
from app.schemas.job import JobCreateResponse
from app.workers.local_queue import dispatch_image_task, dispatch_video_task
from app.services.gps_service import extract_exif_gps
from app.utils.security import get_current_user

router = APIRouter(prefix="", tags=["Uploads & Jobs"])

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
ALLOWED_VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv"}

@router.post("/uploads/image", response_model=JobCreateResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_image(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    road_segment_id: Optional[int] = Form(None),
    road_segment_name: Optional[str] = Form(None),
    road_name: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    road_importance: str = Form("Medium"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Non-blocking image upload:
    Saves file with UUID, extracts EXIF GPS if available, creates Inspection & Job records,
    and dispatches asynchronously to background worker. Returns job_id immediately.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(ALLOWED_IMAGE_EXTS)}"
        )

    file_uuid = str(uuid.uuid4())
    stored_filename = f"{file_uuid}{ext}"
    dest_path = os.path.join(settings.UPLOADS_DIR, stored_filename)

    # Stream write to disk
    file_size = 0
    with open(dest_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            file_size += len(chunk)
            if file_size > settings.MAX_UPLOAD_SIZE:
                buffer.close()
                os.remove(dest_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Uploaded file exceeds maximum allowable size ({settings.MAX_UPLOAD_SIZE} bytes)."
                )
            buffer.write(chunk)

    # Check EXIF GPS if coordinates not explicitly provided
    if (latitude is None or longitude is None) or (latitude == 0 and longitude == 0):
        exif_lat, exif_lng = extract_exif_gps(dest_path)
        if exif_lat is not None and exif_lng is not None:
            latitude, longitude = exif_lat, exif_lng

    # Create Inspection record
    inspection_title = title or f"Road Inspection ({file.filename})"
    inspection = Inspection(
        title=inspection_title,
        description=description,
        user_id=current_user.id,
        road_segment_id=road_segment_id,
        road_segment_name=road_segment_name or "Sector 4 Main Corridor",
        road_name=road_name or "State Highway 12",
        district=district or "Central",
        city=city or "Metropolitan City",
        state=state or "State",
        latitude=latitude or 28.6139,
        longitude=longitude or 77.2090,
        media_type="image",
        status="queued"
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    # Create FileRecord
    file_record = FileRecord(
        inspection_id=inspection.id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        storage_path=dest_path,
        file_type="image",
        mime_type=file.content_type,
        file_size=file_size
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    # Create ProcessingJob record
    job_uuid = str(uuid.uuid4())
    job = ProcessingJob(
        job_id=job_uuid,
        user_id=current_user.id,
        inspection_id=inspection.id,
        task_type="image",
        status="queued",
        progress=0.0,
        step_message="Queued for YOLO road damage inference & damage boxing"
    )
    db.add(job)
    db.commit()

    # Dispatch to background Celery / Redis queue (with resilient fallback)
    dispatch_image_task(
        job_id=job_uuid,
        inspection_id=inspection.id,
        file_id=file_record.id,
        file_path=dest_path,
        user_id=current_user.id,
        road_importance=road_importance
    )

    return JobCreateResponse(
        job_id=job_uuid,
        status="queued",
        inspection_id=inspection.id,
        inspection_uuid=inspection.uuid,
        message="Image accepted and queued for background inference"
    )

@router.post("/uploads/video", response_model=JobCreateResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_video(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    road_segment_id: Optional[int] = Form(None),
    road_segment_name: Optional[str] = Form(None),
    road_name: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    road_importance: str = Form("Medium"),
    frame_interval: int = Form(settings.VIDEO_FRAME_INTERVAL),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Non-blocking video upload:
    Saves video to storage, creates database records, and dispatches to Celery queue.
    Returns job_id immediately without blocking the request.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_VIDEO_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video format '{ext}'. Allowed: {', '.join(ALLOWED_VIDEO_EXTS)}"
        )

    file_uuid = str(uuid.uuid4())
    stored_filename = f"{file_uuid}{ext}"
    dest_path = os.path.join(settings.VIDEOS_DIR, stored_filename)

    file_size = 0
    with open(dest_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            file_size += len(chunk)
            if file_size > settings.MAX_VIDEO_SIZE:
                buffer.close()
                os.remove(dest_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Uploaded video exceeds maximum allowed size (500MB)."
                )
            buffer.write(chunk)

    inspection = Inspection(
        title=title or f"Video Road Survey ({file.filename})",
        description=description,
        user_id=current_user.id,
        road_segment_id=road_segment_id,
        road_segment_name=road_segment_name or "Expressway Corridor B",
        road_name=road_name or "Ring Road North",
        district=district or "Northern",
        city=city or "Metropolitan City",
        state=state or "State",
        latitude=latitude or 28.6139,
        longitude=longitude or 77.2090,
        media_type="video",
        status="queued"
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    file_record = FileRecord(
        inspection_id=inspection.id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        storage_path=dest_path,
        file_type="video",
        mime_type=file.content_type,
        file_size=file_size
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    job_uuid = str(uuid.uuid4())
    job = ProcessingJob(
        job_id=job_uuid,
        user_id=current_user.id,
        inspection_id=inspection.id,
        task_type="video",
        status="queued",
        progress=0.0,
        step_message="Video accepted and queued for frame extraction & YOLO tracking"
    )
    db.add(job)
    db.commit()

    dispatch_video_task(
        job_id=job_uuid,
        inspection_id=inspection.id,
        file_id=file_record.id,
        file_path=dest_path,
        user_id=current_user.id,
        road_importance=road_importance,
        frame_interval=frame_interval
    )

    return JobCreateResponse(
        job_id=job_uuid,
        status="queued",
        inspection_id=inspection.id,
        inspection_uuid=inspection.uuid,
        message="Video accepted and queued for background inference"
    )

# Direct aliases for /jobs/image and /jobs/video as requested in specifications
@router.post("/jobs/image", response_model=JobCreateResponse, status_code=status.HTTP_202_ACCEPTED)
async def jobs_image_alias(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    road_segment_id: Optional[int] = Form(None),
    road_segment_name: Optional[str] = Form(None),
    road_name: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    road_importance: str = Form("Medium"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await upload_image(
        file, title, description, road_segment_id, road_segment_name, road_name,
        district, city, state, latitude, longitude, road_importance, db, current_user
    )

@router.post("/jobs/video", response_model=JobCreateResponse, status_code=status.HTTP_202_ACCEPTED)
async def jobs_video_alias(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    road_segment_id: Optional[int] = Form(None),
    road_segment_name: Optional[str] = Form(None),
    road_name: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    road_importance: str = Form("Medium"),
    frame_interval: int = Form(settings.VIDEO_FRAME_INTERVAL),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await upload_video(
        file, title, description, road_segment_id, road_segment_name, road_name,
        district, city, state, latitude, longitude, road_importance, frame_interval, db, current_user
    )
