import Link from "next/link";
import { ArrowRight, FileSearch, GitBranch, Scale, ShieldCheck, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const pipelineSteps = [
  "1. Worker Agent / Case Intake",
  "2. Policy Agent / Rule Engine",
  "3. Risk Agent / Risk Scoring",
  "4. Fairness & Governance Agent",
  "5. Audit Agent / Decision Trace",
  "6. Human Review Layer",
  "7. Final Decision Output",
];

const featureCards = [
  {
    icon: ShieldCheck,
    title: "Deterministic control enforcement",
    description: "Hard rules, configurable thresholds, and active policy versioning govern every routed decision.",
  },
  {
    icon: Scale,
    title: "Governance-aware escalation",
    description: "Fairness-sensitive context, weak justification, and contradictory recommendations are routed into review.",
  },
  {
    icon: FileSearch,
    title: "Audit-grade decision trace",
    description: "Every case is explainable, reproducible, exportable, and backed by machine-readable audit artifacts.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen max-w-[1500px] flex-col justify-center px-6 py-16 lg:px-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Badge variant="outline">Governed Agentic AI Decision Control Platform</Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.05] text-foreground lg:text-7xl">
              Agentic Guardrail Engine for Financial AI
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              A production-style internal control platform for banks, fintechs, insurers, and model risk teams that
              governs agentic AI before any financial action is executed.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/evaluation" className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
                Run New Evaluation
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {featureCards.map((card) => (
                <Card key={card.title} className="panel-gradient">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="mt-4">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{card.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="panel-gradient border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Workflow className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Architecture Preview</p>
                  <CardTitle className="mt-2 text-2xl">Guardrail orchestration pipeline</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pipelineSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary font-semibold text-primary">
                    {index + 1}
                  </div>
                  <p className="font-medium">{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 pb-20 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Why it matters in finance</CardTitle>
              <CardDescription>
                High-impact AI actions need model risk controls, policy determinism, human oversight, and auditability.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>What the platform blocks</CardTitle>
              <CardDescription>
                Conflicted recommendations, weak evidence, fairness-sensitive context, risky transaction patterns, and
                low-confidence model actions.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>What the platform proves</CardTitle>
              <CardDescription>
                Reproducible reasoning, versioned policies, traceable overrides, and downloadable case-level audit
                reports.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="mt-6 overflow-hidden border-border/70">
          <CardContent className="grid gap-6 p-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-gradient-to-br from-primary/10 via-transparent to-warning/10 p-8">
              <Badge variant="success">Governance-first positioning</Badge>
              <h2 className="mt-5 text-3xl font-semibold">Built for serious internal review workflows</h2>
              <p className="mt-4 text-muted-foreground">
                The product sits between AI recommendation engines and execution systems, acting as a governed control
                plane instead of a dashboard veneer.
              </p>
            </div>
            <div className="grid gap-4 p-8 md:grid-cols-2">
              {[
                "Versioned policies with threshold editing",
                "Fairness-sensitive escalation routing",
                "Human override controls and notes",
                "Case-level audit report export",
                "Rule violation analytics and health reporting",
                "Future-ready architecture for RBAC, PostgreSQL, and orchestration",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm">
                  <GitBranch className="mb-3 h-5 w-5 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

