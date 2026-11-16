import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { toggleRecommended } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { JobFacts, Receipt } from "@/components/job";
import { Avatar, Back, Badge, BookingStatusBadge, JobStatusBadge, Page, SectionTitle, Stars } from "@/components/ui";
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
      <Back href="/admin/jobs">Jobs</Back>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <JobStatusBadge status={job.status} />
        {booking && <BookingStatusBadge status={booking.status} />}
      </div>
      <h1 className="title mt-4 max-w-[20ch]">{job.title}</h1>
      <p className="mt-4 text-muted">
        {resident.firstName} {resident.lastName} · {resident.email} {resident.phone && `· ${resident.phone}`}
      </p>

      <div className="mt-12 grid items-start gap-12 lg:grid-cols-[1fr_23rem]">
        <div className="space-y-16">
          <section>
            <SectionTitle count={apps.length}>Applicants</SectionTitle>
            <p className="mt-2 text-muted">Mark the students you&apos;d recommend. The resident sees them first, tagged as a JobsU pick.</p>
            <div className="mt-5 border-b border-line">
              {apps.map(({ app, user }) => (
                <div key={app.id} className="rule flex flex-wrap items-center gap-4 py-5">
                  <Avatar name={`${user.firstName} ${user.lastName}`} size={48} verified />
                  <div className="min-w-0 flex-1">
                    <Link href={`/students/${user.id}`} className="link text-[20px] tracking-tight">
                      {user.firstName} {user.lastName}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-muted">
                      {user.email}
                      <Stars rating={ratings.get(user.id)?.average ?? null} count={ratings.get(user.id)?.count} />
                      <span>{completed.get(user.id) ?? 0} jobs</span>
                    </p>
                    {app.note && <p className="mt-2 text-[15px] text-ink">{app.note}</p>}
                  </div>
                  <Badge tone="slate">{app.status}</Badge>
                  <ActionForm action={toggleRecommended}>
                    <input type="hidden" name="applicationId" value={app.id} />
                    <SubmitButton className={app.recommended ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}>
                      {app.recommended ? "JobsU pick" : "Recommend"}
                    </SubmitButton>
                  </ActionForm>
                </div>
              ))}
              {apps.length === 0 && <p className="rule py-8 text-muted">No applicants yet.</p>}
            </div>
          </section>
          <JobFacts job={job} showLandmark />
        </div>
        <aside className="lg:sticky lg:top-28">{booking && <Receipt booking={booking} forStudent />}</aside>
      </div>
    </Page>
  );
}
