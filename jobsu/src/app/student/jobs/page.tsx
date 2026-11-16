import Link from "next/link";
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { ArrowUpRight, CalendarDays, Clock, MapPin, Repeat, SearchX } from "lucide-react";
import { Badge, Empty, JobTile, Meta, Page, PageHeader, Rate } from "@/components/ui";
import { db } from "@/db";
import { applications, jobs, studentProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { TOWNS } from "@/lib/config";
import { formatDate, todayISO } from "@/lib/dates";
import { JOB_TYPES, JOB_TYPE_SLUGS, timingLabel } from "@/lib/jobTypes";
import { formatCents, formatHours, jobTotalCents, parseDollars } from "@/lib/money";

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
  const field = "h-14 w-full bg-transparent px-4 pt-4 text-[15px] text-ink outline-none";

  return (
    <Page>
      <PageHeader eyebrow="For students" title="Jobs near campus" subtitle="The rate is shown up front. Apply in one click." />

      {!profile?.bio && (
        <Link href="/student/profile" className="mb-8 flex items-center justify-between gap-4 rounded-lg bg-tint px-5 py-4 text-ink">
          <span className="flex items-center gap-3">
            <span className="sq" />
            Families pick students with a filled-in profile. Add a short bio and the jobs you want.
          </span>
          <ArrowUpRight size={18} strokeWidth={1.5} className="shrink-0" />
        </Link>
      )}

      {/* One joined filter bar that floats over the list while scrolling */}
      <form method="get" className="glass z-30 mb-8 grid rounded-xl sm:sticky sm:top-[84px] sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
        {(
          [
            ["Job type", <select key="t" name="type" className={`${field} appearance-none`} defaultValue={q.type ?? ""}><option value="">All types</option>{JOB_TYPES.map((t) => <option key={t.slug} value={t.slug}>{t.label}</option>)}</select>],
            ["Town", <select key="w" name="town" className={`${field} appearance-none`} defaultValue={q.town ?? ""}><option value="">All towns</option>{TOWNS.map((t) => <option key={t}>{t}</option>)}</select>],
            ["Min. pay / hr", <input key="m" name="minRate" className={field} inputMode="decimal" placeholder="Any" defaultValue={q.minRate ?? ""} />],
            ["From date", <input key="f" name="from" type="date" className={field} defaultValue={q.from ?? ""} />],
          ] as const
        ).map(([label, control], i) => (
          <label key={label} className={`relative block ${i ? "border-t border-ink/10 sm:border-l sm:border-t-0" : ""}`}>
            <span className="caption pointer-events-none absolute left-4 top-2.5">{label}</span>
            {control}
          </label>
        ))}
        <div className="flex items-center gap-2 border-t border-ink/10 p-2 sm:border-l sm:border-t-0">
          <button className="btn btn-primary btn-sm h-10 w-full">Search</button>
        </div>
      </form>

      {list.length === 0 ? (
        <Empty
          icon={SearchX}
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
        <>
          <p className="caption mb-3">
            {String(list.length).padStart(2, "0")} open {list.length === 1 ? "job" : "jobs"}
            {filtering && (
              <Link href="/student/jobs" className="ml-3 normal-case tracking-normal text-ink underline">
                Clear filters
              </Link>
            )}
          </p>
          <div className="rows">
            {list.map((job) => (
              <Link key={job.id} href={`/student/jobs/${job.id}`} className="row group flex-wrap items-start sm:flex-nowrap sm:items-center" data-testid="job-card">
                <span className="hidden sm:block">
                  <JobTile type={job.type} size={52} />
                </span>
                <div className="min-w-0 flex-1 basis-full sm:basis-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[22px] leading-tight tracking-tight">{job.title}</p>
                    {applied.has(job.id) && <Badge tone="green">Applied</Badge>}
                  </div>
                  <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-muted">
                    <Meta icon={MapPin}>{job.town}</Meta>
                    <Meta icon={CalendarDays}>
                      {formatDate(job.startDate)}
                      {job.startTime ? ` at ${job.startTime}` : ""}
                    </Meta>
                    <Meta icon={Clock}>{formatHours(job.estMinutes)}</Meta>
                    <Meta icon={Repeat}>{timingLabel(job.timing)}</Meta>
                  </p>
                </div>
                <div className="flex items-baseline gap-3 sm:block sm:text-right">
                  <Rate cents={job.rateCents} />
                  <p className="text-[13px] text-faint sm:mt-1">about {formatCents(jobTotalCents(job.rateCents!, job.estMinutes))} total</p>
                </div>
                <ArrowUpRight
                  size={20}
                  strokeWidth={1.5}
                  className="hidden shrink-0 text-faint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink sm:block"
                />
              </Link>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
