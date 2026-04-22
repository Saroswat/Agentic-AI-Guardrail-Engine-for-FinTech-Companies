from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Case, HumanReview
from app.schemas.reviews import ReviewDecisionRequest
from app.services.audit_engine import record_audit_event


def get_pending_reviews(db: Session) -> list[HumanReview]:
    stmt = (
        select(HumanReview)
        .where(HumanReview.review_status == "pending")
        .options(selectinload(HumanReview.case))
        .order_by(HumanReview.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


def apply_review_decision(db: Session, review_id: int, payload: ReviewDecisionRequest) -> HumanReview:
    review = (
        db.execute(
            select(HumanReview)
            .where(HumanReview.id == review_id)
            .options(
                selectinload(HumanReview.case).selectinload(Case.policy_results),
                selectinload(HumanReview.case).selectinload(Case.governance_flags),
                selectinload(HumanReview.case).selectinload(Case.audit_logs),
                selectinload(HumanReview.case).selectinload(Case.case_input),
                selectinload(HumanReview.case).selectinload(Case.human_reviews),
                selectinload(HumanReview.case).selectinload(Case.risk_result),
            )
        )
        .scalar_one_or_none()
    )
    if review is None:
        raise ValueError("Pending review not found.")

    case = review.case
    review.review_status = "completed"
    review.reviewer_name = payload.reviewer_name
    review.decision = payload.decision
    review.note = payload.note
    review.override_reason = payload.override_reason
    review.reviewed_at = datetime.utcnow()

    case.final_decision = payload.decision
    case.case_status = "review_completed"
    case.requires_human_review = False
    case.was_escalated = True
    case.reviewer_note = payload.note
    case.override_reason = payload.override_reason
    case.governance_status = "Human review completed"
    case.updated_at = datetime.utcnow()

    record_audit_event(
        db,
        case,
        event_type="HUMAN_REVIEW_DECISION",
        actor=payload.reviewer_name,
        summary=f"Human reviewer issued {payload.decision}.",
        details={
            "note": payload.note,
            "override_reason": payload.override_reason,
            "review_id": review.id,
        },
    )

    db.commit()
    db.refresh(review)
    return review
