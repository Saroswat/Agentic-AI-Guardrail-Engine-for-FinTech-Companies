from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.dashboard import DashboardChartsResponse, DashboardSummaryResponse
from app.services.analytics_service import get_dashboard_charts, get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummaryResponse:
    return DashboardSummaryResponse(**get_dashboard_summary(db))


@router.get("/charts", response_model=DashboardChartsResponse)
def dashboard_charts(db: Session = Depends(get_db)) -> DashboardChartsResponse:
    return DashboardChartsResponse(**get_dashboard_charts(db))

