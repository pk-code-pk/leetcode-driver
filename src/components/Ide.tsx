"use client";

import Link from "next/link";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CustomProblem } from "@/lib/custom";
import { Markdown } from "@/components/Markdown";

type Row = {
  args: Record<string, unknown>;
  expected: unknown;
  got?: unknown;
  pass: boolean;
  error?: string;
  stdout: string;
  ms?: number;
};
type Outcome =
  | { kind: "results"; rows: Row[]; stdout: string }
  | { kind: "error"; message: string; stdout?: string }
  | { kind: "timeout" };

/** The in-flight attempt, as /api/attempt reports it. */
type Attempt = {
  slug: string;
  title: string;
  isReview: boolean;
  hintLevel: number;
  startedAt: string;
  pausedSec: number;
  pausedAt: string | null;
  baselineMin: number;
};
/**
 * signedOut: nothing can be recorded. other: the clock is on a different problem.
 * live: the clock is on this one, so hints, failed runs and the solve all count.
 */
type Track =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "idle"; other: Attempt | null }
  | { kind: "live"; attempt: Attempt };

/** Generous, because the first call into a fresh interpreter is slow. */
const TIME_LIMIT_MS = 10_000;

const show = (v: unknown) => JSON.stringify(v);
const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Storage can throw (private windows, blocked site data); the IDE works without it. */
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k: string) => { try { localStorage.removeItem(k); } catch {} },
};

/** Like the Console's helper, but a 401 means "not signed in", not "go sign in". */
async function api(path: string, body?: unknown): Promise<{ status: number; json: Record<string, any> }> {
  const r = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}

/**
 * A LeetCode-style workspace for questions that aren't on LeetCode: statement on
 * the left, Monaco on the right, the stored tests run against your code in a
 * Pyodide worker. Layout and problem shape borrowed from cojudge; execution moved
 * into the browser, since a serverless deploy has no Docker to judge in.
 *
 * It stands in for LeetCode plus the extension: with the clock on this question,
 * a run that isn't accepted counts as a failed submission, hints climb the same
 * ladder, and an accepted run is the solve that grades and reschedules it.
 */
export function Ide({ problem }: { problem: CustomProblem }) {
  const key = `ide:${problem.slug}:python`;
  const [code, setCode] = useState(problem.starterCode.python);
  const [tab, setTab] = useState<"statement" | "hints" | "solution">("statement");
  const [hintsShown, setHintsShown] = useState(0);
  const [extraHints, setExtraHints] = useState<Record<number, { text: string; html: boolean }>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "running" | "failed">("loading");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [open, setOpen] = useState(0);
  const [track, setTrack] = useState<Track>({ kind: "loading" });
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [failedRuns, setFailedRuns] = useState(0);
  const [recorded, setRecorded] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const worker = useRef<Worker | null>(null);
  const runRef = useRef<() => void>(() => {});

  const live = track.kind === "live" ? track.attempt : null;
  // Failed runs belong to one attempt, so a reload mid-attempt keeps the count.
  const failKey = live ? `ide:${problem.slug}:fails:${live.startedAt}` : null;

  useEffect(() => {
    const saved = store.get(key);
    if (saved) setCode(saved);
  }, [key]);

  useEffect(() => {
    setFailedRuns(failKey ? Number(store.get(failKey)) || 0 : 0);
    setRecorded(false);
  }, [failKey]);

  const refresh = useCallback(async () => {
    try {
      const { status: code, json } = await api("/api/attempt");
      if (code === 401) return setTrack({ kind: "signedOut" });
      const a = (json.attempt ?? null) as Attempt | null;
      setTrack(a?.slug === problem.slug ? { kind: "live", attempt: a } : { kind: "idle", other: a });
    } catch {}
  }, [problem.slug]);

  useEffect(() => {
    // Mark the page opened, so a question served hours ago is timed from now.
    void api("/api/open", { slug: problem.slug }).catch(() => {}).then(refresh);
    const a = setInterval(() => setNow(Date.now()), 1000);
    const b = setInterval(refresh, 30000);
    const c = () => !document.hidden && void refresh();
    document.addEventListener("visibilitychange", c);
    return () => { clearInterval(a); clearInterval(b); document.removeEventListener("visibilitychange", c); };
  }, [problem.slug, refresh]);

  const boot = useCallback(() => {
    worker.current?.terminate();
    setStatus("loading");
    const w = new Worker("/pyodide-worker.js");
    w.onmessage = (e) => {
      if (e.data.type === "ready") setStatus("ready");
      if (e.data.type === "fatal") setStatus("failed");
    };
    worker.current = w;
  }, []);

  useEffect(() => {
    boot();
    return () => worker.current?.terminate();
  }, [boot]);

  /** What a run means for the attempt: a rejection, or the solve itself. */
  const judged = useCallback(async (accepted: boolean, submitted: string) => {
    if (!live || recorded) return;
    if (!accepted) {
      const n = failedRuns + 1;
      setFailedRuns(n);
      if (failKey) store.set(failKey, String(n));
      return;
    }
    setRecorded(true);
    const { json } = await api("/api/solve", {
      slug: problem.slug, host: "ide", failedSubmissions: failedRuns, code: submitted, lang: "python3",
    });
    setMessage(json.recorded ? "Solve recorded — it's on the review schedule now." : "Accepted, but the solve wasn't recorded.");
    if (json.recorded) { setNotes(""); setNotesOpen(true); }
    await refresh();
  }, [failKey, failedRuns, live, problem.slug, recorded, refresh]);

  const run = useCallback(() => {
    const w = worker.current;
    if (!w || status !== "ready") return;
    setStatus("running");
    setOutcome(null);
    const submitted = code;
    const timer = setTimeout(() => {
      // The only way to stop a runaway loop is to kill the thread and start over.
      setOutcome({ kind: "timeout" });
      void judged(false, submitted);
      boot();
    }, TIME_LIMIT_MS);
    w.onmessage = (e) => {
      if (e.data.type !== "result") return;
      clearTimeout(timer);
      const { results, error, stdout } = e.data as { results?: Row[]; error?: string; stdout?: string };
      if (error || !results) {
        setOutcome({ kind: "error", message: error ?? "No results.", stdout });
        void judged(false, submitted);
      } else {
        setOutcome({ kind: "results", rows: results, stdout: stdout ?? "" });
        setOpen(Math.max(0, results.findIndex((r) => !r.pass)));
        void judged(results.every((r) => r.pass), submitted);
      }
      setStatus("ready");
    };
    w.postMessage({ code: submitted, functionName: problem.functionName, params: problem.params, tests: problem.tests });
  }, [boot, code, judged, problem, status]);

  runRef.current = run;

  const onMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current());
  };

  const act = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    try { await fn(); } finally { setBusy(null); }
  };

  /** Put the clock on this question; whatever else was in flight is abandoned. */
  const start = () => act("start", async () => {
    if (track.kind === "idle" && track.other &&
        !confirm(`${track.other.title} is in flight. Abandon it and start this one?`)) return;
    await api("/api/start", { slug: problem.slug });
    setMessage("");
    await refresh();
  });

  const timer = (action: string) => act(action, async () => { await api("/api/timer", { action }); await refresh(); });

  /** With the clock running, a hint is a rung on the ladder and costs grade. */
  const nextHint = () => act("hint", async () => {
    if (!live) return setHintsShown((n) => n + 1);
    const { json } = await api("/api/hint", { slug: problem.slug });
    if (json.level && json.text && json.level > (problem.hints?.length ?? 0)) {
      setExtraHints((h) => ({ ...h, [json.level]: { text: json.text, html: Boolean(json.html) } }));
    }
    await refresh();
  });

  const saveNotes = () => act("note", async () => {
    if (notes.trim()) {
      const { json } = await api("/api/note", { slug: problem.slug, notes });
      setMessage(json.regraded ? `Grade ${json.grade}/5 · next review in ${json.intervalDays}d` : "Note saved.");
    }
    setNotesOpen(false);
    // Straight into the next problem: the gap between solves is where sessions die.
    const { json } = await api("/api/serve", {});
    if (json.url) window.location.href = json.url;
  });

  const reset = () => {
    if (!confirm("Discard your code and restore the starter?")) return;
    store.del(key);
    setCode(problem.starterCode.python);
  };

  const ladder = problem.hints ?? [];
  const shown = live ? live.hintLevel : hintsShown;
  const hintMax = live ? 4 : ladder.length;
  const sec = live
    ? Math.max(0, Math.floor((now - new Date(live.startedAt).getTime()) / 1000) - live.pausedSec
        - (live.pausedAt ? Math.floor((now - new Date(live.pausedAt).getTime()) / 1000) : 0))
    : 0;
  const ratio = live ? sec / 60 / live.baselineMin : 0;
  const clock = live?.pausedAt ? "text-neutral-500" : ratio > 2 ? "text-rose-400" : ratio > 1 ? "text-amber-400" : "text-emerald-300";

  const passed = outcome?.kind === "results" ? outcome.rows.filter((r) => r.pass).length : 0;
  const btn = "rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 hover:border-emerald-600 disabled:opacity-50";
  const tabBtn = (t: typeof tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      className={`px-1 pb-2 text-xs ${tab === t ? "border-b border-emerald-500 text-neutral-100" : "text-neutral-500 hover:text-neutral-300"}`}
    >
      {label}
    </button>
  );

  return (
    <main className="flex min-h-screen flex-col lg:h-screen">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-neutral-800 px-4 py-2.5">
        <div className="flex min-w-0 items-baseline gap-3">
          <Link href="/ide" className="shrink-0 text-xs text-neutral-500 hover:text-neutral-300">← questions</Link>
          <h1 className="truncate text-sm font-medium">{problem.title}</h1>
          <span className="hidden shrink-0 text-xs text-neutral-600 sm:inline">
            {problem.category} · {problem.difficulty}
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {live ? (
            <>
              <span className="text-xs text-neutral-500">
                {live.isReview ? "Review" : "New"} · target {live.baselineMin}m
                {failedRuns ? ` · ${failedRuns} failed` : ""}
              </span>
              <span className={`font-mono text-lg font-semibold tabular-nums ${clock}`}>{fmt(sec)}</span>
              <button className={btn} disabled={!!busy} onClick={() => timer(live.pausedAt ? "resume" : "pause")}>
                {live.pausedAt ? "Resume" : "Pause"}
              </button>
            </>
          ) : track.kind === "idle" ? (
            <button className={btn} disabled={!!busy} onClick={start} title="Time this attempt so the solve counts toward your reviews">
              {busy === "start" ? "…" : "Start timer"}
            </button>
          ) : track.kind === "signedOut" ? (
            <a href="/login" className="text-xs text-neutral-500 hover:text-emerald-400">sign in to track →</a>
          ) : null}
          <span className="hidden text-xs text-neutral-600 md:inline">
            {status === "loading" ? "loading Python…" : status === "failed" ? "Python failed to load" : "Python 3"}
          </span>
          <button className={btn} onClick={reset}>Reset</button>
          <button className={btn} disabled={status !== "ready"} onClick={run} title="Ctrl/⌘ + Enter">
            {status === "running" ? "Running…" : "Run tests ›"}
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-2">
        <section className="overflow-y-auto border-neutral-800 px-5 py-4 lg:border-r">
          <nav className="flex gap-4 border-b border-neutral-800">
            {tabBtn("statement", "Description")}
            {tabBtn("hints", live?.hintLevel ? `Hints · ${live.hintLevel} used` : "Hints")}
            {problem.solution ? tabBtn("solution", "Solution") : null}
          </nav>
          <div className="mt-4">
            {tab === "statement" && (
              <>
                <Markdown text={problem.statement} />
                <p className="mt-6 text-xs text-neutral-600">{problem.tags.join(" · ")}</p>
              </>
            )}
            {tab === "hints" && (
              <div className="space-y-3 text-sm">
                <p className="text-xs text-neutral-600">
                  {live
                    ? "The clock is running: each hint is recorded and lowers the grade a little — less than grinding past the target does."
                    : "Not timing, so hints cost nothing here."}
                </p>
                {Array.from({ length: shown }, (_, i) => {
                  const extra = extraHints[i + 1];
                  const text = ladder[i] ?? extra?.text;
                  return (
                    <div key={i} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-amber-200">
                      <span className="text-neutral-600">{i + 1}. </span>
                      {text == null
                        ? <span className="text-neutral-500">(shown earlier in this attempt)</span>
                        : extra?.html ? <span dangerouslySetInnerHTML={{ __html: text }} /> : text}
                    </div>
                  );
                })}
                {shown < hintMax ? (
                  <button className={btn} disabled={busy === "hint"} onClick={nextHint}>
                    {busy === "hint" ? "…" : shown ? "Still stuck — next hint" : "Show a hint"}
                  </button>
                ) : (
                  <p className="text-xs text-neutral-600">No rungs left.</p>
                )}
              </div>
            )}
            {tab === "solution" && (live ? (
              <p className="text-sm text-neutral-500">
                Hidden while the clock runs on this question — reading it would make the grade meaningless.
                The hints are graded more gently.
              </p>
            ) : (
              <pre className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs leading-relaxed text-emerald-200">
                <code>{problem.solution}</code>
              </pre>
            ))}
          </div>
        </section>

        <section className="flex min-h-[70vh] flex-col lg:min-h-0">
          <div className="min-h-[320px] flex-1">
            <Editor
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(v) => { setCode(v ?? ""); store.set(key, v ?? ""); }}
              onMount={onMount}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                tabSize: 4,
                automaticLayout: true,
              }}
            />
          </div>

          <div className="max-h-[45%] min-h-[140px] overflow-y-auto border-t border-neutral-800 px-4 py-3 text-sm">
            {notesOpen && (
              <div className="mb-4 rounded-lg border border-emerald-900 bg-emerald-950/30 p-3">
                <div className="text-sm font-medium">{problem.title} — solved ✓</div>
                <p className="mt-1 text-xs text-neutral-500">How did it go? This sets the review interval.</p>
                <textarea
                  autoFocus
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sorted first, then a two-pointer window — forgot the inclusive bound at first…"
                  className="mt-2 h-20 w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-sm outline-none focus:border-emerald-600"
                />
                <div className="mt-2 flex gap-2">
                  <button className={btn} disabled={busy === "note"} onClick={saveNotes}>
                    {busy === "note" ? "Grading…" : "Save & next problem"}
                  </button>
                  <button className={btn} disabled={busy === "note"} onClick={() => setNotesOpen(false)}>Skip</button>
                </div>
              </div>
            )}
            {message && !notesOpen && <p className="mb-3 text-xs text-emerald-400">{message}</p>}
            {!outcome && (
              <p className="text-xs text-neutral-600">
                {status === "running" ? "Running…" : `${problem.tests.length} tests. Run with Ctrl/⌘ + Enter.`}
                {track.kind === "idle" && " Start the timer to have the solve count toward your reviews."}
              </p>
            )}
            {outcome?.kind === "timeout" && (
              <p className="font-medium text-rose-400">Time limit exceeded ({TIME_LIMIT_MS / 1000}s) — look for an infinite loop.</p>
            )}
            {outcome?.kind === "error" && (
              <>
                <p className="font-medium text-rose-400">Error</p>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-rose-200">{outcome.message}</pre>
                {outcome.stdout && <pre className="mt-2 whitespace-pre-wrap text-xs text-neutral-400">{outcome.stdout}</pre>}
              </>
            )}
            {outcome?.kind === "results" && (
              <>
                <p className={`font-medium ${passed === outcome.rows.length ? "text-emerald-400" : "text-rose-400"}`}>
                  {passed === outcome.rows.length ? "Accepted" : "Wrong answer"}
                  <span className="ml-2 text-xs font-normal text-neutral-500">{passed}/{outcome.rows.length} passed</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {outcome.rows.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => setOpen(i)}
                      className={`rounded px-2 py-0.5 text-xs ${open === i ? "ring-1 ring-neutral-400" : ""} ${r.pass ? "bg-emerald-950 text-emerald-300" : "bg-rose-950 text-rose-300"}`}
                    >
                      Test {i + 1}
                    </button>
                  ))}
                </div>
                {outcome.rows[open] && <Case row={outcome.rows[open]} />}
                {outcome.stdout && <pre className="mt-2 whitespace-pre-wrap text-xs text-neutral-400">{outcome.stdout}</pre>}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Case({ row }: { row: Row }) {
  const line = (label: string, value: string, cls = "text-neutral-300") => (
    <div key={label} className="flex gap-3">
      <span className="w-16 shrink-0 text-neutral-600">{label}</span>
      <code className={`break-all ${cls}`}>{value}</code>
    </div>
  );
  return (
    <div className="mt-3 space-y-1 font-mono text-xs">
      {Object.entries(row.args).map(([k, v]) => line(k, show(v)))}
      {line("expected", show(row.expected))}
      {row.error
        ? <pre className="whitespace-pre-wrap text-rose-200">{row.error}</pre>
        : line("output", show(row.got), row.pass ? "text-emerald-300" : "text-rose-300")}
      {row.ms != null && line("time", `${row.ms} ms`, "text-neutral-500")}
      {row.stdout && line("stdout", row.stdout.trimEnd(), "text-neutral-400 whitespace-pre-wrap")}
    </div>
  );
}
