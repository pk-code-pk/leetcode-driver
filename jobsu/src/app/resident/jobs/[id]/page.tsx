import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { ShieldCheck } from "lucide-react";
import { cancelJob, confirmComplete, disputeBooking, selectApplicant } from "@/app/actions/jobs";
import { ActionForm, SubmitButton } from "@/components/forms";
import { JobFacts, Progress, Receipt, ReviewPanel, Timeline, type TimelineEvent } from "@/components/job";
import { Avatar, Back, Badge, BookingStatusBadge, Field, JobStatusBadge, Notice, Page, SectionTitle, Stars } from "@/components/ui";
import { db } from "@/db";
import { applications, bookings, conversations, jobs, studentProfiles, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatCents, formatHours, jobTotalCents } from "@/lib/money";
import { completedJobCounts, publicName, ratingsFor, visibleReviewsFor } from "@/lib/queries";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ posted?: string; paid?: string }> };

export default async function ResidentJob({ params, searchParams }: Props) {
  const user = await requireUser("resident");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { posted, paid } = await searchParams;
  const [job] = await db.select().from(jobs).where(and(eq(jobs.id, id), eq(jobs.residentId, user.id))).limit(1);
  if (!job) notFound();

  const [booking] = await db.select().from(bookings).where(eq(bookings.jobId, job.id)).limit(1);
  const activeBooking = booking && booking.status !== "awaiting_payment" ? booking : null;

  const applicants = await db
    .select({ app: applications, user: users, profile: studentProfiles })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.studentId))
    .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(and(eq(applications.jobId, job.id), inArray(applications.status, ["applied", "selected"])));
  const ids = applicants.map((a) => a.user.id);
  const [ratings, completed, reviewRows] = await Promise.all([ratingsFor(ids), completedJobCounts(ids), visibleReviewsFor(ids)]);
  const quoteFor = (studentId: string) => reviewRows.find((r) => r.subjectId === studentId && r.comment);
  const convos = await db.select().from(conversations).where(eq(conversations.jobId, job.id));
  const convoFor = (studentId: string) => convos.find((c) => c.studentId === studentId)?.id;

  const booked = activeBooking ? applicants.find((a) => a.user.id === activeBooking.studentId) : null;
  const total = job.rateCents != null ? jobTotalCents(job.rateCents, job.estMinutes) : null;
  // Recommended students first.
  const open = applicants
    .filter((a) => a.app.status === "applied")
    .sort((a, b) => Number(b.app.recommended) - Number(a.app.recommended));
  const canCancel = job.status === "open" || job.status === "pending_review" || activeBooking?.status === "authorized";

  const events: TimelineEvent[] = [{ at: job.createdAt, text: "You posted this job" }];
  for (const a of applicants) events.push({ at: a.app.createdAt, text: `${publicName(a.user)} applied` });
  if (activeBooking && booked) {
    events.push({ at: activeBooking.createdAt, text: `You booked ${booked.user.firstName}` });
    if (activeBooking.studentCompletedAt) events.push({ at: activeBooking.studentCompletedAt, text: `${booked.user.firstName} marked the job done` });
    if (activeBooking.disputedAt) events.push({ at: activeBooking.disputedAt, text: "You raised a problem and payment was paused" });
    if (activeBooking.releasedAt)
      events.push({
        at: activeBooking.releasedAt,
        text: activeBooking.releaseKind === "auto" ? "Payment was released automatically" : "Payment was released",
      });
    if (activeBooking.cancelledAt) events.push({ at: activeBooking.cancelledAt, text: "The booking was cancelled" });
  }

  return (
    <Page>
      <Back href="/resident/jobs">Your jobs</Back>
      <div className="mt-6 grid items-start gap-10 lg:grid-cols-[1fr_23rem] lg:gap-14">
        <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-3">
        <JobStatusBadge status={job.status} />
        {activeBooking && activeBooking.status !== "authorized" && <BookingStatusBadge status={activeBooking.status} />}
      </div>
      <h1 className="title mt-4 max-w-[24ch]">{job.title}</h1>
      <div className="mt-8">
        <Progress job={job.status} booking={activeBooking?.status} />
      </div>

      <div className="mt-8 space-y-3">
        {posted && job.status === "open" && (
          <Notice tone="green">
            Your job is live. We&apos;ve let matching students know, and we&apos;ll email you as they apply.
          </Notice>
        )}
        {paid === "0" && (
          <Notice tone="amber">
            Payment wasn&apos;t completed, so nobody is booked yet. Pick a student again when you&apos;re ready.
          </Notice>
        )}
        {job.status === "pending_review" && (
          <Notice tone="amber">
            We&apos;re taking a quick look at this job before it goes live
            {job.rateCents == null ? " and will suggest a fair rate" : ""}. You&apos;ll get an email shortly.
          </Notice>
        )}
        {job.status === "cancelled" && job.adminNote && <Notice tone="red">{job.adminNote}</Notice>}
      </div>

        <div className="mt-10 space-y-12">
          {job.status === "open" && (
            <section>
              <SectionTitle count={open.length}>Applicants</SectionTitle>
              {open.length === 0 ? (
                <p className="rule mt-5 max-w-xl border-b border-line py-8 text-muted">
                  No one has applied yet. Students usually respond within a day, and we&apos;ll email you when they do.
                </p>
              ) : (
                <div className="mt-5 border-b border-line">
                  {open.map(({ app, user: s, profile }) => {
                    const quote = quoteFor(s.id);
                    const done = completed.get(s.id) ?? 0;
                    return (
                      <article key={app.id} className="rule grid gap-5 py-7 sm:grid-cols-[auto_1fr_auto]" data-testid="applicant">
                        <Avatar name={publicName(s)} size={64} verified />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-[26px] leading-none tracking-tight">{publicName(s)}</h3>
                            {app.recommended && <Badge tone="blue">JobsU pick</Badge>}
                          </div>
                          <p className="mt-2 text-muted">
                            {profile.school}
                            {profile.gradYear ? ` · Class of ${profile.gradYear}` : ""}
                            {profile.major ? ` · ${profile.major}` : ""}
                          </p>
                          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-muted">
                            <Stars rating={ratings.get(s.id)?.average ?? null} count={ratings.get(s.id)?.count} />
                            <span>
                              {done} {done === 1 ? "job" : "jobs"} completed
                            </span>
                            {profile.hasCar && <span>Has a car</span>}
                          </p>
                          {profile.bio && <p className="mt-4 max-w-[58ch] text-ink">{profile.bio}</p>}
                          {app.note && (
                            <div className="inset mt-4 max-w-[58ch]">
                              <p className="caption">Note from {s.firstName}</p>
                              <p className="mt-1 text-ink">{app.note}</p>
                            </div>
                          )}
                          {quote && (
                            <p className="mt-4 max-w-[58ch] text-[15px] text-muted">
                              “{quote.comment}” <span className="text-faint">— {quote.authorFirstName}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex flex-row flex-wrap gap-2 sm:w-44 sm:flex-col">
                          <ActionForm action={selectApplicant}>
                            <input type="hidden" name="applicationId" value={app.id} />
                            <SubmitButton className="btn btn-primary w-full">Book {s.firstName}</SubmitButton>
                          </ActionForm>
                          {convoFor(s.id) && (
                            <Link href={`/messages/${convoFor(s.id)}`} className="btn btn-outline">
                              Message
                            </Link>
                          )}
                          <Link href={`/students/${s.id}`} className="btn btn-outline">
                            View profile
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              {open.length > 0 && total != null && (
                <p className="mt-4 flex items-start gap-2 text-[14px] text-faint">
                  <ShieldCheck size={16} strokeWidth={1.5} className="mt-px shrink-0" />
                  Booking places a hold of {formatCents(total)} ({formatHours(job.estMinutes)}) on your card. You&apos;re only
                  charged once the job is done.
                </p>
              )}
            </section>
          )}

          {activeBooking?.status === "completed" && booked && (
            <ReviewPanel booking={activeBooking} viewerId={user.id} otherName={booked.user.firstName} />
          )}

          <JobFacts job={job} showLandmark />
        </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28">
          {activeBooking && booked && (
            <section className="glass rounded-xl p-6">
              <h2 className="caption text-muted">Your student</h2>
              <div className="mt-4 flex items-center gap-4">
                <Avatar name={`${booked.user.firstName} ${booked.user.lastName}`} size={52} verified />
                <div>
                  <p className="text-[22px] leading-tight tracking-tight">
                    {booked.user.firstName} {booked.user.lastName}
                  </p>
                  <p className="text-[14px] text-muted">{booked.profile.school}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {convoFor(booked.user.id) && (
                  <Link href={`/messages/${convoFor(booked.user.id)}`} className="btn btn-outline btn-sm">
                    Message
                  </Link>
                )}
                <Link href={`/students/${booked.user.id}`} className="btn btn-outline btn-sm">
                  Profile
                </Link>
              </div>

              {activeBooking.status === "completed_pending" && (
                <div className="inset mt-5 text-[15px] text-ink">
                  {booked.user.firstName} marked this done: {formatHours(activeBooking.actualMinutes!)},{" "}
                  {formatCents(jobTotalCents(activeBooking.rateCents, activeBooking.actualMinutes!))}.
                </div>
              )}
              {(activeBooking.status === "authorized" || activeBooking.status === "completed_pending") && (
                <div className="rule mt-5 space-y-3 pt-5">
                  <ActionForm action={confirmComplete}>
                    <input type="hidden" name="bookingId" value={activeBooking.id} />
                    <SubmitButton className="btn btn-primary w-full">Job done — release payment</SubmitButton>
                  </ActionForm>
                  <p className="text-[13px] leading-snug text-faint">
                    If you don&apos;t respond, payment is released automatically 7 days after the job date.
                  </p>
                  <details>
                    <summary className="cursor-pointer text-[14px] text-muted hover:text-ink">Something went wrong?</summary>
                    <ActionForm action={disputeBooking} className="mt-3 space-y-3">
                      <input type="hidden" name="bookingId" value={activeBooking.id} />
                      <Field label="What happened?">
                        <textarea name="reason" className="input min-h-24" required />
                      </Field>
                      <SubmitButton className="btn btn-danger w-full">Pause payment and get help</SubmitButton>
                    </ActionForm>
                  </details>
                </div>
              )}
              {activeBooking.status === "disputed" && (
                <div className="mt-5">
                  <Notice tone="red">Payment is paused while we look into this. We&apos;ll email you shortly.</Notice>
                </div>
              )}
            </section>
          )}

          {activeBooking?.status === "completed" && <Receipt booking={activeBooking} />}

          <section className="rounded-xl border border-line p-6">
            <h2 className="caption text-muted">Activity</h2>
            <div className="mt-5">
              <Timeline events={events} />
            </div>
          </section>

          {canCancel && (
            <details className="px-1">
              <summary className="cursor-pointer text-[14px] text-faint hover:text-ink">Change of plans? Cancel this job</summary>
              <ActionForm action={cancelJob} className="mt-3">
                <input type="hidden" name="jobId" value={job.id} />
                <SubmitButton className="btn btn-danger btn-sm">Cancel this job</SubmitButton>
              </ActionForm>
              <p className="hint">Cancelling is free. Any payment hold is released.</p>
            </details>
          )}
        </aside>
      </div>
    </Page>
  );
}
