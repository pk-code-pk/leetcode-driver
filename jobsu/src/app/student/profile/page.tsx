import Link from "next/link";
import { eq } from "drizzle-orm";
import { updateStudentProfile } from "@/app/actions/social";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Avatar, EduBadge, Field, JobIcon, Notice, Page, PageHeader, SectionTitle, Stars } from "@/components/ui";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { JOB_TYPES, jobType } from "@/lib/jobTypes";
import { completedJobCounts, publicName, ratingsFor, visibleReviewsFor } from "@/lib/queries";

type Props = { searchParams: Promise<{ welcome?: string }> };

export default async function StudentProfile({ searchParams }: Props) {
  const user = await requireUser("student");
  const { welcome } = await searchParams;
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id)).limit(1);
  const rating = (await ratingsFor([user.id])).get(user.id)!;
  const completed = (await completedJobCounts([user.id])).get(user.id) ?? 0;
  const reviews = await visibleReviewsFor([user.id]);

  return (
    <Page>
      <PageHeader
        eyebrow={welcome ? "You're in" : "For students"}
        title={welcome ? "Set up your profile" : "Your profile"}
        subtitle="This is what families see when you apply. No resume needed. A few honest lines go a long way."
      />

      <div className="grid items-start gap-12 lg:grid-cols-[1fr_23rem]">
        <ActionForm action={updateStudentProfile} className="space-y-12">
          <section>
            <SectionTitle>About you</SectionTitle>
            <div className="rule mt-5 space-y-6 pt-7">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="First name">
                  <input name="firstName" className="input" required defaultValue={user.firstName} />
                </Field>
                <Field label="Last name" hint="Families see your first name and last initial until they book you.">
                  <input name="lastName" className="input" defaultValue={user.lastName} />
                </Field>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Graduation year">
                  <input name="gradYear" type="number" className="input" min={2024} max={2035} defaultValue={profile.gradYear ?? ""} />
                </Field>
                <Field label="Major">
                  <input name="major" className="input" defaultValue={profile.major} maxLength={100} />
                </Field>
              </div>
              <Field label="Bio">
                <textarea
                  name="bio"
                  className="input min-h-32"
                  maxLength={1000}
                  defaultValue={profile.bio}
                  placeholder="I'm a sophomore from Ohio. I've babysat for three families and worked two summers landscaping."
                />
              </Field>
            </div>
          </section>

          <section>
            <SectionTitle>Jobs you want</SectionTitle>
            <div className="rule mt-5 pt-7">
              <p className="mb-4 text-muted">We&apos;ll email you when a matching job is posted.</p>
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
                    <span className="inline-flex h-11 items-center gap-2.5 rounded-lg px-4 text-[15px] text-ink shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors peer-checked:bg-deep peer-checked:text-white peer-checked:shadow-none peer-focus-visible:shadow-[inset_0_0_0_1.5px_var(--color-ink)] hover:shadow-[inset_0_0_0_1px_var(--color-ink)]">
                      <JobIcon type={t.slug} size={17} />
                      {t.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section>
            <SectionTitle>Details</SectionTitle>
            <div className="rule mt-5 space-y-6 pt-7">
              <Field label="When are you usually free?">
                <input
                  name="availability"
                  className="input"
                  maxLength={300}
                  defaultValue={profile.availability}
                  placeholder="Weekday afternoons after 3, most weekends"
                />
              </Field>
              <Field label="Certifications (optional)" hint="For example CPR or lifeguarding. Self-reported: JobsU doesn't verify these.">
                <input name="certifications" className="input" maxLength={300} defaultValue={profile.certifications} />
              </Field>
              <Field label="Phone (optional)" hint="Only shared with a family once they've booked you.">
                <input name="phone" type="tel" className="input" defaultValue={user.phone} />
              </Field>
              <label className="flex items-center gap-3 text-ink">
                <input type="checkbox" name="hasCar" defaultChecked={profile.hasCar} />I have a car on campus
              </label>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton>Save profile</SubmitButton>
            <Link href="/student/jobs" className="btn btn-outline">
              Browse jobs
            </Link>
          </div>
        </ActionForm>

        <aside className="space-y-6 lg:sticky lg:top-28">
          {/* How a family sees this student in their applicant list */}
          <section className="glass rounded-xl p-6">
            <h2 className="caption text-muted">How families see you</h2>
            <div className="mt-5 flex items-center gap-4">
              <Avatar name={publicName(user)} size={56} verified />
              <div>
                <p className="text-[24px] leading-tight tracking-tight">{publicName(user)}</p>
                <p className="text-[14px] text-muted">
                  {profile.school}
                  {profile.gradYear ? ` · Class of ${profile.gradYear}` : ""}
                </p>
              </div>
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-muted">
              <Stars rating={rating.average} count={rating.count} />
              <span>
                {completed} {completed === 1 ? "job" : "jobs"} completed
              </span>
            </p>
            <p className="mt-4 text-[15px] text-ink">
              {profile.bio || <span className="text-faint">Your bio will appear here once you add one.</span>}
            </p>
            {profile.jobTypes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {profile.jobTypes.map((t) => (
                  <span key={t} className="chip text-[13px]">
                    <JobIcon type={t} size={14} /> {jobType(t).label}
                  </span>
                ))}
              </div>
            )}
            <div className="rule mt-5 flex items-center justify-between pt-4">
              <EduBadge />
              <span className="text-[13px] text-faint">{user.email}</span>
            </div>
          </section>

          <Link href="/student/payouts" className="group flex items-center justify-between rounded-xl border border-line p-6 transition-colors hover:border-ink">
            <span>
              <span className="block text-[18px] tracking-tight">Getting paid</span>
              <span className="text-[14px] text-muted">Set up where your earnings go</span>
            </span>
            <span className="sq transition-transform duration-500 group-hover:rotate-45" />
          </Link>

          <p className="px-1 text-[14px] text-faint">
            Need to change your password?{" "}
            <Link href="/account" className="link">
              Account settings
            </Link>
          </p>

          {profile.strikes > 0 && (
            <Notice tone="amber">
              You&apos;ve cancelled {profile.strikes} booked {profile.strikes === 1 ? "job" : "jobs"}. Repeated cancellations can
              pause your account.
            </Notice>
          )}
        </aside>
      </div>

      {reviews.length > 0 && (
        <section className="mt-16">
          <SectionTitle count={reviews.length}>What families said</SectionTitle>
          <div className="mt-5 grid border-t border-line md:grid-cols-2">
            {reviews.map((r, i) => (
              <figure key={r.id} className={`border-b border-line py-7 ${i % 2 ? "md:border-l md:pl-8" : "md:pr-8"}`}>
                <Stars rating={r.rating} />
                {r.comment && <blockquote className="mt-3 text-[22px] leading-snug tracking-tight">“{r.comment}”</blockquote>}
                <figcaption className="mt-3 text-[14px] text-muted">{r.authorFirstName}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}
