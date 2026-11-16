import { and, eq } from "drizzle-orm";
import { submitReview } from "@/app/actions/social";
import { ActionForm, SubmitButton } from "./forms";
import { Field } from "./ui";
import { db } from "@/db";
import { reviews, type Booking, type Job } from "@/db/schema";
import { formatDate } from "@/lib/dates";
import { jobType, timingLabel } from "@/lib/jobTypes";
import { formatCents, formatHours, formatRate, jobTotalCents } from "@/lib/money";
import { reviewVisible } from "@/lib/reviews";

/** The facts of a job. `showLandmark` is for the resident, staff and signed-in students only. */
export function JobFacts({ job, showLandmark }: { job: Job; showLandmark?: boolean }) {
  const type = jobType(job.type);
  const facts: [string, string][] = [
    ["Type", `${type.emoji} ${type.label}`],
    ["When", `${formatDate(job.startDate)}${job.startTime ? ` at ${job.startTime}` : ""}`],
    ["How often", timingLabel(job.timing)],
    ["Time needed", formatHours(job.estMinutes)],
    ["Rate", formatRate(job.rateCents)],
    ["Where", showLandmark && job.landmark ? `${job.town} · ${job.landmark}` : job.town],
  ];
  if (job.rateCents != null) facts.push(["Estimated total", formatCents(jobTotalCents(job.rateCents, job.estMinutes))]);
  return (
    <div className="card">
      <p className="whitespace-pre-wrap font-medium leading-relaxed text-navy">{job.description}</p>
      <dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="label">{k}</dt>
            <dd className="font-semibold">{v}</dd>
          </div>
        ))}
        {type.questions
          .filter((q) => job.answers[q.key])
          .map((q) => (
            <div key={q.key} className="sm:col-span-3">
              <dt className="label">{q.label}</dt>
              <dd className="font-semibold">{job.answers[q.key]}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

export function StarsInput() {
  return (
    <fieldset>
      <legend className="label">Your rating</legend>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input type="radio" name="rating" value={n} className="peer sr-only" required />
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-field text-sm font-extrabold text-muted peer-checked:border-blue peer-checked:bg-blue peer-checked:text-white">
              {n}★
            </span>
          </label>
        ))}
      </div>
    </fieldset>
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
    <div className="card">
      <p className="eyebrow">Ratings</p>
      {mine ? (
        <p className="mt-2 font-semibold">
          You rated {otherName} {mine.rating}★{mine.comment ? ` — “${mine.comment}”` : ""}
        </p>
      ) : (
        <ActionForm action={submitReview} className="mt-3 space-y-4">
          <input type="hidden" name="bookingId" value={booking.id} />
          <StarsInput />
          <Field label={`How was working with ${otherName}? (optional)`}>
            <textarea name="comment" className="input min-h-20" maxLength={1000} />
          </Field>
          <SubmitButton>Submit rating</SubmitButton>
        </ActionForm>
      )}
      <div className="mt-4 border-t border-line pt-4 text-sm font-medium text-muted">
        {theirs && visible ? (
          <p className="text-navy">
            {otherName} rated you {theirs.rating}★{theirs.comment ? ` — “${theirs.comment}”` : ""}
          </p>
        ) : theirs ? (
          <p>{otherName} has rated you. You&apos;ll see it once you submit yours.</p>
        ) : (
          <p>{otherName} hasn&apos;t rated you yet. Ratings are shared once you&apos;ve both submitted.</p>
        )}
      </div>
    </div>
  );
}

export function Receipt({ booking, forStudent }: { booking: Booking; forStudent?: boolean }) {
  if (booking.amountCents == null) return null;
  return (
    <div className="card">
      <p className="eyebrow">{forStudent ? "Your payout" : "Receipt"}</p>
      <dl className="mt-3 space-y-1.5 text-sm font-medium">
        <div className="flex justify-between">
          <dt className="text-muted">
            {formatHours(booking.actualMinutes ?? booking.estMinutes)} at {formatRate(booking.rateCents)}
          </dt>
          <dd className="font-bold">{formatCents(booking.amountCents)}</dd>
        </div>
        {forStudent && (
          <>
            <div className="flex justify-between">
              <dt className="text-muted">JobsU service fee (10%)</dt>
              <dd className="font-bold">−{formatCents(booking.feeCents ?? 0)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base">
              <dt className="font-extrabold">You receive</dt>
              <dd className="font-extrabold text-green-deep">{formatCents(booking.payoutCents ?? 0)}</dd>
            </div>
          </>
        )}
      </dl>
      {booking.releaseKind === "auto" && (
        <p className="hint">Released automatically 7 days after the job date.</p>
      )}
    </div>
  );
}
