import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { applyToJob, markComplete, studentCancelBooking, withdrawApplication } from "@/app/actions/jobs";
import { updateProfileCard } from "@/app/actions/social";
import { PhotoInput } from "@/components/PhotoInput";
import { Baby, Car, Dog, StickyNote, Users } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { JobFacts, Progress, Receipt, ReviewPanel, Timeline, type TimelineEvent } from "@/components/job";
import { Avatar, Back, Badge, BookingStatusBadge, Field, Notice, Page, Rate, Stars, photoUrl } from "@/components/ui";
import { db } from "@/db";
import { applications, bookings, conversations, jobs, residentProfiles, studentProfiles, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { PLATFORM_FEE_BPS } from "@/lib/config";
import { transportOption } from "@/lib/jobTypes";
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
  const [home] = await db.select().from(residentProfiles).where(eq(residentProfiles.userId, resident.id)).limit(1);
  const [me] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id)).limit(1);
  // The first application also fills in the basics of the student's profile.
  const needPhoto = !user.photoAt;
  const needBasics = !me?.gradYear || !me?.bio;
  const cardEmpty = !me?.hometown && !me?.gettingAround && (me?.funFacts.length ?? 0) === 0;
  const thisYear = new Date().getFullYear();
  const transport = transportOption(job.transport);
  const residentRating = (await ratingsFor([resident.id])).get(resident.id)!;
  const [convo] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.jobId, job.id), eq(conversations.studentId, user.id)))
    .limit(1);
  const estimate = job.rateCents != null ? settle(job.rateCents, job.estMinutes, jobTotalCents(job.rateCents, job.estMinutes)) : null;
  const canApply = !mine && job.status === "open" && !app;

  const events: TimelineEvent[] = [{ at: job.createdAt, text: `${resident.firstName} posted this job` }];
  if (app) events.push({ at: app.createdAt, text: "You sent your application" });
  if (mine) {
    events.push({ at: mine.createdAt, text: `${resident.firstName} booked you` });
    if (mine.studentCompletedAt) events.push({ at: mine.studentCompletedAt, text: "You marked the job done" });
    if (mine.disputedAt) events.push({ at: mine.disputedAt, text: `${resident.firstName} raised a problem` });
    if (mine.releasedAt) events.push({ at: mine.releasedAt, text: "You were paid" });
    if (mine.cancelledAt) events.push({ at: mine.cancelledAt, text: "The job was cancelled" });
  }

  return (
    <Page>
      <Back href="/student/jobs">All jobs</Back>
      <div className="mt-6 grid items-start gap-10 lg:grid-cols-[1fr_23rem] lg:gap-14">
        <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-3">
        {mine ? <BookingStatusBadge status={mine.status} /> : app?.status === "applied" ? <Badge tone="green">Applied</Badge> : <Badge tone="blue">Open</Badge>}
      </div>
      <h1 className="title mt-4 max-w-[24ch]">{job.title}</h1>
      <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
        Posted by {resident.firstName} in {job.town}
        <Stars rating={residentRating.average} count={residentRating.count} />
      </p>
      {mine && (
        <div className="mt-8">
          <Progress job={job.status} booking={mine.status} />
        </div>
      )}

        <div className="mt-10 space-y-12">
          {mine?.status === "completed" && <ReviewPanel booking={mine} viewerId={user.id} otherName={resident.firstName} />}
          <JobFacts job={job} showLandmark={Boolean(mine)} />

          {/* What the family told us about their home and the job set-up. */}
          <section className="rounded-xl border border-line p-6" data-testid="about-family">
            <div className="flex items-center gap-4">
              <Avatar name={resident.firstName} size={48} src={photoUrl(resident)} />
              <div>
                <p className="text-[19px] tracking-tight text-ink">
                  {resident.firstName} {mine ? resident.lastName : resident.lastName ? `${resident.lastName[0]}.` : ""}
                </p>
                <p className="text-[14px] text-muted">
                  {job.town}
                  {mine ? "" : " · Full name and address shared once you're booked"}
                </p>
              </div>
            </div>
            <ul className="mt-5 grid gap-3 text-[15px] text-ink sm:grid-cols-2">
              {job.studentsNeeded > 1 && (
                <li className="flex items-center gap-2.5">
                  <Users size={16} strokeWidth={1.5} className="text-faint" /> Hiring {job.studentsNeeded} students
                </li>
              )}
              {transport && (
                <li className="flex items-center gap-2.5">
                  <Car size={16} strokeWidth={1.5} className="text-faint" /> {transport.label}
                </li>
              )}
              {home?.hasPets && (
                <li className="flex items-center gap-2.5">
                  <Dog size={16} strokeWidth={1.5} className="text-faint" /> Pets at home
                </li>
              )}
              {home?.hasKids && (
                <li className="flex items-center gap-2.5">
                  <Baby size={16} strokeWidth={1.5} className="text-faint" /> Children at home
                </li>
              )}
            </ul>
            {home?.notesForStudents && (
              <p className="inset mt-5 flex gap-2.5 text-[15px] text-ink">
                <StickyNote size={16} strokeWidth={1.5} className="mt-1 shrink-0 text-faint" />
                {home.notesForStudents}
              </p>
            )}
          </section>
        </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28">
          {canApply && (
            <section className="glass rounded-xl p-6">
              <Rate cents={job.rateCents} size="lg" />
              {estimate && (
                <p className="mt-3 text-[15px] text-muted">
                  {formatHours(job.estMinutes)} booked. You&apos;d earn about{" "}
                  <span className="text-ink">{formatCents(estimate.payoutCents)}</span> after the {PLATFORM_FEE_BPS / 100}% JobsU fee.
                </p>
              )}
              <ActionForm action={applyToJob} className="rule mt-5 space-y-5 pt-5">
                <input type="hidden" name="jobId" value={job.id} />
                {(needPhoto || needBasics) && (
                  <div className="space-y-4 rounded-lg bg-tint p-4">
                    <div>
                      <p className="text-[15px] text-ink">First, a little about you</p>
                      <p className="text-[13px] text-muted">{resident.firstName} sees this when deciding who to pick. You only fill it in once.</p>
                    </div>
                    {needPhoto && (
                      <Field label="Profile photo">
                        <PhotoInput required />
                      </Field>
                    )}
                    {!me?.gradYear && (
                      <Field label="Class year">
                        <select name="gradYear" className="input" required defaultValue="">
                          <option value="" disabled>
                            Select year
                          </option>
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <option key={n}>{thisYear + n}</option>
                          ))}
                        </select>
                      </Field>
                    )}
                    {!me?.bio && (
                      <>
                        <Field label="Short bio" hint="What you're studying and the kind of work you've done. Families see your first name and last initial.">
                          <textarea name="bio" className="input min-h-20" required minLength={20} maxLength={500} />
                        </Field>
                        <fieldset>
                          <legend className="label">Do you have access to a car?</legend>
                          <div className="flex gap-4 text-ink">
                            <label className="flex items-center gap-2">
                              <input type="radio" name="hasCar" value="yes" required /> Yes
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="radio" name="hasCar" value="no" /> No
                            </label>
                          </div>
                        </fieldset>
                      </>
                    )}
                  </div>
                )}
                <Field label="Why are you a good fit for this one?" hint="A sentence or two. This is the first thing the family reads.">
                  <textarea
                    name="note"
                    className="input min-h-24"
                    required
                    minLength={20}
                    maxLength={600}
                    placeholder="What you've done before, or what you'd bring to this job."
                  />
                </Field>
                <SubmitButton className="btn btn-primary w-full">Apply</SubmitButton>
                <p className="text-[12px] leading-snug text-faint">
                  By applying, you agree to do this and any future work with this family through JobsU.
                </p>
              </ActionForm>
            </section>
          )}

          {!mine && app?.status === "withdrawn" && (
            <Notice tone="slate">You withdrew your application for this job.</Notice>
          )}

          {app?.status === "applied" && !mine && cardEmpty && (
            <section className="glass rounded-xl p-6" data-testid="profile-card-prompt">
              <h2 className="text-[22px] tracking-tight">Your application is in</h2>
              <p className="mt-1 text-[14px] text-muted">A few things families like to know. All optional.</p>
              <ActionForm action={updateProfileCard} className="mt-5 space-y-4">
                <input type="hidden" name="jobId" value={job.id} />
                <Field label="Where are you from?">
                  <input name="hometown" className="input" maxLength={80} placeholder="Newton, MA" />
                </Field>
                <Field label="How do you get around?">
                  <input name="gettingAround" className="input" maxLength={160} placeholder="I have a car, so I can get to jobs a short drive from campus." />
                </Field>
                <Field label="Two things worth knowing about you">
                  <input name="fact1" className="input" maxLength={100} placeholder="Coached my little brother's soccer team" />
                  <input name="fact2" className="input mt-2" maxLength={100} placeholder="Grew up with two golden retrievers" />
                </Field>
                <SubmitButton className="btn btn-primary w-full">Save</SubmitButton>
              </ActionForm>
            </section>
          )}

          {app?.status === "applied" && !mine && (
            <section className="glass rounded-xl p-6">
              <h2 className="text-[22px] tracking-tight">You applied</h2>
              <p className="mt-2 text-[15px] text-muted">
                We&apos;ll email you if {resident.firstName} picks you. You can message them in the meantime.
              </p>
              <div className="mt-5 grid gap-2">
                {convo && (
                  <Link href={`/messages/${convo.id}`} className="btn btn-primary btn-sm">
                    Message {resident.firstName}
                  </Link>
                )}
                <ActionForm action={withdrawApplication}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <SubmitButton className="btn btn-outline btn-sm w-full">Withdraw</SubmitButton>
                </ActionForm>
              </div>
            </section>
          )}

          {(app?.status === "declined" || app?.status === "passed") && <Notice tone="slate">The family went with another student for this job.</Notice>}

          {mine?.status === "authorized" && (
            <section className="glass rounded-xl p-6">
              <h2 className="text-[22px] tracking-tight">You got the job</h2>
              <p className="mt-2 text-[15px] text-muted">
                {resident.firstName} booked you. Payment is held by JobsU and released when the job is done.
              </p>
              {convo && (
                <Link href={`/messages/${convo.id}`} className="btn btn-outline btn-sm mt-5 w-full">
                  Message {resident.firstName}
                </Link>
              )}
              <ActionForm action={markComplete} className="rule mt-5 space-y-4 pt-5">
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
                <SubmitButton className="btn btn-primary w-full">Mark job as done</SubmitButton>
              </ActionForm>
              <details className="mt-4">
                <summary className="cursor-pointer text-[14px] text-muted hover:text-ink">Can&apos;t make it?</summary>
                <ActionForm action={studentCancelBooking} className="mt-3">
                  <input type="hidden" name="bookingId" value={mine.id} />
                  <SubmitButton className="btn btn-danger btn-sm w-full">Cancel this booking</SubmitButton>
                </ActionForm>
                <p className="hint">Cancelling a booked job counts against your profile, so please only do it if you must.</p>
              </details>
            </section>
          )}

          {mine?.status === "completed_pending" && (
            <section className="glass rounded-xl p-6">
              <h2 className="text-[22px] tracking-tight">Waiting for {resident.firstName}</h2>
              <p className="mt-2 text-[15px] text-muted">
                You marked this done ({formatHours(mine.actualMinutes!)}). You&apos;ll be paid when {resident.firstName} confirms, or
                automatically 7 days after the job date.
              </p>
            </section>
          )}

          {mine?.status === "disputed" && (
            <Notice tone="red">
              {resident.firstName} raised a problem with this job. Payment is paused while JobsU looks into it, and we&apos;ll be
              in touch.
            </Notice>
          )}

          {mine?.status === "cancelled" && <Notice tone="slate">This job was cancelled. You weren&apos;t charged a fee.</Notice>}

          {mine?.status === "completed" && <Receipt booking={mine} forStudent />}

          <section className="rounded-xl border border-line p-6">
            <h2 className="caption text-muted">Activity</h2>
            <div className="mt-5">
              <Timeline events={events} />
            </div>
          </section>
        </aside>
      </div>
    </Page>
  );
}
