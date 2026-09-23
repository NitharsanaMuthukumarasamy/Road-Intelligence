import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class FileRecord(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="CASCADE"), index=True, nullable=False)
    
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    processed_path = Column(String(500), nullable=True)  # Annotated image or video path
    
    file_type = Column(String(50), nullable=False)  # image, video
    mime_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=False)  # in bytes
    
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    inspection = relationship("Inspection", back_populates="files")
