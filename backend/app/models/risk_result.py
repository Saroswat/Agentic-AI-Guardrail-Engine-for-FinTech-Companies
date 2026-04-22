from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RiskResult(Base):
    __tablename__ = "risk_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_pk: Mapped[int] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), unique=True, index=True)
    overall_score: Mapped[float] = mapped_column(Float)
    risk_level: Mapped[str] = mapped_column(String(32))
    credit_risk: Mapped[float] = mapped_column(Float)
    debt_to_income_risk: Mapped[float] = mapped_column(Float)
    transaction_anomaly_risk: Mapped[float] = mapped_column(Float)
    evidence_weakness_risk: Mapped[float] = mapped_column(Float)
    model_confidence_penalty: Mapped[float] = mapped_column(Float)
    breakdown: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="risk_result")

