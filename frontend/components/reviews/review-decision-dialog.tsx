"use client";

import { useEffect, useState } from "react";

import type { CaseDetail, PendingReview } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

interface ReviewDecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: PendingReview | null;
  caseDetail: CaseDetail | null;
  onSubmit: (payload: { reviewer_name: string; decision: "APPROVE" | "REJECT"; note: string; override_reason: string }) => Promise<void>;
}

export function ReviewDecisionDialog({ open, onOpenChange, review, caseDetail, onSubmit }: ReviewDecisionDialogProps) {
  const [reviewerName, setReviewerName] = useState("");
  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [note, setNote] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && review) {
      setReviewerName("");
      setDecision("APPROVE");
      setNote("");
      setOverrideReason("");
    }
  }, [open, review?.review_id]);

  if (!open || !review) {
    return null;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit({
        reviewer_name: reviewerName,
        decision,
        note,
        override_reason: overrideReason,
      });
      setReviewerName("");
      setDecision("APPROVE");
      setNote("");
      setOverrideReason("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur">
      <div className="mx-auto mt-10 max-w-5xl rounded-[28px] border border-border/70 bg-card p-6 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Human Review Decision</p>
            <h3 className="mt-2 text-2xl font-semibold">{review.case_id}</h3>
          </div>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Card className="panel-gradient">
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="mt-2 text-lg font-semibold">{review.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="mt-2 text-lg font-semibold">{review.requested_product_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current routed decision</p>
                  <Badge variant="warning" className="mt-2">
                    {review.previous_decision ?? "Pending"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk score</p>
                  <p className="mt-2 text-lg font-semibold">{review.risk_score ?? "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            {caseDetail ? (
              <Card>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Loan amount</p>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(Number(caseDetail.case_input.normalized_payload.loan_amount ?? 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual income</p>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(Number(caseDetail.case_input.normalized_payload.annual_income ?? 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Governance status</p>
                      <p className="mt-1 font-semibold">{caseDetail.governance_status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fairness flags</p>
                      <p className="mt-1 font-semibold">{caseDetail.fairness_flag_count}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Explainability trace</p>
                    <p className="mt-2 text-sm leading-7">{caseDetail.final_explanation}</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Card>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">Reviewer name</p>
                <Input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} placeholder="Maria Chen" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Decision</p>
                <div className="flex gap-2">
                  <Button variant={decision === "APPROVE" ? "default" : "secondary"} onClick={() => setDecision("APPROVE")}>
                    Approve
                  </Button>
                  <Button variant={decision === "REJECT" ? "destructive" : "secondary"} onClick={() => setDecision("REJECT")}>
                    Reject
                  </Button>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Reviewer note</p>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Document the review outcome and any control notes."
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Override reason</p>
                <Textarea
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                  placeholder="Explain why the override is justified within policy."
                />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit review decision"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
