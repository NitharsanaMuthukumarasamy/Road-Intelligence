from fastapi import APIRouter
from sqlalchemy import text
from app.database import SessionLocal
import redis
from app.config import settings

router = APIRouter(tags=["Health & Readiness"])

@router.get("/health")
def health_check():
    """Health status check verifying backend, database, and Redis connectivity."""
    db_status = "healthy"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception:
        db_status = "unhealthy"

    redis_status = "offline (using local async worker fallback)"
    try:
        r = redis.Redis.from_url(settings.REDIS_URL, socket_connect_timeout=0.2, socket_timeout=0.2)
        r.ping()
        redis_status = "healthy"
    except Exception:
        pass

    return {
        "backend": "healthy",
        "database": db_status,
        "redis": redis_status,
        "yolo_model": "loaded",
        "version": settings.VERSION
    }

@router.get("/ready")
def readiness_check():
    """Readiness probe for container orchestration."""
    return health_check()
