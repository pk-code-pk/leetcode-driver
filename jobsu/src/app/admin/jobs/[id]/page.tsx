import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { toggleRecommended } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { JobFacts, Receipt } from "@/components/job";
import { BookingStatusBadge, JobStatusBadge, Page, Stars } from "@/components/ui";
import { db } from "@/db";
import { applications, bookings, jobs, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { completedJobCounts, ratingsFor } from "@/lib/queries";

type Props = { params: Promise<{ id: string }> };

export default async function AdminJob({ params }: Props) {
  await requireUser("admin");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) notFound();
  const [resident] = await db.select().from(users).where(eq(users.id, job.residentId)).limit(1);
  const [booking] = await db.select().from(bookings).where(eq(bookings.jobId, job.id)).limit(1);
  const apps = await db
    .select({ app: applications, user: users })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.studentId))
    .where(eq(applications.jobId, job.id));
  const ids = apps.map((a) => a.user.id);
  const [ratings, completed] = await Promise.all([ratingsFor(ids), completedJobCounts(ids)]);

  return (
    <Page>
      <Link href="/admin/jobs" className="text-sm font-bold text-muted hover:text-blue">
        ← Jobs
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="title">{job.title}</h1>
        <JobStatusBadge status={job.status} />
        {booking && <BookingStatusBadge status={booking.status} />}
      </div>
      <p className="mt-2 text-sm font-medium text-muted">
        {resident.firstName} {resident.lastName} · {resident.email} {resident.phone && `· ${resident.phone}`}
      </p>
      <div className="mt-6 space-y-6">
        <JobFacts job={job} showLandmark />
        {booking && <Receipt booking={booking} forStudent />}
        <section>
          <p className="eyebrow">Applicants ({apps.length})</p>
          <p className="hint">Mark the students you&apos;d recommend. The resident sees them first, tagged as a JobsU pick.</p>
          <div className="mt-3 space-y-3">
            {apps.map(({ app, user }) => (
              <div key={app.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/students/${user.id}`} className="font-extrabold text-blue underline">
                    {user.firstName} {user.lastName}
                  </Link>
                  <p className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted">
                    {user.email} · {app.status}
                    <Stars rating={ratings.get(user.id)?.average ?? null} count={ratings.get(user.id)?.count} />
                    <span>{completed.get(user.id) ?? 0} jobs</span>
                  </p>
                  {app.note && <p className="mt-1 text-sm font-medium">{app.note}</p>}
                </div>
                <ActionForm action={toggleRecommended}>
                  <input type="hidden" name="applicationId" value={app.id} />
                  <SubmitButton className={app.recommended ? "btn btn-primary" : "btn btn-outline"}>
                    {app.recommended ? "★ JobsU pick" : "Recommend"}
                  </SubmitButton>
                </ActionForm>
              </div>
            ))}
            {apps.length === 0 && <p className="text-sm font-medium text-muted">No applicants yet.</p>}
          </div>
        </section>
      </div>
    </Page>
  );
}
