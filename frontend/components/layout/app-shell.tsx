import type { ReactNode } from "react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopNav } from "@/components/layout/top-nav";
import { SessionGate } from "@/components/session-gate";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SessionGate>
      <div className="min-h-screen">
        <div className="mx-auto flex max-w-[1700px] gap-6 px-4 py-6 lg:px-6">
          <SidebarNav />
          <main className="min-w-0 flex-1 space-y-6">
            <TopNav />
            {children}
          </main>
        </div>
      </div>
    </SessionGate>
  );
}
