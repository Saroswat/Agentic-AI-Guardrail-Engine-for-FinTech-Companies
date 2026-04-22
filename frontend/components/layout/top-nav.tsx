import Link from "next/link";
import { BellRing, ShieldCheck } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TopNav() {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-5 py-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Governed Agentic AI Decision Control Platform</p>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-xl font-semibold">Operational Guardrail Console</h1>
          <Badge variant="success">Operational</Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="outline">
          <ShieldCheck className="mr-1 h-3.5 w-3.5" />
          Policy versioning active
        </Badge>
        <Button variant="secondary" size="icon">
          <BellRing className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <Link href="/evaluation" className={cn(buttonVariants({ variant: "default" }))}>
          Run New Review
        </Link>
      </div>
    </div>
  );
}
