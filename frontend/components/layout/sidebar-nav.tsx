"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileCheck2, LayoutDashboard, ListChecks, Shield, Sparkles, Waypoints } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/evaluation", label: "New Evaluation", icon: Sparkles },
  { href: "/audit", label: "Audit Log", icon: FileCheck2 },
  { href: "/reviews", label: "Human Review", icon: ListChecks },
  { href: "/policies", label: "Policies", icon: Shield },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-border/70 bg-card/80 p-6 backdrop-blur xl:block">
      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/60 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Waypoints className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Agentic Guardrail</p>
          <p className="text-base font-semibold">Financial AI Control</p>
        </div>
      </div>

      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-10 rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-transparent to-warning/10 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="h-4 w-4 text-success" />
          Governance fabric online
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Deterministic policy execution, audit trace capture, and human override controls are active.
        </p>
      </div>
    </aside>
  );
}

