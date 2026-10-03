"use client";

import { useCallback, useEffect, useState } from "react";

type Attempt = {
  slug: string;
  title: string;
  difficulty: string;
  isReview: boolean;
  hintLevel: number;
  startedAt: string;
  pausedSec: number;
  pausedAt: string | null;
  baselineMin: number;
  url: string;
};
type Last = { slug: string; title: string } | null;

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

async function api(path: string, body?: unknown, method = body === undefined ? "GET" : "POST") {
  const r = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (r.status === 401) {
    window.location.href = "/login";
    throw new Error("signed out");
  }
  return r.json();
}

/**
 * The extension's on-page panel, on the site: serve the next problem, time it,
 * ask for hints, close it out and write the note that sets the next review.
 */
export function Console() {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [last, setLast] = useState<Last>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [notesFor, setNotesFor] = useState<Last>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");

  const refresh = useCallback(async () => {
    try {
      const j = await api("/api/attempt");
      setAttempt(j.attempt ?? null);
      setLast(j.lastSolved ?? null);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
    const a = setInterval(() => setNow(Date.now()), 1000);
    const b = setInterval(refresh, 30000);
    const c = () => !document.hidden && void refresh();
    document.addEventListener("visibilitychange", c);
    return () => { clearInterval(a); clearInterval(b); document.removeEventListener("visibilitychange", c); };
  }, [refresh]);

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    try { await fn(); } finally { setBusy(null); }
  };

  /** Feed the next problem: serve it, then take you straight to it. */
  const feed = () => run("next", async () => {
    setHint(null); setResult("");
    const j = await api("/api/serve", {});
    await refresh();
    if (j.url) window.open(j.url, "_blank");
    else setResult("Nothing due.");
  });

  const timer = (action: string) => run(action, async () => { await api("/api/timer", { action }); await refresh(); });

  const stuck = () => run("stuck", async () => {
    if (!attempt) return;
    const j = await api("/api/hint", { slug: attempt.slug });
    setHint(j.text ?? (j.exhausted ? "No rungs left — you have seen all four." : j.error ?? "No hint available."));
    await refresh();
  });

  const solved = () => run("solved", async () => {
    if (!attempt) return;
    const t = { slug: attempt.slug, title: attempt.title };
    await api("/api/solve", { slug: attempt.slug, host: "site" });
    setHint(null); setNotes(""); setResult("");
    setNotesFor(t);
    await refresh();
  });

  const saveNotes = () => run("note", async () => {
    if (!notesFor) return;
    if (notes.trim()) {
      const j = await api("/api/note", { slug: notesFor.slug, notes });
      setResult(j.regraded ? `Grade ${j.grade}/5 · next review in ${j.intervalDays}d` : "Saved.");
    }
    setNotesFor(null);
    // Straight into the next problem: the gap between solves is where sessions die.
    const n = await api("/api/serve", {});
    await refresh();
    if (n.url) window.open(n.url, "_blank");
    window.location.reload();
  });

  const sec = attempt
    ? Math.max(0, Math.floor((now - new Date(attempt.startedAt).getTime()) / 1000) - attempt.pausedSec
        - (attempt.pausedAt ? Math.floor((now - new Date(attempt.pausedAt).getTime()) / 1000) : 0))
    : 0;
  const ratio = attempt ? sec / 60 / attempt.baselineMin : 0;
  const clock = attempt?.pausedAt ? "text-neutral-500" : ratio > 2 ? "text-rose-400" : ratio > 1 ? "text-amber-400" : "text-emerald-300";

  const btn = "rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 hover:border-emerald-600 disabled:opacity-50";

  if (!loaded) return <div className="mt-8 h-32 rounded-lg border border-neutral-800" />;

  return (
    <section className="mt-8 rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
      {notesFor ? (
        <div>
          <div className="text-sm font-medium">{notesFor.title} — solved ✓</div>
          <p className="mt-1 text-xs text-neutral-500">How did it go? This sets the review interval.</p>
          <textarea
            autoFocus
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Knew the pattern instantly, but off-by-one on the window…"
            className="mt-3 h-24 w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-sm outline-none focus:border-emerald-600"
          />
          <div className="mt-2 flex gap-2">
            <button className={btn} disabled={busy === "note"} onClick={saveNotes}>
              {busy === "note" ? "Grading…" : "Save & next problem"}
            </button>
            <button className={btn} disabled={busy === "note"} onClick={() => { setNotesFor(null); }}>Skip</button>
          </div>
        </div>
      ) : attempt ? (
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <a href={attempt.url} target="_blank" rel="noreferrer" className="text-base font-medium hover:text-emerald-400">
                {attempt.title} ↗
              </a>
              <div className="mt-0.5 text-xs text-neutral-500">
                {attempt.isReview ? "Review" : "New"} · {attempt.difficulty} · target {attempt.baselineMin}m
                {attempt.hintLevel ? ` · ${attempt.hintLevel} hint${attempt.hintLevel > 1 ? "s" : ""}` : ""}
              </div>
            </div>
            <div className={`font-mono text-3xl font-semibold tabular-nums ${clock}`}>{fmt(sec)}</div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className={btn} disabled={!!busy} onClick={() => timer(attempt.pausedAt ? "resume" : "pause")}>
              {attempt.pausedAt ? "Resume" : "Pause"}
            </button>
            <button className={btn} disabled={!!busy} onClick={() => timer("reset")}>Reset</button>
            <button className={btn} disabled={!!busy} onClick={solved}>Solved</button>
            <button className={btn} disabled={!!busy} onClick={stuck}>{busy === "stuck" ? "…" : "Stuck"}</button>
            <a className={btn} href={`/learn?slug=${attempt.slug}`} target="_blank" rel="noreferrer">Learn</a>
            <button className={btn} disabled={!!busy} onClick={feed}>Skip ›</button>
          </div>
          {hint && <p className="mt-4 whitespace-pre-wrap rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-amber-200">{hint}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">Nothing in flight</div>
            <div className="mt-0.5 text-xs text-neutral-500">{result || "Serve the next problem and start the clock."}</div>
          </div>
          <div className="flex gap-2">
            {last && <button className={btn} onClick={() => { setNotes(""); setNotesFor(last); }}>Add note to {last.title}</button>}
            <button className={btn} disabled={!!busy} onClick={feed}>{busy === "next" ? "…" : "Next problem ›"}</button>
          </div>
        </div>
      )}
      {result && attempt && <p className="mt-3 text-xs text-emerald-400">{result}</p>}
    </section>
  );
}
