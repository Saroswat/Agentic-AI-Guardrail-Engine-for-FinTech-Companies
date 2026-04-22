from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.reviews import PendingReviewItem, PendingReviewResponse, ReviewDecisionRequest, ReviewDecisionResponse
from app.services.review_service import apply_review_decision, get_pending_reviews

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/pending", response_model=PendingReviewResponse)
def pending_reviews(db: Session = Depends(get_db)) -> PendingReviewResponse:
    reviews = get_pending_reviews(db)
    items = [
        PendingReviewItem(
            review_id=review.id,
            case_id=review.case.case_id,
            customer_name=review.case.customer_name,
            requested_product_type=review.case.requested_product_type,
            previous_decision=review.previous_decision,
            risk_score=review.case.risk_score,
            risk_level=review.case.risk_level,
            fairness_flag_count=review.case.fairness_flag_count,
            created_at=review.created_at,
        )
        for review in reviews
    ]
    return PendingReviewResponse(items=items, total=len(items))


@router.post("/{review_id}/decision", response_model=ReviewDecisionResponse)
def review_decision(review_id: int, payload: ReviewDecisionRequest, db: Session = Depends(get_db)) -> ReviewDecisionResponse:
    try:
        review = apply_review_decision(db, review_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return ReviewDecisionResponse(
        review_id=review.id,
        case_id=review.case.case_id,
        final_decision=review.case.final_decision or "UNKNOWN",
        review_status=review.review_status,
        reviewer_name=review.reviewer_name or "",
        reviewed_at=review.reviewed_at or review.created_at,
    )

