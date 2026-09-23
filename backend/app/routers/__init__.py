from app.routers.auth import router as auth_router
from app.routers.inspections import router as inspections_router
from app.routers.uploads import router as uploads_router
from app.routers.jobs import router as jobs_router
from app.routers.detections import router as detections_router
from app.routers.road_segments import router as road_segments_router
from app.routers.dashboard import router as dashboard_router
from app.routers.map import router as map_router
from app.routers.ai import router as ai_router
from app.routers.dispatches import router as dispatches_router
from app.routers.reports import router as reports_router
from app.routers.health import router as health_router
from app.routers.chatbot import router as chatbot_router

__all__ = [
    "auth_router",
    "inspections_router",
    "uploads_router",
    "jobs_router",
    "detections_router",
    "road_segments_router",
    "dashboard_router",
    "map_router",
    "ai_router",
    "dispatches_router",
    "reports_router",
    "health_router",
    "chatbot_router",
]
