import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { resolveDispute } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { CountUp } from "@/components/motion";
import { Badge, Page, PageHeader, SectionTitle } from "@/components/ui";
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

  const money = (cents: number) => <CountUp value={cents / 100} prefix="$" decimals={cents % 100 ? 2 : 0} />;
  const stats: [string, React.ReactNode, string?][] = [
    ["Jobs to review", <CountUp key="p" value={counts.pendingJobs} />, "/admin/jobs"],
    ["Open reports", <CountUp key="r" value={counts.openReports} />, "/admin/reports"],
    ["Open jobs", <CountUp key="o" value={counts.openJobs} />, "/admin/jobs"],
    ["Jobs completed", <CountUp key="c" value={counts.completed} />],
    ["Residents", <CountUp key="re" value={counts.residents} />, "/admin/users"],
    ["Students", <CountUp key="s" value={counts.students} />, "/admin/users"],
    ["Paid through JobsU", money(counts.volume)],
    ["JobsU fees earned", money(counts.fees)],
  ];

  return (
    <Page>
      <PageHeader eyebrow="Staff" title="Overview" />

      <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4" style={{ gap: 1 }}>
        {stats.map(([label, value, href]) => {
          const body = (
            <>
              <dt className="caption">{label}</dt>
              <dd className="mt-3 text-[44px] leading-none tracking-tight">{value}</dd>
            </>
          );
          return href ? (
            <Link key={label} href={href} className="group bg-white p-6 transition-colors hover:bg-ice">
              {body}
            </Link>
          ) : (
            <div key={label} className="bg-white p-6">
              {body}
            </div>
          );
        })}
      </dl>

      <section className="mt-16">
        <SectionTitle count={disputes.length}>Problems raised on bookings</SectionTitle>
        {disputes.length === 0 ? (
          <p className="rule mt-5 border-b border-line py-8 text-muted">None right now.</p>
        ) : (
          <div className="mt-5 border-b border-line">
            {disputes.map(({ booking, jobTitle }) => (
              <div key={booking.id} className="rule grid gap-5 py-7 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-[24px] tracking-tight">{jobTitle}</p>
                  <p className="mt-1 text-[14px] text-muted">
                    {formatCents(booking.authorizedCents)} held · raised {booking.disputedAt ? timeAgo(booking.disputedAt) : ""}
                  </p>
                  <p className="inset mt-4 max-w-[60ch]">{booking.disputeReason}</p>
                </div>
                <div className="flex flex-wrap items-start gap-2 lg:flex-col">
                  <ActionForm action={resolveDispute}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <SubmitButton className="btn btn-primary btn-sm w-full" name="decision" value="release">
                      Pay the student
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm action={resolveDispute}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <SubmitButton className="btn btn-outline btn-sm w-full" name="decision" value="refund">
                      Don&apos;t charge the resident
                    </SubmitButton>
                  </ActionForm>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-16">
        <SectionTitle count={flagged.length}>Flagged messages</SectionTitle>
        <p className="mt-2 text-muted">Messages that mention paying outside JobsU or share contact details before booking.</p>
        {flagged.length === 0 ? (
          <p className="rule mt-5 border-b border-line py-8 text-muted">None yet.</p>
        ) : (
          <div className="mt-5 border-b border-line">
            {flagged.map(({ message, sender }) => (
              <div key={message.id} className="rule grid gap-3 py-5 sm:grid-cols-[16rem_1fr]">
                <div>
                  <p className="truncate">{sender}</p>
                  <p className="text-[13px] text-faint">{timeAgo(message.createdAt)}</p>
                </div>
                <div>
                  <p className="text-ink">{message.body}</p>
                  <p className="mt-3 flex flex-wrap gap-2">
                    {message.flagReasons.map((r) => (
                      <Badge key={r} tone="amber">
                        {r}
                      </Badge>
                    ))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}
