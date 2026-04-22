import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export function CaseHistoryTimeline({
  events,
}: {
  events: Array<{ event_type: string; actor: string; summary: string; created_at: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Case History Timeline</CardTitle>
        <CardDescription>Execution path captured across the agentic control chain.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event, index) => (
          <div key={`${event.event_type}-${event.created_at}`} className="relative pl-8">
            <div className="absolute left-0 top-1 h-4 w-4 rounded-full bg-primary/20 ring-4 ring-primary/10" />
            {index < events.length - 1 ? <div className="absolute left-[7px] top-6 h-full w-px bg-border" /> : null}
            <div className="rounded-2xl border border-border/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge variant="outline">{event.event_type}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
              </div>
              <p className="mt-3 text-sm font-medium">{event.summary}</p>
              <p className="mt-2 text-sm text-muted-foreground">{event.actor}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

