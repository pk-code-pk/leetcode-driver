import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { BookingStatusBadge, Empty, Page, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { applications, bookings, jobs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { jobType } from "@/lib/jobTypes";
import { formatCents, formatRate } from "@/lib/money";

const APP_LABEL: Record<string, string> = {
  applied: "Applied",
  declined: "Not selected",
  withdrawn: "Withdrawn",
};

export default async function MyJobs() {
  const user = await requireUser("student");
  const booked = await db
    .select({ booking: bookings, job: jobs })
    .from(bookings)
    .innerJoin(jobs, eq(jobs.id, bookings.jobId))
    .where(and(eq(bookings.studentId, user.id), inArray(bookings.status, ["authorized", "completed_pending", "completed", "disputed", "cancelled"])))
    .orderBy(desc(bookings.scheduledFor));
  const apps = await db
    .select({ app: applications, job: jobs })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(and(eq(applications.studentId, user.id), inArray(applications.status, ["applied", "declined", "withdrawn"])))
    .orderBy(desc(applications.createdAt));

  const earned = booked.reduce((sum, b) => sum + (b.booking.status === "completed" ? b.booking.payoutCents ?? 0 : 0), 0);

  return (
    <Page>
      <PageHeader
        green
        eyebrow="For students"
        title="My jobs"
        action={
          <div className="card px-5 py-3 text-right">
            <p className="label mb-0">Earned on JobsU</p>
            <p className="text-2xl font-black text-green-deep" data-testid="earned">
              {formatCents(earned)}
            </p>
          </div>
        }
      />
      {booked.length === 0 && apps.length === 0 ? (
        <Empty title="Nothing here yet" body="Apply to a job and it will show up here." href="/student/jobs" cta="Find jobs" />
      ) : (
        <div className="space-y-8">
          {booked.length > 0 && (
            <section>
              <p className="eyebrow-green">Booked</p>
              <div className="mt-3 space-y-3">
                {booked.map(({ booking, job }) => (
                  <Link key={booking.id} href={`/student/jobs/${job.id}`} className="card flex flex-wrap items-center justify-between gap-3 hover:border-green-dark">
                    <div>
                      <p className="text-lg font-extrabold tracking-tight">
                        {jobType(job.type).emoji} {job.title}
                      </p>
                      <p className="text-sm font-medium text-muted">
                        {formatDate(job.startDate)} · {job.town} · {formatRate(booking.rateCents)}
                      </p>
                    </div>
                    <BookingStatusBadge status={booking.status} />
                  </Link>
                ))}
              </div>
            </section>
          )}
          {apps.length > 0 && (
            <section>
              <p className="eyebrow-green">Applications</p>
              <div className="mt-3 space-y-3">
                {apps.map(({ app, job }) => (
                  <Link key={app.id} href={`/student/jobs/${job.id}`} className="card flex flex-wrap items-center justify-between gap-3 hover:border-green-dark">
                    <div>
                      <p className="text-lg font-extrabold tracking-tight">
                        {jobType(job.type).emoji} {job.title}
                      </p>
                      <p className="text-sm font-medium text-muted">
                        {formatDate(job.startDate)} · {job.town} · {formatRate(job.rateCents)}
                      </p>
                    </div>
                    <span className="badge bg-slate-100 text-slate-700">{APP_LABEL[app.status]}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Page>
  );
}
