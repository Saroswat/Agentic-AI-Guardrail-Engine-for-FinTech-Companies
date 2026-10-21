"use client";
import { useState, type FormEvent } from "react";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      const r = await fetch("/backend/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.get("username"),
          password: data.get("password"),
        }),
      });
      if (!r.ok) {
        const body = await r.json();
        throw new Error(body.detail || "Sign in failed.");
      }
      window.location.assign("/investigations");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <ShieldCheck className="mb-6 h-10 w-10 text-primary" />
        <p className="text-xs uppercase tracking-[.25em] text-muted-foreground">
          Guardrail / Investigation intelligence
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Evidence before action.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to investigate alerts, inspect evidence, and review proposed
          actions.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm">
            Username
            <input
              name="username"
              autoComplete="username"
              required
              className="mt-2 w-full rounded-xl border border-border bg-background p-3"
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-xl border border-border bg-background p-3"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary p-3 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Open workspace"}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="mt-6 text-xs text-muted-foreground">
          Use the credentials configured during setup. This workspace uses
          synthetic demonstration cases.
        </p>
      </div>
    </main>
  );
}
