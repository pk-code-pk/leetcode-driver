import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { cancelJob, confirmComplete, disputeBooking, selectApplicant } from "@/app/actions/jobs";
import { ActionForm, SubmitButton } from "@/components/forms";
import { JobFacts, Receipt, ReviewPanel } from "@/components/job";
import { Avatar, BookingStatusBadge, EduBadge, Field, JobStatusBadge, Page, Stars } from "@/components/ui";
import { db } from "@/db";
import { applications, bookings, conversations, jobs, studentProfiles, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatCents, formatHours, jobTotalCents } from "@/lib/money";
import { completedJobCounts, publicName, ratingsFor } from "@/lib/queries";

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
  const [ratings, completed] = await Promise.all([ratingsFor(ids), completedJobCounts(ids)]);
  const convos = await db.select().from(conversations).where(eq(conversations.jobId, job.id));
  const convoFor = (studentId: string) => convos.find((c) => c.studentId === studentId)?.id;

  const booked = activeBooking ? applicants.find((a) => a.user.id === activeBooking.studentId) : null;
  const total = job.rateCents != null ? jobTotalCents(job.rateCents, job.estMinutes) : null;
  // Recommended students first.
  const open = applicants
    .filter((a) => a.app.status === "applied")
    .sort((a, b) => Number(b.app.recommended) - Number(a.app.recommended));

  return (
    <Page>
      <Link href="/resident/jobs" className="text-sm font-bold text-muted hover:text-blue">
        ← Your jobs
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="title">{job.title}</h1>
        <JobStatusBadge status={job.status} />
      </div>

      {posted && job.status === "open" && (
        <p className="mt-4 rounded-xl border border-green-200 bg-green-bg px-4 py-3 text-sm font-semibold text-green-deep">
          Your job is live. We&apos;ve let matching students know, and we&apos;ll email you as they apply.
        </p>
      )}
      {paid === "0" && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Payment wasn&apos;t completed, so nobody is booked yet. Pick a student again when you&apos;re ready.
        </p>
      )}
      {job.status === "pending_review" && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          We&apos;re taking a quick look at this job before it goes live
          {job.rateCents == null ? " and will suggest a fair rate" : ""}. You&apos;ll get an email shortly.
        </p>
      )}
      {job.status === "cancelled" && job.adminNote && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {job.adminNote}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <JobFacts job={job} showLandmark />

          {job.status === "open" && (
            <section>
              <p className="eyebrow">Applicants</p>
              {open.length === 0 ? (
                <div className="card mt-3 text-sm font-medium text-muted">
                  No one has applied yet. Students usually respond within a day, and we&apos;ll email you when they do.
                </div>
              ) : (
                <div className="mt-3 space-y-4">
                  {open.map(({ app, user: s, profile }) => (
                    <div key={app.id} className="card" data-testid="applicant">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={publicName(s)} size={48} />
                          <div>
                            <p className="text-lg font-extrabold tracking-tight">{publicName(s)}</p>
                            <p className="text-sm font-medium text-muted">
                              {profile.school}
                              {profile.gradYear ? ` · Class of ${profile.gradYear}` : ""}
                              {profile.major ? ` · ${profile.major}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {app.recommended && <span className="badge bg-blue text-white">★ JobsU pick</span>}
                          <EduBadge />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-medium text-muted">
                        <Stars rating={ratings.get(s.id)?.average ?? null} count={ratings.get(s.id)?.count} />
                        <span>{completed.get(s.id) ?? 0} jobs completed</span>
                        {profile.hasCar && <span>🚗 Has a car</span>}
                      </div>
                      {profile.bio && <p className="mt-3 text-sm font-medium leading-relaxed">{profile.bio}</p>}
                      {app.note && (
                        <p className="mt-3 rounded-xl bg-ice px-4 py-3 text-sm font-medium">
                          <span className="label">Note from {s.firstName}</span>
                          {app.note}
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <ActionForm action={selectApplicant}>
                          <input type="hidden" name="applicationId" value={app.id} />
                          <SubmitButton>Book {s.firstName}</SubmitButton>
                        </ActionForm>
                        <Link href={`/students/${s.id}`} className="btn btn-outline">
                          View profile
                        </Link>
                        {convoFor(s.id) && (
                          <Link href={`/messages/${convoFor(s.id)}`} className="btn btn-outline">
                            Message
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                  {total != null && (
                    <p className="hint">
                      Booking places a hold of {formatCents(total)} ({formatHours(job.estMinutes)}) on your card. You&apos;re
                      only charged once the job is done.
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {activeBooking?.status === "completed" && booked && (
            <ReviewPanel booking={activeBooking} viewerId={user.id} otherName={booked.user.firstName} />
          )}
        </div>

        <aside className="space-y-6">
          {activeBooking && booked && (
            <div className="card">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Your student</p>
                <BookingStatusBadge status={activeBooking.status} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={`${booked.user.firstName} ${booked.user.lastName}`} size={44} />
                <div>
                  <p className="font-extrabold">
                    {booked.user.firstName} {booked.user.lastName}
                  </p>
                  <p className="text-sm font-medium text-muted">{booked.profile.school}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {convoFor(booked.user.id) && (
                  <Link href={`/messages/${convoFor(booked.user.id)}`} className="btn btn-outline">
                    Message
                  </Link>
                )}
                <Link href={`/students/${booked.user.id}`} className="btn btn-outline">
                  Profile
                </Link>
              </div>

              {activeBooking.status === "completed_pending" && (
                <p className="mt-4 rounded-xl bg-ice px-4 py-3 text-sm font-semibold">
                  {booked.user.firstName} marked this done: {formatHours(activeBooking.actualMinutes!)},{" "}
                  {formatCents(jobTotalCents(activeBooking.rateCents, activeBooking.actualMinutes!))}.
                </p>
              )}
              {(activeBooking.status === "authorized" || activeBooking.status === "completed_pending") && (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  <ActionForm action={confirmComplete}>
                    <input type="hidden" name="bookingId" value={activeBooking.id} />
                    <SubmitButton className="btn btn-green w-full">Job done — release payment</SubmitButton>
                  </ActionForm>
                  <details>
                    <summary className="cursor-pointer text-sm font-bold text-muted hover:text-blue">
                      Something went wrong?
                    </summary>
                    <ActionForm action={disputeBooking} className="mt-3 space-y-3">
                      <input type="hidden" name="bookingId" value={activeBooking.id} />
                      <Field label="What happened?">
                        <textarea name="reason" className="input min-h-20" required />
                      </Field>
                      <SubmitButton className="btn btn-danger">Pause payment and get help</SubmitButton>
                    </ActionForm>
                  </details>
                  <p className="hint">
                    If you don&apos;t respond, payment is released automatically 7 days after the job date.
                  </p>
                </div>
              )}
              {activeBooking.status === "disputed" && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                  Payment is paused while we look into this. We&apos;ll email you shortly.
                </p>
              )}
            </div>
          )}

          {activeBooking?.status === "completed" && <Receipt booking={activeBooking} />}

          {(job.status === "open" || job.status === "pending_review" || activeBooking?.status === "authorized") && (
            <div className="card">
              <p className="eyebrow">Change of plans?</p>
              <ActionForm action={cancelJob} className="mt-3">
                <input type="hidden" name="jobId" value={job.id} />
                <SubmitButton className="btn btn-danger">Cancel this job</SubmitButton>
              </ActionForm>
              <p className="hint">Cancelling is free. Any payment hold is released.</p>
            </div>
          )}
        </aside>
      </div>
    </Page>
  );
}
