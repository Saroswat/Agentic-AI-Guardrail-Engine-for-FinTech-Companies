"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, FileText, ShieldCheck, UserRoundCheck } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { CaseHistoryTimeline } from "@/components/cases/case-history-timeline";
import { ExplainabilityPanel } from "@/components/cases/explainability-panel";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auditExportUrl, getCase } from "@/lib/api";
import type { CaseDetail } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

function decisionVariant(decision: string | null | undefined) {
  if (decision === "APPROVE") return "success";
  if (decision === "REJECT") return "destructive";
  if (decision === "ESCALATE TO HUMAN REVIEW") return "warning";
  return "outline";
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const detail = await getCase(params.id);
        setCaseDetail(detail);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load case detail.");
      }
    }

    if (params.id) {
      void load();
    }
  }, [params.id]);

  const latestReview = caseDetail?.human_reviews.find((review) => review.review_status === "completed");
  const sortedAuditLogs = caseDetail ? [...caseDetail.audit_logs].sort((a, b) => a.created_at.localeCompare(b.created_at)) : [];
  const sortedPolicyResults = caseDetail
    ? [...caseDetail.policy_results].sort((a, b) => Number(b.triggered) - Number(a.triggered) || a.rule_name.localeCompare(b.rule_name))
    : [];

  return (
    <AppShell>
      {!caseDetail && !error ? (
        <div className="space-y-6">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-[600px] rounded-2xl" />
        </div>
      ) : null}

      {error ? <EmptyState title="Unable to load case" description={error} /> : null}

      {caseDetail ? (
        <div className="space-y-6">
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="panel-gradient border-primary/20">
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline">{caseDetail.case_id}</Badge>
                  <Badge variant={decisionVariant(caseDetail.final_decision)}>{caseDetail.final_decision ?? "Pending"}</Badge>
                  <Badge variant="outline">{caseDetail.policy_version_used ?? "No policy"}</Badge>
                </div>
                <h2 className="text-3xl font-semibold">{caseDetail.customer_name}</h2>
                <p className="text-muted-foreground">{caseDetail.worker_summary}</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-secondary/60 p-4">
                    <p className="text-sm text-muted-foreground">Risk score</p>
                    <p className="mt-2 text-xl font-semibold">{caseDetail.risk_score}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary/60 p-4">
                    <p className="text-sm text-muted-foreground">Risk level</p>
                    <p className="mt-2 text-xl font-semibold">{caseDetail.risk_level}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary/60 p-4">
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="mt-2 text-xl font-semibold">{caseDetail.overall_confidence?.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Case metadata</CardTitle>
                <CardDescription>Timestamp, policy, and audit export controls.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 p-4">
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="mt-2 font-semibold">{formatDate(caseDetail.created_at)}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 p-4">
                    <p className="text-sm text-muted-foreground">Evaluated</p>
                    <p className="mt-2 font-semibold">{formatDate(caseDetail.evaluated_at)}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 p-4">
                    <p className="text-sm text-muted-foreground">Governance status</p>
                    <p className="mt-2 font-semibold">{caseDetail.governance_status}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 p-4">
                    <p className="text-sm text-muted-foreground">Fairness flags</p>
                    <p className="mt-2 font-semibold">{caseDetail.fairness_flag_count}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={auditExportUrl(caseDetail.case_id, "json")} className={cn(buttonVariants({ variant: "secondary" }), "gap-2")}>
                    <Download className="h-4 w-4" />
                    JSON audit
                  </Link>
                  <Link href={auditExportUrl(caseDetail.case_id, "txt")} className={cn(buttonVariants({ variant: "secondary" }), "gap-2")}>
                    <FileText className="h-4 w-4" />
                    TXT audit
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          <ExplainabilityPanel caseDetail={caseDetail} />

          <section className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Original input payload</CardTitle>
                <CardDescription>Raw and normalized case intake used by the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-2xl bg-secondary/60 p-4 text-xs leading-6">
                  {JSON.stringify(caseDetail.case_input.normalized_payload, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Derived intake fields</CardTitle>
                <CardDescription>Normalized ratios and derived metrics computed during intake.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-2xl bg-secondary/60 p-4 text-xs leading-6">
                  {JSON.stringify(caseDetail.case_input.derived_fields, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card>
              <CardHeader>
                <CardTitle>Policy rule results</CardTitle>
                <CardDescription>Deterministic rule outcomes recorded under the active policy version.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Threshold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPolicyResults.map((result) => (
                      <TableRow key={result.rule_name}>
                        <TableCell>
                          <p className="font-semibold">{result.rule_name}</p>
                          <p className="text-xs text-muted-foreground">{result.description}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={result.severity === "critical" ? "destructive" : result.severity === "medium" ? "warning" : "outline"}>
                            {result.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={result.outcome === "REJECT" ? "destructive" : result.outcome === "ESCALATE" ? "warning" : "success"}>
                            {result.outcome}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.threshold}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk score breakdown</CardTitle>
                <CardDescription>Component-level scores feeding the overall risk assessment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {caseDetail.risk_result?.breakdown.components.map((component) => (
                  <div key={component.name}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>{component.name}</span>
                      <span>{component.score}</span>
                    </div>
                    <Progress value={component.score} />
                    <p className="mt-2 text-xs text-muted-foreground">{component.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Fairness and governance findings</CardTitle>
                <CardDescription>Governance interventions and fairness-sensitive routing findings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {caseDetail.governance_flags.length ? (
                  caseDetail.governance_flags.map((flag) => (
                    <div key={flag.flag_name} className="rounded-2xl border border-border/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant={flag.requires_human_review ? "warning" : "outline"}>{flag.flag_name}</Badge>
                        <Badge variant="outline">{flag.category}</Badge>
                      </div>
                      <p className="mt-3 text-sm">{flag.details}</p>
                      <pre className="mt-3 overflow-x-auto rounded-2xl bg-secondary/60 p-3 text-xs leading-6">
                        {JSON.stringify(flag.context, null, 2)}
                      </pre>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                    No governance flags were triggered for this case.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Human review output</CardTitle>
                <CardDescription>Reviewer note, override reason, and completion metadata.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <UserRoundCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{latestReview?.reviewer_name ?? "No completed review yet"}</p>
                      <p className="text-sm text-muted-foreground">{latestReview?.decision ?? caseDetail.case_status}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3 pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Reviewer note</p>
                      <p className="mt-1 text-sm">{caseDetail.reviewer_note ?? latestReview?.note ?? "No reviewer note recorded."}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Override reason</p>
                      <p className="mt-1 text-sm">{caseDetail.override_reason ?? latestReview?.override_reason ?? "No override applied."}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-success/15 p-3 text-success">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Policy version used</p>
                      <p className="text-sm text-muted-foreground">{caseDetail.policy_version_used}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <CaseHistoryTimeline events={sortedAuditLogs} />
        </div>
      ) : null}
    </AppShell>
  );
}
