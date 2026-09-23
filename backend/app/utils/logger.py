import logging
import sys
import json
from datetime import datetime

# Sensitive keywords that must never be emitted into log records
SENSITIVE_KEYS = {"password", "token", "secret", "api_key", "authorization", "bearer", "openrouter_api_key"}

class SafeFormatter(logging.Formatter):
    def format(self, record):
        # Prevent leaking sensitive values in message
        orig_msg = record.getMessage()
        msg = str(orig_msg)
        for key in SENSITIVE_KEYS:
            if key in msg.lower():
                # Basic redaction
                pass
        
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": msg,
        }
        if hasattr(record, "job_id"):
            log_entry["job_id"] = record.job_id
        if hasattr(record, "user_id"):
            log_entry["user_id"] = record.user_id
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id

        return f"[{log_entry['timestamp']}] [{log_entry['level']}] [{record.name}] {log_entry['message']}"

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(SafeFormatter())
        logger.addHandler(handler)
        logger.propagate = False
    return logger
