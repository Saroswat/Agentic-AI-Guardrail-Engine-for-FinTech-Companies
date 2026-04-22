export type Decision = "APPROVE" | "REJECT" | "ESCALATE TO HUMAN REVIEW";

export interface DashboardSummary {
  total_cases: number;
  approved: number;
  rejected: number;
  escalated: number;
  average_risk_score: number;
  average_confidence: number;
  fairness_flags_count: number;
  pending_human_review_count: number;
  recent_activity: Array<{
    case_id: string;
    event_type: string;
    actor: string;
    summary: string;
    created_at: string;
  }>;
  recent_audit_logs: Array<{
    case_id: string;
    event_type: string;
    actor: string;
    summary: string;
    created_at: string;
  }>;
  top_policy_rule_violations: Array<{
    rule_name: string;
    count: number;
  }>;
  system_health: Record<string, string>;
}

export interface DashboardCharts {
  decision_distribution: Array<{ name: string; value: number }>;
  risk_histogram: Array<{ bucket: string; count: number }>;
  rule_violations: Array<{ rule_name: string; count: number }>;
  review_queue_stats: Array<{ status: string; count: number }>;
  activity_over_time: Array<{ date: string; count: number }>;
}

export interface CaseInputSnapshot {
  raw_payload: Record<string, unknown>;
  normalized_payload: Record<string, unknown>;
  derived_fields: Record<string, unknown>;
}

export interface CaseListItem {
  case_id: string;
  customer_name: string;
  customer_id: string;
  requested_product_type: string;
  transaction_type: string;
  model_recommendation: Decision;
  final_decision: Decision | null;
  case_status: string;
  risk_score: number | null;
  risk_level: string | null;
  overall_confidence: number | null;
  policy_version_used: string | null;
  requires_human_review: boolean;
  was_escalated: boolean;
  fairness_flag_count: number;
  created_at: string;
  evaluated_at: string | null;
}

export interface CaseDetail extends Omit<CaseListItem, "evaluated_at"> {
  model_confidence: number;
  evidence_completeness_score: number;
  explanation_mode: "deterministic" | "simulated_agentic";
  worker_summary: string | null;
  governance_status: string;
  reviewer_note: string | null;
  override_reason: string | null;
  final_explanation: string | null;
  deterministic_explanation: string | null;
  simulated_agentic_explanation: string | null;
  top_risk_factors: Array<{ name: string; score: number; reason: string }> | null;
  blocker_rules: Array<{ rule_name: string; outcome: string; severity: string }> | null;
  updated_at: string;
  evaluated_at: string | null;
  case_input: CaseInputSnapshot;
  policy_results: Array<{
    rule_name: string;
    description: string;
    severity: string;
    threshold: number;
    rule_type: string;
    version: string;
    outcome: string;
    triggered: boolean;
    details: Record<string, unknown>;
  }>;
  risk_result: {
    overall_score: number;
    risk_level: string;
    credit_risk: number;
    debt_to_income_risk: number;
    transaction_anomaly_risk: number;
    evidence_weakness_risk: number;
    model_confidence_penalty: number;
    breakdown: {
      components: Array<{ name: string; score: number; reason: string }>;
      derived_metrics: Record<string, number>;
      top_contributors: Array<{ name: string; score: number; reason: string }>;
    };
  } | null;
  governance_flags: Array<{
    flag_name: string;
    category: string;
    severity: string;
    requires_human_review: boolean;
    details: string;
    context: Record<string, unknown>;
    created_at: string;
  }>;
  audit_logs: Array<{
    event_type: string;
    actor: string;
    summary: string;
    details_json: Record<string, unknown>;
    created_at: string;
  }>;
  human_reviews: Array<{
    id: number;
    review_status: string;
    reviewer_name: string | null;
    decision: string | null;
    note: string | null;
    override_reason: string | null;
    previous_decision: string | null;
    reviewed_at: string | null;
    created_at: string;
  }>;
}

export interface CaseSubmission {
  applicant_name: string;
  customer_id: string;
  age: number;
  annual_income: number;
  monthly_income: number;
  loan_amount: number;
  existing_debt: number;
  monthly_obligations: number;
  credit_score: number;
  employment_status: string;
  years_employed: number;
  country: string;
  region: string;
  transaction_amount: number;
  transaction_type: string;
  purpose: string;
  requested_product_type: string;
  model_recommendation: Decision;
  model_confidence: number;
  evidence_completeness_score: number;
  supporting_evidence_text: string;
  agent_explanation?: string;
  explanation_mode: "deterministic" | "simulated_agentic";
}

export interface EvaluateCaseResponse {
  case_id: string;
  final_decision: Decision;
  case_status: string;
  risk_score: number;
  risk_level: string;
  policy_version_used: string;
  requires_human_review: boolean;
  explanation: string;
}

export interface PendingReview {
  review_id: number;
  case_id: string;
  customer_name: string;
  requested_product_type: string;
  previous_decision: string | null;
  risk_score: number | null;
  risk_level: string | null;
  fairness_flag_count: number;
  created_at: string;
}

export interface PolicyRule {
  name: string;
  description: string;
  severity: string;
  threshold: number;
  rule_type: string;
  enabled: boolean;
}

export interface PolicyVersion {
  version: string;
  name: string;
  description: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  rules: PolicyRule[];
}
