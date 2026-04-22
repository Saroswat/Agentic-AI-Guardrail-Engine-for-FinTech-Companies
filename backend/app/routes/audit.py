from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.cases import AuditExportResponse
from app.services.audit_engine import export_case_audit
from app.services.evaluation_service import get_case_or_raise

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/{case_id}/export/json", response_model=AuditExportResponse)
def export_audit_json(case_id: str, db: Session = Depends(get_db)) -> AuditExportResponse:
    try:
        case = get_case_or_raise(db, case_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    path = export_case_audit(case, "json")
    return AuditExportResponse(case_id=case_id, format="json", path=path)


@router.get("/{case_id}/export/txt", response_model=AuditExportResponse)
def export_audit_txt(case_id: str, db: Session = Depends(get_db)) -> AuditExportResponse:
    try:
        case = get_case_or_raise(db, case_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    path = export_case_audit(case, "txt")
    return AuditExportResponse(case_id=case_id, format="txt", path=path)

