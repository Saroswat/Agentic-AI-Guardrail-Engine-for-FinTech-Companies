from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.models import Case, GovernanceFlag, HumanReview, PolicyResult, RiskResult
from app.services.audit_engine import build_explanations, record_audit_event
from app.services.fairness_governance_engine import evaluate_governance
from app.services.policy_engine import evaluate_policy_rules, get_active_policy_version
from app.services.risk_engine import compute_risk


def get_case_detail_query(case_id: str):
    return (
        select(Case)
        .where(Case.case_id == case_id)
        .options(
            selectinload(Case.case_input),
            selectinload(Case.policy_results),
            selectinload(Case.risk_result),
            selectinload(Case.governance_flags),
            selectinload(Case.audit_logs),
            selectinload(Case.human_reviews),
        )
    )


def get_case_or_raise(db: Session, case_id: str) -> Case:
    case = db.execute(get_case_detail_query(case_id)).scalar_one_or_none()
    if case is None:
        raise ValueError("Case not found.")
    return case


def _reset_evaluation_artifacts(db: Session, case: Case) -> None:
    db.execute(delete(PolicyResult).where(PolicyResult.case_pk == case.id))
    db.execute(delete(GovernanceFlag).where(GovernanceFlag.case_pk == case.id))
    db.execute(delete(HumanReview).where(HumanReview.case_pk == case.id))
    db.execute(delete(RiskResult).where(RiskResult.case_pk == case.id))


def _persist_policy_results(db: Session, case: Case, results: list[dict]) -> None:
    for result in results:
        db.add(PolicyResult(case_pk=case.id, **result))


def _persist_governance_flags(db: Session, case: Case, flags: list[dict]) -> None:
    for flag in flags:
        db.add(GovernanceFlag(case_pk=case.id, **flag))


def determine_final_decision(policy_results: list[dict], governance_flags: list[dict], risk_result: dict) -> tuple[str, bool]:
    has_reject = any(item["triggered"] and item["outcome"] == "REJECT" for item in policy_results)
    needs_human = any(item["triggered"] and item["outcome"] == "ESCALATE" for item in policy_results) or any(
        flag["requires_human_review"] for flag in governance_flags
    )

    if has_reject:
        return "REJECT", False
    if needs_human or risk_result["risk_level"] == "Critical":
        return "ESCALATE TO HUMAN REVIEW", True
    return "APPROVE", False


def evaluate_case(db: Session, case_id: str) -> Case:
    case = get_case_or_raise(db, case_id)
    if case.case_input is None:
        raise ValueError("Case input payload not available.")

    _reset_evaluation_artifacts(db, case)

    normalized_payload = case.case_input.normalized_payload
    derived_fields = case.case_input.derived_fields
    active_policy = get_active_policy_version(db)
    policy_output = evaluate_policy_rules(normalized_payload, derived_fields, active_policy.rules_json, active_policy.version)
    risk_output = compute_risk(normalized_payload, derived_fields)
    governance_output = evaluate_governance(normalized_payload, derived_fields, policy_output["results"], risk_output)
    final_decision, requires_human_review = determine_final_decision(
        policy_output["results"], governance_output["flags"], risk_output
    )

    _persist_policy_results(db, case, policy_output["results"])
    db.add(
        RiskResult(
            case_pk=case.id,
            overall_score=risk_output["overall_score"],
            risk_level=risk_output["risk_level"],
            credit_risk=risk_output["credit_risk"],
            debt_to_income_risk=risk_output["debt_to_income_risk"],
            transaction_anomaly_risk=risk_output["transaction_anomaly_risk"],
            evidence_weakness_risk=risk_output["evidence_weakness_risk"],
            model_confidence_penalty=risk_output["model_confidence_penalty"],
            breakdown=risk_output["breakdown"],
        )
    )
    _persist_governance_flags(db, case, governance_output["flags"])

    case.final_decision = final_decision
    case.case_status = "pending_human_review" if requires_human_review else "completed"
    case.risk_score = risk_output["overall_score"]
    case.risk_level = risk_output["risk_level"]
    case.overall_confidence = risk_output["overall_confidence"]
    case.policy_version_used = active_policy.version
    case.requires_human_review = requires_human_review
    case.was_escalated = case.was_escalated or requires_human_review
    case.fairness_flag_count = sum(1 for flag in governance_output["flags"] if flag["category"] == "fairness")
    case.governance_status = governance_output["governance_status"]
    case.top_risk_factors = risk_output["top_risk_factors"]
    case.blocker_rules = [
        {
            "rule_name": item["rule_name"],
            "outcome": item["outcome"],
            "severity": item["severity"],
        }
        for item in policy_output["results"]
        if item["triggered"] and item["outcome"] in {"REJECT", "ESCALATE"}
    ]
    case.evaluated_at = datetime.utcnow()
    case.updated_at = datetime.utcnow()

    record_audit_event(
        db,
        case,
        event_type="POLICY_EVALUATION",
        actor="policy-agent",
        summary="Deterministic policy rules evaluated.",
        details={"policy_version": active_policy.version, "results": policy_output["results"]},
    )
    record_audit_event(
        db,
        case,
        event_type="RISK_SCORING",
        actor="risk-agent",
        summary=f"Risk score calculated at {risk_output['overall_score']} ({risk_output['risk_level']}).",
        details=risk_output,
    )
    record_audit_event(
        db,
        case,
        event_type="GOVERNANCE_REVIEW",
        actor="governance-agent",
        summary=governance_output["governance_status"],
        details={"flags": governance_output["flags"]},
    )

    if requires_human_review:
        pending_review = HumanReview(
            case_pk=case.id,
            review_status="pending",
            previous_decision=final_decision,
        )
        db.add(pending_review)
        record_audit_event(
            db,
            case,
            event_type="HUMAN_REVIEW_REQUIRED",
            actor="review-layer",
            summary="Case escalated to human review queue.",
            details={"final_decision": final_decision},
        )
    else:
        record_audit_event(
            db,
            case,
            event_type="DECISION_FINALIZED",
            actor="decision-engine",
            summary=f"Case finalized as {final_decision}.",
            details={"final_decision": final_decision},
        )

    db.flush()
    db.refresh(case)
    deterministic, simulated_agentic = build_explanations(case)
    case.deterministic_explanation = deterministic
    case.simulated_agentic_explanation = simulated_agentic
    case.final_explanation = deterministic if case.explanation_mode == "deterministic" else simulated_agentic
    db.commit()

    return get_case_or_raise(db, case_id)
