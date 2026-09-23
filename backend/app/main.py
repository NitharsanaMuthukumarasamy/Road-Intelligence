import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import engine, Base
from app.routers import (
    auth_router,
    inspections_router,
    uploads_router,
    jobs_router,
    detections_router,
    road_segments_router,
    dashboard_router,
    map_router,
    ai_router,
    dispatches_router,
    reports_router,
    health_router,
    chatbot_router,
)
from app.services.cv_service import get_yolo_model
from app.utils.logger import get_logger

logger = get_logger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure DB schema is created
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)

    # Preload YOLO model once into memory
    logger.info("Pre-warming YOLO detection engine...")
    try:
        get_yolo_model()
    except Exception as e:
        logger.warning(f"Note: YOLO model initialization notice: {e}")

    yield
    # Shutdown
    logger.info("Shutting down AI Road Condition Intelligence System...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-grade AI-powered platform that analyzes road images and videos to detect road defects, estimate defect severity, calculate 0-100 risk scores, prioritize maintenance, and automatically dispatch boxed damage alerts to government officers.",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production can restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file storage for images, annotated outputs, and videos
app.mount("/storage", StaticFiles(directory=settings.STORAGE_ROOT), name="storage")

# Centralized Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error in request parameters", "errors": exc.errors()}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server exception on {request.url}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error occurred. Please contact the administrator."}
    )

# Include API Routers
app.include_router(health_router)
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(inspections_router, prefix=settings.API_V1_PREFIX)
app.include_router(inspections_router, prefix="/api/v1")
app.include_router(uploads_router, prefix=settings.API_V1_PREFIX)
app.include_router(jobs_router, prefix=settings.API_V1_PREFIX)
app.include_router(detections_router, prefix=settings.API_V1_PREFIX)
app.include_router(road_segments_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(map_router, prefix=settings.API_V1_PREFIX)
app.include_router(ai_router, prefix=settings.API_V1_PREFIX)
app.include_router(dispatches_router, prefix=settings.API_V1_PREFIX)
app.include_router(reports_router, prefix=settings.API_V1_PREFIX)
app.include_router(chatbot_router, prefix=settings.API_V1_PREFIX)
app.include_router(chatbot_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
