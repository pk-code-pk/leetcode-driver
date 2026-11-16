import { Fragment } from "react";
import { and, eq } from "drizzle-orm";
import { Banknote, CalendarDays, Check, Clock, MapPin, Star } from "lucide-react";
import { submitReview } from "@/app/actions/social";
import { ActionForm, SubmitButton } from "./forms";
import { Field, JobIcon } from "./ui";
import { db } from "@/db";
import { reviews, type Booking, type BookingStatus, type Job, type JobStatus } from "@/db/schema";
import { formatDate, timeAgo } from "@/lib/dates";
import { jobType, timingLabel } from "@/lib/jobTypes";
import { formatCents, formatHours, formatRate, jobTotalCents } from "@/lib/money";
import { reviewVisible } from "@/lib/reviews";

/** A job at a glance: the four things everyone asks first, then the description and any extra answers. */
export function JobFacts({ job, showLandmark }: { job: Job; showLandmark?: boolean }) {
  const type = jobType(job.type);
  const top: { icon: typeof CalendarDays; label: string; value: string; sub?: string }[] = [
    { icon: CalendarDays, label: "When", value: formatDate(job.startDate), sub: job.startTime ? `at ${job.startTime}` : timingLabel(job.timing) },
    { icon: Clock, label: "Time needed", value: formatHours(job.estMinutes), sub: timingLabel(job.timing) },
    { icon: MapPin, label: "Where", value: job.town, sub: showLandmark && job.landmark ? job.landmark : "Exact address after booking" },
    {
      icon: Banknote,
      label: "Pay",
      value: job.rateCents != null ? formatRate(job.rateCents) : "Rate to be suggested",
      sub: job.rateCents != null ? `about ${formatCents(jobTotalCents(job.rateCents, job.estMinutes))} total` : undefined,
    },
  ];
  const extra = type.questions.filter((q) => job.answers[q.key]);

  return (
    <section>
      <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-line lg:grid-cols-4">
        {top.map(({ icon: Icon, label, value, sub }, i) => (
          <div key={label} className={`p-5 ${i % 2 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
            <dt className="flex items-center gap-2 text-[13px] text-muted">
              <Icon size={15} strokeWidth={1.5} />
              {label}
            </dt>
            <dd className="mt-2 text-[19px] leading-tight tracking-tight text-ink">{value}</dd>
            {sub && <dd className="mt-1 text-[13px] text-faint">{sub}</dd>}
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <p className="flex items-center gap-2 text-[14px] text-muted">
          <JobIcon type={job.type} size={16} />
          {type.label}
        </p>
        <p className="mt-3 max-w-[62ch] whitespace-pre-wrap text-[18px] leading-[1.5] text-ink">{job.description}</p>
      </div>

      {extra.length > 0 && (
        <dl className="mt-7 grid gap-x-10 border-t border-line sm:grid-cols-2">
          {extra.map((q) => (
            <div key={q.key} className="border-b border-line py-4">
              <dt className="text-[14px] text-muted">{q.label}</dt>
              <dd className="mt-1 text-ink">{job.answers[q.key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/** Where a job is in its life: posted, booked, done, paid. */
export function Progress({ job, booking }: { job: JobStatus; booking?: BookingStatus | null }) {
  if (job === "cancelled" || job === "pending_review" || booking === "disputed" || booking === "cancelled") return null;
  const step = job === "completed" ? 4 : booking === "completed_pending" ? 3 : job === "booked" ? 2 : 1;
  const steps = ["Posted", "Booked", "Job done", "Paid"];
  return (
    <ol className="grid max-w-xl grid-cols-4 gap-2" aria-label="Job progress">
      {steps.map((label, i) => {
        const done = i + 1 <= step;
        return (
          <li key={label}>
            <span className="block h-[3px] overflow-hidden rounded-full bg-line">
              {done && <span className="fill-line block h-full bg-deep" style={{ animationDelay: `${i * 140}ms` }} />}
            </span>
            <span className={`mt-2.5 flex items-center gap-2 text-[13px] ${done ? "text-ink" : "text-faint"}`}>
              <span className="num">0{i + 1}</span>
              {label}
              {done && i + 1 === step && step === 4 && <Check size={13} strokeWidth={2} />}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export type TimelineEvent = { at: Date; text: string };

/** What has happened on a job, newest first. */
export function Timeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => b.at.getTime() - a.at.getTime());
  return (
    <ol className="relative">
      {sorted.map((e, i) => (
        <li key={i} className="relative flex gap-3.5 pb-5 last:pb-0">
          {i < sorted.length - 1 && <span className="absolute left-[4px] top-4 h-full w-px bg-line" />}
          <span className={`sq relative mt-[6px] ${i === 0 ? "text-deep" : "text-line"}`} />
          <span className="flex-1 text-[15px] leading-snug text-ink">
            {e.text}
            <span className="block text-[13px] text-faint">{timeAgo(e.at)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Five clickable stars. Stars to the left of the chosen one light up too. */
export function StarsInput() {
  return (
    <fieldset>
      <legend className="label">Your rating</legend>
      <div className="flex flex-row-reverse justify-end gap-1.5">
        {[5, 4, 3, 2, 1].map((n) => (
          <Fragment key={n}>
            <input type="radio" name="rating" value={n} id={`star-${n}`} className="peer sr-only" required />
            <label
              htmlFor={`star-${n}`}
              data-star={n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className="cursor-pointer text-line transition-colors hover:text-deep peer-checked:text-deep peer-focus-visible:text-blue [&:hover~label]:text-deep"
            >
              <Star size={34} className="fill-current" strokeWidth={0} />
            </label>
          </Fragment>
        ))}
      </div>
    </fieldset>
  );
}

function RatingLine({ who, rating, comment }: { who: string; rating: number; comment: string }) {
  return (
    <div>
      <p className="flex items-center gap-2.5 text-ink">
        {who}
        <span className="num inline-flex items-center gap-1">
          {rating}
          <Star size={14} className="fill-ink text-ink" aria-label="stars" />
        </span>
      </p>
      {comment && <p className="mt-2 text-[20px] leading-snug tracking-tight text-ink">“{comment}”</p>}
    </div>
  );
}

/** Rating form and both sides' ratings for a completed booking (double-blind until both are in). */
export async function ReviewPanel({
  booking,
  viewerId,
  otherName,
}: {
  booking: Booking;
  viewerId: string;
  otherName: string;
}) {
  const all = await db.select().from(reviews).where(and(eq(reviews.bookingId, booking.id)));
  const mine = all.find((r) => r.authorId === viewerId);
  const theirs = all.find((r) => r.authorId !== viewerId && !r.removedAt);
  const visible = reviewVisible({ bothSubmitted: all.length >= 2, completedAt: booking.releasedAt });

  return (
    <section>
      <h2 className="flex items-center gap-3 text-[22px] tracking-tight">
        <span className="sq" />
        Ratings
      </h2>
      <div className="rule mt-5 pt-6">
        {mine ? (
          <RatingLine who={`You rated ${otherName}`} rating={mine.rating} comment={mine.comment} />
        ) : (
          <ActionForm action={submitReview} className="max-w-xl space-y-5">
            <input type="hidden" name="bookingId" value={booking.id} />
            <StarsInput />
            <Field label={`How was working with ${otherName}? (optional)`}>
              <textarea name="comment" className="input min-h-24" maxLength={1000} />
            </Field>
            <SubmitButton>Submit rating</SubmitButton>
          </ActionForm>
        )}
      </div>
      <div className="rule mt-6 border-b border-line py-6">
        {theirs && visible ? (
          <RatingLine who={`${otherName} rated you`} rating={theirs.rating} comment={theirs.comment} />
        ) : theirs ? (
          <p className="text-muted">{otherName} has rated you. You&apos;ll see it once you submit yours.</p>
        ) : (
          <p className="text-muted">{otherName} hasn&apos;t rated you yet. Ratings are shared once you&apos;ve both submitted.</p>
        )}
      </div>
    </section>
  );
}

export function Receipt({ booking, forStudent }: { booking: Booking; forStudent?: boolean }) {
  if (booking.amountCents == null) return null;
  return (
    <section className="tinted">
      <h2 className="caption text-muted">{forStudent ? "Your payout" : "Receipt"}</h2>
      <p className="num mt-2 text-[48px] leading-none tracking-tight text-ink">
        {formatCents(forStudent ? booking.payoutCents ?? 0 : booking.amountCents)}
      </p>
      <dl className="num mt-6 border-t border-ink/10 text-[15px]">
        <div className="flex justify-between gap-4 border-b border-ink/10 py-3">
          <dt className="text-muted">
            {formatHours(booking.actualMinutes ?? booking.estMinutes)} at {formatRate(booking.rateCents)}
          </dt>
          <dd>{formatCents(booking.amountCents)}</dd>
        </div>
        {forStudent && (
          <div className="flex justify-between gap-4 border-b border-ink/10 py-3">
            <dt className="text-muted">JobsU service fee (10%)</dt>
            <dd>−{formatCents(booking.feeCents ?? 0)}</dd>
          </div>
        )}
      </dl>
      {booking.releaseKind === "auto" && <p className="hint">Released automatically 7 days after the job date.</p>}
    </section>
  );
}
