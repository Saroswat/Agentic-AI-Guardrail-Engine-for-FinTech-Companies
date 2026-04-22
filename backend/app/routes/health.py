from datetime import datetime

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "service": settings.project_name,
        "subtitle": settings.project_subtitle,
        "timestamp": datetime.utcnow().isoformat(),
    }
