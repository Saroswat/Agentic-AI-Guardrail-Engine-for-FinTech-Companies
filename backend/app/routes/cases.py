from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Case
from app.schemas.cases import (
    CaseCreateResponse,
    CaseDetailResponse,
    CaseListItem,
    CaseListResponse,
    CaseSubmission,
    EvaluateCaseResponse,
)
from app.services.evaluation_service import evaluate_case, get_case_or_raise
from app.services.intake_service import create_case

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("", response_model=CaseListResponse)
def list_cases(
    decision: str | None = Query(default=None),
    risk_level: str | None = Query(default=None),
    escalated: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
) -> CaseListResponse:
    stmt = select(Case).order_by(Case.created_at.desc())
    filters = []
    if decision:
        filters.append(Case.final_decision == decision)
    if risk_level:
        filters.append(Case.risk_level == risk_level)
    if escalated is not None:
        filters.append(Case.was_escalated.is_(escalated))
    if search:
        filters.append((Case.customer_name.ilike(f"%{search}%")) | (Case.case_id.ilike(f"%{search}%")))
    if start_date:
        filters.append(Case.created_at >= start_date)
    if end_date:
        filters.append(Case.created_at <= end_date)
    if filters:
        stmt = stmt.where(and_(*filters))

    items = list(db.execute(stmt).scalars().all())
    return CaseListResponse(items=[CaseListItem.model_validate(item) for item in items], total=len(items))


@router.post("", response_model=CaseCreateResponse, status_code=201)
def create_case_route(payload: CaseSubmission, db: Session = Depends(get_db)) -> CaseCreateResponse:
    case = create_case(db, payload)
    return CaseCreateResponse(case_id=case.case_id, status=case.case_status, created_at=case.created_at)


@router.get("/{case_id}", response_model=CaseDetailResponse)
def get_case(case_id: str, db: Session = Depends(get_db)) -> CaseDetailResponse:
    try:
        case = get_case_or_raise(db, case_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return CaseDetailResponse.model_validate(case)


@router.post("/{case_id}/evaluate", response_model=EvaluateCaseResponse)
def evaluate_case_route(case_id: str, db: Session = Depends(get_db)) -> EvaluateCaseResponse:
    try:
        case = evaluate_case(db, case_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return EvaluateCaseResponse(
        case_id=case.case_id,
        final_decision=case.final_decision,
        case_status=case.case_status,
        risk_score=case.risk_score or 0,
        risk_level=case.risk_level or "Unknown",
        policy_version_used=case.policy_version_used or "Unknown",
        requires_human_review=case.requires_human_review,
        explanation=case.final_explanation or "",
    )
