import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Road Intelligence & Maintenance Prioritization"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"

    # Database: SQLite fallback for local dev, PostgreSQL for production
    DATABASE_URL: str = "sqlite:///./road_intelligence.db"

    # Background processing: Redis + Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    CELERY_CONCURRENCY: int = 2
    MAX_WORKERS: int = 4

    # OpenRouter AI Assistant
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "anthropic/claude-3.5-sonnet"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # Security & JWT
    JWT_SECRET_KEY: str = "super-secret-production-key-change-in-production-random-salt-9823472"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Uploads & Video Processing
    MAX_UPLOAD_SIZE: int = 500 * 1024 * 1024  # 500MB
    MAX_VIDEO_DURATION: int = 600  # 10 minutes
    MAX_VIDEO_SIZE: int = 500 * 1024 * 1024
    VIDEO_FRAME_INTERVAL: int = 3  # Process every Nth frame

    # YOLO Computer Vision
    YOLO_MODEL_PATH: str = str(BASE_DIR / "models" / "road_damage.pt")
    CONFIDENCE_THRESHOLD: float = 0.25

    # Storage paths
    STORAGE_ROOT: str = str(STORAGE_DIR)
    UPLOADS_DIR: str = str(STORAGE_DIR / "uploads")
    PROCESSED_DIR: str = str(STORAGE_DIR / "processed")
    VIDEOS_DIR: str = str(STORAGE_DIR / "videos")
    REPORTS_DIR: str = str(STORAGE_DIR / "reports")

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"

settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
os.makedirs(settings.VIDEOS_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs(BASE_DIR / "models", exist_ok=True)
