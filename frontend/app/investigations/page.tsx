"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

type RunItem = {
  id: string;
  case_id: string;
  status: string;
  provider: string;
  created_by: string;
};
type Evidence = {
  id: string;
  title: string;
  text: string;
  kind: string;
  digest?: string;
};
type Brief = {
  summary: string;
  findings: { claim: string; evidence_ids: string[]; quote: string }[];
  missing_evidence: string[];
  proposed_action: string;
  rationale: string;
};
type Run = RunItem & {
  objective: string;
  revision: number;
  attempts: number;
  brief: Brief | null;
  proposal_hash: string | null;
  snapshot: {
    evidence: Evidence[];
    policy_version: string;
    hard_decision: string;
    risk_level: string;
  } | null;
  error: string | null;
  feedback: string | null;
  events: {
    id: number;
    kind: string;
    actor: string;
    details: Record<string, unknown>;
    created_at: string;
  }[];
  reviews: {
    reviewer: string;
    decision: string;
    note: string;
    proposal_hash: string;
  }[];
};
type CaseItem = {
  case_id: string;
  customer_name: string;
  transaction_type: string;
};
type Account = { username: string; role: string };
const box = "rounded-2xl border border-border/70 bg-card p-5";
const input =
  "mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm";
const button =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40";
const label = (s: string) => s.replaceAll("_", " ");

async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`/backend${path}`, {
    credentials: "same-origin",
    cache: "no-store",
    ...(body !== undefined
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  if (r.status === 401) {
    window.location.assign("/login");
    throw new Error("Please sign in.");
  }
  const result = await r.json();
  if (!r.ok)
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Request could not be completed.",
    );
  return result;
}

export default function Investigations() {
  const [account, setAccount] = useState<Account | null>(null);
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selected, setSelected] = useState("");
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("");
  const [documents, setDocuments] = useState<{ id: string; title: string }[]>(
    [],
  );
  const refreshList = useCallback(async () => {
    setRuns(await api<RunItem[]>("/investigations"));
  }, []);
  useEffect(() => {
    Promise.all([
      api<Account>("/auth/me"),
      api<{ items: CaseItem[] }>("/cases"),
      api<{ live_available: boolean }>("/investigations/config"),
      api<{ id: string; title: string }[]>("/evidence"),
    ])
      .then(([a, c, config, docs]) => {
        setAccount(a);
        setCases(c.items);
        setLive(config.live_available);
        setDocuments(docs);
      })
      .catch((e) => setError(e.message));
    refreshList().catch((e) => setError(e.message));
  }, [refreshList]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    const refresh = async () => {
      try {
        const r = await api<Run>(`/investigations/${selected}`);
        if (active) {
          setRun(r);
          setRuns(await api<RunItem[]>("/investigations"));
        }
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Unable to load investigation.",
          );
      }
    };
    refresh();
    const timer = setInterval(refresh, 2500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [selected]);
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  async function start(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await act(async () => {
      const r = await api<{ id: string }>("/investigations", {
        case_id: form.get("case_id"),
        objective: form.get("objective"),
        provider: form.get("provider"),
      });
      setSelected(r.id);
      setRun(null);
      await refreshList();
    });
  }
  async function review(decision: string) {
    if (!run) return;
    await act(async () => {
      await api(`/investigations/${run.id}/review`, {
        decision,
        note,
        proposal_hash: run.proposal_hash,
      });
      setNote("");
      setRun(await api<Run>(`/investigations/${run.id}`));
      await refreshList();
    });
  }
  const canCreate = account?.role === "analyst" || account?.role === "admin";
  const canReview =
    (account?.role === "reviewer" || account?.role === "admin") &&
    run?.created_by !== account?.username;
  return (
    <AppShell>
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[.24em] text-primary">
              Evidence-led operations
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              Investigation workspace
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Trace an alert from recorded facts to a cited brief and an
              independently reviewed action.
            </p>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs">
            Synthetic cases · Human approval required
          </span>
        </div>
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm"
          >
            {error}
            <button
              className="float-right underline"
              onClick={() => setError("")}
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Investigate",
              text: "Case-scoped tools and captured policy evidence",
            },
            {
              icon: FileText,
              title: "Verify",
              text: "Exact citations, immutable snapshots and control checks",
            },
            {
              icon: ShieldCheck,
              title: "Review",
              text: "Independent approval bound to the precise proposal",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className={box}>
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-4">
            {canCreate && (
              <form className={box + " space-y-4"} onSubmit={start}>
                <h3 className="font-semibold">Start an investigation</h3>
                <label className="block text-sm">
                  Case
                  <select name="case_id" required className={input}>
                    <option value="">Select an alert</option>
                    {cases.map((c) => (
                      <option key={c.case_id} value={c.case_id}>
                        {c.customer_name} · {c.case_id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Objective
                  <textarea
                    name="objective"
                    minLength={10}
                    maxLength={2000}
                    required
                    className={input}
                    rows={3}
                    defaultValue="Investigate this transaction alert, identify missing evidence and propose the next analyst action."
                  />
                </label>
                <label className="block text-sm">
                  Provider
                  <select name="provider" className={input}>
                    <option value="demo">Offline demo · no model calls</option>
                    <option value="openai" disabled={!live}>
                      Live LLM {live ? "" : "· not configured"}
                    </option>
                  </select>
                </label>
                <button
                  className={button + " w-full"}
                  disabled={busy || !cases.length}
                >
                  <Play size={14} />
                  Queue investigation
                </button>
                {!cases.length && (
                  <Link className="block text-xs underline" href="/evaluation">
                    Create a case first
                  </Link>
                )}
              </form>
            )}
            <div className={box}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Recent investigations</h3>
                <button
                  aria-label="Refresh investigations"
                  onClick={() => act(refreshList)}
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <input
                aria-label="Filter investigations"
                placeholder="Filter by case or status"
                className={input}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <div className="mt-3 max-h-[430px] space-y-2 overflow-auto">
                {runs
                  .filter((r) =>
                    `${r.case_id} ${r.status}`
                      .toLowerCase()
                      .includes(filter.toLowerCase()),
                  )
                  .map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelected(r.id);
                        setRun(null);
                        setNote("");
                      }}
                      className={`w-full rounded-xl border p-3 text-left text-sm ${selected === r.id ? "border-primary bg-primary/10" : "border-border hover:bg-secondary"}`}
                    >
                      <span className="block font-medium">{r.case_id}</span>
                      <span className="mt-1 block text-xs capitalize text-muted-foreground">
                        {label(r.status)} · {r.provider}
                      </span>
                    </button>
                  ))}
                {!runs.length && (
                  <p className="py-4 text-sm text-muted-foreground">
                    No investigations yet. Choose a case to begin.
                  </p>
                )}
              </div>
            </div>
          </aside>
          <div className="min-w-0 space-y-4">
            {!run ? (
              <div
                className={
                  box +
                  " flex min-h-72 flex-col items-center justify-center text-center"
                }
              >
                <Search className="h-10 w-10 text-primary" />
                <h3 className="mt-4 text-xl font-semibold">
                  {selected
                    ? "Loading investigation…"
                    : "Your evidence trail starts here"}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {selected
                    ? "Retrieving the latest saved state."
                    : "Select an investigation, or queue a new alert from the panel."}
                </p>
              </div>
            ) : (
              <>
                <div className={box}>
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <Link
                        className="text-sm text-primary underline"
                        href={`/cases/${run.case_id}`}
                      >
                        {run.case_id}
                        <ArrowUpRight className="ml-1 inline" size={13} />
                      </Link>
                      <h3 className="mt-2 text-xl font-semibold capitalize">
                        {label(run.status)}
                      </h3>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>
                        Revision {run.revision} · Attempt {run.attempts}/3
                      </p>
                      <p className="mt-1">
                        {run.provider === "demo"
                          ? "Deterministic offline demo"
                          : "Live model investigation"}
                      </p>
                      <a
                        className="mt-2 inline-block underline"
                        href={`/backend/investigations/${run.id}/export`}
                      >
                        Export audit JSON
                      </a>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {run.objective}
                  </p>
                  {run.snapshot && (
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-lg bg-secondary px-3 py-2">
                        Policy {run.snapshot.policy_version}
                      </span>
                      <span className="rounded-lg bg-secondary px-3 py-2">
                        Control outcome: {run.snapshot.hard_decision}
                      </span>
                      <span className="rounded-lg bg-secondary px-3 py-2">
                        {run.snapshot.evidence.length} captured sources
                      </span>
                    </div>
                  )}
                  {run.error && (
                    <p role="alert" className="mt-3 text-sm text-red-400">
                      {run.error}
                    </p>
                  )}
                  {run.status === "failed" && canCreate && run.attempts < 3 && (
                    <button
                      className={button + " mt-3"}
                      disabled={busy}
                      onClick={() =>
                        act(async () => {
                          await api(`/investigations/${run.id}/retry`, {});
                          setRun(await api<Run>(`/investigations/${run.id}`));
                        })
                      }
                    >
                      Retry investigation
                    </button>
                  )}
                  {["queued", "running"].includes(run.status) && (
                    <p
                      role="status"
                      className="mt-4 flex items-center gap-2 text-sm text-primary"
                    >
                      <Clock3 size={14} />
                      {run.status === "queued"
                        ? "Queued for the worker. This page updates automatically."
                        : "Investigation in progress. Evidence and tool activity will appear below."}
                    </p>
                  )}
                </div>
                {run.brief && (
                  <div className={box + " space-y-5"}>
                    <h3 className="text-lg font-semibold">
                      Investigation brief
                    </h3>
                    <p className="text-sm leading-relaxed">
                      {run.brief.summary}
                    </p>
                    <div className="space-y-3">
                      {run.brief.findings.map((f, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-border p-4"
                        >
                          <p className="text-sm font-medium">{f.claim}</p>
                          <blockquote className="mt-2 break-words border-l-2 border-primary pl-3 text-xs leading-relaxed text-muted-foreground">
                            {f.quote}
                          </blockquote>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {f.evidence_ids.map((id) => (
                              <a
                                key={id}
                                className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary"
                                href={`#evidence-${id}`}
                              >
                                {run.snapshot?.evidence.find((e) => e.id === id)
                                  ?.title || id}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {run.brief.missing_evidence.length > 0 && (
                      <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
                        <h4 className="text-sm font-semibold">
                          Evidence still needed
                        </h4>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                          {run.brief.missing_evidence.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="rounded-xl bg-secondary p-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Proposed next action
                      </p>
                      <p className="mt-2 text-lg font-semibold capitalize">
                        {label(run.brief.proposed_action)}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {run.brief.rationale}
                      </p>
                    </div>
                  </div>
                )}
                {run.status === "awaiting_review" && (
                  <div className={box}>
                    <h3 className="font-semibold">Independent review</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Approval records this investigation outcome. It does not
                      move money or execute a financial decision.
                    </p>
                    {canReview ? (
                      <>
                        <label className="mt-4 block text-sm">
                          Review rationale
                          <textarea
                            aria-label="Review rationale"
                            minLength={10}
                            maxLength={2000}
                            className={input}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Explain the evidence supporting your decision…"
                          />
                        </label>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className={button}
                            disabled={busy || note.trim().length < 10}
                            onClick={() => review("approve")}
                          >
                            <CheckCircle2 size={15} />
                            Approve proposal
                          </button>
                          <button
                            className={button + " bg-secondary text-foreground"}
                            disabled={busy || note.trim().length < 10}
                            onClick={() => review("request_changes")}
                          >
                            Request changes
                          </button>
                          <button
                            className={button + " bg-red-500/15 text-red-400"}
                            disabled={busy || note.trim().length < 10}
                            onClick={() => review("reject")}
                          >
                            Reject proposal
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-amber-400">
                        A reviewer or a different administrator must review this
                        proposal.
                      </p>
                    )}
                    <p className="mt-4 break-all font-mono text-[10px] text-muted-foreground">
                      Proposal SHA-256: {run.proposal_hash}
                    </p>
                  </div>
                )}
                {run.reviews.length > 0 && (
                  <div className={box}>
                    <h3 className="font-semibold">Review history</h3>
                    {run.reviews.map((r, i) => (
                      <div
                        key={i}
                        className="mt-3 border-t border-border pt-3 text-sm"
                      >
                        <p className="capitalize">
                          {label(r.decision)} · {r.reviewer}
                        </p>
                        <p className="mt-1 text-muted-foreground">{r.note}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className={box}>
                  <h3 className="font-semibold">Captured evidence</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saved with this run. Later policy edits do not change these
                    passages.
                  </p>
                  {run.snapshot?.evidence.map((e) => (
                    <details
                      key={e.id}
                      id={`evidence-${e.id}`}
                      className="mt-3 scroll-mt-28 rounded-xl border border-border p-3"
                    >
                      <summary className="cursor-pointer text-sm">
                        {e.title}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {e.kind}
                        </span>
                      </summary>
                      <pre className="mt-3 whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
                        {e.text}
                      </pre>
                      <p className="mt-2 break-all font-mono text-[10px]">
                        {e.id}
                      </p>
                    </details>
                  ))}
                </div>
                <div className={box}>
                  <h3 className="font-semibold">Activity & tool trace</h3>
                  <ol className="mt-4 space-y-4">
                    {run.events.map((e) => (
                      <li
                        key={e.id}
                        className="border-l-2 border-primary/40 pl-4"
                      >
                        <p className="text-sm capitalize">
                          {label(e.kind)}{" "}
                          <span className="text-xs text-muted-foreground">
                            · {e.actor}
                          </span>
                        </p>
                        <time className="text-[10px] text-muted-foreground">
                          {new Date(
                            e.created_at +
                              (e.created_at.endsWith("Z") ? "" : "Z"),
                          ).toLocaleString()}
                        </time>
                        <details className="mt-1 text-xs text-muted-foreground">
                          <summary className="cursor-pointer">
                            Event details
                          </summary>
                          <pre className="mt-2 whitespace-pre-wrap break-all">
                            {JSON.stringify(e.details, null, 2)}
                          </pre>
                        </details>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}
          </div>
        </div>
        {account?.role === "admin" && (
          <form
            className={box + " space-y-4"}
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const data = new FormData(form);
              act(async () => {
                await api("/evidence", {
                  title: data.get("title"),
                  kind: "policy",
                  text: data.get("text"),
                });
                setDocuments(await api("/evidence"));
                form.reset();
              });
            }}
          >
            <h3 className="font-semibold">Policy evidence library</h3>
            <p className="text-sm text-muted-foreground">
              Upload plain-text policy passages. New runs retrieve relevant
              chunks; existing snapshots stay unchanged.
            </p>
            <label className="block text-sm">
              Policy title
              <input
                required
                name="title"
                minLength={3}
                maxLength={200}
                className={input}
              />
            </label>
            <label className="block text-sm">
              Policy text
              <textarea
                required
                name="text"
                minLength={20}
                maxLength={100000}
                rows={3}
                className={input}
              />
            </label>
            <button disabled={busy} className={button}>
              Add policy evidence
            </button>
            <p className="text-xs text-muted-foreground">
              {documents.length} stored documents
              {documents.length > 0
                ? `: ${documents.map((d) => d.title).join(", ")}`
                : ""}
            </p>
          </form>
        )}
      </section>
    </AppShell>
  );
}
