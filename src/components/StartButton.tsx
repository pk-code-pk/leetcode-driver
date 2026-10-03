"use client";

import { useState } from "react";

/** Open a specific problem *and* start its attempt, so the solve has something to attach to. */
export function StartButton({ slug, url, label = "Start" }: { slug: string; url: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      className="rounded-md border border-neutral-700 px-2 py-0.5 text-xs text-neutral-300 hover:border-emerald-600 hover:text-emerald-300 disabled:opacity-50"
      onClick={async () => {
        setBusy(true);
        try {
          const r = await fetch("/api/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          });
          if (r.status === 401) { window.location.href = "/login"; return; }
        } catch {}
        window.open(url, "_blank");
        window.location.reload();
      }}
    >
      {busy ? "…" : label}
    </button>
  );
}
