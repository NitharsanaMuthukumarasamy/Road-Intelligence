import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.database import get_db
from app.config import settings
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintTrackResponse,
    ChatbotMessageRequest,
    ChatbotMessageResponse
)
from app.services.chatbot_service import ChatbotService
from app.utils.logger import get_logger

logger = get_logger("chatbot_router")

router = APIRouter(prefix="/chatbot", tags=["RoadCare Assistant"])

ALLOWED_CHATBOT_MEDIA_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".avi"}

@router.post("/chat", response_model=ChatbotMessageResponse)
def chat_with_roadcare(
    request: ChatbotMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Stateful conversational endpoint for RoadCare Assistant.
    Powered by LangGraph to manage intent classification, slot extraction,
    complaint filing prompts, and ticket tracking queries.
    """
    try:
        response = ChatbotService.process_message(
            message=request.message,
            session_id=request.session_id,
            language=request.language or "en",
            current_slots=request.current_slots or {},
            current_step=request.current_step or "IDLE",
            db=db
        )
        return ChatbotMessageResponse(**response)
    except Exception as e:
        logger.error(f"Error processing chatbot message: {e}", exc_info=True)
        return ChatbotMessageResponse(
            reply="I'm sorry, I encountered a temporary issue processing your request. Please try again or select an option below.",
            session_id=request.session_id or str(uuid.uuid4()),
            language=request.language or "en",
            current_step="IDLE",
            slots=request.current_slots or {},
            quick_actions=["Report Road Problem", "Track My Ticket"]
        )


@router.post("/complaints", status_code=status.HTTP_201_CREATED)
def submit_complaint(
    complaint_in: ComplaintCreate,
    db: Session = Depends(get_db)
):
    """
    Registers a confirmed road complaint, generates a unique ticket ID (RC-YYYYMMDD-XXXXX),
    and initializes tracking status to 'Submitted'.
    """
    try:
        result = ChatbotService.create_complaint(
            complaint_data=complaint_in.model_dump(),
            db=db
        )
        return result
    except Exception as e:
        logger.error(f"Error registering road complaint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register road complaint in the database."
        )


@router.get("/complaints/{ticket_id}", response_model=ComplaintTrackResponse)
def track_complaint(
    ticket_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieves complaint tracking telemetry and visual status timeline
    for a given Ticket ID (e.g. RC-20260919-00421).
    """
    complaint_data = ChatbotService.get_complaint_status(ticket_id=ticket_id, db=db)
    if not complaint_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with Ticket ID '{ticket_id}' was not found."
        )
    return ComplaintTrackResponse(**complaint_data)


@router.post("/upload")
async def upload_chatbot_media(
    file: UploadFile = File(...)
):
    """
    Handles image or video upload for citizen road complaints.
    Returns the media URL for preview and database linking.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_CHATBOT_MEDIA_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(ALLOWED_CHATBOT_MEDIA_EXTS)}"
        )

    file_uuid = str(uuid.uuid4())
    stored_filename = f"complaint_{file_uuid}{ext}"
    dest_path = os.path.join(settings.UPLOADS_DIR, stored_filename)

    with open(dest_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            buffer.write(chunk)

    media_url = f"/storage/uploads/{stored_filename}"
    return {
        "filename": stored_filename,
        "original_name": file.filename,
        "media_url": media_url
    }
