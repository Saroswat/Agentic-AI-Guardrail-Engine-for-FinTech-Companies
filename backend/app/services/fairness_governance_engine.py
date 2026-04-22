from __future__ import annotations

SENSITIVE_KEYWORDS = {
    "age",
    "gender",
    "race",
    "ethnicity",
    "religion",
    "nationality",
    "disabled",
    "marital",
    "pregnant",
    "young",
    "elderly",
}


def evaluate_governance(normalized_payload: dict, derived_fields: dict, policy_results: list[dict], risk_result: dict) -> dict:
    flags: list[dict] = []
    combined_text = " ".join(
        [
            normalized_payload.get("agent_explanation") or "",
            normalized_payload.get("supporting_evidence_text") or "",
        ]
    ).lower()

    sensitive_mentions = sorted(keyword for keyword in SENSITIVE_KEYWORDS if keyword in combined_text)
    if sensitive_mentions:
        flags.append(
            {
                "flag_name": "SENSITIVE_ATTRIBUTE_REFERENCE",
                "category": "fairness",
                "severity": "high",
                "requires_human_review": True,
                "details": "Free-text rationale references sensitive attributes and should be routed for human oversight.",
                "context": {"matched_keywords": sensitive_mentions},
            }
        )

    if normalized_payload["model_confidence"] >= 0.75 and len((normalized_payload.get("agent_explanation") or "").strip()) < 40:
        flags.append(
            {
                "flag_name": "WEAK_JUSTIFICATION",
                "category": "explainability",
                "severity": "medium",
                "requires_human_review": False,
                "details": "High-confidence recommendation lacks a sufficiently detailed explanation trace.",
                "context": {"agent_explanation_length": len((normalized_payload.get("agent_explanation") or "").strip())},
            }
        )

    close_to_threshold = normalized_payload["credit_score"] <= 620 or derived_fields["debt_to_income_ratio"] >= 0.38
    if (normalized_payload["age"] < 21 or normalized_payload["age"] > 75) and close_to_threshold:
        flags.append(
            {
                "flag_name": "FAIRNESS_SENSITIVE_CONTEXT",
                "category": "fairness",
                "severity": "high",
                "requires_human_review": True,
                "details": "Sensitive-attribute context detected near a decision boundary. Case is routed to human review for fairness oversight.",
                "context": {
                    "age": normalized_payload["age"],
                    "credit_score": normalized_payload["credit_score"],
                    "debt_to_income_ratio": derived_fields["debt_to_income_ratio"],
                },
            }
        )

    hard_rejects = [item for item in policy_results if item["outcome"] == "REJECT" and item["triggered"]]
    if normalized_payload["model_recommendation"] == "APPROVE" and hard_rejects:
        flags.append(
            {
                "flag_name": "MODEL_POLICY_CONTRADICTION",
                "category": "model_risk",
                "severity": "high",
                "requires_human_review": True,
                "details": "Model recommendation conflicts with deterministic hard-rule outcomes.",
                "context": {"blocking_rules": [item["rule_name"] for item in hard_rejects]},
            }
        )

    if normalized_payload["loan_amount"] > normalized_payload["annual_income"] * 0.8 and normalized_payload["evidence_completeness_score"] < 0.7:
        flags.append(
            {
                "flag_name": "THIN_FILE_HIGH_IMPACT",
                "category": "governance",
                "severity": "medium",
                "requires_human_review": True,
                "details": "High-impact exposure with incomplete evidence package should be manually reviewed.",
                "context": {
                    "loan_amount": normalized_payload["loan_amount"],
                    "annual_income": normalized_payload["annual_income"],
                    "evidence_completeness_score": normalized_payload["evidence_completeness_score"],
                },
            }
        )

    governance_status = "Within governance tolerance"
    if any(flag["requires_human_review"] for flag in flags):
        governance_status = "Human review required by governance controls"
    elif flags:
        governance_status = "Governed with non-blocking findings"
    elif risk_result["risk_level"] in {"High", "Critical"}:
        governance_status = "Governed with elevated risk posture"

    return {
        "flags": flags,
        "governance_status": governance_status,
    }

