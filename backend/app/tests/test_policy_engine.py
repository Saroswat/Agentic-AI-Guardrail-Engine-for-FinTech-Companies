from app.schemas.cases import CaseSubmission
from app.services.intake_service import normalize_case_submission
from app.services.policy_engine import evaluate_policy_rules
from app.utils.demo_policies import build_policy_versions_seed


def make_submission(**overrides) -> CaseSubmission:
    payload = {
        "applicant_name": "Test Applicant",
        "customer_id": "CUST-T-1",
        "age": 35,
        "annual_income": 84000,
        "monthly_income": 7000,
        "loan_amount": 140000,
        "existing_debt": 700,
        "monthly_obligations": 1400,
        "credit_score": 720,
        "employment_status": "Full Time",
        "years_employed": 6,
        "country": "United Kingdom",
        "region": "London",
        "transaction_amount": 6000,
        "transaction_type": "Bank Transfer",
        "purpose": "Home purchase",
        "requested_product_type": "Residential Mortgage",
        "model_recommendation": "APPROVE",
        "model_confidence": 0.82,
        "evidence_completeness_score": 0.88,
        "supporting_evidence_text": "Verified payslips, tax records, bank statements, and signed affordability disclosure.",
        "agent_explanation": "Stable profile with complete documentation.",
        "explanation_mode": "deterministic",
    }
    payload.update(overrides)
    return CaseSubmission(**payload)


def active_policy():
    return next(policy for policy in build_policy_versions_seed() if policy["is_active"])


def test_policy_engine_rejects_low_credit():
    submission = make_submission(credit_score=540)
    normalized, derived, _ = normalize_case_submission(submission)
    policy = active_policy()
    result = evaluate_policy_rules(normalized, derived, policy["rules_json"], policy["version"])

    credit_rule = next(item for item in result["results"] if item["rule_name"] == "CREDIT_SCORE_MIN")
    assert credit_rule["triggered"] is True
    assert credit_rule["outcome"] == "REJECT"


def test_policy_engine_escalates_risky_country_combo():
    submission = make_submission(
        country="Koranda",
        requested_product_type="Trade Finance",
        transaction_type="International Wire",
    )
    normalized, derived, _ = normalize_case_submission(submission)
    policy = active_policy()
    result = evaluate_policy_rules(normalized, derived, policy["rules_json"], policy["version"])

    aml_rule = next(item for item in result["results"] if item["rule_name"] == "RISKY_COUNTRY_PRODUCT_COMBO")
    assert aml_rule["triggered"] is True
    assert aml_rule["outcome"] == "ESCALATE"

