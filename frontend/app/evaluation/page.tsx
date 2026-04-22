"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createCase, evaluateCase } from "@/lib/api";
import type { CaseSubmission, EvaluateCaseResponse } from "@/lib/types";

const initialForm: CaseSubmission = {
  applicant_name: "Ava Sterling",
  customer_id: "CUST-NEW-001",
  age: 35,
  annual_income: 108000,
  monthly_income: 9000,
  loan_amount: 185000,
  existing_debt: 650,
  monthly_obligations: 1450,
  credit_score: 728,
  employment_status: "Full Time",
  years_employed: 7,
  country: "United Kingdom",
  region: "London",
  transaction_amount: 8400,
  transaction_type: "Bank Transfer",
  purpose: "Home purchase",
  requested_product_type: "Residential Mortgage",
  model_recommendation: "APPROVE",
  model_confidence: 0.82,
  evidence_completeness_score: 0.87,
  supporting_evidence_text:
    "Verified bank statements, salary slips, tax records, source-of-funds documentation, and signed affordability disclosures are attached.",
  agent_explanation:
    "Stable income, low delinquency indicators, and complete evidence support a controlled approval path.",
  explanation_mode: "deterministic",
};

export default function EvaluationPage() {
  const [form, setForm] = useState<CaseSubmission>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<EvaluateCaseResponse | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof CaseSubmission>(field: K, value: CaseSubmission[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const created = await createCase(form);
      setCaseId(created.case_id);
      const evaluation = await evaluateCase(created.case_id);
      setResult(evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run guardrail review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="panel-gradient border-primary/20">
            <CardContent className="space-y-4">
              <Badge variant="outline">New evaluation intake</Badge>
              <h2 className="text-3xl font-semibold">Submit a financial case into the governance pipeline</h2>
              <p className="text-muted-foreground">
                The platform will normalize the case, apply deterministic policy rules, compute risk, run governance
                checks, and either approve, reject, or route to human review.
              </p>
            </CardContent>
          </Card>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Customer and affordability profile</CardTitle>
                <CardDescription>Core applicant and credit information used by the intake and risk agents.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Input value={form.applicant_name} onChange={(e) => updateField("applicant_name", e.target.value)} placeholder="Applicant name" />
                <Input value={form.customer_id} onChange={(e) => updateField("customer_id", e.target.value)} placeholder="Customer ID" />
                <Input type="number" value={form.age} onChange={(e) => updateField("age", Number(e.target.value))} placeholder="Age" />
                <Input
                  type="number"
                  value={form.credit_score}
                  onChange={(e) => updateField("credit_score", Number(e.target.value))}
                  placeholder="Credit score"
                />
                <Input
                  type="number"
                  value={form.annual_income}
                  onChange={(e) => updateField("annual_income", Number(e.target.value))}
                  placeholder="Annual income"
                />
                <Input
                  type="number"
                  value={form.monthly_income}
                  onChange={(e) => updateField("monthly_income", Number(e.target.value))}
                  placeholder="Monthly income"
                />
                <Input
                  type="number"
                  value={form.loan_amount}
                  onChange={(e) => updateField("loan_amount", Number(e.target.value))}
                  placeholder="Loan amount"
                />
                <Input
                  type="number"
                  value={form.existing_debt}
                  onChange={(e) => updateField("existing_debt", Number(e.target.value))}
                  placeholder="Existing debt"
                />
                <Input
                  type="number"
                  value={form.monthly_obligations}
                  onChange={(e) => updateField("monthly_obligations", Number(e.target.value))}
                  placeholder="Monthly obligations"
                />
                <Input
                  type="number"
                  step="0.1"
                  value={form.years_employed}
                  onChange={(e) => updateField("years_employed", Number(e.target.value))}
                  placeholder="Years employed"
                />
                <Select value={form.employment_status} onChange={(e) => updateField("employment_status", e.target.value)}>
                  {["Full Time", "Contract", "Self Employed", "Retired"].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
                <Select value={form.requested_product_type} onChange={(e) => updateField("requested_product_type", e.target.value)}>
                  {["Residential Mortgage", "Personal Loan", "SME Working Capital", "Trade Finance", "Professional Loan", "Commercial Credit"].map(
                    (option) => (
                      <option key={option}>{option}</option>
                    ),
                  )}
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction and model signal</CardTitle>
                <CardDescription>Requested action context, transaction profile, and agent recommendation signal.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Input value={form.country} onChange={(e) => updateField("country", e.target.value)} placeholder="Country" />
                <Input value={form.region} onChange={(e) => updateField("region", e.target.value)} placeholder="Region" />
                <Input
                  type="number"
                  value={form.transaction_amount}
                  onChange={(e) => updateField("transaction_amount", Number(e.target.value))}
                  placeholder="Transaction amount"
                />
                <Select value={form.transaction_type} onChange={(e) => updateField("transaction_type", e.target.value)}>
                  {["Bank Transfer", "International Wire", "Cash Withdrawal", "Crypto Transfer"].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
                <Input value={form.purpose} onChange={(e) => updateField("purpose", e.target.value)} placeholder="Purpose" />
                <Select value={form.model_recommendation} onChange={(e) => updateField("model_recommendation", e.target.value as CaseSubmission["model_recommendation"])}>
                  {["APPROVE", "REJECT", "ESCALATE TO HUMAN REVIEW"].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  value={form.model_confidence}
                  onChange={(e) => updateField("model_confidence", Number(e.target.value))}
                  placeholder="Model confidence"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={form.evidence_completeness_score}
                  onChange={(e) => updateField("evidence_completeness_score", Number(e.target.value))}
                  placeholder="Evidence completeness score"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evidence and explainability input</CardTitle>
                <CardDescription>Optional free-text rationale is reviewed by governance controls and logged in the audit trace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={form.supporting_evidence_text}
                  onChange={(e) => updateField("supporting_evidence_text", e.target.value)}
                  placeholder="Supporting evidence text"
                />
                <Textarea
                  value={form.agent_explanation ?? ""}
                  onChange={(e) => updateField("agent_explanation", e.target.value)}
                  placeholder="Optional manually entered agent explanation"
                />
                <div className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
                  <div>
                    <p className="font-medium">Simulated LLM explanation mode</p>
                    <p className="text-sm text-muted-foreground">
                      Toggle between deterministic plain-English trace and simulated agentic narrative mode.
                    </p>
                  </div>
                  <Switch
                    checked={form.explanation_mode === "simulated_agentic"}
                    onCheckedChange={(checked) => updateField("explanation_mode", checked ? "simulated_agentic" : "deterministic")}
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Running guardrail review..." : "Run Guardrail Review"}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="space-y-6">
          <Card className="panel-gradient">
            <CardHeader>
              <CardTitle>Pipeline execution preview</CardTitle>
              <CardDescription>Every new case flows through seven governed stages before execution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Worker agent normalizes and enriches intake payload",
                "Policy engine applies deterministic rule checks",
                "Risk engine computes component scores and aggregation",
                "Governance agent checks fairness and explainability",
                "Audit engine writes trace and export-ready artifacts",
                "Human review layer captures override decisions",
                "Decision engine emits final governed outcome",
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evaluation outcome</CardTitle>
              <CardDescription>Latest case result and traceable output after review execution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div> : null}
              {result ? (
                <>
                  <div className="rounded-2xl border border-border/70 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Final decision</p>
                        <p className="mt-2 text-2xl font-semibold">{result.final_decision}</p>
                      </div>
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mt-6 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-secondary/60 p-4">
                        <p className="text-sm text-muted-foreground">Risk score</p>
                        <p className="mt-1 font-semibold">{result.risk_score}</p>
                      </div>
                      <div className="rounded-2xl bg-secondary/60 p-4">
                        <p className="text-sm text-muted-foreground">Policy version</p>
                        <p className="mt-1 font-semibold">{result.policy_version_used}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{result.explanation}</p>
                  </div>
                  {caseId ? (
                    <Link href={`/cases/${caseId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Open case detail
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 p-8 text-sm text-muted-foreground">
                  Run a case to see the governed decision output, final explanation, and routed case link.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-4">
              <div className="rounded-2xl bg-warning/15 p-3 text-warning">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Governance note</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sensitive attributes are never used for approval or rejection. When fairness-sensitive context appears,
                  the platform only escalates to human oversight.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
