from __future__ import annotations

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models import PolicyVersion

AML_WATCH_COUNTRIES = {"Koranda", "Zetavia", "Novastria"}
AML_HIGH_RISK_PRODUCTS = {"Cross-Border Wire", "Trade Finance", "Crypto Transfer"}


def get_active_policy_version(db: Session) -> PolicyVersion:
    stmt = select(PolicyVersion).where(PolicyVersion.is_active.is_(True)).order_by(desc(PolicyVersion.created_at))
    policy = db.execute(stmt).scalar_one_or_none()
    if policy is None:
        raise ValueError("No active policy version configured.")
    return policy


def build_policy_lookup(rules: list[dict]) -> dict[str, dict]:
    return {rule["name"]: rule for rule in rules}


def _result(rule: dict, version: str, outcome: str, triggered: bool, details: dict) -> dict:
    return {
        "rule_name": rule["name"],
        "description": rule["description"],
        "severity": rule["severity"],
        "threshold": float(rule["threshold"]),
        "rule_type": rule["rule_type"],
        "version": version,
        "outcome": outcome,
        "triggered": triggered,
        "details": details,
    }


def evaluate_policy_rules(normalized_payload: dict, derived_fields: dict, rules: list[dict], version: str) -> dict:
    results: list[dict] = []
    critical_blockers: list[dict] = []
    escalations: list[dict] = []
    medium_factor_count = 0
    lookup = build_policy_lookup(rules)

    for rule in rules:
        if not rule.get("enabled", True):
            results.append(_result(rule, version, "SKIPPED", False, {"reason": "Rule disabled in active policy version."}))
            continue

        name = rule["name"]
        threshold = float(rule["threshold"])
        triggered = False
        outcome = "PASS"
        details: dict = {}

        if name == "CREDIT_SCORE_MIN":
            triggered = normalized_payload["credit_score"] < threshold
            outcome = "REJECT" if triggered else "PASS"
            details = {
                "observed_credit_score": normalized_payload["credit_score"],
                "threshold": threshold,
            }
        elif name == "DEBT_TO_INCOME_MAX":
            triggered = derived_fields["debt_to_income_ratio"] > threshold
            outcome = "ESCALATE" if triggered else "PASS"
            details = {
                "observed_debt_to_income_ratio": derived_fields["debt_to_income_ratio"],
                "threshold": threshold,
            }
        elif name == "MODEL_CONFIDENCE_MIN":
            triggered = normalized_payload["model_confidence"] < threshold
            outcome = "ESCALATE" if triggered else "PASS"
            details = {
                "observed_model_confidence": normalized_payload["model_confidence"],
                "threshold": threshold,
            }
        elif name == "EVIDENCE_COMPLETENESS_MIN":
            triggered = normalized_payload["evidence_completeness_score"] < threshold
            outcome = "ESCALATE" if triggered else "PASS"
            details = {
                "observed_evidence_completeness_score": normalized_payload["evidence_completeness_score"],
                "threshold": threshold,
            }
        elif name == "TRANSACTION_INCOME_RATIO_WATCH":
            triggered = derived_fields["transaction_to_income_ratio"] > threshold
            outcome = "ESCALATE" if triggered else "PASS"
            details = {
                "observed_transaction_to_income_ratio": derived_fields["transaction_to_income_ratio"],
                "threshold": threshold,
            }
        elif name == "TRANSACTION_INCOME_RATIO_MAX":
            triggered = derived_fields["transaction_to_income_ratio"] > threshold
            outcome = "REJECT" if triggered else "PASS"
            details = {
                "observed_transaction_to_income_ratio": derived_fields["transaction_to_income_ratio"],
                "threshold": threshold,
            }
        elif name == "EVIDENCE_TEXT_MIN_LENGTH":
            triggered = derived_fields["evidence_text_length"] < threshold
            outcome = "ESCALATE" if triggered else "PASS"
            details = {
                "observed_evidence_text_length": derived_fields["evidence_text_length"],
                "threshold": threshold,
            }
        elif name == "RISKY_COUNTRY_PRODUCT_COMBO":
            risky_combo = normalized_payload["country"] in AML_WATCH_COUNTRIES and (
                normalized_payload["requested_product_type"] in AML_HIGH_RISK_PRODUCTS
                or normalized_payload["transaction_type"] in {"International Wire", "Crypto Transfer"}
            )
            triggered = risky_combo
            outcome = "ESCALATE" if triggered else "PASS"
            details = {
                "country": normalized_payload["country"],
                "requested_product_type": normalized_payload["requested_product_type"],
                "transaction_type": normalized_payload["transaction_type"],
            }
        elif name == "RECOMMENDATION_CONFLICT":
            approve_conflict = normalized_payload["model_recommendation"] == "APPROVE" and any(
                existing["outcome"] == "REJECT" and existing["triggered"] for existing in results
            )
            reject_conflict = normalized_payload["model_recommendation"] == "REJECT" and (
                normalized_payload["credit_score"] >= 700
                and derived_fields["debt_to_income_ratio"] < 0.35
                and normalized_payload["evidence_completeness_score"] >= 0.75
            )
            triggered = approve_conflict or reject_conflict
            outcome = "ESCALATE" if triggered else "PASS"
            details = {
                "model_recommendation": normalized_payload["model_recommendation"],
                "approve_conflict": approve_conflict,
                "reject_conflict": reject_conflict,
            }
        elif name == "COMBINED_MEDIUM_RISK_THRESHOLD":
            medium_factor_count = 0
            if 0.35 <= derived_fields["debt_to_income_ratio"] <= lookup["DEBT_TO_INCOME_MAX"]["threshold"]:
                medium_factor_count += 1
            if lookup["MODEL_CONFIDENCE_MIN"]["threshold"] <= normalized_payload["model_confidence"] <= lookup["MODEL_CONFIDENCE_MIN"]["threshold"] + 0.1:
                medium_factor_count += 1
            if lookup["EVIDENCE_COMPLETENESS_MIN"]["threshold"] <= normalized_payload["evidence_completeness_score"] <= lookup["EVIDENCE_COMPLETENESS_MIN"]["threshold"] + 0.1:
                medium_factor_count += 1
            if derived_fields["transaction_to_income_ratio"] >= lookup["TRANSACTION_INCOME_RATIO_WATCH"]["threshold"] * 0.8:
                medium_factor_count += 1
            if normalized_payload["years_employed"] < 1:
                medium_factor_count += 1
            triggered = medium_factor_count >= threshold
            outcome = "ESCALATE" if triggered else "PASS"
            details = {
                "medium_factor_count": medium_factor_count,
                "threshold": threshold,
            }

        result = _result(rule, version, outcome, triggered, details)
        results.append(result)

        if triggered and outcome == "REJECT":
            critical_blockers.append(result)
        if triggered and outcome == "ESCALATE":
            escalations.append(result)

    return {
        "results": results,
        "critical_blockers": critical_blockers,
        "escalations": escalations,
        "medium_factor_count": medium_factor_count,
    }


def increment_policy_version(version: str) -> str:
    raw = version.removeprefix("v")
    major, minor = raw.split(".")
    return f"v{major}.{int(minor) + 1}"

