"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RuleViolationsChart({ data }: { data: Array<{ rule_name: string; count: number }> }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top Rule Violations</CardTitle>
        <CardDescription>Most frequently triggered deterministic controls.</CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis type="number" stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
            <YAxis dataKey="rule_name" type="category" width={180} stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#f59e0b" radius={[0, 12, 12, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

