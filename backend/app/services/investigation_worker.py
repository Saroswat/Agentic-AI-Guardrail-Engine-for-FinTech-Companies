"""A database queue with atomic claims and expiring leases; run as a separate process."""
import logging
import time
from datetime import datetime, timedelta

from sqlalchemy import or_, select, update

from app.core.database import SessionLocal
from app.models.investigation import Investigation
from app.services.evaluation_service import evaluate_case
from app.services.investigation_engine import build_snapshot, demo_brief, digest, event, live_brief, validate_brief

logger = logging.getLogger(__name__)


def process_one() -> bool:
    with SessionLocal() as db:
        now = datetime.utcnow()
        eligible = or_(Investigation.status == "queued", (Investigation.status == "running") & (Investigation.lease_until < now))
        candidate = db.scalar(select(Investigation.id).where(eligible, Investigation.attempts < 3).order_by(Investigation.created_at).limit(1))
        if not candidate:
            db.execute(update(Investigation).where(Investigation.status == "running", Investigation.lease_until < now, Investigation.attempts >= 3).values(status="failed", error="Worker lease expired after three attempts.", updated_at=now))
            db.commit()
            return False
        claimed = db.execute(update(Investigation).where(Investigation.id == candidate, eligible, Investigation.attempts < 3).values(status="running", lease_until=now + timedelta(minutes=6), attempts=Investigation.attempts + 1, started_at=now, updated_at=now))
        db.commit()
        if claimed.rowcount != 1:
            return False
        run = db.get(Investigation, candidate)
        try:
            event(db, run, "run_started", {"attempt": run.attempts, "provider": run.provider, "revision": run.revision})
            if run.snapshot is None:
                evaluate_case(db, run.case_id)
                run.snapshot = build_snapshot(db, run)
                event(db, run, "evidence_captured", {"snapshot_hash": digest(run.snapshot), "evidence_count": len(run.snapshot["evidence"])})
            db.commit()
            brief, usage = (live_brief(db, run, run.snapshot) if run.provider == "openai" else (demo_brief(run.snapshot), {"model": "offline-demo", "total_tokens": 0}))
            parsed = validate_brief(brief, run.snapshot)
            run.brief = parsed.model_dump()
            run.proposal_hash = digest({"brief": run.brief, "snapshot": run.snapshot, "revision": run.revision})
            run.status = "awaiting_review"
            run.error = None
            event(db, run, "proposal_ready", {"proposal_hash": run.proposal_hash, "action": parsed.proposed_action, **usage})
        except Exception as exc:
            db.rollback()
            run = db.get(Investigation, candidate)
            run.status = "failed"
            run.error = str(exc)[:500] if isinstance(exc, ValueError) else "Investigation failed; inspect server logs and retry."
            logger.exception("Investigation %s failed", candidate)
            event(db, run, "run_failed", {"error": run.error})
        run.lease_until = None
        run.updated_at = datetime.utcnow()
        db.commit()
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    while True:
        if not process_one():
            time.sleep(2)
