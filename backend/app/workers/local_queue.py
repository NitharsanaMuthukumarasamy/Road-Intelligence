import concurrent.futures
import redis
from app.config import settings
from app.workers.tasks import (
    process_image_celery_task,
    process_video_celery_task,
    run_image_processing_sync,
    run_video_processing_sync
)
from app.utils.logger import get_logger

logger = get_logger("task_dispatcher")

# Thread pool executor for local non-blocking asynchronous fallback
_EXECUTOR = concurrent.futures.ThreadPoolExecutor(max_workers=4)

def is_redis_available() -> bool:
    """Fast non-blocking check whether Redis message broker is active."""
    try:
        r = redis.Redis.from_url(settings.REDIS_URL, socket_timeout=0.5)
        return bool(r.ping())
    except Exception:
        return False

def dispatch_image_task(
    job_id: str,
    inspection_id: int,
    file_id: int,
    file_path: str,
    user_id: int,
    road_importance: str = "Medium"
):
    """
    Dispatches image processing task to Celery + Redis if available.
    Otherwise immediately executes asynchronously via local ThreadPoolExecutor.
    """
    if is_redis_available():
        try:
            process_image_celery_task.delay(
                job_id, inspection_id, file_id, file_path, user_id, road_importance
            )
            logger.info(f"Dispatched image task {job_id} to Celery + Redis queue.")
            return
        except Exception as exc:
            logger.warning(f"Celery dispatch failed ({exc}). Falling back to local thread pool.")

    logger.info(f"Dispatching image task {job_id} asynchronously via local background thread pool.")
    _EXECUTOR.submit(
        run_image_processing_sync,
        job_id, inspection_id, file_id, file_path, user_id, road_importance
    )

def dispatch_video_task(
    job_id: str,
    inspection_id: int,
    file_id: int,
    file_path: str,
    user_id: int,
    road_importance: str = "Medium",
    frame_interval: int = 3
):
    """
    Dispatches video processing task to Celery + Redis if available.
    Otherwise immediately executes asynchronously via local ThreadPoolExecutor.
    """
    if is_redis_available():
        try:
            process_video_celery_task.delay(
                job_id, inspection_id, file_id, file_path, user_id, road_importance, frame_interval
            )
            logger.info(f"Dispatched video task {job_id} to Celery + Redis queue.")
            return
        except Exception as exc:
            logger.warning(f"Celery dispatch failed ({exc}). Falling back to local thread pool.")

    logger.info(f"Dispatching video task {job_id} asynchronously via local background thread pool.")
    _EXECUTOR.submit(
        run_video_processing_sync,
        job_id, inspection_id, file_id, file_path, user_id, road_importance, frame_interval
    )
