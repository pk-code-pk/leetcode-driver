"use client";

import { useState } from "react";
import { Check, Copy, Gift } from "lucide-react";

/** A shareable link that brings neighbors or classmates to JobsU. */
export function ReferralCard({ url, count, who }: { url: string; count: number; who: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <section className="rounded-xl border border-line p-6" data-testid="referral">
      <h2 className="flex items-center gap-2 text-[19px] tracking-tight text-ink">
        <Gift size={18} strokeWidth={1.5} /> Refer {who}
      </h2>
      <p className="mt-1 text-[14px] text-muted">
        {count === 0 ? "No one has joined from your link yet." : `${count} ${count === 1 ? "person has" : "people have"} joined from your link.`}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input readOnly value={url} className="input min-w-0 flex-1 text-[14px]" onFocus={(e) => e.target.select()} aria-label="Your referral link" />
        <button type="button" onClick={copy} className="btn btn-outline">
          {copied ? <Check size={16} /> : <Copy size={16} strokeWidth={1.75} />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </section>
  );
}
