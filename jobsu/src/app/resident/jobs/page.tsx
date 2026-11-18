import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { ArrowUpRight, CalendarDays, ClipboardList, Clock, RotateCcw, Users } from "lucide-react";
import { CountUp } from "@/components/motion";
import { Badge, Empty, JobStatusBadge, JobTile, Meta, Page, PageHeader, Rate } from "@/components/ui";
import { db } from "@/db";
import { applications, bookings, jobs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { formatHours } from "@/lib/money";

export default async function ResidentJobs() {
  const user = await requireUser("resident");
  const rows = await db
    .select({
      job: jobs,
      // Written out by hand: inside a single-table select, a column placeholder loses its table name.
      applicants: sql<number>`(select count(*)::int from applications a where a.job_id = "jobs"."id" and a.status = 'applied')`,
      awaitingConfirm: sql<boolean>`exists (select 1 from bookings b where b.job_id = "jobs"."id" and b.status = 'completed_pending')`,
      doneBy: sql<string | null>`(select string_agg(u.first_name || ' ' || left(u.last_name, 1) || '.', ', ') from bookings b join users u on u.id = b.student_id where b.job_id = "jobs"."id" and b.status = 'completed')`,
    })
    .from(jobs)
    .where(and(eq(jobs.residentId, user.id)))
    .orderBy(desc(jobs.createdAt));
  const [spent] = await db
    .select({ cents: sql<number>`coalesce(sum(${bookings.amountCents}), 0)::int` })
    .from(bookings)
    .where(and(eq(bookings.residentId, user.id), eq(bookings.status, "completed")));

  const count = (s: string) => rows.filter((r) => r.job.status === s).length;
  // What needs the resident first, then what's in motion, then history.
  const needsYou = rows.filter((r) => r.awaitingConfirm || (r.job.status === "open" && r.applicants > 0));
  const active = rows.filter((r) => !needsYou.includes(r) && ["open", "booked", "pending_review"].includes(r.job.status));
  const past = rows.filter((r) => ["completed", "cancelled"].includes(r.job.status));
  const groups = [
    ["Needs you", needsYou],
    ["In progress", active],
    ["Past jobs", past],
  ] as const;
  const waiting = rows.reduce((n, r) => n + (r.job.status === "open" ? r.applicants : 0), 0);

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
          icon={ClipboardList}
          title="No jobs yet"
          body="Post your first job and .edu-confirmed students nearby will apply."
          href="/resident/jobs/new"
          cta="Post a job"
        />
      ) : (
        <>
          <dl className="mb-10 grid grid-cols-2 border-y border-line sm:grid-cols-4">
            {(
              [
                ["Open", <CountUp key="o" value={count("open")} />],
                ["Applicants waiting", <CountUp key="a" value={waiting} />],
                ["Booked", <CountUp key="b" value={count("booked")} />],
                ["Paid through JobsU", <CountUp key="s" value={spent.cents / 100} prefix="$" decimals={spent.cents % 100 ? 2 : 0} />],
              ] as const
            ).map(([label, value], i) => (
              <div key={label} className={`py-6 sm:px-6 ${i ? "sm:border-l sm:border-line" : "sm:pl-0"} ${i % 2 ? "border-l border-line pl-6 sm:pl-6" : ""}`}>
                <dt className="caption">{label}</dt>
                <dd className="mt-2 text-[40px] leading-none tracking-tight">{value}</dd>
              </div>
            ))}
          </dl>

          {groups.map(
            ([label, list]) =>
              list.length > 0 && (
                <section key={label} className="mb-10">
                  <h2 className="caption mb-3 flex items-center gap-2 text-muted">
                    {label}
                    <span className="num text-faint">{String(list.length).padStart(2, "0")}</span>
                  </h2>
                  <div className="rows">
                    {list.map(({ job, applicants, awaitingConfirm, doneBy }) => (
                      <div key={job.id} className="row group relative">
                <span className="hidden sm:block"><JobTile type={job.type} size={48} /></span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/resident/jobs/${job.id}`}
                    className="line-clamp-2 text-[19px] leading-snug tracking-tight after:absolute after:inset-0 sm:line-clamp-none sm:truncate sm:text-[20px]"
                  >
                    {job.title}
                  </Link>
                  <p className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-muted">
                    <Meta icon={CalendarDays}>{formatDate(job.startDate)}</Meta>
                    <Meta icon={Clock}>{formatHours(job.estMinutes)}</Meta>
                    {job.studentsNeeded > 1 && <Meta icon={Users}>{job.studentsNeeded} students</Meta>}
                    {doneBy && <span>Done by {doneBy}</span>}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                  {job.status === "open" && applicants > 0 && (
                    <Badge tone="blue">
                      {applicants} {applicants === 1 ? "applicant" : "applicants"}
                    </Badge>
                  )}
                  {awaitingConfirm ? <Badge tone="amber">Confirm it&apos;s done</Badge> : <JobStatusBadge status={job.status} />}
                  {(job.status === "completed" || job.status === "cancelled") && (
                    <Link href={`/resident/jobs/new?from=${job.id}`} className="btn btn-outline btn-sm relative z-10">
                      <RotateCcw size={14} strokeWidth={1.75} /> Repost
                    </Link>
                  )}
                </div>
                <div className="hidden w-28 text-right sm:block">
                  <Rate cents={job.rateCents} />
                </div>
                <ArrowUpRight
                  size={20}
                  strokeWidth={1.5}
                  className="shrink-0 text-faint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                />
              </div>
                    ))}
                  </div>
                </section>
              ),
          )}
        </>
      )}
    </Page>
  );
}
