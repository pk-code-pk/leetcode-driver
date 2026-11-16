import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { Empty, JobStatusBadge, Page, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { applications, jobs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { jobType } from "@/lib/jobTypes";
import { formatHours, formatRate } from "@/lib/money";

export default async function ResidentJobs() {
  const user = await requireUser("resident");
  const rows = await db
    .select({
      job: jobs,
      applicants: sql<number>`(select count(*)::int from ${applications} a where a.job_id = ${jobs.id} and a.status = 'applied')`,
    })
    .from(jobs)
    .where(and(eq(jobs.residentId, user.id)))
    .orderBy(desc(jobs.createdAt));

  return (
    <Page>
      <PageHeader
        eyebrow={`Hi ${user.firstName}`}
        title="Your jobs"
        action={
          <Link href="/resident/jobs/new" className="btn btn-primary">
            Post a job
          </Link>
        }
      />
      {rows.length === 0 ? (
        <Empty
          title="No jobs yet"
          body="Post your first job and .edu-confirmed students nearby will apply."
          href="/resident/jobs/new"
          cta="Post a job"
        />
      ) : (
        <div className="space-y-3">
          {rows.map(({ job, applicants }) => (
            <Link key={job.id} href={`/resident/jobs/${job.id}`} className="card flex flex-wrap items-center justify-between gap-3 hover:border-blue">
              <div>
                <p className="text-lg font-extrabold tracking-tight">
                  {jobType(job.type).emoji} {job.title}
                </p>
                <p className="mt-0.5 text-sm font-medium text-muted">
                  {formatDate(job.startDate)} · {formatHours(job.estMinutes)} · {formatRate(job.rateCents)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {job.status === "open" && applicants > 0 && (
                  <span className="badge bg-blue text-white">
                    {applicants} {applicants === 1 ? "applicant" : "applicants"}
                  </span>
                )}
                <JobStatusBadge status={job.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
