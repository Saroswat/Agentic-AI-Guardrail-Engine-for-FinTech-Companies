"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RiskHistogramChart({ data }: { data: Array<{ bucket: string; count: number }> }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Risk Score Distribution</CardTitle>
        <CardDescription>Observed case risk across governed score bands.</CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="bucket" stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
            <YAxis stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#0f766e" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

