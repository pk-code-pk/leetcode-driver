import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { resolveDispute } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Page, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { bookings, conversations, jobs, messages, reports, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/dates";
import { formatCents } from "@/lib/money";

export default async function AdminHome() {
  await requireUser("admin");

  const [counts] = await db
    .select({
      residents: sql<number>`(select count(*)::int from ${users} where role = 'resident')`,
      students: sql<number>`(select count(*)::int from ${users} where role = 'student')`,
      openJobs: sql<number>`(select count(*)::int from ${jobs} where status = 'open')`,
      pendingJobs: sql<number>`(select count(*)::int from ${jobs} where status = 'pending_review')`,
      completed: sql<number>`(select count(*)::int from ${bookings} where status = 'completed')`,
      volume: sql<number>`(select coalesce(sum(amount_cents), 0)::int from ${bookings} where status = 'completed')`,
      fees: sql<number>`(select coalesce(sum(fee_cents), 0)::int from ${bookings} where status = 'completed')`,
      openReports: sql<number>`(select count(*)::int from ${reports} where status = 'open')`,
    })
    .from(sql`(select 1) as one`);

  const disputes = await db
    .select({ booking: bookings, jobTitle: jobs.title })
    .from(bookings)
    .innerJoin(jobs, eq(jobs.id, bookings.jobId))
    .where(eq(bookings.status, "disputed"));

  const flagged = await db
    .select({ message: messages, sender: users.email, conversationId: conversations.id })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(eq(messages.flagged, true))
    .orderBy(desc(messages.createdAt))
    .limit(20);

  const stats: [string, string | number, string?][] = [
    ["Residents", counts.residents],
    ["Students", counts.students],
    ["Open jobs", counts.openJobs],
    ["Jobs to review", counts.pendingJobs, "/admin/jobs"],
    ["Open reports", counts.openReports, "/admin/reports"],
    ["Jobs completed", counts.completed],
    ["Paid through JobsU", formatCents(counts.volume)],
    ["JobsU fees earned", formatCents(counts.fees)],
  ];

  return (
    <Page>
      <PageHeader eyebrow="Staff" title="Overview" />
      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map(([label, value, href]) => {
          const body = (
            <>
              <p className="label">{label}</p>
              <p className="text-3xl font-black">{value}</p>
            </>
          );
          return href ? (
            <Link key={label} href={href} className="card hover:border-blue">
              {body}
            </Link>
          ) : (
            <div key={label} className="card">
              {body}
            </div>
          );
        })}
      </div>

      <section className="mt-10">
        <p className="eyebrow">Problems raised on bookings</p>
        {disputes.length === 0 ? (
          <p className="mt-3 text-sm font-medium text-muted">None right now.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {disputes.map(({ booking, jobTitle }) => (
              <div key={booking.id} className="card">
                <p className="text-lg font-extrabold">{jobTitle}</p>
                <p className="mt-1 text-sm font-medium text-muted">
                  Held: {formatCents(booking.authorizedCents)} · raised {booking.disputedAt ? timeAgo(booking.disputedAt) : ""}
                </p>
                <p className="mt-3 rounded-xl bg-ice px-4 py-3 text-sm font-medium">{booking.disputeReason}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionForm action={resolveDispute}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <SubmitButton className="btn btn-green" name="decision" value="release">
                      Pay the student
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm action={resolveDispute}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <SubmitButton className="btn btn-danger" name="decision" value="refund">
                      Don&apos;t charge the resident
                    </SubmitButton>
                  </ActionForm>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <p className="eyebrow">Flagged messages</p>
        <p className="hint">Messages that mention paying outside JobsU or share contact details before booking.</p>
        {flagged.length === 0 ? (
          <p className="mt-3 text-sm font-medium text-muted">None yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {flagged.map(({ message, sender }) => (
              <div key={message.id} className="card">
                <p className="text-sm font-bold">
                  {sender} <span className="font-medium text-muted">· {timeAgo(message.createdAt)}</span>
                </p>
                <p className="mt-1 text-sm font-medium">{message.body}</p>
                <p className="mt-2 flex flex-wrap gap-2">
                  {message.flagReasons.map((r) => (
                    <span key={r} className="badge bg-amber-100 text-amber-800">
                      {r}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}
