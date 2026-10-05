"use client";

import { useState } from "react";

export default function Login() {
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => null);
    if (r?.ok) {
      window.location.href = "/";
      return;
    }
    setErr(r?.status === 401 ? "That isn't the DRIVER_TOKEN." : "Couldn't reach the server.");
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-lg font-medium">Sign in</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Use the same <code className="text-neutral-300">DRIVER_TOKEN</code> you gave the extension.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          type="password"
          autoFocus
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="DRIVER_TOKEN"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm outline-none focus:border-emerald-600"
        />
        <button
          disabled={busy || !token}
          className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "…" : "Sign in"}
        </button>
        {err && <p className="text-sm text-rose-400">{err}</p>}
      </form>
    </main>
  );
}
