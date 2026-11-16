import { desc } from "drizzle-orm";
import { Page, PageHeader } from "@/components/ui";
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
      <PageHeader
        eyebrow="Staff"
        title="Emails"
        subtitle={
          delivering
            ? "Every email JobsU has sent, newest first."
            : "Email delivery isn't connected yet, so these were recorded here but not sent."
        }
      />
      <div className="space-y-3">
        {rows.map((m) => (
          <details key={m.id} className="card" data-testid="email">
            <summary className="cursor-pointer">
              <span className="font-extrabold">{m.subject}</span>
              <span className="block text-sm font-medium text-muted">
                To {m.to} · {timeAgo(m.createdAt)}
                {m.error && <span className="ml-2 font-bold text-red-700">Failed: {m.error}</span>}
              </span>
            </summary>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-ice px-4 py-3 font-sans text-sm font-medium">{m.body}</pre>
          </details>
        ))}
        {rows.length === 0 && <p className="text-sm font-medium text-muted">No emails yet.</p>}
      </div>
    </Page>
  );
}
