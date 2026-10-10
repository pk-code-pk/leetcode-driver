"use client";

import { useState } from "react";

export function ForgiveDebt() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      className="mt-1 text-xs text-neutral-500 hover:text-emerald-400 disabled:opacity-50"
      onClick={async () => {
        if (!confirm("Forgive all debt? Today's target goes back to the normal daily one.")) return;
        setBusy(true);
        const r = await fetch("/api/forgive", { method: "POST" }).catch(() => null);
        if (r?.ok) window.location.reload();
        else { setBusy(false); alert("Couldn't forgive the debt."); }
      }}
    >
      {busy ? "forgiving…" : "forgive"}
    </button>
  );
}
