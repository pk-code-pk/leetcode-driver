import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Wallet } from "lucide-react";
import { refreshPayoutStatus, startPayoutSetup } from "@/app/actions/social";
import { ActionForm, SubmitButton } from "@/components/forms";
import { CountUp } from "@/components/motion";
import { BookingStatusBadge, JobTile, Notice, Page, PageHeader, SectionTitle } from "@/components/ui";
import { db } from "@/db";
import { bookings, jobs, studentProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { PLATFORM_FEE_BPS } from "@/lib/config";
import { formatDate } from "@/lib/dates";
import { formatCents, formatHours, formatRate, jobTotalCents } from "@/lib/money";
import { paymentsProvider } from "@/lib/payments";

const STEPS: [string, string][] = [
  ["A family books you", "Their payment is held by JobsU, so the money is there before you start."],
  ["You do the job", "Mark it done with the hours you worked."],
  ["You get paid", "The family confirms, the 10% service fee comes out, and the rest goes to your bank account."],
];

export default async function Payouts() {
  const user = await requireUser("student");
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id)).limit(1);
  const live = paymentsProvider() === "stripe";

  const rows = await db
    .select({ booking: bookings, job: jobs })
    .from(bookings)
    .innerJoin(jobs, eq(jobs.id, bookings.jobId))
    .where(and(eq(bookings.studentId, user.id), inArray(bookings.status, ["authorized", "completed_pending", "completed"])))
    .orderBy(desc(bookings.scheduledFor));
  const paid = rows.filter((r) => r.booking.status === "completed");
  const pending = rows.filter((r) => r.booking.status !== "completed");
  // What a job still in progress should pay out, after the service fee.
  const expected = (b: (typeof rows)[number]["booking"]) =>
    Math.round(jobTotalCents(b.rateCents, b.actualMinutes ?? b.estMinutes) * (1 - PLATFORM_FEE_BPS / 10000));
  const earned = paid.reduce((sum, r) => sum + (r.booking.payoutCents ?? 0), 0);
  const onTheWay = pending.reduce((sum, r) => sum + expected(r.booking), 0);
  const fees = paid.reduce((sum, r) => sum + (r.booking.feeCents ?? 0), 0);

  return (
    <Page>
      <PageHeader eyebrow="For students" title="Earnings" subtitle="What you've been paid, and what's on the way." />

      <div className="grid items-start gap-10 lg:grid-cols-[1fr_23rem] lg:gap-14">
        <div className="min-w-0 space-y-12">
          <dl className="grid grid-cols-2 border-y border-line sm:grid-cols-3">
            <div className="py-6">
              <dt className="caption">Paid to you</dt>
              <dd className="mt-2 text-[40px] leading-none tracking-tight">
                <CountUp value={earned / 100} prefix="$" decimals={earned % 100 ? 2 : 0} />
              </dd>
            </div>
            <div className="border-l border-line py-6 pl-6">
              <dt className="caption">On the way</dt>
              <dd className="mt-2 text-[40px] leading-none tracking-tight">
                <CountUp value={onTheWay / 100} prefix="$" decimals={onTheWay % 100 ? 2 : 0} />
              </dd>
            </div>
            <div className="col-span-2 border-t border-line py-6 sm:col-span-1 sm:border-l sm:border-t-0 sm:pl-6">
              <dt className="caption">Jobs paid</dt>
              <dd className="mt-2 text-[40px] leading-none tracking-tight">
                <CountUp value={paid.length} />
              </dd>
            </div>
          </dl>

          {rows.length === 0 && (
            <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
              <span className="tile mx-auto mb-5 h-14 w-14">
                <Wallet size={24} strokeWidth={1.4} />
              </span>
              <p className="text-[22px] tracking-tight">No earnings yet</p>
              <p className="mx-auto mt-1 max-w-sm text-muted">Once a family books you, the job and what it pays will show up here.</p>
              <Link href="/student/jobs" className="btn btn-primary mt-6">
                Find jobs
              </Link>
            </div>
          )}

          {pending.length > 0 && (
            <section>
              <SectionTitle count={pending.length}>On the way</SectionTitle>
              <div className="rows mt-5">
                {pending.map(({ booking, job }) => (
                  <Link key={booking.id} href={`/student/jobs/${job.id}`} className="row group">
                    <span className="hidden sm:block">
                      <JobTile type={job.type} size={44} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[18px] tracking-tight">{job.title}</p>
                      <p className="mt-0.5 text-[14px] text-muted">
                        {formatDate(booking.scheduledFor)} · {formatHours(booking.actualMinutes ?? booking.estMinutes)} at{" "}
                        {formatRate(booking.rateCents)}
                      </p>
                    </div>
                    <span className="hidden sm:block">
                      <BookingStatusBadge status={booking.status} />
                    </span>
                    <p className="num w-24 text-right text-[20px] tracking-tight text-muted">{formatCents(expected(booking))}</p>
                  </Link>
                ))}
              </div>
              <p className="mt-3 text-[13px] text-faint">
                Estimates after the 10% service fee. Payment is released when the family confirms, or automatically 7 days after the
                job date.
              </p>
            </section>
          )}

          {paid.length > 0 && (
            <section>
              <SectionTitle count={paid.length}>Paid</SectionTitle>
              <div className="rows mt-5">
                {paid.map(({ booking, job }) => (
                  <Link key={booking.id} href={`/student/jobs/${job.id}`} className="row group" data-testid="payout">
                    <span className="hidden sm:block">
                      <JobTile type={job.type} size={44} green />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[18px] tracking-tight">{job.title}</p>
                      <p className="mt-0.5 text-[14px] text-muted">
                        {booking.releasedAt ? `Paid ${formatDate(booking.releasedAt.toISOString().slice(0, 10))}` : "Paid"} ·{" "}
                        {formatHours(booking.actualMinutes ?? booking.estMinutes)} at {formatRate(booking.rateCents)}
                      </p>
                    </div>
                    <p className="hidden w-32 text-right text-[13px] leading-snug text-faint sm:block">
                      {formatCents(booking.amountCents ?? 0)} job
                      <br />−{formatCents(booking.feeCents ?? 0)} fee
                    </p>
                    <p className="num w-24 text-right text-[20px] tracking-tight text-ink">{formatCents(booking.payoutCents ?? 0)}</p>
                  </Link>
                ))}
              </div>
              {fees > 0 && <p className="mt-3 text-[13px] text-faint">Service fees so far: {formatCents(fees)}.</p>}
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28">
          <section className="glass rounded-xl p-6">
            <h2 className="caption text-muted">Where your money goes</h2>
            <div className="mt-4 space-y-4">
              {!live ? (
                <Notice>Payments are running in test mode here, so payouts are simulated and there&apos;s nothing to set up yet.</Notice>
              ) : profile.payoutsEnabled ? (
                <Notice tone="green">Payouts are set up. You&apos;re ready to be booked.</Notice>
              ) : (
                <>
                  <p className="text-muted">Connect your bank account through Stripe so families can book you. It takes about 5 minutes.</p>
                  <ActionForm action={startPayoutSetup}>
                    <SubmitButton className="btn btn-primary w-full">{profile.stripeAccountId ? "Continue setup" : "Set up payouts"}</SubmitButton>
                  </ActionForm>
                  {profile.stripeAccountId && (
                    <ActionForm action={refreshPayoutStatus}>
                      <SubmitButton className="btn btn-outline w-full">I&apos;ve finished — check again</SubmitButton>
                    </ActionForm>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-line p-6">
            <h2 className="caption text-muted">How getting paid works</h2>
            <ol className="mt-4">
              {STEPS.map(([title, body], i) => (
                <li key={title} className="grid grid-cols-[2rem_1fr] gap-2 border-t border-line py-4 first:border-t-0 first:pt-0 last:pb-0">
                  <span className="num pt-0.5 text-[13px] text-faint">0{i + 1}</span>
                  <span>
                    <span className="block text-[17px] tracking-tight">{title}</span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-muted">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </Page>
  );
}
