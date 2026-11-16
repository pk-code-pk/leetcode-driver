import Link from "next/link";
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { Empty, Page, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { applications, jobs, studentProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { TOWNS } from "@/lib/config";
import { formatDate, todayISO } from "@/lib/dates";
import { JOB_TYPES, JOB_TYPE_SLUGS, jobType, timingLabel } from "@/lib/jobTypes";
import { formatCents, formatHours, formatRate, jobTotalCents, parseDollars } from "@/lib/money";

type Props = { searchParams: Promise<{ type?: string; town?: string; minRate?: string; from?: string }> };

export default async function StudentJobs({ searchParams }: Props) {
  const user = await requireUser("student");
  const q = await searchParams;
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id)).limit(1);

  const filters = [eq(jobs.status, "open" as const), gte(jobs.startDate, todayISO())];
  if (q.type && JOB_TYPE_SLUGS.includes(q.type)) filters.push(eq(jobs.type, q.type));
  if (q.town && TOWNS.includes(q.town as (typeof TOWNS)[number])) filters.push(eq(jobs.town, q.town));
  const minRate = q.minRate ? parseDollars(q.minRate) : null;
  if (minRate != null) filters.push(gte(jobs.rateCents, minRate));
  if (q.from && /^\d{4}-\d{2}-\d{2}$/.test(q.from)) filters.push(gte(jobs.startDate, q.from));

  const list = await db.select().from(jobs).where(and(...filters)).orderBy(asc(jobs.startDate)).limit(100);
  const mine = list.length
    ? await db
        .select({ jobId: applications.jobId })
        .from(applications)
        .where(and(eq(applications.studentId, user.id), inArray(applications.jobId, list.map((j) => j.id)), eq(applications.status, "applied")))
    : [];
  const applied = new Set(mine.map((m) => m.jobId));
  const filtering = Boolean(q.type || q.town || q.minRate || q.from);

  return (
    <Page>
      <PageHeader
        green
        eyebrow="For students"
        title="Jobs near campus"
        subtitle="The rate is shown up front. Apply in one click."
      />

      {!profile?.bio && (
        <Link
          href="/student/profile"
          className="mb-6 block rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
        >
          Families pick students with a filled-in profile. Add a short bio and the jobs you want →
        </Link>
      )}

      <form className="card mb-6 grid gap-4 sm:grid-cols-5" method="get">
        <label>
          <span className="label">Job type</span>
          <select name="type" className="input" defaultValue={q.type ?? ""}>
            <option value="">All types</option>
            {JOB_TYPES.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Town</span>
          <select name="town" className="input" defaultValue={q.town ?? ""}>
            <option value="">All towns</option>
            {TOWNS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Min. pay / hr</span>
          <input name="minRate" className="input" inputMode="decimal" placeholder="$25" defaultValue={q.minRate ?? ""} />
        </label>
        <label>
          <span className="label">From date</span>
          <input name="from" type="date" className="input" defaultValue={q.from ?? ""} />
        </label>
        <div className="flex items-end gap-2">
          <button className="btn btn-green w-full">Filter</button>
        </div>
      </form>

      {list.length === 0 ? (
        <Empty
          title={filtering ? "No jobs match those filters" : "No open jobs right now"}
          body={
            filtering
              ? "Try widening your search."
              : "New jobs are posted most days. We'll email you when one matches the job types on your profile."
          }
          href={filtering ? "/student/jobs" : "/student/profile"}
          cta={filtering ? "Clear filters" : "Update my job types"}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((job) => (
            <Link key={job.id} href={`/student/jobs/${job.id}`} className="card hover:border-green-dark" data-testid="job-card">
              <div className="flex items-start justify-between gap-3">
                <p className="eyebrow-green">
                  {jobType(job.type).emoji} {jobType(job.type).label}
                </p>
                {applied.has(job.id) && <span className="badge bg-green-bg text-green-deep">Applied</span>}
              </div>
              <p className="mt-2 text-xl font-extrabold tracking-tight">{job.title}</p>
              <p className="mt-1 text-sm font-medium text-muted">
                {job.town} · {formatDate(job.startDate)}
                {job.startTime ? ` at ${job.startTime}` : ""} · {timingLabel(job.timing)}
              </p>
              <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
                <p className="text-2xl font-black text-navy">{formatRate(job.rateCents)}</p>
                <p className="text-sm font-semibold text-muted">
                  {formatHours(job.estMinutes)} · about {formatCents(jobTotalCents(job.rateCents!, job.estMinutes))}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
