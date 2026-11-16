import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { Badge, Notice, Page, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { emails } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/dates";

export default async function Outbox() {
  await requireUser("admin");
  const rows = await db.select().from(emails).orderBy(desc(emails.createdAt)).limit(200);
  const delivering = Boolean(process.env.RESEND_API_KEY);

  return (
    <Page>
      <PageHeader eyebrow="Staff" title="Emails" subtitle="Every email JobsU has sent, newest first." />
      {!delivering && (
        <div className="mb-8">
          <Notice tone="amber">Email delivery isn&apos;t connected yet, so these were recorded here but not sent.</Notice>
        </div>
      )}
      <div className="border-b border-line">
        {rows.map((m) => (
          <details key={m.id} className="group rule" data-testid="email">
            <summary className="grid cursor-pointer items-center gap-x-6 gap-y-1 py-5 sm:grid-cols-[1fr_18rem_6rem_auto]">
              <span className="text-[18px] tracking-tight">{m.subject}</span>
              <span className="truncate text-[14px] text-muted">{m.to}</span>
              <span className="text-[13px] text-faint">{timeAgo(m.createdAt)}</span>
              <span className="flex items-center gap-3">
                {m.error && <Badge tone="red">Failed</Badge>}
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line transition-transform duration-500 group-open:rotate-45">
                  <Plus size={15} strokeWidth={1.5} />
                </span>
              </span>
            </summary>
            <pre className="inset mb-6 max-w-[70ch] whitespace-pre-wrap font-sans text-[15px]">{m.body}</pre>
            {m.error && <p className="mb-6 text-[14px] text-red-700">{m.error}</p>}
          </details>
        ))}
        {rows.length === 0 && <p className="rule py-8 text-muted">No emails yet.</p>}
      </div>
    </Page>
  );
}
