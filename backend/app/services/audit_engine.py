from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import AuditLog, Case
from app.utils.audit_storage import write_json_export, write_text_export


def record_audit_event(db: Session, case: Case, event_type: str, actor: str, summary: str, details: dict) -> None:
    db.add(
        AuditLog(
            case_pk=case.id,
            event_type=event_type,
            actor=actor,
            summary=summary,
            details_json=details,
        )
    )


def build_audit_payload(case: Case) -> dict:
    policy_results = [
        {
            "rule_name": item.rule_name,
            "severity": item.severity,
            "outcome": item.outcome,
            "triggered": item.triggered,
            "details": item.details,
        }
        for item in case.policy_results
    ]
    governance_flags = [
        {
            "flag_name": item.flag_name,
            "category": item.category,
            "severity": item.severity,
            "requires_human_review": item.requires_human_review,
            "details": item.details,
            "context": item.context,
        }
        for item in case.governance_flags
    ]
    audit_logs = [
        {
            "event_type": item.event_type,
            "actor": item.actor,
            "summary": item.summary,
            "details": item.details_json,
            "created_at": item.created_at.isoformat(),
        }
        for item in sorted(case.audit_logs, key=lambda log: log.created_at)
    ]
    risk_result = case.risk_result
    risk_breakdown = risk_result.breakdown if risk_result else {}
    top_risk_factors = case.top_risk_factors or []
    blocker_rules = case.blocker_rules or []

    return {
        "case_id": case.case_id,
        "generated_at": datetime.utcnow().isoformat(),
        "customer_name": case.customer_name,
        "customer_id": case.customer_id,
        "decision": case.final_decision,
        "case_status": case.case_status,
        "policy_version_used": case.policy_version_used,
        "worker_summary": case.worker_summary,
        "governance_status": case.governance_status,
        "risk_score": case.risk_score,
        "risk_level": case.risk_level,
        "overall_confidence": case.overall_confidence,
        "top_risk_factors": top_risk_factors,
        "blocker_rules": blocker_rules,
        "deterministic_explanation": case.deterministic_explanation,
        "simulated_agentic_explanation": case.simulated_agentic_explanation,
        "input_payload": case.case_input.normalized_payload if case.case_input else {},
        "derived_fields": case.case_input.derived_fields if case.case_input else {},
        "policy_results": policy_results,
        "governance_flags": governance_flags,
        "risk_breakdown": risk_breakdown,
        "human_reviews": [
            {
                "review_status": review.review_status,
                "reviewer_name": review.reviewer_name,
                "decision": review.decision,
                "note": review.note,
                "override_reason": review.override_reason,
                "created_at": review.created_at.isoformat(),
                "reviewed_at": review.reviewed_at.isoformat() if review.reviewed_at else None,
            }
            for review in case.human_reviews
        ],
        "timeline": audit_logs,
    }


def build_explanations(case: Case) -> tuple[str, str]:
    triggered_rejects = [item.rule_name for item in case.policy_results if item.triggered and item.outcome == "REJECT"]
    triggered_escalations = [item.rule_name for item in case.policy_results if item.triggered and item.outcome == "ESCALATE"]
    governance_flags = [item.flag_name for item in case.governance_flags]
    top_factors = ", ".join(f"{item['name']} ({item['score']})" for item in (case.top_risk_factors or []))

    deterministic = (
        f"Final decision is {case.final_decision}. Policy version {case.policy_version_used} "
        f"evaluated the case with risk score {case.risk_score} ({case.risk_level}). "
        f"Reject blockers: {triggered_rejects or ['none']}; escalation triggers: {triggered_escalations or ['none']}; "
        f"governance flags: {governance_flags or ['none']}. Top contributing risk factors were {top_factors or 'none'}."
    )

    simulated_agentic = (
        f"Worker agent captured the case and summarized the requested action. Policy agent applied version "
        f"{case.policy_version_used} and found blockers {triggered_rejects or ['none']} with escalation drivers "
        f"{triggered_escalations or ['none']}. Risk agent assigned {case.risk_score} / 100, led by {top_factors or 'no major drivers'}. "
        f"Governance agent recorded {governance_flags or ['no special interventions']}, so the platform issued "
        f"{case.final_decision} under controlled execution."
    )

    return deterministic, simulated_agentic


def export_case_audit(case: Case, file_format: str) -> str:
    settings = get_settings()
    payload = build_audit_payload(case)
    filename_base = f"{case.case_id}_audit_report"

    if file_format == "json":
        return write_json_export(settings.audit_export_dir, f"{filename_base}.json", payload)

    text_content = "\n".join(
        [
            f"Case ID: {payload['case_id']}",
            f"Decision: {payload['decision']}",
            f"Status: {payload['case_status']}",
            f"Policy Version: {payload['policy_version_used']}",
            f"Governance Status: {payload['governance_status']}",
            f"Risk Score: {payload['risk_score']} ({payload['risk_level']})",
            "",
            "Deterministic Explanation:",
            payload["deterministic_explanation"] or "",
            "",
            "Top Risk Factors:",
            *(f"- {item['name']}: {item['score']}" for item in payload["top_risk_factors"]),
            "",
            "Policy Results:",
            *(f"- {item['rule_name']}: {item['outcome']} (triggered={item['triggered']})" for item in payload["policy_results"]),
            "",
            "Governance Flags:",
            *(f"- {item['flag_name']}: {item['details']}" for item in payload["governance_flags"]),
        ]
    )
    return write_text_export(settings.audit_export_dir, f"{filename_base}.txt", text_content)

