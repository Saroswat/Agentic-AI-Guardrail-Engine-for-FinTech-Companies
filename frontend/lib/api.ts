import type {
  CaseDetail,
  CaseListItem,
  CaseSubmission,
  DashboardCharts,
  DashboardSummary,
  EvaluateCaseResponse,
  PendingReview,
  PolicyVersion,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getDashboardSummary() {
  return request<DashboardSummary>("/dashboard/summary");
}

export async function getDashboardCharts() {
  return request<DashboardCharts>("/dashboard/charts");
}

export async function getCases(params?: Record<string, string>) {
  const search = params ? `?${new URLSearchParams(params).toString()}` : "";
  return request<{ items: CaseListItem[]; total: number }>(`/cases${search}`);
}

export async function getCase(caseId: string) {
  return request<CaseDetail>(`/cases/${caseId}`);
}

export async function createCase(payload: CaseSubmission) {
  return request<{ case_id: string; status: string; created_at: string }>("/cases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function evaluateCase(caseId: string) {
  return request<EvaluateCaseResponse>(`/cases/${caseId}/evaluate`, {
    method: "POST",
  });
}

export async function getPendingReviews() {
  return request<{ items: PendingReview[]; total: number }>("/reviews/pending");
}

export async function submitReviewDecision(
  reviewId: number,
  payload: {
    reviewer_name: string;
    decision: "APPROVE" | "REJECT";
    note: string;
    override_reason: string;
  },
) {
  return request(`/reviews/${reviewId}/decision`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPolicies() {
  return request<PolicyVersion>("/policies");
}

export async function updatePolicies(payload: {
  name: string;
  description: string;
  rules: PolicyVersion["rules"];
  created_by: string;
}) {
  return request<PolicyVersion>("/policies/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function auditExportUrl(caseId: string, format: "json" | "txt") {
  return `${API_BASE_URL}/audit/${caseId}/export/${format}`;
}

