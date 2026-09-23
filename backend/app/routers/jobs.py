from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.processing_job import ProcessingJob
from app.schemas.job import JobStatusResponse
from app.utils.security import get_current_user

router = APIRouter(prefix="/jobs", tags=["Processing Jobs"])

@router.get("", response_model=List[JobStatusResponse])
def list_jobs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists current processing jobs with live statuses and progress bars."""
    query = db.query(ProcessingJob)
    if current_user.role == "Citizen":
        query = query.filter(ProcessingJob.user_id == current_user.id)

    if status:
        query = query.filter(ProcessingJob.status == status)

    jobs = query.order_by(ProcessingJob.created_at.desc()).offset(offset).limit(limit).all()
    return [JobStatusResponse.from_orm(j) for j in jobs]

@router.get("/{job_id}", response_model=JobStatusResponse)
def get_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves real-time processing status, progress percentage (0-100),
    current step message, or error message for a specific job.
    """
    job = db.query(ProcessingJob).filter(ProcessingJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing job not found.")

    if current_user.role == "Citizen" and job.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to inspect this job.")

    return JobStatusResponse.from_orm(job)
