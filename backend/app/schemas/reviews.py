from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PendingReviewItem(BaseModel):
    review_id: int
    case_id: str
    customer_name: str
    requested_product_type: str
    previous_decision: str | None
    risk_score: float | None
    risk_level: str | None
    fairness_flag_count: int
    created_at: datetime


class PendingReviewResponse(BaseModel):
    items: list[PendingReviewItem]
    total: int


class ReviewDecisionRequest(BaseModel):
    reviewer_name: str = Field(min_length=2, max_length=128)
    decision: Literal["APPROVE", "REJECT"]
    note: str = Field(min_length=5, max_length=4000)
    override_reason: str = Field(min_length=5, max_length=4000)


class ReviewDecisionResponse(BaseModel):
    review_id: int
    case_id: str
    final_decision: str
    review_status: str
    reviewer_name: str
    reviewed_at: datetime
