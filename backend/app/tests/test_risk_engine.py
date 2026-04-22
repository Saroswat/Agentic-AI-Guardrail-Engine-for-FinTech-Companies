from app.schemas.cases import CaseSubmission
from app.services.intake_service import normalize_case_submission
from app.services.risk_engine import compute_risk


def make_submission(**overrides) -> CaseSubmission:
    payload = {
        "applicant_name": "Risk Test",
        "customer_id": "CUST-R-1",
        "age": 37,
        "annual_income": 120000,
        "monthly_income": 10000,
        "loan_amount": 160000,
        "existing_debt": 600,
        "monthly_obligations": 1200,
        "credit_score": 760,
        "employment_status": "Full Time",
        "years_employed": 8,
        "country": "United Kingdom",
        "region": "London",
        "transaction_amount": 5500,
        "transaction_type": "Bank Transfer",
        "purpose": "Property purchase",
        "requested_product_type": "Residential Mortgage",
        "model_recommendation": "APPROVE",
        "model_confidence": 0.9,
        "evidence_completeness_score": 0.92,
        "supporting_evidence_text": "Complete package of supporting evidence and tax verification.",
        "agent_explanation": "Complete supporting evidence and resilient affordability profile.",
        "explanation_mode": "deterministic",
    }
    payload.update(overrides)
    return CaseSubmission(**payload)


def test_risk_engine_scores_risky_case_higher_than_safe_case():
    safe_normalized, safe_derived, _ = normalize_case_submission(make_submission())
    risky_normalized, risky_derived, _ = normalize_case_submission(
        make_submission(
            credit_score=590,
            existing_debt=1800,
            monthly_obligations=2600,
            transaction_amount=36000,
            transaction_type="International Wire",
            model_confidence=0.52,
            evidence_completeness_score=0.46,
            supporting_evidence_text="Thin evidence.",
        )
    )

    safe = compute_risk(safe_normalized, safe_derived)
    risky = compute_risk(risky_normalized, risky_derived)

    assert risky["overall_score"] > safe["overall_score"]
    assert risky["risk_level"] in {"High", "Critical"}
    assert safe["risk_level"] in {"Low", "Medium"}

