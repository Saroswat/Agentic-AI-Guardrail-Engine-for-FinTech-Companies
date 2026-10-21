import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TopNav() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-5 py-4 backdrop-blur">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Governed AI operations
        </p>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-base font-semibold sm:text-xl">
            Guardrail Console
          </h1>
          <Badge variant="success">Operational</Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="outline" className="hidden 2xl:inline-flex">
          <ShieldCheck className="mr-1 h-3.5 w-3.5" />
          Policy versioning active
        </Badge>
        <ThemeToggle />
        <Link
          href="/evaluation"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          Run New Review
        </Link>
      </div>
    </div>
  );
}
