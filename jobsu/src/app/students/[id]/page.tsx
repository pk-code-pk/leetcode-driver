import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { Avatar, EduBadge, Page, Stars } from "@/components/ui";
import { db } from "@/db";
import { applications, bookings, jobs, studentProfiles, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { jobType } from "@/lib/jobTypes";
import { completedJobCounts, fullName, publicName, ratingsFor, visibleReviewsFor } from "@/lib/queries";

type Props = { params: Promise<{ id: string }> };

/** A student's profile, visible to staff and to residents the student has applied to or worked for. */
export default async function StudentPublicProfile({ params }: Props) {
  const viewer = await requireUser(["resident", "admin"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [row] = await db
    .select({ user: users, profile: studentProfiles })
    .from(users)
    .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(eq(users.id, id))
    .limit(1);
  if (!row) notFound();

  let hasBooked = viewer.role === "admin";
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

  return (
    <Page narrow>
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={name} size={64} />
          <div>
            <h1 className="text-3xl font-black">{name}</h1>
            <p className="text-sm font-semibold text-muted">
              {profile.school}
              {profile.gradYear ? ` · Class of ${profile.gradYear}` : ""}
              {profile.major ? ` · ${profile.major}` : ""}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold text-muted">
          <EduBadge />
          <Stars rating={rating.average} count={rating.count} />
          <span>{completed} jobs completed</span>
          {profile.hasCar && <span>🚗 Has a car</span>}
        </div>
        {profile.bio && <p className="mt-5 whitespace-pre-wrap font-medium leading-relaxed">{profile.bio}</p>}
        <dl className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          {profile.jobTypes.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="label">Jobs they do</dt>
              <dd className="flex flex-wrap gap-2">
                {profile.jobTypes.map((t) => (
                  <span key={t} className="rounded-full bg-ice px-3 py-1 text-sm font-bold">
                    {jobType(t).emoji} {jobType(t).label}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {profile.availability && (
            <div>
              <dt className="label">Usually free</dt>
              <dd className="font-semibold">{profile.availability}</dd>
            </div>
          )}
          {profile.certifications && (
            <div>
              <dt className="label">Certifications (self-reported)</dt>
              <dd className="font-semibold">{profile.certifications}</dd>
            </div>
          )}
          {hasBooked && user.phone && (
            <div>
              <dt className="label">Phone</dt>
              <dd className="font-semibold">{user.phone}</dd>
            </div>
          )}
          {viewer.role === "admin" && (
            <div>
              <dt className="label">Email · cancellations</dt>
              <dd className="font-semibold">
                {user.email} · {profile.strikes}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <section className="mt-8">
        <p className="eyebrow">Ratings from families</p>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm font-medium text-muted">No ratings yet. Every student starts somewhere.</p>
        ) : (
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
        )}
      </section>
      <p className="mt-8 text-sm font-medium text-muted">
        Something not right?{" "}
        <Link href={`/report?subjectId=${id}`} className="font-bold text-blue underline">
          Report this profile
        </Link>
      </p>
    </Page>
  );
}
