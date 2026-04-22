from app.models import PolicyVersion
from app.schemas.cases import CaseSubmission
from app.services.evaluation_service import evaluate_case
from app.services.intake_service import create_case
from app.utils.demo_policies import build_policy_versions_seed


def ensure_policies(db_session):
    if db_session.query(PolicyVersion).count() == 0:
        for policy in build_policy_versions_seed():
            db_session.add(PolicyVersion(**policy))
        db_session.commit()


def make_submission(**overrides) -> CaseSubmission:
    payload = {
        "applicant_name": "Escalation Test",
        "customer_id": "CUST-E-1",
        "age": 33,
        "annual_income": 78000,
        "monthly_income": 6500,
        "loan_amount": 120000,
        "existing_debt": 800,
        "monthly_obligations": 1400,
        "credit_score": 705,
        "employment_status": "Full Time",
        "years_employed": 5,
        "country": "United Kingdom",
        "region": "London",
        "transaction_amount": 5000,
        "transaction_type": "Bank Transfer",
        "purpose": "Equipment purchase",
        "requested_product_type": "Commercial Credit",
        "model_recommendation": "APPROVE",
        "model_confidence": 0.82,
        "evidence_completeness_score": 0.86,
        "supporting_evidence_text": "Complete evidence pack with statements, invoices, and signed disclosures.",
        "agent_explanation": "Standard approval profile.",
        "explanation_mode": "deterministic",
    }
    payload.update(overrides)
    return CaseSubmission(**payload)


def test_low_confidence_case_escalates(db_session):
    ensure_policies(db_session)
    case = create_case(db_session, make_submission(model_confidence=0.48))
    evaluated = evaluate_case(db_session, case.case_id)

    assert evaluated.final_decision == "ESCALATE TO HUMAN REVIEW"
    assert evaluated.requires_human_review is True
    assert evaluated.case_status == "pending_human_review"


def test_low_credit_case_rejects(db_session):
    ensure_policies(db_session)
    case = create_case(db_session, make_submission(credit_score=520))
    evaluated = evaluate_case(db_session, case.case_id)

    assert evaluated.final_decision == "REJECT"
    assert evaluated.requires_human_review is False

