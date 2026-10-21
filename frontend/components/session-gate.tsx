"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

export function SessionGate({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<{
    username: string;
    role: string;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/backend/auth/me", { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) {
          window.location.assign("/login");
          return;
        }
        if (!r.ok) throw new Error("Unable to connect to the backend.");
        setAccount(await r.json());
      })
      .catch((e) => setError(e.message));
  }, []);
  if (!account)
    return (
      <div className="p-10" role="status">
        {error || "Checking your session…"}
        {error && (
          <Link className="ml-4 underline" href="/login">
            Sign in
          </Link>
        )}
      </div>
    );
  return (
    <>
      <div className="mx-auto flex max-w-[1700px] flex-wrap items-center justify-between gap-3 px-6 pt-4 text-sm text-muted-foreground">
        <span>
          {account.username} · {account.role}
        </span>
        <div className="flex flex-wrap gap-4">
          <Link className="underline" href="/investigations">
            Investigations
          </Link>
          <Link className="underline" href="/dashboard">
            Dashboard
          </Link>
          <Link className="underline" href="/evaluation">
            New case
          </Link>
          <Link className="underline" href="/account">
            Account
          </Link>
          <button
            onClick={async () => {
              await fetch("/backend/auth/logout", { method: "POST" });
              window.location.assign("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </div>
      {children}
    </>
  );
}
