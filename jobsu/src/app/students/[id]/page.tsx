import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { Avatar, EduBadge, JobIcon, Page, SectionTitle, Stars } from "@/components/ui";
import { db } from "@/db";
import { applications, bookings, jobs, studentProfiles, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { jobType } from "@/lib/jobTypes";
import { completedJobCounts, fullName, publicName, ratingsFor, visibleReviewsFor } from "@/lib/queries";

type Props = { params: Promise<{ id: string }> };

/** A student's profile, visible to staff, to the student, and to residents the student has applied to or worked for. */
export default async function StudentPublicProfile({ params }: Props) {
  const viewer = await requireUser(["resident", "admin", "student"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [row] = await db
    .select({ user: users, profile: studentProfiles })
    .from(users)
    .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(eq(users.id, id))
    .limit(1);
  if (!row) notFound();

  // Students can preview their own page, never anyone else's.
  if (viewer.role === "student" && viewer.id !== id) notFound();
  let hasBooked = viewer.role !== "resident";
  if (viewer.role === "resident") {
    const applied = await db
      .select({ id: applications.id })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .where(and(eq(applications.studentId, id), eq(jobs.residentId, viewer.id)))
      .limit(1);
    if (!applied.length) notFound();
    const booked = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.studentId, id),
          eq(bookings.residentId, viewer.id),
          inArray(bookings.status, ["authorized", "completed_pending", "completed", "disputed"]),
        ),
      )
      .limit(1);
    hasBooked = booked.length > 0;
  }

  const { user, profile } = row;
  const rating = (await ratingsFor([id])).get(id)!;
  const completed = (await completedJobCounts([id])).get(id) ?? 0;
  const reviews = await visibleReviewsFor([id]);
  const name = hasBooked ? fullName(user) : publicName(user);

  const facts: [string, React.ReactNode][] = [];
  if (profile.availability) facts.push(["Usually free", profile.availability]);
  if (profile.certifications) facts.push(["Certifications (self-reported)", profile.certifications]);
  if (profile.hasCar) facts.push(["Transport", "Has a car on campus"]);
  if (hasBooked && user.phone) facts.push(["Phone", user.phone]);
  if (viewer.role === "admin") {
    facts.push(["Email", user.email]);
    facts.push(["Cancelled bookings", String(profile.strikes)]);
  }

  return (
    <Page>
      <div className="grid items-start gap-12 lg:grid-cols-[1fr_23rem]">
        <div>
          <div className="flex flex-wrap items-center gap-6">
            <Avatar name={name} size={96} verified />
            <div>
              <EduBadge />
              <h1 className="title mt-3">{name}</h1>
              <p className="mt-2 text-muted">
                {profile.school}
                {profile.gradYear ? ` · Class of ${profile.gradYear}` : ""}
                {profile.major ? ` · ${profile.major}` : ""}
              </p>
            </div>
          </div>

          {profile.bio && <p className="mt-10 max-w-[60ch] whitespace-pre-wrap text-[20px] leading-[1.45]">{profile.bio}</p>}

          {profile.jobTypes.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {profile.jobTypes.map((t) => (
                <span key={t} className="chip">
                  <JobIcon type={t} size={16} /> {jobType(t).label}
                </span>
              ))}
            </div>
          )}

          {facts.length > 0 && (
            <dl className="mt-10 border-b border-line">
              {facts.map(([k, v]) => (
                <div key={k} className="rule grid gap-1 py-4 sm:grid-cols-[15rem_1fr] sm:gap-6">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}

          <section className="mt-16">
            <SectionTitle count={reviews.length}>Ratings from families</SectionTitle>
            {reviews.length === 0 ? (
              <p className="rule mt-5 border-b border-line py-8 text-muted">No ratings yet. Every student starts somewhere.</p>
            ) : (
              <div className="mt-5 border-b border-line">
                {reviews.map((r) => (
                  <figure key={r.id} className="rule py-7">
                    <Stars rating={r.rating} />
                    {r.comment && <blockquote className="mt-3 max-w-[50ch] text-[22px] leading-snug tracking-tight">“{r.comment}”</blockquote>}
                    <figcaption className="mt-3 text-[14px] text-muted">{r.authorFirstName}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-28">
          <dl className="glass grid grid-cols-2 rounded-xl">
            <div className="p-6">
              <dt className="caption">Rating</dt>
              <dd className="mt-2 text-[40px] leading-none tracking-tight">{rating.average != null ? rating.average.toFixed(1) : "—"}</dd>
              <dd className="mt-1 text-[13px] text-faint">
                {rating.count} {rating.count === 1 ? "rating" : "ratings"}
              </dd>
            </div>
            <div className="border-l border-ink/10 p-6">
              <dt className="caption">Jobs completed</dt>
              <dd className="mt-2 text-[40px] leading-none tracking-tight">{completed}</dd>
              <dd className="mt-1 text-[13px] text-faint">on JobsU</dd>
            </div>
          </dl>
          {viewer.role === "resident" && (
            <p className="mt-5 px-1 text-[14px] text-faint">
              Something not right?{" "}
              <Link href={`/report?subjectId=${id}`} className="link">
                Report this profile
              </Link>
            </p>
          )}
        </aside>
      </div>
    </Page>
  );
}
