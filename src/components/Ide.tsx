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

/** Generous, because the first call into a fresh interpreter is slow. */
const TIME_LIMIT_MS = 10_000;

const show = (v: unknown) => JSON.stringify(v);

/** Storage can throw (private windows, blocked site data); the IDE works without it. */
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k: string) => { try { localStorage.removeItem(k); } catch {} },
};

/**
 * A LeetCode-style workspace for questions that aren't on LeetCode: statement on
 * the left, Monaco on the right, the stored tests run against your code in a
 * Pyodide worker. Layout and problem shape borrowed from cojudge; execution moved
 * into the browser, since a serverless deploy has no Docker to judge in.
 */
export function Ide({ problem }: { problem: CustomProblem }) {
  const key = `ide:${problem.slug}:python`;
  const [code, setCode] = useState(problem.starterCode.python);
  const [tab, setTab] = useState<"statement" | "hints" | "solution">("statement");
  const [hintsShown, setHintsShown] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "running" | "failed">("loading");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [open, setOpen] = useState(0);
  const worker = useRef<Worker | null>(null);
  const runRef = useRef<() => void>(() => {});

  useEffect(() => {
    const saved = store.get(key);
    if (saved) setCode(saved);
  }, [key]);

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

  const run = useCallback(() => {
    const w = worker.current;
    if (!w || status !== "ready") return;
    setStatus("running");
    setOutcome(null);
    const timer = setTimeout(() => {
      // The only way to stop a runaway loop is to kill the thread and start over.
      setOutcome({ kind: "timeout" });
      boot();
    }, TIME_LIMIT_MS);
    w.onmessage = (e) => {
      if (e.data.type !== "result") return;
      clearTimeout(timer);
      const { results, error, stdout } = e.data as { results?: Row[]; error?: string; stdout?: string };
      if (error || !results) setOutcome({ kind: "error", message: error ?? "No results.", stdout });
      else {
        setOutcome({ kind: "results", rows: results, stdout: stdout ?? "" });
        setOpen(Math.max(0, results.findIndex((r) => !r.pass)));
      }
      setStatus("ready");
    };
    w.postMessage({ code, functionName: problem.functionName, params: problem.params, tests: problem.tests });
  }, [boot, code, problem, status]);

  runRef.current = run;

  const onMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current());
  };

  const reset = () => {
    if (!confirm("Discard your code and restore the starter?")) return;
    store.del(key);
    setCode(problem.starterCode.python);
  };

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
      <header className="flex items-center justify-between gap-4 border-b border-neutral-800 px-4 py-2.5">
        <div className="flex min-w-0 items-baseline gap-3">
          <Link href="/ide" className="shrink-0 text-xs text-neutral-500 hover:text-neutral-300">← questions</Link>
          <h1 className="truncate text-sm font-medium">{problem.title}</h1>
          <span className="hidden shrink-0 text-xs text-neutral-600 sm:inline">
            {problem.category} · {problem.difficulty}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-neutral-600 sm:inline">
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
            {problem.hints?.length ? tabBtn("hints", `Hints · ${problem.hints.length}`) : null}
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
                {problem.hints!.slice(0, hintsShown).map((h, i) => (
                  <p key={i} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-amber-200">
                    <span className="text-neutral-600">{i + 1}. </span>{h}
                  </p>
                ))}
                {hintsShown < problem.hints!.length && (
                  <button className={btn} onClick={() => setHintsShown((n) => n + 1)}>
                    {hintsShown ? "Next hint" : "Show a hint"}
                  </button>
                )}
              </div>
            )}
            {tab === "solution" && (
              <pre className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs leading-relaxed text-emerald-200">
                <code>{problem.solution}</code>
              </pre>
            )}
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
            {!outcome && (
              <p className="text-xs text-neutral-600">
                {status === "running" ? "Running…" : `${problem.tests.length} tests. Run with Ctrl/⌘ + Enter.`}
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
