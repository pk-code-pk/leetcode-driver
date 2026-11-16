import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { applyToJob, markComplete, studentCancelBooking, withdrawApplication } from "@/app/actions/jobs";
import { ActionForm, SubmitButton } from "@/components/forms";
import { JobFacts, Receipt, ReviewPanel } from "@/components/job";
import { BookingStatusBadge, Field, Page, Stars } from "@/components/ui";
import { db } from "@/db";
import { applications, bookings, conversations, jobs, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { PLATFORM_FEE_BPS } from "@/lib/config";
import { formatCents, formatHours, jobTotalCents, settle } from "@/lib/money";
import { ratingsFor } from "@/lib/queries";

type Props = { params: Promise<{ id: string }> };

export default async function StudentJob({ params }: Props) {
  const user = await requireUser("student");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) notFound();

  const [app] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.jobId, job.id), eq(applications.studentId, user.id)))
    .limit(1);
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.jobId, job.id), eq(bookings.studentId, user.id)))
    .limit(1);
  const mine = booking && booking.status !== "awaiting_payment" ? booking : null;

  // Students can see open jobs, and jobs they applied to or were booked for.
  if (job.status !== "open" && !app && !mine) notFound();

  const [resident] = await db.select().from(users).where(eq(users.id, job.residentId)).limit(1);
  const residentRating = (await ratingsFor([resident.id])).get(resident.id)!;
  const [convo] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.jobId, job.id), eq(conversations.studentId, user.id)))
    .limit(1);
  const estimate = job.rateCents != null ? settle(job.rateCents, job.estMinutes, jobTotalCents(job.rateCents, job.estMinutes)) : null;

  return (
    <Page>
      <Link href="/student/jobs" className="text-sm font-bold text-muted hover:text-green-dark">
        ← All jobs
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="title">{job.title}</h1>
        {mine && <BookingStatusBadge status={mine.status} />}
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-muted">
        Posted by {resident.firstName} in {job.town}
        <Stars rating={residentRating.average} count={residentRating.count} />
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <JobFacts job={job} showLandmark />
          {mine?.status === "completed" && (
            <ReviewPanel booking={mine} viewerId={user.id} otherName={resident.firstName} />
          )}
        </div>

        <aside className="space-y-6">
          {!mine && job.status === "open" && (!app || app.status === "withdrawn") && (
            <div className="card">
              <p className="eyebrow-green">Interested?</p>
              {estimate && (
                <p className="mt-2 text-sm font-medium text-muted">
                  You&apos;d earn about{" "}
                  <span className="font-extrabold text-green-deep">{formatCents(estimate.payoutCents)}</span> after the{" "}
                  {PLATFORM_FEE_BPS / 100}% JobsU fee.
                </p>
              )}
              {app?.status === "withdrawn" ? (
                <p className="mt-3 text-sm font-semibold text-muted">You withdrew your application for this job.</p>
              ) : (
                <ActionForm action={applyToJob} className="mt-4 space-y-3">
                  <input type="hidden" name="jobId" value={job.id} />
                  <Field label="Add a note (optional)">
                    <textarea
                      name="note"
                      className="input min-h-20"
                      maxLength={600}
                      placeholder="Why you're a good fit, or a question for the family."
                    />
                  </Field>
                  <SubmitButton className="btn btn-green w-full">Apply in one click</SubmitButton>
                </ActionForm>
              )}
            </div>
          )}

          {app?.status === "applied" && !mine && (
            <div className="card">
              <p className="eyebrow-green">You applied</p>
              <p className="mt-2 text-sm font-medium text-muted">
                We&apos;ll email you if {resident.firstName} picks you. You can message them in the meantime.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {convo && (
                  <Link href={`/messages/${convo.id}`} className="btn btn-outline">
                    Message {resident.firstName}
                  </Link>
                )}
                <ActionForm action={withdrawApplication}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <SubmitButton className="btn btn-danger">Withdraw</SubmitButton>
                </ActionForm>
              </div>
            </div>
          )}

          {app?.status === "declined" && (
            <div className="card text-sm font-semibold text-muted">The family went with another student for this job.</div>
          )}

          {mine?.status === "authorized" && (
            <div className="card">
              <p className="eyebrow-green">You got the job</p>
              <p className="mt-2 text-sm font-medium text-muted">
                {resident.firstName} booked you. Payment is held by JobsU and released when the job is done.
              </p>
              {convo && (
                <Link href={`/messages/${convo.id}`} className="btn btn-outline mt-4">
                  Message {resident.firstName}
                </Link>
              )}
              <ActionForm action={markComplete} className="mt-4 space-y-3 border-t border-line pt-4">
                <input type="hidden" name="bookingId" value={mine.id} />
                <Field label="Hours worked" hint={`Booked for ${formatHours(mine.estMinutes)}.`}>
                  <input
                    name="hours"
                    type="number"
                    className="input"
                    required
                    min={0.25}
                    max={mine.estMinutes / 60}
                    step={0.25}
                    defaultValue={mine.estMinutes / 60}
                  />
                </Field>
                <SubmitButton className="btn btn-green w-full">Mark job as done</SubmitButton>
              </ActionForm>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-bold text-muted hover:text-blue">Can&apos;t make it?</summary>
                <ActionForm action={studentCancelBooking} className="mt-3">
                  <input type="hidden" name="bookingId" value={mine.id} />
                  <SubmitButton className="btn btn-danger">Cancel this booking</SubmitButton>
                </ActionForm>
                <p className="hint">Cancelling a booked job counts against your profile, so please only do it if you must.</p>
              </details>
            </div>
          )}

          {mine?.status === "completed_pending" && (
            <div className="card">
              <p className="eyebrow-green">Waiting for {resident.firstName}</p>
              <p className="mt-2 text-sm font-medium text-muted">
                You marked this done ({formatHours(mine.actualMinutes!)}). You&apos;ll be paid when {resident.firstName}{" "}
                confirms, or automatically 7 days after the job date.
              </p>
            </div>
          )}

          {mine?.status === "disputed" && (
            <div className="card text-sm font-semibold text-red-800">
              {resident.firstName} raised a problem with this job. Payment is paused while JobsU looks into it, and
              we&apos;ll be in touch.
            </div>
          )}

          {mine?.status === "cancelled" && (
            <div className="card text-sm font-semibold text-muted">This job was cancelled. You weren&apos;t charged a fee.</div>
          )}

          {mine?.status === "completed" && <Receipt booking={mine} forStudent />}
        </aside>
      </div>
    </Page>
  );
}
