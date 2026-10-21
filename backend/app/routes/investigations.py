import hashlib
import os
import time
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.encoders import jsonable_encoder
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.auth import current_account, issue_session, password_matches, require_roles
from app.core.database import get_db
from app.models import Case
from app.models.investigation import Account, EvidenceDocument, Investigation, InvestigationEvent, InvestigationReview, LoginSession
from app.schemas.investigation import DocumentRequest, LoginRequest, ReviewRequest, StartRequest
from app.services.investigation_engine import digest, event
from app.services.policy_engine import get_active_policy_version

router = APIRouter(tags=["investigations"])
# Per-process throttle supplements a production reverse-proxy rate limit.
_login_attempts: dict[str, list[float]] = {}


@router.post("/auth/login")
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    key = request.client.host if request.client else "unknown"
    now = time.monotonic()
    attempts = [x for x in _login_attempts.get(key, []) if x > now - 60]
    if len(attempts) >= 10:
        raise HTTPException(429, "Too many attempts. Try again in a minute.")
    _login_attempts[key] = [*attempts, now]
    account = db.scalar(select(Account).where(Account.username == payload.username))
    if not account or not account.active or not password_matches(payload.password, account.password_hash):
        raise HTTPException(401, "Incorrect username or password.")
    token = issue_session(db, account)
    response.set_cookie("guardrail_session", token, httponly=True, secure=os.getenv("APP_ENV") == "production", samesite="lax", max_age=28800, path="/")
    return {"username": account.username, "role": account.role}


@router.get("/auth/me")
def me(account: Account = Depends(current_account)):
    return {"username": account.username, "role": account.role}


@router.post("/auth/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = hashlib.sha256(request.cookies.get("guardrail_session", "").encode()).hexdigest()
    session = db.get(LoginSession, token)
    if session:
        db.delete(session)
        db.commit()
    response.delete_cookie("guardrail_session", path="/")
    return {"ok": True}


@router.get("/investigations/config")
def config(account: Account = Depends(current_account)):
    return {"live_available": bool(os.getenv("OPENAI_API_KEY") and os.getenv("OPENAI_MODEL")), "model": os.getenv("OPENAI_MODEL", "Not configured")}


@router.get("/evidence")
def documents(db: Session = Depends(get_db), account: Account = Depends(current_account)):
    return [{"id": d.id, "title": d.title, "kind": d.kind, "digest": d.digest, "created_at": d.created_at} for d in db.scalars(select(EvidenceDocument).order_by(EvidenceDocument.created_at.desc()).limit(100))]


@router.post("/evidence", status_code=201)
def add_document(payload: DocumentRequest, db: Session = Depends(get_db), account: Account = Depends(require_roles("admin"))):
    # Policies are global; transaction evidence is captured from the selected case only.
    if payload.kind != "policy":
        raise HTTPException(422, "Only policy documents can be uploaded globally. Transaction facts belong in a case.")
    checksum = digest(payload.model_dump())
    existing = db.scalar(select(EvidenceDocument).where(EvidenceDocument.digest == checksum))
    if existing:
        return {"id": existing.id, "digest": existing.digest}
    doc = EvidenceDocument(**payload.model_dump(), digest=checksum, created_by=account.username)
    db.add(doc)
    db.commit()
    return {"id": doc.id, "digest": checksum}


@router.get("/investigations")
def list_runs(db: Session = Depends(get_db), account: Account = Depends(current_account)):
    return [{"id": r.id, "case_id": r.case_id, "status": r.status, "provider": r.provider, "created_at": r.created_at, "created_by": r.created_by} for r in db.scalars(select(Investigation).order_by(Investigation.created_at.desc()).limit(100))]


@router.post("/investigations", status_code=202)
def start_run(payload: StartRequest, db: Session = Depends(get_db), account: Account = Depends(require_roles("analyst", "admin"))):
    if not db.scalar(select(Case).where(Case.case_id == payload.case_id)):
        raise HTTPException(404, "Case not found.")
    if payload.provider == "openai" and not (os.getenv("OPENAI_API_KEY") and os.getenv("OPENAI_MODEL")):
        raise HTTPException(422, "Live provider is not configured.")
    active = db.scalar(select(func.count()).select_from(Investigation).where(Investigation.status.in_(["queued", "running"])))
    if active >= 20:
        raise HTTPException(429, "Investigation queue is full; wait for existing runs.")
    run = Investigation(**payload.model_dump(), created_by=account.username)
    db.add(run)
    db.flush()
    event(db, run, "run_queued", {"objective": run.objective}, account.username)
    db.commit()
    return {"id": run.id, "status": run.status}


def get_run(db: Session, run_id: str) -> Investigation:
    run = db.get(Investigation, run_id)
    if not run:
        raise HTTPException(404, "Investigation not found.")
    return run


@router.get("/investigations/{run_id}")
def detail(run_id: str, db: Session = Depends(get_db), account: Account = Depends(current_account)):
    run = get_run(db, run_id)
    return {"id": run.id, "case_id": run.case_id, "status": run.status, "provider": run.provider,
            "objective": run.objective, "created_by": run.created_by, "revision": run.revision,
            "attempts": run.attempts, "brief": run.brief, "snapshot": run.snapshot, "proposal_hash": run.proposal_hash,
            "error": run.error, "feedback": run.feedback, "created_at": run.created_at, "updated_at": run.updated_at,
            "events": [{"id": e.id, "kind": e.kind, "actor": e.actor, "details": e.details, "created_at": e.created_at} for e in db.scalars(select(InvestigationEvent).where(InvestigationEvent.investigation_id == run_id).order_by(InvestigationEvent.id))],
            "reviews": [{"reviewer": r.reviewer, "decision": r.decision, "note": r.note, "proposal_hash": r.proposal_hash, "created_at": r.created_at} for r in db.scalars(select(InvestigationReview).where(InvestigationReview.investigation_id == run_id).order_by(InvestigationReview.created_at))]}


@router.get("/investigations/{run_id}/export")
def export(run_id: str, db: Session = Depends(get_db), account: Account = Depends(current_account)):
    from fastapi.responses import JSONResponse
    result = detail(run_id, db, account)
    return JSONResponse(jsonable_encoder(result), headers={"Content-Disposition": f'attachment; filename="investigation-{run_id}.json"'})


@router.post("/investigations/{run_id}/retry", status_code=202)
def retry(run_id: str, db: Session = Depends(get_db), account: Account = Depends(require_roles("analyst", "admin"))):
    get_run(db, run_id)
    result = db.execute(update(Investigation).where(Investigation.id == run_id, Investigation.status == "failed", Investigation.attempts < 3).values(status="queued", error=None, updated_at=datetime.utcnow()))
    if result.rowcount != 1:
        raise HTTPException(409, "Only failed investigations with fewer than three attempts can retry.")
    event(db, db.get(Investigation, run_id), "retry_requested", {}, account.username)
    db.commit()
    return {"status": "queued"}


@router.post("/investigations/{run_id}/review")
def review(run_id: str, payload: ReviewRequest, db: Session = Depends(get_db), account: Account = Depends(require_roles("reviewer", "admin"))):
    run = get_run(db, run_id)
    if run.created_by == account.username:
        raise HTTPException(403, "A different person must review this investigation.")
    if payload.decision == "approve" and run.snapshot and run.snapshot["policy_version"] != get_active_policy_version(db).version:
        raise HTTPException(409, "The active policy changed. Start a new investigation to capture the current policy.")
    status = {"approve": "approved", "reject": "rejected", "request_changes": "queued"}[payload.decision]
    values = {"status": status, "updated_at": datetime.utcnow()}
    if payload.decision == "request_changes":
        values.update(revision=run.revision + 1, brief=None, proposal_hash=None, feedback=payload.note, attempts=0)
    result = db.execute(update(Investigation).where(Investigation.id == run_id, Investigation.status == "awaiting_review", Investigation.proposal_hash == payload.proposal_hash).values(**values))
    if result.rowcount != 1:
        raise HTTPException(409, "The proposal changed or was already reviewed. Refresh the investigation.")
    db.add(InvestigationReview(investigation_id=run_id, proposal_hash=payload.proposal_hash, decision=payload.decision, reviewer=account.username, note=payload.note))
    event(db, run, "human_review", {"decision": payload.decision, "note": payload.note, "proposal_hash": payload.proposal_hash}, account.username)
    # Approval records an analyst workflow outcome only; no financial side effects.
    db.commit()
    return {"status": status}
