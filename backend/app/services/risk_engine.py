from __future__ import annotations


def _clamp(score: float) -> float:
    return round(max(0.0, min(100.0, score)), 2)


def score_credit_risk(credit_score: int) -> float:
    if credit_score >= 780:
        return 8.0
    if credit_score >= 740:
        return 18.0
    if credit_score >= 700:
        return 30.0
    if credit_score >= 660:
        return 48.0
    if credit_score >= 620:
        return 66.0
    if credit_score >= 580:
        return 82.0
    return 96.0


def score_debt_to_income_risk(debt_to_income_ratio: float) -> float:
    return _clamp(debt_to_income_ratio * 140)


def score_transaction_anomaly_risk(transaction_ratio: float, transaction_type: str) -> float:
    base = transaction_ratio * 18
    if transaction_type in {"International Wire", "Crypto Transfer"}:
        base += 18
    if transaction_type in {"Cash Withdrawal", "International Wire"} and transaction_ratio > 2:
        base += 12
    return _clamp(base)


def score_evidence_weakness_risk(evidence_completeness_score: float, evidence_text_length: int) -> float:
    completeness_gap = (1 - evidence_completeness_score) * 70
    thin_file_penalty = 0
    if evidence_text_length < 40:
        thin_file_penalty = 25
    elif evidence_text_length < 80:
        thin_file_penalty = 12
    return _clamp(completeness_gap + thin_file_penalty)


def score_model_confidence_penalty(model_confidence: float) -> float:
    return _clamp((1 - model_confidence) * 100)


def risk_level_for_score(overall_score: float) -> str:
    if overall_score < 35:
        return "Low"
    if overall_score < 60:
        return "Medium"
    if overall_score < 80:
        return "High"
    return "Critical"


def compute_risk(normalized_payload: dict, derived_fields: dict) -> dict:
    credit_risk = score_credit_risk(normalized_payload["credit_score"])
    debt_to_income_risk = score_debt_to_income_risk(derived_fields["debt_to_income_ratio"])
    transaction_anomaly_risk = score_transaction_anomaly_risk(
        derived_fields["transaction_to_income_ratio"],
        normalized_payload["transaction_type"],
    )
    evidence_weakness_risk = score_evidence_weakness_risk(
        normalized_payload["evidence_completeness_score"],
        derived_fields["evidence_text_length"],
    )
    model_confidence_penalty = score_model_confidence_penalty(normalized_payload["model_confidence"])

    overall_score = _clamp(
        (credit_risk * 0.32)
        + (debt_to_income_risk * 0.23)
        + (transaction_anomaly_risk * 0.17)
        + (evidence_weakness_risk * 0.15)
        + (model_confidence_penalty * 0.13)
    )
    overall_confidence = round(
        ((normalized_payload["model_confidence"] * 0.6) + (normalized_payload["evidence_completeness_score"] * 0.4)) * 100,
        2,
    )

    components = [
        {
            "name": "Credit risk",
            "score": credit_risk,
            "reason": f"Credit score of {normalized_payload['credit_score']} maps to a controlled score of {credit_risk}.",
        },
        {
            "name": "Debt-to-income risk",
            "score": debt_to_income_risk,
            "reason": f"Debt-to-income ratio is {derived_fields['debt_to_income_ratio']:.0%}.",
        },
        {
            "name": "Transaction anomaly risk",
            "score": transaction_anomaly_risk,
            "reason": f"Transaction-to-income ratio is {derived_fields['transaction_to_income_ratio']:.2f}x.",
        },
        {
            "name": "Evidence weakness risk",
            "score": evidence_weakness_risk,
            "reason": f"Evidence completeness is {normalized_payload['evidence_completeness_score']:.0%} with {derived_fields['evidence_text_length']} characters.",
        },
        {
            "name": "Model confidence penalty",
            "score": model_confidence_penalty,
            "reason": f"Model confidence is {normalized_payload['model_confidence']:.0%}.",
        },
    ]
    top_contributors = sorted(components, key=lambda item: item["score"], reverse=True)[:3]

    return {
        "overall_score": overall_score,
        "risk_level": risk_level_for_score(overall_score),
        "credit_risk": credit_risk,
        "debt_to_income_risk": debt_to_income_risk,
        "transaction_anomaly_risk": transaction_anomaly_risk,
        "evidence_weakness_risk": evidence_weakness_risk,
        "model_confidence_penalty": model_confidence_penalty,
        "overall_confidence": overall_confidence,
        "top_risk_factors": top_contributors,
        "breakdown": {
            "components": components,
            "derived_metrics": {
                "debt_to_income_ratio": derived_fields["debt_to_income_ratio"],
                "loan_to_income_ratio": derived_fields["loan_to_income_ratio"],
                "transaction_to_income_ratio": derived_fields["transaction_to_income_ratio"],
                "evidence_text_length": derived_fields["evidence_text_length"],
            },
            "top_contributors": top_contributors,
        },
    }

