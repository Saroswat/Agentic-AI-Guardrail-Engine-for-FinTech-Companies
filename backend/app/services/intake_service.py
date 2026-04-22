from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import AuditLog, Case, CaseInput
from app.schemas.cases import CaseSubmission


def generate_case_id() -> str:
    stamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    suffix = uuid4().hex[:6].upper()
    return f"CSE-{stamp}-{suffix}"


def normalize_case_submission(payload: CaseSubmission) -> tuple[dict, dict, str]:
    data = payload.model_dump()

    if not data["monthly_income"] and data["annual_income"]:
        data["monthly_income"] = round(data["annual_income"] / 12, 2)
    if not data["annual_income"] and data["monthly_income"]:
        data["annual_income"] = round(data["monthly_income"] * 12, 2)

    data["model_recommendation"] = data["model_recommendation"].upper()
    data["employment_status"] = data["employment_status"].strip().title()
    data["country"] = data["country"].strip().title()
    data["region"] = data["region"].strip().title()
    data["transaction_type"] = data["transaction_type"].strip().title()
    data["requested_product_type"] = data["requested_product_type"].strip().title()
    data["supporting_evidence_text"] = data["supporting_evidence_text"].strip()
    if data.get("agent_explanation"):
        data["agent_explanation"] = data["agent_explanation"].strip()

    monthly_income = max(data["monthly_income"], 1)
    annual_income = max(data["annual_income"], 1)
    combined_monthly_obligations = data["existing_debt"] + data["monthly_obligations"]

    derived = {
        "debt_to_income_ratio": round(combined_monthly_obligations / monthly_income, 4),
        "loan_to_income_ratio": round(data["loan_amount"] / annual_income, 4),
        "transaction_to_income_ratio": round(data["transaction_amount"] / monthly_income, 4),
        "evidence_text_length": len(data["supporting_evidence_text"]),
        "combined_monthly_obligations": round(combined_monthly_obligations, 2),
        "intake_timestamp": datetime.utcnow().isoformat(),
    }

    worker_summary = (
        f"{data['applicant_name']} requested {data['requested_product_type']} for "
        f"{data['purpose'].lower()} with a loan amount of ${data['loan_amount']:,.0f}. "
        f"Model recommendation is {data['model_recommendation']} at "
        f"{data['model_confidence'] * 100:.0f}% confidence; credit score is {data['credit_score']} "
        f"and debt-to-income ratio is {derived['debt_to_income_ratio']:.0%}."
    )

    return data, derived, worker_summary


def create_case(db: Session, payload: CaseSubmission) -> Case:
    normalized_payload, derived_fields, worker_summary = normalize_case_submission(payload)
    case = Case(
        case_id=generate_case_id(),
        customer_name=normalized_payload["applicant_name"],
        customer_id=normalized_payload["customer_id"],
        requested_product_type=normalized_payload["requested_product_type"],
        transaction_type=normalized_payload["transaction_type"],
        model_recommendation=normalized_payload["model_recommendation"],
        model_confidence=normalized_payload["model_confidence"],
        evidence_completeness_score=normalized_payload["evidence_completeness_score"],
        explanation_mode=normalized_payload["explanation_mode"],
        worker_summary=worker_summary,
        case_status="intake_completed",
        governance_status="Case intake completed",
    )
    db.add(case)
    db.flush()

    case_input = CaseInput(
        case_pk=case.id,
        raw_payload=payload.model_dump(),
        normalized_payload=normalized_payload,
        derived_fields=derived_fields,
    )
    db.add(case_input)

    audit_log = AuditLog(
        case_pk=case.id,
        event_type="INTAKE",
        actor="worker-agent",
        summary="Case intake completed and normalized.",
        details_json={
            "worker_summary": worker_summary,
            "derived_fields": derived_fields,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )
    db.add(audit_log)
    db.commit()
    db.refresh(case)
    return case

