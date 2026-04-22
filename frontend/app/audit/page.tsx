"use client";

import Link from "next/link";
import { Download, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCases } from "@/lib/api";
import type { CaseListItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function decisionVariant(decision: string | null) {
  if (decision === "APPROVE") return "success";
  if (decision === "REJECT") return "destructive";
  if (decision === "ESCALATE TO HUMAN REVIEW") return "warning";
  return "outline";
}

export default function AuditPage() {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [escalated, setEscalated] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (decision) params.decision = decision;
      if (riskLevel) params.risk_level = riskLevel;
      if (escalated) params.escalated = escalated;
      if (startDate) params.start_date = `${startDate}T00:00:00`;
      if (endDate) params.end_date = `${endDate}T23:59:59`;

      try {
        const response = await getCases(params);
        setCases(response.items);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [search, decision, riskLevel, escalated, startDate, endDate]);

  function exportCsv() {
    const rows = [
      ["Case ID", "Customer", "Decision", "Risk Score", "Risk Level", "Policy Version", "Created At"],
      ...cases.map((item) => [
        item.case_id,
        item.customer_name,
        item.final_decision ?? "",
        item.risk_score?.toString() ?? "",
        item.risk_level ?? "",
        item.policy_version_used ?? "",
        item.created_at,
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "agentic_guardrail_audit_logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <Card className="panel-gradient border-primary/20">
        <CardContent className="space-y-4">
          <Badge variant="outline">Searchable audit log</Badge>
          <h2 className="text-3xl font-semibold">Governed case audit registry</h2>
          <p className="text-muted-foreground">
            Filter cases by decision, risk level, escalation status, and date range, then export the current slice to CSV.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Slice the case ledger across audit and governance dimensions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search case or customer" />
          </div>
          <Select value={decision} onChange={(e) => setDecision(e.target.value)}>
            <option value="">All decisions</option>
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
            <option value="ESCALATE TO HUMAN REVIEW">Escalated</option>
          </Select>
          <Select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
            <option value="">All risk levels</option>
            {["Low", "Medium", "High", "Critical"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Select value={escalated} onChange={(e) => setEscalated(e.target.value)}>
            <option value="">All queue states</option>
            <option value="true">Escalated</option>
            <option value="false">Not escalated</option>
          </Select>
          <Button variant="secondary" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent>Loading audit cases...</CardContent>
        </Card>
      ) : cases.length === 0 ? (
        <EmptyState title="No audit results" description="Adjust the filters or run additional evaluations to populate the audit table." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Audit case table</CardTitle>
            <CardDescription>Searchable and filterable case-level decision registry.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Escalated</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((item) => (
                  <TableRow key={item.case_id}>
                    <TableCell>
                      <Link href={`/cases/${item.case_id}`} className="font-semibold text-primary">
                        {item.case_id}
                      </Link>
                    </TableCell>
                    <TableCell>{item.customer_name}</TableCell>
                    <TableCell>
                      <Badge variant={decisionVariant(item.final_decision)}>{item.final_decision ?? "Pending"}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.risk_score ?? "N/A"} / {item.risk_level ?? "N/A"}
                    </TableCell>
                    <TableCell>{item.was_escalated ? "Yes" : "No"}</TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
