import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { Car, GraduationCap, Home, Mail, MapPin, Phone, RotateCcw, ShieldCheck, UserPlus } from "lucide-react";
import { cancelJob, confirmComplete, declineApplicant, disputeBooking, selectApplicant } from "@/app/actions/jobs";
import { ActionForm, SubmitButton } from "@/components/forms";
import { JobFacts, Progress, Receipt, ReviewPanel, Timeline, type TimelineEvent } from "@/components/job";
import {
  Avatar,
  Back,
  Badge,
  BookingStatusBadge,
  Field,
  JobStatusBadge,
  Notice,
  Page,
  SectionTitle,
  Stars,
  photoUrl,
} from "@/components/ui";
import { db } from "@/db";
import { applications, bookings, conversations, jobs, studentProfiles, users, type Booking } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { transportOption } from "@/lib/jobTypes";
import { formatCents, formatHours, jobTotalCents } from "@/lib/money";
import { completedJobCounts, publicName, ratingsFor, visibleReviewsFor } from "@/lib/queries";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ posted?: string; paid?: string; a?: string }> };

const NEW_FOR_MS = 2 * 24 * 60 * 60 * 1000;

export default async function ResidentJob({ params, searchParams }: Props) {
  const user = await requireUser("resident");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { posted, paid, a: picked } = await searchParams;
  const [job] = await db.select().from(jobs).where(and(eq(jobs.id, id), eq(jobs.residentId, user.id))).limit(1);
  if (!job) notFound();

  // A job can take several students, so it can have several bookings.
  const jobBookings = (await db.select().from(bookings).where(eq(bookings.jobId, job.id))).filter(
    (b) => b.status !== "awaiting_payment" && b.status !== "cancelled",
  );

  const applicants = await db
    .select({ app: applications, user: users, profile: studentProfiles })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.studentId))
    .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(and(eq(applications.jobId, job.id), inArray(applications.status, ["applied", "selected"])));
  const ids = applicants.map((x) => x.user.id);
  const [ratings, completed, reviewRows] = await Promise.all([ratingsFor(ids), completedJobCounts(ids), visibleReviewsFor(ids)]);
  const quoteFor = (studentId: string) => reviewRows.find((r) => r.subjectId === studentId && r.comment);
  const convos = await db.select().from(conversations).where(eq(conversations.jobId, job.id));
  const convoFor = (studentId: string) => convos.find((c) => c.studentId === studentId)?.id;

  const booked = jobBookings
    .map((b) => ({ booking: b, who: applicants.find((x) => x.user.id === b.studentId) }))
    .filter((x): x is { booking: Booking; who: (typeof applicants)[number] } => Boolean(x.who));
  const total = job.rateCents != null ? jobTotalCents(job.rateCents, job.estMinutes) : null;
  // JobsU picks first, then newest.
  const open = applicants
    .filter((x) => x.app.status === "applied")
    .sort((x, y) => Number(y.app.recommended) - Number(x.app.recommended) || y.app.createdAt.getTime() - x.app.createdAt.getTime());
  const selected = open.find((x) => x.app.id === picked) ?? open[0];
  const placesLeft = Math.max(0, job.studentsNeeded - booked.length);
  const canCancel =
    job.status === "open" || job.status === "pending_review" || (job.status === "booked" && booked.every((b) => b.booking.status === "authorized"));
  const firstStatus = booked[0]?.booking.status;

  const events: TimelineEvent[] = [{ at: job.createdAt, text: "You posted this job" }];
  for (const x of applicants) events.push({ at: x.app.createdAt, text: `${publicName(x.user)} applied` });
  for (const { booking: b, who } of booked) {
    const name = who.user.firstName;
    events.push({ at: b.createdAt, text: `You booked ${name}` });
    if (b.studentCompletedAt) events.push({ at: b.studentCompletedAt, text: `${name} marked the job done` });
    if (b.disputedAt) events.push({ at: b.disputedAt, text: `You raised a problem and ${name}'s payment was paused` });
    if (b.releasedAt)
      events.push({ at: b.releasedAt, text: b.releaseKind === "auto" ? `${name}'s payment was released automatically` : `${name} was paid` });
  }

  return (
    <Page>
      <Back href="/resident/jobs">Your jobs</Back>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <JobStatusBadge status={job.status} />
        {booked.length === 1 && firstStatus && firstStatus !== "authorized" && <BookingStatusBadge status={firstStatus} />}
        {job.studentsNeeded > 1 && (
          <Badge tone="slate">
            {booked.length} of {job.studentsNeeded} students booked
          </Badge>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="title max-w-[24ch]">{job.title}</h1>
        {(job.status === "completed" || job.status === "cancelled") && (
          <Link href={`/resident/jobs/new?from=${job.id}`} className="btn btn-outline">
            <RotateCcw size={16} strokeWidth={1.75} /> Post it again
          </Link>
        )}
      </div>
      <div className="mt-8">
        <Progress job={job.status} booking={booked.length === 1 ? firstStatus : null} />
      </div>

      <div className="mt-8 space-y-3">
        {posted && job.status === "open" && (
          <Notice tone="green">Your job is live. We&apos;ve let matching students know, and we&apos;ll email you as they apply.</Notice>
        )}
        {paid === "0" && (
          <Notice tone="amber">Payment wasn&apos;t completed, so that student isn&apos;t booked yet. Pick them again when you&apos;re ready.</Notice>
        )}
        {job.status === "pending_review" && (
          <Notice tone="amber">
            We&apos;re taking a quick look at this job before it goes live
            {job.rateCents == null ? " and will suggest a fair rate" : ""}. You&apos;ll get an email shortly.
          </Notice>
        )}
        {job.status === "cancelled" && job.adminNote && <Notice tone="red">{job.adminNote}</Notice>}
      </div>

      {job.status === "open" && (
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <SectionTitle count={open.length}>Applicants</SectionTitle>
            {job.studentsNeeded > 1 && (
              <p className="text-[14px] text-muted">
                {placesLeft} {placesLeft === 1 ? "place" : "places"} left to fill
              </p>
            )}
          </div>
          {open.length === 0 ? (
            <p className="rule mt-5 max-w-xl border-b border-line py-8 text-muted">
              No one has applied yet. Students usually respond within a day, and we&apos;ll email you when they do.
            </p>
          ) : (
            <div className="mt-5 grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
              {/* The list: pick someone to see their full profile. */}
              <nav aria-label="Applicants" className="min-w-0 space-y-2">
                {open.map(({ app, user: s, profile }) => {
                  const on = app.id === selected?.app.id;
                  const isNew = Date.now() - app.createdAt.getTime() < NEW_FOR_MS;
                  return (
                    <Link
                      key={app.id}
                      href={`/resident/jobs/${job.id}?a=${app.id}`}
                      scroll={false}
                      aria-current={on ? "true" : undefined}
                      data-testid="applicant-row"
                      className={`flex gap-3 rounded-xl p-3 transition-colors ${
                        on ? "bg-white shadow-[inset_0_0_0_1.5px_var(--color-ink)]" : "hover:bg-tint"
                      }`}
                    >
                      <Avatar name={publicName(s)} size={44} src={photoUrl(s)} verified />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[16px] text-ink">{publicName(s)}</span>
                          {isNew && <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-blue">New</span>}
                          {app.recommended && <Badge tone="blue">JobsU pick</Badge>}
                        </span>
                        <span className="block text-[13px] text-muted">
                          {profile.school}
                          {profile.gradYear ? ` · Class of ${profile.gradYear}` : ""}
                        </span>
                        {app.note && <span className="mt-1 block truncate text-[13px] text-faint">{app.note}</span>}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {selected && <ApplicantDetail x={selected} jobId={job.id} ratings={ratings} completed={completed} quote={quoteFor(selected.user.id)} convo={convoFor(selected.user.id)} canBook={placesLeft > 0} />}
            </div>
          )}
          {open.length > 0 && total != null && (
            <p className="mt-4 flex items-start gap-2 text-[14px] text-faint">
              <ShieldCheck size={16} strokeWidth={1.5} className="mt-px shrink-0" />
              Booking places a hold of {formatCents(total)} ({formatHours(job.estMinutes)}) per student on your card. You&apos;re only
              charged once the job is done.
            </p>
          )}
        </section>
      )}

      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_23rem] lg:gap-14">
        <div className="min-w-0 space-y-12">
          {booked
            .filter(({ booking: b }) => b.status === "completed")
            .map(({ booking: b, who }) => (
              <ReviewPanel key={b.id} booking={b} viewerId={user.id} otherName={who.user.firstName} />
            ))}
          <JobFacts job={job} showLandmark />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28">
          {booked.map(({ booking: b, who }) => (
            <BookedStudent key={b.id} booking={b} who={who} convo={convoFor(who.user.id)} jobId={job.id} />
          ))}

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

type Applicant = {
  app: typeof applications.$inferSelect;
  user: typeof users.$inferSelect;
  profile: typeof studentProfiles.$inferSelect;
};

/** Everything a resident wants to know before booking one applicant. */
function ApplicantDetail({
  x,
  jobId,
  ratings,
  completed,
  quote,
  convo,
  canBook,
}: {
  x: Applicant;
  jobId: string;
  ratings: Map<string, { average: number | null; count: number }>;
  completed: Map<string, number>;
  quote?: { comment: string; authorFirstName: string };
  convo?: string;
  canBook: boolean;
}) {
  const { app, user: s, profile } = x;
  const done = completed.get(s.id) ?? 0;
  const facts = [
    profile.gradYear && { icon: GraduationCap, label: "Class year", value: String(profile.gradYear) },
    profile.major && { icon: GraduationCap, label: "Major", value: profile.major + (profile.minor ? `, minor in ${profile.minor}` : "") },
    { icon: Car, label: "Has a car", value: profile.hasCar ? "Yes" : "No" },
    profile.hometown && { icon: Home, label: "From", value: profile.hometown },
    profile.gettingAround && { icon: MapPin, label: "Getting around", value: profile.gettingAround },
  ].filter(Boolean) as { icon: typeof Car; label: string; value: string }[];

  return (
    <article className="glass min-w-0 rounded-2xl p-5 sm:p-7" data-testid="applicant">
      <div className="flex flex-wrap items-start gap-4">
        <Avatar name={publicName(s)} size={72} src={photoUrl(s)} verified />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[26px] leading-none tracking-tight">{publicName(s)}</h3>
            {app.recommended && <Badge tone="blue">JobsU pick</Badge>}
          </div>
          <p className="mt-2 text-muted">
            {profile.school}
            {profile.gradYear ? ` · Class of ${profile.gradYear}` : ""} · .edu confirmed
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-muted">
            <Stars rating={ratings.get(s.id)?.average ?? null} count={ratings.get(s.id)?.count} />
            {done > 0 && <span>{`${done} ${done === 1 ? "job" : "jobs"} completed`}</span>}
          </p>
        </div>
      </div>

      {app.note && (
        <div className="inset mt-6">
          <p className="caption">Why they&apos;re a good fit</p>
          <p className="mt-1 text-ink">{app.note}</p>
        </div>
      )}

      <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon size={16} strokeWidth={1.5} className="mt-1 shrink-0 text-faint" />
            <div>
              <dt className="text-[13px] text-muted">{label}</dt>
              <dd className="text-ink">{value}</dd>
            </div>
          </div>
        ))}
      </dl>

      {profile.bio && (
        <div className="mt-6">
          <p className="caption text-muted">About</p>
          <p className="mt-1.5 max-w-[60ch] text-ink">{profile.bio}</p>
        </div>
      )}
      {profile.funFacts.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {profile.funFacts.map((f) => (
            <li key={f} className="chip">
              {f}
            </li>
          ))}
        </ul>
      )}
      {quote && (
        <p className="mt-5 max-w-[60ch] text-[15px] text-muted">
          “{quote.comment}” <span className="text-faint">— {quote.authorFirstName}</span>
        </p>
      )}

      <div className="rule mt-7 flex flex-wrap items-center gap-2 pt-6">
        {canBook && (
          <ActionForm action={selectApplicant}>
            <input type="hidden" name="applicationId" value={app.id} />
            <SubmitButton className="btn btn-primary">Book {s.firstName}</SubmitButton>
          </ActionForm>
        )}
        {convo && (
          <Link href={`/messages/${convo}`} className="btn btn-outline">
            Message
          </Link>
        )}
        <Link href={`/students/${s.id}`} className="btn btn-outline">
          Full profile
        </Link>
        <ActionForm action={declineApplicant} className="ml-auto">
          <input type="hidden" name="applicationId" value={app.id} />
          <input type="hidden" name="jobId" value={jobId} />
          <SubmitButton className="btn btn-ghost text-muted">Decline</SubmitButton>
        </ActionForm>
      </div>
    </article>
  );
}

/** A booked student: contact, and whatever the resident needs to do next. */
function BookedStudent({ booking, who, convo, jobId }: { booking: Booking; who: Applicant; convo?: string; jobId: string }) {
  const s = who.user;
  return (
    <section className="glass rounded-xl p-6" data-testid="booked-student">
      <div className="flex items-center justify-between gap-3">
        <h2 className="caption text-muted">Your student</h2>
        {booking.status !== "authorized" && <BookingStatusBadge status={booking.status} />}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <Avatar name={`${s.firstName} ${s.lastName}`} size={52} src={photoUrl(s)} verified />
        <div>
          <p className="text-[22px] leading-tight tracking-tight">
            {s.firstName} {s.lastName}
          </p>
          <p className="text-[14px] text-muted">{who.profile.school}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {convo && (
          <Link href={`/messages/${convo}`} className="btn btn-outline btn-sm">
            Message
          </Link>
        )}
        <Link href={`/students/${s.id}`} className="btn btn-outline btn-sm">
          Profile
        </Link>
      </div>

      {booking.status === "completed_pending" && (
        <div className="inset mt-5 text-[15px] text-ink">
          {s.firstName} marked this done: {formatHours(booking.actualMinutes!)},{" "}
          {formatCents(jobTotalCents(booking.rateCents, booking.actualMinutes!))}.
        </div>
      )}
      {(booking.status === "authorized" || booking.status === "completed_pending") && (
        <div className="rule mt-5 space-y-3 pt-5">
          <ActionForm action={confirmComplete}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <SubmitButton className="btn btn-primary w-full">Job done — pay {s.firstName}</SubmitButton>
          </ActionForm>
          <p className="text-[13px] leading-snug text-faint">
            If you don&apos;t respond, payment is released automatically 7 days after the job date.
          </p>
          <details>
            <summary className="cursor-pointer text-[14px] text-muted hover:text-ink">Something went wrong?</summary>
            <ActionForm action={disputeBooking} className="mt-3 space-y-3">
              <input type="hidden" name="bookingId" value={booking.id} />
              <Field label="What happened?">
                <textarea name="reason" className="input min-h-24" required />
              </Field>
              <SubmitButton className="btn btn-danger w-full">Pause payment and get help</SubmitButton>
            </ActionForm>
          </details>
        </div>
      )}
      {booking.status === "disputed" && (
        <div className="mt-5">
          <Notice tone="red">Payment is paused while we look into this. We&apos;ll email you shortly.</Notice>
        </div>
      )}

      {booking.status === "completed" && (
        <>
          <div className="mt-5">
            <Receipt booking={booking} />
          </div>
          {/* After a finished job the resident can reach the student directly and book them again. */}
          <div className="rule mt-5 space-y-2 pt-5 text-[15px]" data-testid="direct-contact">
            <p className="caption text-muted">Direct contact</p>
            <p className="flex items-center gap-2 text-ink">
              <Mail size={15} strokeWidth={1.5} className="text-faint" />
              <a className="link" href={`mailto:${s.email}`}>
                {s.email}
              </a>
            </p>
            {s.phone && (
              <p className="flex items-center gap-2 text-ink">
                <Phone size={15} strokeWidth={1.5} className="text-faint" />
                {s.phone}
              </p>
            )}
          </div>
          <Link href={`/resident/jobs/new?from=${jobId}&invite=${s.id}`} className="btn btn-outline mt-5 w-full">
            <UserPlus size={16} strokeWidth={1.75} /> Hire {s.firstName} again
          </Link>
        </>
      )}
    </section>
  );
}
