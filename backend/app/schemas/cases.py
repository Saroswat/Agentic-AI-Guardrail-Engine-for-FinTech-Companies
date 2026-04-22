from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


DecisionType = Literal["APPROVE", "REJECT", "ESCALATE TO HUMAN REVIEW"]


class CaseSubmission(BaseModel):
    applicant_name: str = Field(min_length=2, max_length=255)
    customer_id: str = Field(min_length=2, max_length=64)
    age: int = Field(ge=18, le=100)
    annual_income: float = Field(ge=0)
    monthly_income: float = Field(ge=0)
    loan_amount: float = Field(ge=0)
    existing_debt: float = Field(ge=0)
    monthly_obligations: float = Field(ge=0)
    credit_score: int = Field(ge=300, le=850)
    employment_status: str = Field(min_length=2, max_length=64)
    years_employed: float = Field(ge=0, le=60)
    country: str = Field(min_length=2, max_length=64)
    region: str = Field(min_length=2, max_length=64)
    transaction_amount: float = Field(ge=0)
    transaction_type: str = Field(min_length=2, max_length=64)
    purpose: str = Field(min_length=2, max_length=255)
    requested_product_type: str = Field(min_length=2, max_length=128)
    model_recommendation: Literal["APPROVE", "REJECT", "ESCALATE TO HUMAN REVIEW"]
    model_confidence: float = Field(ge=0, le=1)
    evidence_completeness_score: float = Field(ge=0, le=1)
    supporting_evidence_text: str = Field(default="", max_length=4000)
    agent_explanation: str | None = Field(default=None, max_length=4000)
    explanation_mode: Literal["deterministic", "simulated_agentic"] = "deterministic"


class CaseCreateResponse(BaseModel):
    case_id: str
    status: str
    created_at: datetime


class PolicyResultView(BaseModel):
    rule_name: str
    description: str
    severity: str
    threshold: float
    rule_type: str
    version: str
    outcome: str
    triggered: bool
    details: dict

    model_config = ConfigDict(from_attributes=True)


class RiskResultView(BaseModel):
    overall_score: float
    risk_level: str
    credit_risk: float
    debt_to_income_risk: float
    transaction_anomaly_risk: float
    evidence_weakness_risk: float
    model_confidence_penalty: float
    breakdown: dict

    model_config = ConfigDict(from_attributes=True)


class GovernanceFlagView(BaseModel):
    flag_name: str
    category: str
    severity: str
    requires_human_review: bool
    details: str
    context: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogView(BaseModel):
    event_type: str
    actor: str
    summary: str
    details_json: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HumanReviewView(BaseModel):
    id: int
    review_status: str
    reviewer_name: str | None
    decision: str | None
    note: str | None
    override_reason: str | None
    previous_decision: str | None
    reviewed_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CaseInputSnapshot(BaseModel):
    raw_payload: dict
    normalized_payload: dict
    derived_fields: dict

    model_config = ConfigDict(from_attributes=True)


class CaseListItem(BaseModel):
    case_id: str
    customer_name: str
    customer_id: str
    requested_product_type: str
    transaction_type: str
    model_recommendation: str
    final_decision: str | None
    case_status: str
    risk_score: float | None
    risk_level: str | None
    overall_confidence: float | None
    policy_version_used: str | None
    requires_human_review: bool
    was_escalated: bool
    fairness_flag_count: int
    created_at: datetime
    evaluated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class CaseListResponse(BaseModel):
    items: list[CaseListItem]
    total: int


class CaseDetailResponse(BaseModel):
    case_id: str
    customer_name: str
    customer_id: str
    requested_product_type: str
    transaction_type: str
    model_recommendation: str
    model_confidence: float
    evidence_completeness_score: float
    explanation_mode: str
    worker_summary: str | None
    final_decision: str | None
    case_status: str
    risk_score: float | None
    risk_level: str | None
    overall_confidence: float | None
    policy_version_used: str | None
    governance_status: str
    requires_human_review: bool
    was_escalated: bool
    fairness_flag_count: int
    reviewer_note: str | None
    override_reason: str | None
    final_explanation: str | None
    deterministic_explanation: str | None
    simulated_agentic_explanation: str | None
    top_risk_factors: list[dict] | None
    blocker_rules: list[dict] | None
    created_at: datetime
    updated_at: datetime
    evaluated_at: datetime | None
    case_input: CaseInputSnapshot
    policy_results: list[PolicyResultView]
    risk_result: RiskResultView | None
    governance_flags: list[GovernanceFlagView]
    audit_logs: list[AuditLogView]
    human_reviews: list[HumanReviewView]

    model_config = ConfigDict(from_attributes=True)


class EvaluateCaseResponse(BaseModel):
    case_id: str
    final_decision: DecisionType
    case_status: str
    risk_score: float
    risk_level: str
    policy_version_used: str
    requires_human_review: bool
    explanation: str


class AuditExportResponse(BaseModel):
    case_id: str
    format: Literal["json", "txt"]
    path: str
