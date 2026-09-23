import re
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, TypedDict
from sqlalchemy.orm import Session

from langgraph.graph import StateGraph, END
from app.models.complaint import Complaint
from app.utils.logger import get_logger

logger = get_logger("chatbot_service")

# 7 Visual Status Stages
COMPLAINT_STAGES = [
    "Submitted",
    "Under Review",
    "Assigned",
    "Inspection",
    "Maintenance",
    "Resolved",
    "Closed"
]

# Canonical Problem Types
PROBLEM_TYPES = [
    "Pothole",
    "Crack",
    "Damaged Road Surface",
    "Water Logging",
    "Drainage Problem",
    "Other"
]

URGENCY_LEVELS = ["Normal", "Urgent", "Dangerous"]

class RoadCareAgentState(TypedDict):
    session_id: str
    language: str  # "en" or "ta"
    user_input: str
    intent: str
    slots: Dict[str, Any]
    current_step: str
    bot_reply: str
    quick_actions: List[str]
    confirmation_card: Optional[Dict[str, Any]]
    ticket_card: Optional[Dict[str, Any]]
    track_card: Optional[Dict[str, Any]]


def generate_ticket_id(db: Optional[Session] = None) -> str:
    """Generates unique complaint ticket ID: RC-YYYYMMDD-XXXXX."""
    today_str = datetime.utcnow().strftime("%Y%m%d")
    count = 1
    if db:
        try:
            today_prefix = f"RC-{today_str}-%"
            existing_count = db.query(Complaint).filter(Complaint.ticket_id.like(today_prefix)).count()
            count = existing_count + 1
        except Exception:
            count = 1
    ticket_id = f"RC-{today_str}-{count:05d}"
    return ticket_id


def extract_slots_and_intent(user_text: str, current_slots: Dict[str, Any], current_step: str) -> tuple[str, Dict[str, Any]]:
    """
    Extracts slots and intent from natural language input.
    Does not overwrite already provided information unless explicitly requested.
    """
    text = user_text.strip()
    text_lower = text.lower()
    slots = dict(current_slots)
    intent = "UNKNOWN"

    # Quick Action / Intent Detection
    if any(k in text_lower for k in ["report road problem", "register complaint", "report problem", "புகார் பதிவு", "report a problem", "report issue", "file complaint"]):
        intent = "REPORT_COMPLAINT"
    elif any(k in text_lower for k in ["track my ticket", "track ticket", "check status", "ticket status", "கண்காணி", "track complaint"]):
        intent = "TRACK_TICKET"
    elif any(k in text_lower for k in ["confirm & submit", "confirm complaint", "submit complaint", "confirm and submit", "உறுதி செய்"]):
        intent = "CONFIRM_COMPLAINT"
    elif any(k in text_lower for k in ["edit details", "edit complaint", "change details"]):
        intent = "EDIT_DETAILS"
    elif any(k in text_lower for k in ["hi", "hello", "hey", "வணக்கம்", "vanakkam", "namaste", "start", "restart", "menu"]):
        if not current_step or current_step in ["IDLE", "WELCOME"]:
            intent = "GREETING"

    # Ticket ID extraction (e.g., RC-20260919-00421)
    ticket_match = re.search(r'RC-\d{8}-\d{5}', text, re.IGNORECASE)
    if ticket_match:
        slots["ticket_id"] = ticket_match.group(0).upper()
        if intent == "UNKNOWN":
            intent = "TRACK_TICKET"

    # Problem Type Extraction
    if not slots.get("problem_type") or current_step == "ASK_PROBLEM_TYPE":
        if any(w in text_lower for w in ["pothole", "pit", "hole", "crater", "குழி"]):
            slots["problem_type"] = "Pothole"
        elif any(w in text_lower for w in ["crack", "fissure", "fracture", "alligator", "விரிசல்"]):
            slots["problem_type"] = "Crack"
        elif any(w in text_lower for w in ["water logging", "waterlogging", "puddle", "stagnation", "water accumulation", "தண்ணீர் தேக்கம்"]):
            slots["problem_type"] = "Water Logging"
        elif any(w in text_lower for w in ["drainage", "drain", "sewer", "overflow", "culvert", "கழிவுநீர்"]):
            slots["problem_type"] = "Drainage Problem"
        elif any(w in text_lower for w in ["damaged", "broken surface", "erosion", "uneven", "surface", "சேதமடைந்த", "பழுது"]):
            slots["problem_type"] = "Damaged Road Surface"
        elif current_step == "ASK_PROBLEM_TYPE" and len(text) > 2:
            slots["problem_type"] = text.title() if text.title() in PROBLEM_TYPES else "Other"

    # Urgency Extraction
    if not slots.get("urgency") or current_step == "ASK_URGENCY":
        if any(w in text_lower for w in ["dangerous", "hazard", "fatal", "accident", "danger", "very big", "critical", "risk", "ஆபத்தானது"]):
            slots["urgency"] = "Dangerous"
        elif any(w in text_lower for w in ["urgent", "asap", "fast", "immediately", "quick", "அவசரம்"]):
            slots["urgency"] = "Urgent"
        elif any(w in text_lower for w in ["normal", "moderate", "minor", "small", "routine", "சாதாரண"]):
            slots["urgency"] = "Normal"

    # Mobile Number Extraction (10 digits)
    if not slots.get("mobile_number") or current_step == "ASK_MOBILE":
        phone_match = re.search(r'(?:\+91[\-\s]?)?[6789]\d{9}', text)
        if phone_match:
            digits = re.sub(r'\D', '', phone_match.group(0))
            if len(digits) >= 10:
                slots["mobile_number"] = digits[-10:]
        elif current_step == "ASK_MOBILE" and re.search(r'\d{7,15}', text):
            slots["mobile_number"] = re.sub(r'\D', '', text)

    # Name Extraction
    if not slots.get("user_name") or current_step == "ASK_NAME":
        name_match = re.search(r'(?:my name is|i am|name[:\s]+)\s*([a-zA-Z\s]{2,40})', text, re.IGNORECASE)
        if name_match:
            slots["user_name"] = name_match.group(1).strip().title()
        elif current_step == "ASK_NAME" and len(text) >= 2 and not any(k in text_lower for k in ["pothole", "crack", "urgent", "road"]):
            slots["user_name"] = text.strip().title()

    # Location Extraction
    if not slots.get("location") or current_step == "ASK_LOCATION":
        loc_match = re.search(r'(?:on|at|near|in)\s+([a-zA-Z0-9\s,\.\-]{3,60}(?:road|street|nagar|colony|junction|cross|circle|district|area)?)', text, re.IGNORECASE)
        if loc_match and not any(w in loc_match.group(1).lower() for w in ["pothole", "crack", "water", "urgent", "dangerous"]):
            slots["location"] = loc_match.group(1).strip().title()
        elif current_step == "ASK_LOCATION" and len(text) >= 3:
            slots["location"] = text.strip()

    # Description Extraction
    if current_step == "ASK_DESCRIPTION" and len(text) >= 3:
        slots["description"] = text.strip()
    elif not slots.get("description") and len(text) > 15 and not current_step:
        # If user typed a detailed initial problem description, preserve it
        slots["description"] = text.strip()

    # If user provided problem_type or urgency in message, set intent to REPORT_COMPLAINT if not already set
    if intent == "UNKNOWN":
        if slots.get("problem_type") or slots.get("urgency"):
            intent = "REPORT_COMPLAINT"
        elif current_step and current_step.startswith("ASK_"):
            intent = "REPORT_COMPLAINT"

    return intent, slots


def nlu_node(state: RoadCareAgentState) -> Dict[str, Any]:
    """LangGraph Node 1: NLU Intent Detection and Slot Extraction."""
    user_input = state.get("user_input", "")
    current_slots = state.get("slots", {})
    current_step = state.get("current_step", "IDLE")

    intent, updated_slots = extract_slots_and_intent(user_input, current_slots, current_step)

    # Preserve or override state intent
    prev_intent = state.get("intent", "UNKNOWN")
    effective_intent = intent if intent != "UNKNOWN" else prev_intent

    return {
        "intent": effective_intent,
        "slots": updated_slots
    }


def complaint_flow_node(state: RoadCareAgentState) -> Dict[str, Any]:
    """
    LangGraph Node 2: Manages the Report Road Problem conversational flow.
    Checks for missing fields in sequence:
    1. Problem Type
    2. Location
    3. GPS Location
    4. Description
    5. Media Upload
    6. Urgency
    7. User Name
    8. Mobile Number
    Then outputs confirmation card.
    """
    slots = state.get("slots", {})
    lang = state.get("language", "en")
    user_input = state.get("user_input", "").lower()

    # Handle GPS response
    if state.get("current_step") == "ASK_GPS":
        if "skip" in user_input:
            slots["gps_shared"] = False
        elif "current" in user_input or "gps" in user_input or slots.get("latitude"):
            slots["gps_shared"] = True
        else:
            slots["gps_shared"] = False

    # Handle Media response
    if state.get("current_step") == "ASK_MEDIA":
        if "skip" in user_input:
            slots["media_skipped"] = True

    # 1. Check Problem Type
    if not slots.get("problem_type"):
        reply = (
            "What type of road problem would you like to report?"
            if lang == "en"
            else "நீங்கள் எந்த வகையான சாலை பிரச்சனையை பதிவு செய்ய விரும்புகிறீர்கள்?"
        )
        return {
            "current_step": "ASK_PROBLEM_TYPE",
            "bot_reply": reply,
            "quick_actions": PROBLEM_TYPES,
            "slots": slots,
            "confirmation_card": None,
            "ticket_card": None
        }

    # 2. Check Location
    if not slots.get("location"):
        reply = (
            f"Got it, {slots.get('problem_type')}. Where is the problem located?\n\nPlease provide the Road/Street Name, Area, District, or Landmark."
            if lang == "en"
            else f"{slots.get('problem_type')} பதிவாகியுள்ளது. இந்த பிரச்சனை எங்கு உள்ளது?\n\nதயவுசெய்து சாலை/தெரு பெயர், பகுதி, மாவட்டம் அல்லது அடையாளத்தை தெரிவிக்கவும்."
        )
        return {
            "current_step": "ASK_LOCATION",
            "bot_reply": reply,
            "quick_actions": ["Enter Location Manually"],
            "slots": slots,
            "confirmation_card": None,
            "ticket_card": None
        }

    # 3. Check GPS Location
    if "gps_shared" not in slots and not slots.get("latitude"):
        reply = (
            "Would you like to share your current GPS location to pinpoint the exact road coordinates?"
            if lang == "en"
            else "துல்லியமான இடத்தைக் குறிக்க உங்கள் தற்போதைய ஜி.பி.எஸ் (GPS) இருப்பிடத்தை பகிர விரும்புகிறீர்களா?"
        )
        return {
            "current_step": "ASK_GPS",
            "bot_reply": reply,
            "quick_actions": ["Use Current Location", "Enter Location Manually", "Skip GPS"],
            "slots": slots,
            "confirmation_card": None,
            "ticket_card": None
        }

    # 4. Check Problem Description
    if not slots.get("description"):
        reply = (
            "Please describe the problem in a few words (e.g. depth, width, impact on vehicles)."
            if lang == "en"
            else "தயவுசெய்து பிரச்சனையைப் பற்றி சுருக்கமாக விவரிக்கவும் (எ.கா. ஆழம், வாகனங்களுக்கு ஆபத்து)."
        )
        return {
            "current_step": "ASK_DESCRIPTION",
            "bot_reply": reply,
            "quick_actions": ["Very deep pothole", "Cracks spreading across lane", "Water stagnant across street"],
            "slots": slots,
            "confirmation_card": None,
            "ticket_card": None
        }

    # 5. Check Media Upload
    if not slots.get("media_url") and not slots.get("media_skipped"):
        reply = (
            "Please upload a photo or video of the road problem. You can use the upload button below or type 'skip' if you don't have one."
            if lang == "en"
            else "தயவுசெய்து சாலை பிரச்சனையின் புகைப்படம் அல்லது வீடியோவை பதிவேற்றவும் (அல்லது 'skip' என்று தட்டச்சு செய்யவும்)."
        )
        return {
            "current_step": "ASK_MEDIA",
            "bot_reply": reply,
            "quick_actions": ["Upload Photo/Video", "Skip Upload"],
            "slots": slots,
            "confirmation_card": None,
            "ticket_card": None
        }

    # 6. Check Urgency
    if not slots.get("urgency"):
        reply = (
            "How urgent is the problem?"
            if lang == "en"
            else "இந்த பிரச்சனை எவ்வளவு அவசரமானது?"
        )
        return {
            "current_step": "ASK_URGENCY",
            "bot_reply": reply,
            "quick_actions": URGENCY_LEVELS,
            "slots": slots,
            "confirmation_card": None,
            "ticket_card": None
        }

    # 7. Check Customer Name
    if not slots.get("user_name"):
        reply = (
            "Please enter your name."
            if lang == "en"
            else "தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்."
        )
        return {
            "current_step": "ASK_NAME",
            "bot_reply": reply,
            "quick_actions": [],
            "slots": slots,
            "confirmation_card": None,
            "ticket_card": None
        }

    # 8. Check Mobile Number
    if not slots.get("mobile_number"):
        reply = (
            "Please enter your 10-digit mobile number for ticket updates and SMS tracking."
            if lang == "en"
            else "புகார் தகவல்களைப் பெற உங்கள் 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்."
        )
        return {
            "current_step": "ASK_MOBILE",
            "bot_reply": reply,
            "quick_actions": [],
            "slots": slots,
            "confirmation_card": None,
            "ticket_card": None
        }

    # ALL SLOTS COLLECTED -> SHOW CONFIRMATION CARD
    gps_display = (
        f"{slots.get('latitude', 'Lat')}, {slots.get('longitude', 'Lng')}"
        if slots.get("latitude") and slots.get("longitude")
        else ("Current Location Shared" if slots.get("gps_shared") else "Not Provided")
    )

    confirmation_data = {
        "problem_type": slots.get("problem_type"),
        "location": slots.get("location"),
        "description": slots.get("description"),
        "gps_location": gps_display,
        "latitude": slots.get("latitude"),
        "longitude": slots.get("longitude"),
        "media_url": slots.get("media_url"),
        "urgency": slots.get("urgency", "Normal"),
        "user_name": slots.get("user_name"),
        "mobile_number": slots.get("mobile_number")
    }

    reply = (
        "Thank you! Please review your road complaint details below before final submission:"
        if lang == "en"
        else "நன்றி! புகாரை சமர்ப்பிப்பதற்கு முன் விவரங்களை உறுதிப்படுத்தவும்:"
    )

    return {
        "current_step": "CONFIRMATION",
        "bot_reply": reply,
        "quick_actions": ["Confirm & Submit Complaint", "Edit Details"],
        "slots": slots,
        "confirmation_card": confirmation_data,
        "ticket_card": None
    }


def track_flow_node(state: RoadCareAgentState) -> Dict[str, Any]:
    """LangGraph Node 3: Manages Ticket Tracking Flow."""
    slots = state.get("slots", {})
    lang = state.get("language", "en")
    ticket_id = slots.get("ticket_id")

    if not ticket_id:
        reply = (
            "Please enter your Ticket ID (e.g. RC-20260919-00421) to track your road complaint."
            if lang == "en"
            else "உங்கள் புகாரை கண்காணிக்க டிக்கெட் ஐடியை (Ticket ID) உள்ளிடவும் (எ.கா. RC-20260919-00421)."
        )
        return {
            "current_step": "TRACK_INPUT",
            "bot_reply": reply,
            "quick_actions": ["Report Road Problem"],
            "slots": slots,
            "track_card": None
        }

    # Return tracking status instructions; actual database lookup is merged in service
    reply = (
        f"Retrieving complaint telemetry for Ticket ID: {ticket_id}..."
        if lang == "en"
        else f"டிக்கெட் {ticket_id} பற்றிய விவரங்கள் பெறப்படுகின்றன..."
    )
    return {
        "current_step": "TRACK_RESULT",
        "bot_reply": reply,
        "quick_actions": ["Track Another Ticket", "Report Road Problem"],
        "slots": slots
    }


def greeting_node(state: RoadCareAgentState) -> Dict[str, Any]:
    """LangGraph Node 4: Returns the RoadCare Assistant welcome message."""
    lang = state.get("language", "en")
    if lang == "ta":
        reply = "வணக்கம்! நான் RoadCare Assistant. ரோடு பிரச்சனையை பதிவு செய்ய அல்லது உங்கள் புகாரை கண்காணிக்க நான் உங்களுக்கு உதவ முடியும்."
    else:
        reply = "Hi! I’m RoadCare Assistant. I can help you report a road problem or track your existing complaint."

    return {
        "current_step": "WELCOME",
        "bot_reply": reply,
        "quick_actions": ["Report Road Problem", "Track My Ticket"],
        "slots": state.get("slots", {}),
        "confirmation_card": None,
        "ticket_card": None,
        "track_card": None
    }


def qa_flow_node(state: RoadCareAgentState) -> Dict[str, Any]:
    """LangGraph Node 5: Answers citizen inquiries about road maintenance and procedures."""
    user_input = state.get("user_input", "").lower()
    lang = state.get("language", "en")

    if any(w in user_input for w in ["time", "how long", "duration", "எவ்வளவு நாள்", "காலம்"]):
        reply = (
            "Standard resolution timelines for reported road problems:\n"
            "• Dangerous (Potholes/Collapses): 24 – 48 Hours\n"
            "• Urgent (Severe Cracks/Water Stagnation): 3 – 5 Days\n"
            "• Normal (Routine Surface Wear): 7 – 14 Days\n\n"
            "You can track real-time progress anytime using your Ticket ID."
        )
    elif any(w in user_input for w in ["help", "contact", "phone", "support", "தொடர்பு"]):
        reply = (
            "For municipal emergency road hazards, you can also reach the 24/7 State Highway Toll-Free Helpline: 1800-425-7623 (ROAD).\n\n"
            "Would you like to report a road problem or track an existing ticket?"
        )
    else:
        reply = (
            "I'm here to assist you with road condition complaints and maintenance tracking.\n\n"
            "You can choose an option below to get started:"
        )

    return {
        "current_step": "QA",
        "bot_reply": reply,
        "quick_actions": ["Report Road Problem", "Track My Ticket"],
        "slots": state.get("slots", {})
    }


def route_intent(state: RoadCareAgentState) -> str:
    """Routing condition for LangGraph."""
    intent = state.get("intent", "UNKNOWN")
    current_step = state.get("current_step", "IDLE")

    if intent == "GREETING":
        return "greeting"
    elif intent in ["REPORT_COMPLAINT", "CONFIRM_COMPLAINT", "EDIT_DETAILS"] or current_step.startswith("ASK_"):
        return "complaint"
    elif intent == "TRACK_TICKET" or current_step == "TRACK_INPUT":
        return "track"
    else:
        return "qa"


# Build the LangGraph Workflow
def build_roadcare_graph():
    builder = StateGraph(RoadCareAgentState)
    builder.add_node("nlu", nlu_node)
    builder.add_node("greeting", greeting_node)
    builder.add_node("complaint", complaint_flow_node)
    builder.add_node("track", track_flow_node)
    builder.add_node("qa", qa_flow_node)

    builder.set_entry_point("nlu")

    builder.add_conditional_edges(
        "nlu",
        route_intent,
        {
            "greeting": "greeting",
            "complaint": "complaint",
            "track": "track",
            "qa": "qa"
        }
    )

    builder.add_edge("greeting", END)
    builder.add_edge("complaint", END)
    builder.add_edge("track", END)
    builder.add_edge("qa", END)

    return builder.compile()


# Compile graph once
roadcare_chatbot_graph = build_roadcare_graph()


class ChatbotService:
    @staticmethod
    def process_message(
        message: str,
        session_id: Optional[str] = None,
        language: str = "en",
        current_slots: Optional[Dict[str, Any]] = None,
        current_step: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """Runs the LangGraph conversation pipeline and returns structured response."""
        sid = session_id or str(uuid.uuid4())
        slots = current_slots or {}

        # If user selected "Edit Details", clear confirmation state
        if "edit" in message.lower() and current_step == "CONFIRMATION":
            current_step = "ASK_PROBLEM_TYPE"
            slots = {}

        initial_state: RoadCareAgentState = {
            "session_id": sid,
            "language": language,
            "user_input": message,
            "intent": "UNKNOWN",
            "slots": slots,
            "current_step": current_step or "IDLE",
            "bot_reply": "",
            "quick_actions": [],
            "confirmation_card": None,
            "ticket_card": None,
            "track_card": None
        }

        # Invoke LangGraph
        result = roadcare_chatbot_graph.invoke(initial_state)

        # If track result step and DB session is available, execute actual ticket lookup
        if result.get("current_step") == "TRACK_RESULT" and db:
            ticket_id = result.get("slots", {}).get("ticket_id")
            if ticket_id:
                complaint = db.query(Complaint).filter(Complaint.ticket_id == ticket_id).first()
                if complaint:
                    stage_idx = COMPLAINT_STAGES.index(complaint.status) if complaint.status in COMPLAINT_STAGES else 0
                    track_data = {
                        "ticket_id": complaint.ticket_id,
                        "problem_type": complaint.problem_type,
                        "location": complaint.address or "Registered Location",
                        "status": complaint.status,
                        "priority": complaint.priority,
                        "created_at": complaint.created_at.strftime("%d %B %Y") if complaint.created_at else "Recently",
                        "updated_at": complaint.updated_at.strftime("%d %B %Y") if complaint.updated_at else "Recently",
                        "current_stage_index": stage_idx,
                        "stages": COMPLAINT_STAGES,
                        "description": complaint.description,
                        "media_url": complaint.media_url
                    }
                    result["track_card"] = track_data
                    result["bot_reply"] = (
                        f"Found complaint record for Ticket ID: {complaint.ticket_id}. "
                        f"Current status is '{complaint.status}' with priority '{complaint.priority}'."
                    )
                else:
                    result["bot_reply"] = (
                        f"No registered road complaint found for Ticket ID '{ticket_id}'. "
                        "Please verify the ticket ID and try again."
                    )
                    result["track_card"] = None
                    result["quick_actions"] = ["Enter Ticket ID Again", "Report Road Problem"]

        return result

    @staticmethod
    def create_complaint(
        complaint_data: Dict[str, Any],
        db: Session
    ) -> Dict[str, Any]:
        """Persists a new complaint and generates ticket ID."""
        ticket_id = generate_ticket_id(db=db)
        
        urgency = complaint_data.get("urgency", "Normal")
        priority = "Critical" if urgency == "Dangerous" else ("High" if urgency == "Urgent" else "Medium")

        complaint = Complaint(
            ticket_id=ticket_id,
            user_name=complaint_data["user_name"],
            mobile_number=complaint_data["mobile_number"],
            problem_type=complaint_data["problem_type"],
            description=complaint_data["description"],
            latitude=complaint_data.get("latitude"),
            longitude=complaint_data.get("longitude"),
            address=complaint_data.get("address") or complaint_data.get("location"),
            media_url=complaint_data.get("media_url"),
            urgency=urgency,
            priority=priority,
            status="Submitted",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(complaint)
        db.commit()
        db.refresh(complaint)

        logger.info(f"Generated new road complaint ticket: {ticket_id} for user {complaint.user_name}")

        return {
            "ticket_id": ticket_id,
            "complaint_type": complaint.problem_type,
            "location": complaint.address or "Registered Location",
            "priority": complaint.priority,
            "current_status": complaint.status,
            "registration_date": complaint.created_at.strftime("%d %B %Y"),
            "user_name": complaint.user_name,
            "mobile_number": complaint.mobile_number
        }

    @staticmethod
    def get_complaint_status(ticket_id: str, db: Session) -> Optional[Dict[str, Any]]:
        """Retrieves complaint tracking status with 7-stage visual timeline."""
        clean_id = ticket_id.strip().upper()
        complaint = db.query(Complaint).filter(Complaint.ticket_id == clean_id).first()
        if not complaint:
            return None

        stage_idx = COMPLAINT_STAGES.index(complaint.status) if complaint.status in COMPLAINT_STAGES else 0

        return {
            "ticket_id": complaint.ticket_id,
            "problem_type": complaint.problem_type,
            "location": complaint.address or "Corridor Segment",
            "status": complaint.status,
            "priority": complaint.priority,
            "created_at": complaint.created_at.strftime("%d %B %Y") if complaint.created_at else "Recently",
            "updated_at": complaint.updated_at.strftime("%d %B %Y") if complaint.updated_at else "Recently",
            "current_stage_index": stage_idx,
            "stages": COMPLAINT_STAGES,
            "description": complaint.description,
            "media_url": complaint.media_url
        }
