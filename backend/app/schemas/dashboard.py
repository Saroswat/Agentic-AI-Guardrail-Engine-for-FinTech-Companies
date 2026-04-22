from __future__ import annotations

from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_cases: int
    approved: int
    rejected: int
    escalated: int
    average_risk_score: float
    average_confidence: float
    fairness_flags_count: int
    pending_human_review_count: int
    recent_activity: list[dict]
    recent_audit_logs: list[dict]
    top_policy_rule_violations: list[dict]
    system_health: dict


class DashboardChartsResponse(BaseModel):
    decision_distribution: list[dict]
    risk_histogram: list[dict]
    rule_violations: list[dict]
    review_queue_stats: list[dict]
    activity_over_time: list[dict]

