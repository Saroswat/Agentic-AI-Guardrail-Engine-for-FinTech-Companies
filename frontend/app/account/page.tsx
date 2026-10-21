"use client";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function Account() {
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/backend/auth/me")
      .then((r) => r.json())
      .then((a) => setRole(a.role));
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>, path: string) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch(`/backend${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await r.json();
      if (!r.ok)
        throw new Error(
          typeof result.detail === "string" ? result.detail : "Request failed.",
        );
      form.reset();
      if (path === "/auth/password") window.location.assign("/login");
      else setMessage(`Created ${result.username} (${result.role}).`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  const input =
    "mt-2 block w-full rounded-xl border border-border bg-background p-3";
  return (
    <AppShell>
      <h2 className="text-3xl font-semibold">Account & access</h2>
      {message && (
        <p role="status" className="rounded-xl border border-border p-4">
          {message}
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-2xl border border-border bg-card p-6"
          onSubmit={(e) => submit(e, "/auth/password")}
        >
          <h3 className="text-lg font-semibold">Change your password</h3>
          <p className="text-sm text-muted-foreground">
            Changing your password ends all of your active sessions.
          </p>
          <label className="block text-sm">
            Current password
            <input
              className={input}
              type="password"
              name="old_password"
              autoComplete="current-password"
              required
            />
          </label>
          <label className="block text-sm">
            New password
            <input
              className={input}
              type="password"
              name="new_password"
              autoComplete="new-password"
              minLength={12}
              maxLength={200}
              required
            />
          </label>
          <button
            className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
            disabled={busy}
          >
            Change password
          </button>
        </form>
        {role === "admin" && (
          <form
            className="space-y-4 rounded-2xl border border-border bg-card p-6"
            onSubmit={(e) => submit(e, "/accounts")}
          >
            <h3 className="text-lg font-semibold">Create a team account</h3>
            <label className="block text-sm">
              Username
              <input
                className={input}
                name="username"
                pattern="[a-zA-Z0-9._-]{3,80}"
                autoComplete="off"
                required
              />
            </label>
            <label className="block text-sm">
              Initial password
              <input
                className={input}
                name="password"
                type="password"
                minLength={12}
                maxLength={200}
                autoComplete="new-password"
                required
              />
            </label>
            <label className="block text-sm">
              Role
              <select name="role" className={input}>
                <option value="analyst">Analyst</option>
                <option value="reviewer">Reviewer</option>
                <option value="admin">Administrator</option>
              </select>
            </label>
            <button
              disabled={busy}
              className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
            >
              Create account
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
