import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export function RecentActivity({
  items,
}: {
  items: Array<{ case_id: string; event_type: string; actor: string; summary: string; created_at: string }>;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity Feed</CardTitle>
        <CardDescription>Latest agent, control, and review events.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={`${item.case_id}-${item.created_at}`} className="rounded-2xl border border-border/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <Badge variant="outline">{item.event_type}</Badge>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                {formatDate(item.created_at)}
              </div>
            </div>
            <p className="mt-3 text-sm font-medium">{item.summary}</p>
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>{item.actor}</span>
              <Link href={`/cases/${item.case_id}`} className="inline-flex items-center gap-1 text-primary">
                Open case <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

