"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivityChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Activity Over Time</CardTitle>
        <CardDescription>Case intake throughput by day.</CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.65} />
                <stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
            <YAxis stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#0f766e" fill="url(#activityFill)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

