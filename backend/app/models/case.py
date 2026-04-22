from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    case_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(255))
    customer_id: Mapped[str] = mapped_column(String(64), index=True)
    requested_product_type: Mapped[str] = mapped_column(String(128))
    transaction_type: Mapped[str] = mapped_column(String(128))
    model_recommendation: Mapped[str] = mapped_column(String(32))
    model_confidence: Mapped[float] = mapped_column(Float)
    evidence_completeness_score: Mapped[float] = mapped_column(Float)
    explanation_mode: Mapped[str] = mapped_column(String(32), default="deterministic")
    worker_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    final_decision: Mapped[str | None] = mapped_column(String(48), nullable=True)
    case_status: Mapped[str] = mapped_column(String(48), default="draft")
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_level: Mapped[str | None] = mapped_column(String(32), nullable=True)
    overall_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    policy_version_used: Mapped[str | None] = mapped_column(String(32), nullable=True)
    governance_status: Mapped[str] = mapped_column(String(64), default="Awaiting evaluation")
    requires_human_review: Mapped[bool] = mapped_column(Boolean, default=False)
    was_escalated: Mapped[bool] = mapped_column(Boolean, default=False)
    fairness_flag_count: Mapped[int] = mapped_column(Integer, default=0)
    reviewer_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    override_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    final_explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    deterministic_explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    simulated_agentic_explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    top_risk_factors: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    blocker_rules: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    evaluated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    case_input = relationship("CaseInput", back_populates="case", uselist=False, cascade="all, delete-orphan")
    policy_results = relationship("PolicyResult", back_populates="case", cascade="all, delete-orphan")
    risk_result = relationship("RiskResult", back_populates="case", uselist=False, cascade="all, delete-orphan")
    governance_flags = relationship("GovernanceFlag", back_populates="case", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="case", cascade="all, delete-orphan")
    human_reviews = relationship("HumanReview", back_populates="case", cascade="all, delete-orphan")
