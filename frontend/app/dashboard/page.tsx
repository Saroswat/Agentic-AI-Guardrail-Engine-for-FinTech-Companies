"use client";

import { Activity, AlertTriangle, CheckCircle2, Clock3, Scale, ShieldAlert, TrendingUp, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { AuditLogTable } from "@/components/dashboard/audit-log-table";
import { DecisionDistributionChart } from "@/components/dashboard/decision-distribution-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RiskHistogramChart } from "@/components/dashboard/risk-histogram-chart";
import { RuleViolationsChart } from "@/components/dashboard/rule-violations-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardCharts, getDashboardSummary } from "@/lib/api";
import type { DashboardCharts, DashboardSummary } from "@/lib/types";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [summaryData, chartsData] = await Promise.all([getDashboardSummary(), getDashboardCharts()]);
        setSummary(summaryData);
        setCharts(chartsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      }
    }

    void load();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="panel-gradient border-primary/20">
            <CardContent className="space-y-4">
              <Badge variant="outline">Governance-first command center</Badge>
              <h2 className="text-3xl font-semibold">Guardrail operating dashboard</h2>
              <p className="max-w-2xl text-muted-foreground">
                Monitor evaluated cases, policy effectiveness, human review load, and traceability health across the
                financial AI governance pipeline.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Current governance fabric posture and platform signals.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {summary ? (
                Object.entries(summary.system_health).map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-border/70 p-4">
                    <p className="text-sm capitalize text-muted-foreground">{label.replaceAll("_", " ")}</p>
                    <p className="mt-2 text-lg font-semibold">{value}</p>
                  </div>
                ))
              ) : (
                <>
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {error ? <Card><CardContent>{error}</CardContent></Card> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary ? (
            <>
              <KpiCard title="Total cases" value={summary.total_cases.toString()} description="Evaluated portfolio volume" icon={Activity} />
              <KpiCard title="Approved" value={summary.approved.toString()} description="Guardrailed straight-through approvals" icon={CheckCircle2} />
              <KpiCard title="Rejected" value={summary.rejected.toString()} description="Deterministic blocker outcomes" icon={XCircle} />
              <KpiCard title="Escalated" value={summary.escalated.toString()} description="Cases routed to human oversight" icon={AlertTriangle} />
              <KpiCard
                title="Average risk score"
                value={summary.average_risk_score.toFixed(1)}
                description="Portfolio risk centerline"
                icon={TrendingUp}
              />
              <KpiCard
                title="Average confidence"
                value={`${summary.average_confidence.toFixed(1)}%`}
                description="Model and evidence confidence blend"
                icon={Scale}
              />
              <KpiCard
                title="Fairness flags"
                value={summary.fairness_flags_count.toString()}
                description="Governance interventions recorded"
                icon={ShieldAlert}
              />
              <KpiCard
                title="Pending review"
                value={summary.pending_human_review_count.toString()}
                description="Open human review items"
                icon={Clock3}
              />
            </>
          ) : (
            Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-2xl" />)
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          {charts ? <DecisionDistributionChart data={charts.decision_distribution} /> : <Skeleton className="h-[430px] rounded-2xl" />}
          {charts ? <RiskHistogramChart data={charts.risk_histogram} /> : <Skeleton className="h-[430px] rounded-2xl" />}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          {charts ? <RuleViolationsChart data={charts.rule_violations} /> : <Skeleton className="h-[430px] rounded-2xl" />}
          {charts ? <ActivityChart data={charts.activity_over_time} /> : <Skeleton className="h-[430px] rounded-2xl" />}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          {summary ? <RecentActivity items={summary.recent_activity} /> : <Skeleton className="h-[520px] rounded-2xl" />}
          {summary ? <AuditLogTable rows={summary.recent_audit_logs} /> : <Skeleton className="h-[520px] rounded-2xl" />}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top policy rule violations</CardTitle>
              <CardDescription>Most active sources of control friction.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary?.top_policy_rule_violations.map((item) => (
                <div key={item.rule_name} className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
                  <div>
                    <p className="font-medium">{item.rule_name}</p>
                    <p className="text-sm text-muted-foreground">Triggered policy control</p>
                  </div>
                  <Badge variant="warning">{item.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review queue status</CardTitle>
              <CardDescription>Human review backlog and completed interventions.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {charts?.review_queue_stats.map((item) => (
                <div key={item.status} className="rounded-2xl border border-border/70 p-5">
                  <p className="text-sm capitalize text-muted-foreground">{item.status}</p>
                  <p className="mt-3 text-3xl font-semibold">{item.count}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

