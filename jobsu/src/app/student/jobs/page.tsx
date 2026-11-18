import Link from "next/link";
import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { ArrowUpRight, CalendarDays, Car, Clock, MapPin, Repeat, SearchX, Users } from "lucide-react";
import { Badge, Empty, JobTile, Meta, Page, PageHeader, Rate } from "@/components/ui";
import { db } from "@/db";
import { applications, jobs, studentProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { TOWNS } from "@/lib/config";
import { paymentsProvider } from "@/lib/payments";
import { formatDate, todayISO } from "@/lib/dates";
import { JOB_TYPES, JOB_TYPE_SLUGS, jobType, timingLabel, transportOption } from "@/lib/jobTypes";
import { formatCents, formatHours, jobTotalCents, parseDollars } from "@/lib/money";

type Props = { searchParams: Promise<{ type?: string; town?: string; minRate?: string; from?: string; view?: string }> };

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

  const rows = await db.select().from(jobs).where(and(...filters)).orderBy(asc(jobs.startDate)).limit(100);
  const counts = rows.length
    ? await db
        .select({ jobId: applications.jobId, n: sql<number>`count(*)::int` })
        .from(applications)
        .where(and(inArray(applications.jobId, rows.map((j) => j.id)), inArray(applications.status, ["applied", "selected"])))
        .groupBy(applications.jobId)
    : [];
  const appliedCount = new Map(counts.map((c) => [c.jobId, c.n]));

  // "For you" puts the job types on the student's profile first and jobs that
  // need a car last for students without one. "All jobs" is by date.
  const forYou = q.view !== "all";
  const needsCar = (j: (typeof rows)[number]) => Boolean(transportOption(j.transport)?.needsCar);
  const score = (j: (typeof rows)[number]) =>
    (profile?.jobTypes.includes(j.type) ? 2 : 0) - (needsCar(j) && !profile?.hasCar ? 3 : 0);
  const list = forYou ? [...rows].sort((a, b) => score(b) - score(a)) : rows;
  const mine = list.length
    ? await db
        .select({ jobId: applications.jobId })
        .from(applications)
        .where(and(eq(applications.studentId, user.id), inArray(applications.jobId, list.map((j) => j.id)), eq(applications.status, "applied")))
    : [];
  const applied = new Set(mine.map((m) => m.jobId));
  const filtering = Boolean(q.type || q.town || q.minRate || q.from);
  const keep = new URLSearchParams(Object.entries(q).filter(([k, v]) => k !== "view" && v) as [string, string][]);
  const tab = (view: string) => `/student/jobs?${new URLSearchParams([...keep, ...(view === "all" ? [["view", "all"]] : [])]).toString()}`;
  const field = "h-14 w-full bg-transparent px-4 pt-4 text-[15px] text-ink outline-none";

  return (
    <Page>
      <PageHeader eyebrow="For students" title="Jobs near campus" subtitle="The rate is shown up front. Applying takes a minute." />

      {paymentsProvider() === "stripe" && !profile?.payoutsEnabled && (
        <Link
          href="/student/payouts"
          className="mb-4 flex items-center justify-between gap-4 rounded-lg bg-amber-50 px-5 py-4 text-amber-900"
          data-testid="payout-banner"
        >
          <span className="flex items-center gap-3">
            <span className="sq" />
            Set up payouts to get paid. A family can&apos;t book you until your bank is connected.
          </span>
          <ArrowUpRight size={18} strokeWidth={1.5} className="shrink-0" />
        </Link>
      )}

      {!profile?.bio && (
        <Link href="/student/profile" className="mb-8 flex items-center justify-between gap-4 rounded-lg bg-tint px-5 py-4 text-ink">
          <span className="flex items-center gap-3">
            <span className="sq" />
            Families pick students with a filled-in profile. Add a short bio and the jobs you want.
          </span>
          <ArrowUpRight size={18} strokeWidth={1.5} className="shrink-0" />
        </Link>
      )}

      <div className="mb-5 flex gap-1 rounded-lg bg-tint p-1 sm:w-max" role="tablist" aria-label="Sort jobs">
        {(
          [
            ["for-you", "For you"],
            ["all", "All jobs"],
          ] as const
        ).map(([v, label]) => {
          const on = (v === "all") === !forYou;
          return (
            <Link
              key={v}
              href={tab(v)}
              role="tab"
              aria-selected={on}
              className={`rounded-md px-4 py-2 text-[14px] transition-colors ${on ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {label}
            </Link>
          );
        })}
        {forYou && <span className="hidden self-center px-3 text-[13px] text-faint sm:inline">Sorted by the work you said you&apos;d take on</span>}
      </div>

      {/* One joined filter bar that floats over the list while scrolling */}
      <form method="get" className="glass z-30 mb-8 grid grid-cols-2 rounded-xl sm:sticky sm:top-[84px] sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
        {(
          [
            ["Job type", <select key="t" name="type" className={`${field} appearance-none`} defaultValue={q.type ?? ""}><option value="">All types</option>{JOB_TYPES.map((t) => <option key={t.slug} value={t.slug}>{t.label}</option>)}</select>],
            ["Town", <select key="w" name="town" className={`${field} appearance-none`} defaultValue={q.town ?? ""}><option value="">All towns</option>{TOWNS.map((t) => <option key={t}>{t}</option>)}</select>],
            ["Min. pay / hr", <input key="m" name="minRate" className={field} inputMode="decimal" placeholder="Any" defaultValue={q.minRate ?? ""} />],
            ["From date", <input key="f" name="from" type="date" className={field} defaultValue={q.from ?? ""} />],
          ] as const
        ).map(([label, control], i) => (
          <label
            key={label}
            className={`relative block min-w-0 border-ink/10 ${i % 2 ? "border-l" : ""} ${i >= 2 ? "border-t sm:border-t-0" : ""} ${i ? "sm:border-l" : ""}`}
          >
            <span className="caption pointer-events-none absolute left-4 top-2.5">{label}</span>
            {control}
          </label>
        ))}
        <div className="col-span-2 flex items-center gap-2 border-t border-ink/10 p-2 sm:col-span-1 sm:border-l sm:border-t-0">
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
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="text-muted">{jobType(job.type).label}</span>
                    {needsCar(job) && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">
                        <Car size={12} /> Car needed
                      </span>
                    )}
                    {job.studentsNeeded > 1 && (
                      <span className="inline-flex items-center gap-1 rounded bg-tint px-1.5 py-0.5 text-ink">
                        <Users size={12} /> Hiring {job.studentsNeeded}
                      </span>
                    )}
                  </p>
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
                  <p className="text-[13px] sm:mt-1" data-testid="applied-count">
                    {appliedCount.get(job.id) ? (
                      <span className="text-muted">{appliedCount.get(job.id)} applied</span>
                    ) : (
                      <span className="text-blue">Be the first</span>
                    )}
                  </p>
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
