import Link from "next/link";
import { eq } from "drizzle-orm";
import { updateStudentProfile } from "@/app/actions/social";
import { ActionForm, SubmitButton } from "@/components/forms";
import { EduBadge, Field, Page, PageHeader, Stars } from "@/components/ui";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { JOB_TYPES } from "@/lib/jobTypes";
import { ratingsFor, visibleReviewsFor } from "@/lib/queries";

type Props = { searchParams: Promise<{ welcome?: string }> };

export default async function StudentProfile({ searchParams }: Props) {
  const user = await requireUser("student");
  const { welcome } = await searchParams;
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id)).limit(1);
  const rating = (await ratingsFor([user.id])).get(user.id)!;
  const reviews = await visibleReviewsFor([user.id]);

  return (
    <Page narrow>
      <PageHeader
        green
        eyebrow={welcome ? "You're in" : "For students"}
        title={welcome ? "Set up your profile" : "Your profile"}
        subtitle="This is what families see when you apply. No resume needed — a few honest lines go a long way."
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <EduBadge />
        <span className="text-sm font-semibold text-muted">
          {profile.school} · {user.email}
        </span>
        <Stars rating={rating.average} count={rating.count} />
      </div>

      <ActionForm action={updateStudentProfile} className="card space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name">
            <input name="firstName" className="input" required defaultValue={user.firstName} />
          </Field>
          <Field label="Last name" hint="Families see your first name and last initial until they book you.">
            <input name="lastName" className="input" defaultValue={user.lastName} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Graduation year">
            <input name="gradYear" type="number" className="input" min={2024} max={2035} defaultValue={profile.gradYear ?? ""} />
          </Field>
          <Field label="Major">
            <input name="major" className="input" defaultValue={profile.major} maxLength={100} />
          </Field>
        </div>
        <Field label="About you">
          <textarea
            name="bio"
            className="input min-h-28"
            maxLength={1000}
            defaultValue={profile.bio}
            placeholder="I'm a sophomore from Ohio. I've babysat for three families and worked two summers landscaping."
          />
        </Field>
        <fieldset>
          <legend className="label">Jobs you want</legend>
          <p className="hint mb-2 mt-0">We&apos;ll email you when a matching job is posted.</p>
          <div className="flex flex-wrap gap-2">
            {JOB_TYPES.filter((t) => t.slug !== "other").map((t) => (
              <label key={t.slug} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="jobTypes"
                  value={t.slug}
                  className="peer sr-only"
                  defaultChecked={profile.jobTypes.includes(t.slug)}
                />
                <span className="inline-block rounded-full border border-line bg-field px-3.5 py-1.5 text-sm font-bold text-muted peer-checked:border-green-dark peer-checked:bg-green-bg peer-checked:text-green-deep">
                  {t.emoji} {t.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="When are you usually free?">
          <input name="availability" className="input" maxLength={300} defaultValue={profile.availability} placeholder="Weekday afternoons after 3, most weekends" />
        </Field>
        <Field label="Certifications (optional)" hint="For example CPR or lifeguarding. Self-reported: JobsU doesn't verify these.">
          <input name="certifications" className="input" maxLength={300} defaultValue={profile.certifications} />
        </Field>
        <Field label="Phone (optional)" hint="Only shared with a family once they've booked you.">
          <input name="phone" type="tel" className="input" defaultValue={user.phone} />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="hasCar" defaultChecked={profile.hasCar} />I have a car on campus
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton className="btn btn-green">Save profile</SubmitButton>
          <Link href="/student/jobs" className="btn btn-outline">
            Browse jobs
          </Link>
          <Link href="/student/payouts" className="text-sm font-bold text-blue underline">
            Payout setup
          </Link>
        </div>
      </ActionForm>

      {profile.strikes > 0 && (
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          You&apos;ve cancelled {profile.strikes} booked {profile.strikes === 1 ? "job" : "jobs"}. Repeated cancellations can
          pause your account.
        </p>
      )}

      {reviews.length > 0 && (
        <section className="mt-8">
          <p className="eyebrow-green">What families said</p>
          <div className="mt-3 space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="card">
                <p className="font-extrabold">
                  {r.rating}★ <span className="font-semibold text-muted">from {r.authorFirstName}</span>
                </p>
                {r.comment && <p className="mt-1 text-sm font-medium">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}
