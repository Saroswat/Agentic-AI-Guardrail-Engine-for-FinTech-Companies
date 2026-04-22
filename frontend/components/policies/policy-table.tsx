"use client";

import type { PolicyRule } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function PolicyTable({
  rules,
  onChange,
}: {
  rules: PolicyRule[];
  onChange: (rules: PolicyRule[]) => void;
}) {
  function updateRule(index: number, patch: Partial<PolicyRule>) {
    const next = [...rules];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rule</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Threshold</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Enabled</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((rule, index) => (
          <TableRow key={rule.name}>
            <TableCell className="font-semibold">{rule.name}</TableCell>
            <TableCell>{rule.description}</TableCell>
            <TableCell>
              <Badge variant={rule.severity === "critical" ? "destructive" : rule.severity === "medium" ? "warning" : "outline"}>
                {rule.severity}
              </Badge>
            </TableCell>
            <TableCell>
              <Input
                type="number"
                value={rule.threshold}
                onChange={(event) => updateRule(index, { threshold: Number(event.target.value) })}
              />
            </TableCell>
            <TableCell>{rule.rule_type}</TableCell>
            <TableCell>
              <Switch checked={rule.enabled} onCheckedChange={(checked) => updateRule(index, { enabled: checked })} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
