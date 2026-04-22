from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CaseInput(Base):
    __tablename__ = "case_inputs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_pk: Mapped[int] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), unique=True, index=True)
    raw_payload: Mapped[dict] = mapped_column(JSON)
    normalized_payload: Mapped[dict] = mapped_column(JSON)
    derived_fields: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="case_input")

