"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ReviewDecisionDialog } from "@/components/reviews/review-decision-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCase, getPendingReviews, submitReviewDecision } from "@/lib/api";
import type { CaseDetail, PendingReview } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseDetail | null>(null);
  const [open, setOpen] = useState(false);

  async function loadReviews() {
    const response = await getPendingReviews();
    setReviews(response.items);
  }

  useEffect(() => {
    void loadReviews();
  }, []);

  async function openReview(review: PendingReview) {
    setSelectedReview(review);
    const detail = await getCase(review.case_id);
    setSelectedCase(detail);
    setOpen(true);
  }

  async function handleDecision(payload: { reviewer_name: string; decision: "APPROVE" | "REJECT"; note: string; override_reason: string }) {
    if (!selectedReview) {
      return;
    }
    await submitReviewDecision(selectedReview.review_id, payload);
    await loadReviews();
    setSelectedCase(null);
    setSelectedReview(null);
  }

  return (
    <AppShell>
      <Card className="panel-gradient border-primary/20">
        <CardContent className="space-y-4">
          <Badge variant="outline">Human oversight layer</Badge>
          <h2 className="text-3xl font-semibold">Manual review queue</h2>
          <p className="text-muted-foreground">
            Escalated cases are routed here for reviewer decision, override rationale, and auditable completion.
          </p>
        </CardContent>
      </Card>

      {reviews.length === 0 ? (
        <EmptyState title="No cases pending review" description="Escalated cases will appear here when the governance pipeline routes them for human oversight." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Escalated cases</CardTitle>
            <CardDescription>Open a case, inspect the trace, and record a final reviewer decision.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Queued</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.review_id}>
                    <TableCell className="font-semibold">{review.case_id}</TableCell>
                    <TableCell>{review.customer_name}</TableCell>
                    <TableCell>{review.requested_product_type}</TableCell>
                    <TableCell>{review.risk_score ?? "N/A"} / {review.risk_level ?? "N/A"}</TableCell>
                    <TableCell>{review.fairness_flag_count}</TableCell>
                    <TableCell>{formatDate(review.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="secondary" onClick={() => void openReview(review)}>
                        Open review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ReviewDecisionDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSelectedReview(null);
            setSelectedCase(null);
          }
        }}
        review={selectedReview}
        caseDetail={selectedCase}
        onSubmit={handleDecision}
      />
    </AppShell>
  );
}

