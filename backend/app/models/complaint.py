import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from app.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(36), unique=True, index=True, nullable=False)
    user_name = Column(String(100), nullable=False)
    mobile_number = Column(String(20), nullable=False, index=True)
    problem_type = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String(255), nullable=True)
    media_url = Column(String(500), nullable=True)
    
    urgency = Column(String(20), default="Normal", index=True)  # Normal, Urgent, Dangerous
    priority = Column(String(20), default="Medium", index=True)  # Low, Medium, High, Critical
    status = Column(String(30), default="Submitted", index=True)  # Submitted, Under Review, Assigned, Inspection, Maintenance, Resolved, Closed
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
