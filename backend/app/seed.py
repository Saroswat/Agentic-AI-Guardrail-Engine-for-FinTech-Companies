from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Case, PolicyVersion
from app.schemas.cases import CaseSubmission
from app.services.evaluation_service import evaluate_case
from app.services.intake_service import create_case
from app.services.review_service import apply_review_decision
from app.schemas.reviews import ReviewDecisionRequest
from app.utils.demo_policies import build_policy_versions_seed


DEMO_CASES = [
    {
        "applicant_name": "Ava Sterling",
        "customer_id": "CUST-0001",
        "age": 36,
        "annual_income": 112000,
        "monthly_income": 9333,
        "loan_amount": 240000,
        "existing_debt": 900,
        "monthly_obligations": 1800,
        "credit_score": 762,
        "employment_status": "Full Time",
        "years_employed": 8,
        "country": "United Kingdom",
        "region": "London",
        "transaction_amount": 8500,
        "transaction_type": "Bank Transfer",
        "purpose": "Home purchase",
        "requested_product_type": "Residential Mortgage",
        "model_recommendation": "APPROVE",
        "model_confidence": 0.89,
        "evidence_completeness_score": 0.92,
        "supporting_evidence_text": "Verified payslips, tax filings, employer confirmation, source-of-funds evidence, and signed affordability disclosure attached in the case record.",
        "agent_explanation": "Stable income profile, low affordability stress, and complete documentation support approval.",
    },
    {
        "applicant_name": "Leo Carter",
        "customer_id": "CUST-0002",
        "age": 29,
        "annual_income": 54000,
        "monthly_income": 4500,
        "loan_amount": 190000,
        "existing_debt": 700,
        "monthly_obligations": 900,
        "credit_score": 541,
        "employment_status": "Full Time",
        "years_employed": 3,
        "country": "United Kingdom",
        "region": "Manchester",
        "transaction_amount": 2800,
        "transaction_type": "Bank Transfer",
        "purpose": "Debt consolidation",
        "requested_product_type": "Personal Loan",
        "model_recommendation": "APPROVE",
        "model_confidence": 0.81,
        "evidence_completeness_score": 0.88,
        "supporting_evidence_text": "Income verification and debt schedule supplied.",
        "agent_explanation": "The model favors approval on recent income growth despite weaker credit profile.",
    },
    {
        "applicant_name": "Nina Rahman",
        "customer_id": "CUST-0003",
        "age": 42,
        "annual_income": 78000,
        "monthly_income": 6500,
        "loan_amount": 125000,
        "existing_debt": 1200,
        "monthly_obligations": 2100,
        "credit_score": 682,
        "employment_status": "Contract",
        "years_employed": 4,
        "country": "United Kingdom",
        "region": "Birmingham",
        "transaction_amount": 6400,
        "transaction_type": "Bank Transfer",
        "purpose": "Business expansion",
        "requested_product_type": "SME Working Capital",
        "model_recommendation": "APPROVE",
        "model_confidence": 0.73,
        "evidence_completeness_score": 0.79,
        "supporting_evidence_text": "Signed contracts, current bank statements, management accounts, and utilization notes included.",
        "agent_explanation": "Business cash flow is adequate but monthly commitments are elevated.",
    },
    {
        "applicant_name": "Mason Patel",
        "customer_id": "CUST-0004",
        "age": 31,
        "annual_income": 69000,
        "monthly_income": 5750,
        "loan_amount": 98000,
        "existing_debt": 650,
        "monthly_obligations": 950,
        "credit_score": 711,
        "employment_status": "Full Time",
        "years_employed": 5,
        "country": "United Kingdom",
        "region": "Leeds",
        "transaction_amount": 5400,
        "transaction_type": "Bank Transfer",
        "purpose": "Vehicle fleet purchase",
        "requested_product_type": "Commercial Credit",
        "model_recommendation": "APPROVE",
        "model_confidence": 0.51,
        "evidence_completeness_score": 0.84,
        "supporting_evidence_text": "The file contains current statements, purchase order schedule, and broker quotes.",
        "agent_explanation": "Credit profile is acceptable but the recommendation confidence is low.",
    },
    {
        "applicant_name": "Sofia Nguyen",
        "customer_id": "CUST-0005",
        "age": 38,
        "annual_income": 86000,
        "monthly_income": 7166,
        "loan_amount": 155000,
        "existing_debt": 800,
        "monthly_obligations": 1300,
        "credit_score": 724,
        "employment_status": "Full Time",
        "years_employed": 6,
        "country": "United Kingdom",
        "region": "Bristol",
        "transaction_amount": 3200,
        "transaction_type": "Bank Transfer",
        "purpose": "Home renovation",
        "requested_product_type": "Secured Loan",
        "model_recommendation": "APPROVE",
        "model_confidence": 0.82,
        "evidence_completeness_score": 0.42,
        "supporting_evidence_text": "Invoices pending.",
        "agent_explanation": "Supporting evidence package is incomplete and should be clarified before execution.",
    },
    {
        "applicant_name": "Ethan Moretti",
        "customer_id": "CUST-0006",
        "age": 47,
        "annual_income": 92000,
        "monthly_income": 7666,
        "loan_amount": 210000,
        "existing_debt": 600,
        "monthly_obligations": 1000,
        "credit_score": 695,
        "employment_status": "Self Employed",
        "years_employed": 9,
        "country": "Koranda",
        "region": "North Corridor",
        "transaction_amount": 48000,
        "transaction_type": "International Wire",
        "purpose": "Supplier prepayment",
        "requested_product_type": "Trade Finance",
        "model_recommendation": "APPROVE",
        "model_confidence": 0.78,
        "evidence_completeness_score": 0.76,
        "supporting_evidence_text": "Cross-border payment request, invoice pack, board approval memo, and supplier history included.",
        "agent_explanation": "Exposure is material and transaction pattern should be scrutinized before release.",
    },
    {
        "applicant_name": "Olivia Grant",
        "customer_id": "CUST-0007",
        "age": 79,
        "annual_income": 64000,
        "monthly_income": 5333,
        "loan_amount": 82000,
        "existing_debt": 500,
        "monthly_obligations": 1400,
        "credit_score": 607,
        "employment_status": "Retired",
        "years_employed": 22,
        "country": "United Kingdom",
        "region": "Edinburgh",
        "transaction_amount": 3100,
        "transaction_type": "Bank Transfer",
        "purpose": "Bridge financing",
        "requested_product_type": "Bridge Loan",
        "model_recommendation": "REJECT",
        "model_confidence": 0.68,
        "evidence_completeness_score": 0.74,
        "supporting_evidence_text": "The credit file contains pension statements, property schedule, and current liabilities.",
        "agent_explanation": "Older applicant with near-threshold affordability. Recommend manual fairness check.",
    },
    {
        "applicant_name": "Daniel Brooks",
        "customer_id": "CUST-0008",
        "age": 34,
        "annual_income": 118000,
        "monthly_income": 9833,
        "loan_amount": 310000,
        "existing_debt": 1100,
        "monthly_obligations": 1500,
        "credit_score": 565,
        "employment_status": "Full Time",
        "years_employed": 7,
        "country": "United Kingdom",
        "region": "London",
        "transaction_amount": 9200,
        "transaction_type": "Bank Transfer",
        "purpose": "Investment property acquisition",
        "requested_product_type": "Investment Loan",
        "model_recommendation": "APPROVE",
        "model_confidence": 0.91,
        "evidence_completeness_score": 0.89,
        "supporting_evidence_text": "Detailed rental projections, tax returns, payslips, and down-payment source documents included.",
        "agent_explanation": "Strong income and collateral profile favor approval despite weaker bureau data.",
    },
    {
        "applicant_name": "Grace Holloway",
        "customer_id": "CUST-0009",
        "age": 27,
        "annual_income": 72000,
        "monthly_income": 6000,
        "loan_amount": 142000,
        "existing_debt": 800,
        "monthly_obligations": 1650,
        "credit_score": 663,
        "employment_status": "Full Time",
        "years_employed": 2,
        "country": "United Kingdom",
        "region": "Cardiff",
        "transaction_amount": 5400,
        "transaction_type": "Bank Transfer",
        "purpose": "Medical practice buy-in",
        "requested_product_type": "Professional Loan",
        "model_recommendation": "APPROVE",
        "model_confidence": 0.61,
        "evidence_completeness_score": 0.67,
        "supporting_evidence_text": "Income, partnership agreement, and expected receivables included but employment track record is short.",
        "agent_explanation": "Borderline case that may need human judgment on sustainability and override rationale.",
    },
]


def seed_demo_data(db: Session) -> None:
    existing_policy = db.execute(select(PolicyVersion.id)).first()
    if existing_policy is None:
        for policy in build_policy_versions_seed():
            db.add(PolicyVersion(**policy))
        db.commit()

    existing_cases = db.execute(select(Case.id)).first()
    if existing_cases is not None:
        return

    created_case_ids: list[str] = []
    for item in DEMO_CASES:
        submission = CaseSubmission(**item)
        created_case = create_case(db, submission)
        evaluated_case = evaluate_case(db, created_case.case_id)
        created_case_ids.append(evaluated_case.case_id)

    borderline_case_id = created_case_ids[-1]
    pending_review = (
        db.execute(select(Case).where(Case.case_id == borderline_case_id))
        .scalar_one()
    )
    review_record = pending_review.human_reviews[0]
    apply_review_decision(
        db,
        review_record.id,
        ReviewDecisionRequest(
            reviewer_name="Maria Chen",
            decision="APPROVE",
            note="Affordability remains acceptable with documented compensating controls.",
            override_reason="Manual confirmation of secondary income and operating cash reserve.",
        ),
    )

