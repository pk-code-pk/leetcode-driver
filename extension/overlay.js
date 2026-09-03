/**
 * On-page timer for the live attempt.
 *
 * Duration drives the inferred grade, so the clock has to be visible and
 * correctable — pause when you walk away, reset when you actually start.
 * Lives in a shadow root so neither site's CSS can reach it.
 */
(() => {
  const HIDE_KEY = "__ld_timer_hidden";
  const COLLAPSE_KEY = "__ld_timer_collapsed";
  const HOST_NAME = location.hostname.includes("neetcode") ? "neetcode" : "leetcode";
  let state = null;      // payload from /api/attempt
  let offline = false;
  let lastSolved = null;
  let host, root, els;

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  /** The problem this tab is on, if any. */
  function pageSlug() {
    const m = location.pathname.match(/\/problems\/([^/]+)/);
    return m ? m[1] : null;
  }

  async function creds() {
    const { driverUrl, driverToken } = await chrome.storage.sync.get(["driverUrl", "driverToken"]);
    return driverUrl && driverToken ? { url: driverUrl.replace(/\/$/, ""), token: driverToken } : null;
  }

  /**
   * A failed request and "nothing in flight" are different answers, and
   * conflating them wipes a running timer the moment the laptop wakes before
   * the network does.
   */
  async function fetchAttempt() {
    const c = await creds();
    if (!c) return { ok: false };
    try {
      const r = await fetch(`${c.url}/api/attempt`, { headers: { "x-driver-token": c.token } });
      if (!r.ok) return { ok: false };
      const j = await r.json();
      return { ok: true, attempt: j.attempt, lastSolved: j.lastSolved };
    } catch {
      return { ok: false };
    }
  }

  /** Returns whether the server actually accepted it. */
  async function send(action) {
    const c = await creds();
    if (!c) return false;
    try {
      const r = await fetch(`${c.url}/api/timer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-driver-token": c.token },
        body: JSON.stringify({ action }),
      });
      return r.ok;
    } catch {
      return false;
    }
  }

  function build() {
    host = document.createElement("div");
    host.id = "leetcode-driver-timer";
    host.style.cssText = "position:fixed;left:18px;bottom:18px;z-index:2147483647";
    root = host.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host { all: initial; }
        .box {
          font: 13px/1.35 ui-sans-serif, -apple-system, "Segoe UI", system-ui, sans-serif;
          background: #10201d; color: #e8f2ef; border: 1px solid #2c4a43;
          border-radius: 12px; padding: 10px 12px; min-width: 176px;
          box-shadow: 0 10px 28px rgba(0,0,0,.4);
        }
        .title { font-weight: 600; margin-bottom: 2px; }
        .meta { color: #8fb3aa; font-size: 11px; margin-bottom: 8px; }
        .t { font: 600 26px/1 ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: .5px;
             font-variant-numeric: tabular-nums; }
        .over  { color: #f0c674; }
        .way   { color: #f08a7a; }
        .paused{ color: #7f9d95; }
        .row { display: flex; gap: 6px; margin-top: 9px; }
        textarea {
          width: 100%; box-sizing: border-box; margin-top: 9px; resize: vertical;
          min-height: 66px; font: inherit; color: #e8f2ef; background: #0b1917;
          border: 1px solid #2c4a43; border-radius: 8px; padding: 7px 8px;
        }
        textarea::placeholder { color: #5f807a; }
        .note-h { font-weight: 600; margin-bottom: 2px; }
        .hint { color: #8fb3aa; font-size: 11px; }
        .ok { color: #9ad6a5; font-size: 11px; margin-top: 6px; }
        button {
          font: inherit; font-size: 11px; cursor: pointer; color: #cfe6df;
          background: #17302b; border: 1px solid #2c4a43; border-radius: 7px; padding: 4px 8px;
        }
        button:hover { background: #1e3d37; }
        .x { position:absolute; top:6px; right:8px; border:0; background:none; color:#6e8f87; padding:2px; }
        .min { position:absolute; top:6px; right:24px; border:0; background:none; color:#6e8f87; padding:2px; }
        :host(.collapsed) .box { padding: 6px 10px; min-width: 0; }
        :host(.collapsed) .title,
        :host(.collapsed) .meta,
        :host(.collapsed) .row,
        :host(.collapsed) .x,
        :host(.collapsed) .min { display: none; }
        :host(.collapsed) .t { font-size: 15px; }
      </style>
      <div class="box">
        <button class="x" title="Hide for this tab">&times;</button>
        <button class="min" title="Collapse">&minus;</button>
        <div class="title"></div>
        <div class="meta"></div>
        <div class="t">00:00</div>
        <div class="row">
          <button data-a="pause">Pause</button>
          <button data-a="reset">Reset</button>
          <button data-a="start" hidden>Start</button>
          <button data-a="solved">Solved</button>
          <button data-a="note" hidden>Note</button>
          <button data-a="next">Next &rsaquo;</button>
        </div>
      </div>`;
    document.documentElement.appendChild(host);

    els = {
      title: root.querySelector(".title"),
      meta: root.querySelector(".meta"),
      t: root.querySelector(".t"),
      pause: root.querySelector('[data-a="pause"]'),
      next: root.querySelector('[data-a="next"]'),
      start: root.querySelector('[data-a="start"]'),
      solved: root.querySelector('[data-a="solved"]'),
      note: root.querySelector('[data-a="note"]'),
      reset: root.querySelector('[data-a="reset"]'),
      close: root.querySelector(".x"),
    };

    els.pause.addEventListener("click", async () => {
      if (!state) return;
      const pausing = !state.pausedAt;
      const before = { pausedAt: state.pausedAt, pausedSec: state.pausedSec };

      // Optimistic, then reverted if the server never heard it — a pause that
      // silently fails counts the break as working time and sinks the grade.
      if (pausing) {
        state.pausedAt = new Date().toISOString();
      } else {
        state.pausedSec += Math.floor((Date.now() - new Date(state.pausedAt).getTime()) / 1000);
        state.pausedAt = null;
      }
      render();

      if (!(await send(pausing ? "pause" : "resume"))) {
        state.pausedAt = before.pausedAt;
        state.pausedSec = before.pausedSec;
        offline = true;
        render();
        return;
      }
      offline = false;
      render();
    });

    els.reset.addEventListener("click", async () => {
      if (!state) return;
      const before = { startedAt: state.startedAt, pausedSec: state.pausedSec, pausedAt: state.pausedAt };
      state.startedAt = new Date().toISOString();
      state.pausedSec = 0;
      state.pausedAt = null;
      render();

      if (!(await send("reset"))) {
        Object.assign(state, before);
        offline = true;
      } else {
        offline = false;
      }
      render();
    });

    els.note.addEventListener("click", () => {
      if (lastSolved) askForNotes(lastSolved.slug, lastSolved.title);
    });

    // Detection can miss; this never does.
    els.solved.addEventListener("click", async () => {
      const here = pageSlug() ?? state?.slug;
      if (!here) return;
      els.solved.disabled = true;
      els.solved.textContent = "\u2026";
      const c = await creds();
      if (c) {
        try {
          await fetch(`${c.url}/api/solve`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-driver-token": c.token },
            body: JSON.stringify({ slug: here, host: HOST_NAME }),
          });
        } catch {}
      }
      els.solved.disabled = false;
      els.solved.textContent = "Solved";
      window.dispatchEvent(new CustomEvent("__ld_solved", { detail: { slug: here } }));
    });

    els.start.addEventListener("click", async () => {
      const here = pageSlug();
      if (!here) return;
      els.start.disabled = true;
      els.start.textContent = "\u2026";
      const c = await creds();
      if (c) {
        try {
          await fetch(`${c.url}/api/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-driver-token": c.token },
            body: JSON.stringify({ slug: here }),
          });
        } catch {}
      }
      els.start.disabled = false;
      els.start.textContent = "Start";
      await refresh();
    });

    els.next.addEventListener("click", async () => {
      els.next.disabled = true;
      els.next.textContent = "…";
      const c = await creds();
      if (!c) return;
      try {
        const r = await fetch(`${c.url}/api/serve`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-driver-token": c.token },
        });
        const j = await r.json();
        if (j.url) { location.href = j.url; return; }
      } catch {}
      els.next.disabled = false;
      els.next.textContent = "Next \u203a";
    });

    // Collapsed keeps the clock visible while clearing the buttons out of the
    // way; the whole pill expands again on click.
    const setCollapsed = (on) => {
      host.classList.toggle("collapsed", on);
      try { localStorage.setItem(COLLAPSE_KEY, on ? "1" : ""); } catch {}
    };
    root.querySelector(".min").addEventListener("click", (e) => {
      e.stopPropagation();
      setCollapsed(true);
    });
    host.addEventListener("click", () => {
      if (host.classList.contains("collapsed")) setCollapsed(false);
    });
    try { if (localStorage.getItem(COLLAPSE_KEY)) host.classList.add("collapsed"); } catch {}

    els.close.addEventListener("click", () => {
      try { sessionStorage.setItem(HIDE_KEY, "1"); } catch {}
      host.remove();
      host = null;
      showHandle();
    });
  }

  /** A small dot left behind after dismissing, so the timer is recoverable. */
  function showHandle() {
    if (document.getElementById("leetcode-driver-handle")) return;
    const h = document.createElement("div");
    h.id = "leetcode-driver-handle";
    h.title = "Show the driver";
    h.style.cssText =
      "position:fixed;left:14px;bottom:14px;z-index:2147483647;width:14px;height:14px;" +
      "border-radius:50%;background:#2f6f62;border:1px solid #47968a;cursor:pointer;" +
      "box-shadow:0 2px 8px rgba(0,0,0,.4)";
    h.addEventListener("click", () => {
      try { sessionStorage.removeItem(HIDE_KEY); } catch {}
      h.remove();
      build();
      render();
    });
    document.documentElement.appendChild(h);
  }

  function render() {
    if (!host) return;

    // Nothing in flight. On a problem page, offer to time *this* one; anywhere
    // else, offer the next in the queue.
    if (!state) {
      const here = pageSlug();
      els.title.textContent = here ? "Start the clock?" : "Nothing in flight";
      els.meta.textContent = here ? here.replace(/-/g, " ") : "NeetCode 150 order";
      els.t.textContent = "--:--";
      els.t.className = "t paused";
      els.pause.hidden = true;
      els.reset.hidden = true;
      els.start.hidden = !here;
      els.solved.hidden = !here;
      els.note.hidden = !lastSolved;
      els.next.textContent = here ? "Skip \u203a" : "Next \u203a";
      return;
    }
    els.start.hidden = true;
    els.note.hidden = true;
    els.solved.hidden = false;
    els.pause.hidden = false;
    els.reset.hidden = false;
    els.next.textContent = "Next \u203a";
    const started = new Date(state.startedAt).getTime();
    const pausedNow = state.pausedAt
      ? Math.floor((Date.now() - new Date(state.pausedAt).getTime()) / 1000)
      : 0;
    const sec = Math.max(0, Math.floor((Date.now() - started) / 1000) - state.pausedSec - pausedNow);

    els.title.textContent = state.title;
    els.meta.textContent =
      `${state.isReview ? "Review" : "New"} · ${state.difficulty} · target ${state.baselineMin}m` +
      (state.hintLevel ? ` · ${state.hintLevel} hint${state.hintLevel > 1 ? "s" : ""}` : "");

    const ratio = sec / 60 / state.baselineMin;
    els.t.className = "t" + (state.pausedAt ? " paused" : ratio > 2 ? " way" : ratio > 1 ? " over" : "");
    els.t.textContent = fmt(sec);
    els.pause.textContent = state.pausedAt ? "Resume" : "Pause";
    if (offline) els.meta.textContent += " · offline";
  }

  async function refresh() {
    const res = await fetchAttempt();
    if (!res.ok) {
      // Unreachable: keep showing whatever we had rather than blanking it.
      offline = true;
      if (host) render();
      return;
    }
    offline = false;
    state = res.attempt;
    lastSolved = res.lastSolved ?? lastSolved;
    if (!host) {
      let hidden = false;
      try { hidden = Boolean(sessionStorage.getItem(HIDE_KEY)); } catch {}
      if (hidden) { showHandle(); return; }
      build();
    }
    render();
  }

  /**
   * Ask for a written account of the attempt. The model turns it into the
   * grade, which beats inferring difficulty from a stopwatch.
   */
  function askForNotes(slug, title) {
    const box = document.createElement("div");
    // Sits above the timer panel, which now stays put through a solve.
    box.style.cssText = "position:fixed;left:18px;bottom:150px;z-index:2147483647";
    const sr = box.attachShadow({ mode: "open" });
    sr.innerHTML = `
      <style>
        :host { all: initial; }
        .box {
          font: 13px/1.35 ui-sans-serif, -apple-system, "Segoe UI", system-ui, sans-serif;
          background: #10201d; color: #e8f2ef; border: 1px solid #2c4a43;
          border-radius: 12px; padding: 11px 13px; width: 264px;
          box-shadow: 0 10px 28px rgba(0,0,0,.4);
        }
        .note-h { font-weight: 600; margin-bottom: 2px; }
        .hint { color: #8fb3aa; font-size: 11px; }
        textarea {
          width: 100%; box-sizing: border-box; margin-top: 9px; resize: vertical;
          min-height: 72px; font: inherit; color: #e8f2ef; background: #0b1917;
          border: 1px solid #2c4a43; border-radius: 8px; padding: 7px 8px;
        }
        textarea::placeholder { color: #5f807a; }
        .row { display: flex; gap: 6px; margin-top: 8px; }
        button {
          font: inherit; font-size: 11px; cursor: pointer; color: #cfe6df;
          background: #17302b; border: 1px solid #2c4a43; border-radius: 7px; padding: 4px 9px;
        }
        button:hover { background: #1e3d37; }
        .ok { color: #9ad6a5; font-size: 11px; margin-top: 7px; }
      </style>
      <div class="box">
        <div class="note-h">${title ? title : "Solved \u2713"}</div>
        <div class="hint">How did it go? This sets the review interval.</div>
        <textarea placeholder="Knew the pattern instantly, but off-by-one on the window..."></textarea>
        <div class="row">
          <button data-a="save">Save</button>
          <button data-a="skip">Skip</button>
        </div>
        <div class="ok" hidden></div>
      </div>`;
    document.documentElement.appendChild(box);

    const ta = sr.querySelector("textarea");
    const ok = sr.querySelector(".ok");
    ta.focus();

    const done = () => { box.remove(); void refresh(); };
    sr.querySelector('[data-a="skip"]').addEventListener("click", done);
    sr.querySelector('[data-a="save"]').addEventListener("click", async () => {
      const notes = ta.value.trim();
      if (!notes) return done();
      const c = await creds();
      if (!c) return done();
      ok.hidden = false;
      ok.textContent = "Grading\u2026";
      try {
        const r = await fetch(`${c.url}/api/note`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-driver-token": c.token },
          body: JSON.stringify({ slug, notes }),
        });
        const j = await r.json();
        ok.textContent = j.regraded
          ? `Grade ${j.grade}/5 \u00b7 next review in ${j.intervalDays}d`
          : "Saved.";
      } catch {
        ok.textContent = "Saved locally \u2014 send failed.";
      }

      // Straight into the next problem: the pause between one solve and the
      // next is where a session dies.
      try {
        const r = await fetch(`${c.url}/api/serve`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-driver-token": c.token },
        });
        const j = await r.json();
        if (j.url) {
          ok.textContent += " \u2014 next up\u2026";
          setTimeout(() => { window.location.href = j.url; }, 1600);
          return;
        }
        ok.textContent += " \u2014 nothing left due.";
      } catch {}
      setTimeout(done, 2600);
    });
  }

  window.addEventListener("__ld_solved", (e) => {
    askForNotes(e.detail?.slug, e.detail?.title);
    void refresh();
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type !== "toggle-overlay") return;
    try { sessionStorage.removeItem(HIDE_KEY); } catch {}
    document.getElementById("leetcode-driver-handle")?.remove();
    if (!host) build();
    host.classList.remove("collapsed");
    try { localStorage.removeItem(COLLAPSE_KEY); } catch {}
    void refresh();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void refresh();
  });

  refresh();
  setInterval(render, 1000);
  setInterval(refresh, 30000);
})();
