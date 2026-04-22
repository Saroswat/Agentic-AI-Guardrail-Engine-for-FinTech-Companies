"use client";

import { useState } from "react";

import type { CaseDetail } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ExplainabilityPanel({ caseDetail }: { caseDetail: CaseDetail }) {
  const [mode, setMode] = useState<"deterministic" | "simulated_agentic">(caseDetail.explanation_mode);
  const explanation =
    mode === "deterministic" ? caseDetail.deterministic_explanation : caseDetail.simulated_agentic_explanation;

  return (
    <Card className="panel-gradient">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Explainability Panel</CardTitle>
            <CardDescription>Plain-English decision trace with contribution highlights.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant={mode === "deterministic" ? "default" : "secondary"} size="sm" onClick={() => setMode("deterministic")}>
              Deterministic
            </Button>
            <Button
              variant={mode === "simulated_agentic" ? "default" : "secondary"}
              size="sm"
              onClick={() => setMode("simulated_agentic")}
            >
              Simulated Agentic
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
          <p className="text-sm leading-7">{explanation}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/70 p-5">
            <p className="text-sm font-semibold">Top contributing risk factors</p>
            <div className="mt-4 space-y-4">
              {(caseDetail.top_risk_factors ?? []).map((factor) => (
                <div key={factor.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>{factor.name}</span>
                    <span>{factor.score}</span>
                  </div>
                  <Progress value={factor.score} />
                  <p className="mt-2 text-xs text-muted-foreground">{factor.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 p-5">
            <p className="text-sm font-semibold">Blocking rules</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(caseDetail.blocker_rules ?? []).length ? (
                caseDetail.blocker_rules?.map((rule) => (
                  <Badge key={rule.rule_name} variant={rule.outcome === "REJECT" ? "destructive" : "warning"}>
                    {rule.rule_name}
                  </Badge>
                ))
              ) : (
                <Badge variant="success">No blocking rules</Badge>
              )}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Policy version {caseDetail.policy_version_used} recorded the final control path for this decision.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

