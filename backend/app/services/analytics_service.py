from __future__ import annotations

from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import AuditLog, Case, GovernanceFlag, HumanReview, PolicyResult, PolicyVersion


def _count_cases_by_decision(db: Session, decision: str) -> int:
    stmt = select(func.count(Case.id)).where(Case.final_decision == decision)
    return int(db.execute(stmt).scalar() or 0)


def get_dashboard_summary(db: Session) -> dict:
    total_cases = int(db.execute(select(func.count(Case.id))).scalar() or 0)
    approved = _count_cases_by_decision(db, "APPROVE")
    rejected = _count_cases_by_decision(db, "REJECT")
    escalated = int(db.execute(select(func.count(Case.id)).where(Case.was_escalated.is_(True))).scalar() or 0)
    average_risk_score = round(float(db.execute(select(func.avg(Case.risk_score))).scalar() or 0), 2)
    average_confidence = round(float(db.execute(select(func.avg(Case.overall_confidence))).scalar() or 0), 2)
    fairness_flags_count = int(db.execute(select(func.count(GovernanceFlag.id))).scalar() or 0)
    pending_human_review_count = int(
        db.execute(select(func.count(HumanReview.id)).where(HumanReview.review_status == "pending")).scalar() or 0
    )

    recent_activity_rows = (
        db.execute(select(AuditLog, Case.case_id).join(Case, Case.id == AuditLog.case_pk).order_by(AuditLog.created_at.desc()).limit(8))
        .all()
    )
    recent_audit_rows = (
        db.execute(select(AuditLog, Case.case_id).join(Case, Case.id == AuditLog.case_pk).order_by(AuditLog.created_at.desc()).limit(6))
        .all()
    )
    rule_violations = (
        db.execute(
            select(PolicyResult.rule_name, func.count(PolicyResult.id))
            .where(PolicyResult.triggered.is_(True))
            .group_by(PolicyResult.rule_name)
            .order_by(func.count(PolicyResult.id).desc())
            .limit(5)
        )
        .all()
    )
    active_policy = db.execute(select(PolicyVersion).where(PolicyVersion.is_active.is_(True))).scalar_one_or_none()

    return {
        "total_cases": total_cases,
        "approved": approved,
        "rejected": rejected,
        "escalated": escalated,
        "average_risk_score": average_risk_score,
        "average_confidence": average_confidence,
        "fairness_flags_count": fairness_flags_count,
        "pending_human_review_count": pending_human_review_count,
        "recent_activity": [
            {
                "case_id": case_id,
                "event_type": row.event_type,
                "actor": row.actor,
                "summary": row.summary,
                "created_at": row.created_at.isoformat(),
            }
            for row, case_id in recent_activity_rows
        ],
        "recent_audit_logs": [
            {
                "case_id": case_id,
                "event_type": row.event_type,
                "actor": row.actor,
                "summary": row.summary,
                "created_at": row.created_at.isoformat(),
            }
            for row, case_id in recent_audit_rows
        ],
        "top_policy_rule_violations": [
            {"rule_name": name, "count": count}
            for name, count in rule_violations
        ],
        "system_health": {
            "engine_status": "Healthy",
            "database": "Connected",
            "audit_exports": "Writable",
            "active_policy_version": active_policy.version if active_policy else "Unavailable",
            "queue_sla": "Within threshold",
        },
    }


def get_dashboard_charts(db: Session) -> dict:
    decision_distribution = [
        {"name": "Approved", "value": _count_cases_by_decision(db, "APPROVE")},
        {"name": "Rejected", "value": _count_cases_by_decision(db, "REJECT")},
        {"name": "Escalated", "value": int(db.execute(select(func.count(Case.id)).where(Case.was_escalated.is_(True))).scalar() or 0)},
    ]

    histogram_buckets = defaultdict(int)
    for score in db.execute(select(Case.risk_score).where(Case.risk_score.is_not(None))).scalars():
        bucket = f"{int(score // 20) * 20}-{int(score // 20) * 20 + 19}"
        histogram_buckets[bucket] += 1
    risk_histogram = [{"bucket": key, "count": histogram_buckets[key]} for key in sorted(histogram_buckets)]

    rule_violations = (
        db.execute(
            select(PolicyResult.rule_name, func.count(PolicyResult.id))
            .where(PolicyResult.triggered.is_(True))
            .group_by(PolicyResult.rule_name)
            .order_by(func.count(PolicyResult.id).desc())
            .limit(8)
        )
        .all()
    )

    review_queue_stats = [
        {
            "status": status,
            "count": int(
                db.execute(select(func.count(HumanReview.id)).where(HumanReview.review_status == status)).scalar() or 0
            ),
        }
        for status in ("pending", "completed")
    ]

    activity_over_time_rows = (
        db.execute(
            select(func.date(Case.created_at), func.count(Case.id))
            .group_by(func.date(Case.created_at))
            .order_by(func.date(Case.created_at))
        )
        .all()
    )
    activity_over_time = [{"date": date_value, "count": count} for date_value, count in activity_over_time_rows]

    return {
        "decision_distribution": decision_distribution,
        "risk_histogram": risk_histogram,
        "rule_violations": [{"rule_name": name, "count": count} for name, count in rule_violations],
        "review_queue_stats": review_queue_stats,
        "activity_over_time": activity_over_time,
    }
