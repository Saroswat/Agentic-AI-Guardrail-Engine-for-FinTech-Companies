from __future__ import annotations

from copy import deepcopy


def build_policy_versions_seed() -> list[dict]:
    base_rules = [
        {
            "name": "CREDIT_SCORE_MIN",
            "description": "Reject if the applicant credit score falls below the controlled minimum.",
            "severity": "critical",
            "threshold": 580.0,
            "rule_type": "credit",
            "enabled": True,
        },
        {
            "name": "DEBT_TO_INCOME_MAX",
            "description": "Escalate if debt-to-income exceeds the governed threshold.",
            "severity": "high",
            "threshold": 0.43,
            "rule_type": "affordability",
            "enabled": True,
        },
        {
            "name": "MODEL_CONFIDENCE_MIN",
            "description": "Escalate low-confidence model recommendations.",
            "severity": "high",
            "threshold": 0.55,
            "rule_type": "model_risk",
            "enabled": True,
        },
        {
            "name": "EVIDENCE_COMPLETENESS_MIN",
            "description": "Escalate if evidence completeness is below the minimum guardrail.",
            "severity": "high",
            "threshold": 0.60,
            "rule_type": "evidence",
            "enabled": True,
        },
        {
            "name": "TRANSACTION_INCOME_RATIO_WATCH",
            "description": "Escalate if transaction amount is unusually high relative to monthly income.",
            "severity": "medium",
            "threshold": 2.50,
            "rule_type": "transaction",
            "enabled": True,
        },
        {
            "name": "TRANSACTION_INCOME_RATIO_MAX",
            "description": "Reject if transaction amount is extreme relative to monthly income.",
            "severity": "critical",
            "threshold": 5.00,
            "rule_type": "transaction",
            "enabled": True,
        },
        {
            "name": "EVIDENCE_TEXT_MIN_LENGTH",
            "description": "Escalate if supporting evidence narrative is too short to support the decision.",
            "severity": "medium",
            "threshold": 80.0,
            "rule_type": "evidence",
            "enabled": True,
        },
        {
            "name": "RISKY_COUNTRY_PRODUCT_COMBO",
            "description": "Escalate potentially risky product and country combinations for AML review.",
            "severity": "high",
            "threshold": 1.0,
            "rule_type": "aml",
            "enabled": True,
        },
        {
            "name": "RECOMMENDATION_CONFLICT",
            "description": "Escalate when the model recommendation conflicts with deterministic guardrails.",
            "severity": "high",
            "threshold": 1.0,
            "rule_type": "governance",
            "enabled": True,
        },
        {
            "name": "COMBINED_MEDIUM_RISK_THRESHOLD",
            "description": "Escalate when several medium risk indicators stack together.",
            "severity": "high",
            "threshold": 3.0,
            "rule_type": "aggregation",
            "enabled": True,
        },
    ]

    tuned_rules = deepcopy(base_rules)
    for rule in tuned_rules:
        if rule["name"] == "MODEL_CONFIDENCE_MIN":
            rule["threshold"] = 0.60
        if rule["name"] == "EVIDENCE_COMPLETENESS_MIN":
            rule["threshold"] = 0.65

    return [
        {
            "version": "v1.0",
            "name": "Baseline Prudential Controls",
            "description": "Initial production-aligned policy baseline for deterministic agentic oversight.",
            "is_active": False,
            "created_by": "seed",
            "rules_json": base_rules,
        },
        {
            "version": "v1.1",
            "name": "Enhanced Governance Controls",
            "description": "Slightly tighter model confidence and evidence standards for higher scrutiny.",
            "is_active": True,
            "created_by": "seed",
            "rules_json": tuned_rules,
        },
    ]

