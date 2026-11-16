import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { ArrowUpRight, Briefcase, CalendarDays, MapPin } from "lucide-react";
import { CountUp } from "@/components/motion";
import { Badge, BookingStatusBadge, Empty, JobTile, Meta, Page, PageHeader, Rate, SectionTitle, type Tone } from "@/components/ui";
import { db } from "@/db";
import { applications, bookings, jobs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { ratingsFor } from "@/lib/queries";

const APP_LABEL: Record<string, [string, Tone]> = {
  applied: ["Applied", "green"],
  declined: ["Not selected", "slate"],
  withdrawn: ["Withdrawn", "slate"],
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
  const completed = booked.filter((b) => b.booking.status === "completed").length;
  const upcoming = booked.filter((b) => b.booking.status === "authorized").length;
  const rating = (await ratingsFor([user.id])).get(user.id)!;

  const arrow = (
    <ArrowUpRight
      size={20}
      strokeWidth={1.5}
      className="shrink-0 text-faint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
    />
  );

  return (
    <Page>
      <PageHeader eyebrow="For students" title="My jobs" />

      <dl className="mb-12 grid grid-cols-2 border-y border-line sm:grid-cols-4">
        <div className="py-6">
          <dt className="caption">Earned on JobsU</dt>
          <dd className="mt-2 text-[40px] leading-none tracking-tight" data-testid="earned">
            <CountUp value={earned / 100} prefix="$" decimals={earned % 100 ? 2 : 0} />
          </dd>
        </div>
        <div className="border-l border-line py-6 pl-6">
          <dt className="caption">Jobs completed</dt>
          <dd className="mt-2 text-[40px] leading-none tracking-tight">
            <CountUp value={completed} />
          </dd>
        </div>
        <div className="border-t border-line py-6 sm:border-l sm:border-t-0 sm:pl-6">
          <dt className="caption">Coming up</dt>
          <dd className="mt-2 text-[40px] leading-none tracking-tight">
            <CountUp value={upcoming} />
          </dd>
        </div>
        <div className="border-l border-t border-line py-6 pl-6 sm:border-t-0">
          <dt className="caption">Your rating</dt>
          <dd className="mt-2 text-[40px] leading-none tracking-tight">{rating.average != null ? rating.average.toFixed(1) : "—"}</dd>
        </div>
      </dl>

      {booked.length === 0 && apps.length === 0 ? (
        <Empty icon={Briefcase} title="Nothing here yet" body="Apply to a job and it will show up here." href="/student/jobs" cta="Find jobs" />
      ) : (
        <div className="space-y-14">
          {booked.length > 0 && (
            <section>
              <SectionTitle count={booked.length}>Booked</SectionTitle>
              <div className="rows mt-5">
                {booked.map(({ booking, job }) => (
                  <Link key={booking.id} href={`/student/jobs/${job.id}`} className="row group">
                    <span className="hidden sm:block"><JobTile type={job.type} size={48} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[19px] leading-snug tracking-tight sm:line-clamp-none sm:truncate sm:text-[20px]">{job.title}</p>
                      <p className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-muted">
                        <Meta icon={CalendarDays}>{formatDate(job.startDate)}</Meta>
                        <Meta icon={MapPin}>{job.town}</Meta>
                      </p>
                    </div>
                    <BookingStatusBadge status={booking.status} />
                    <div className="hidden w-28 text-right sm:block">
                      <Rate cents={booking.rateCents} />
                    </div>
                    {arrow}
                  </Link>
                ))}
              </div>
            </section>
          )}
          {apps.length > 0 && (
            <section>
              <SectionTitle count={apps.length}>Applications</SectionTitle>
              <div className="rows mt-5">
                {apps.map(({ app, job }) => (
                  <Link key={app.id} href={`/student/jobs/${job.id}`} className="row group">
                    <span className="hidden sm:block"><JobTile type={job.type} size={48} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[19px] leading-snug tracking-tight sm:line-clamp-none sm:truncate sm:text-[20px]">{job.title}</p>
                      <p className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-muted">
                        <Meta icon={CalendarDays}>{formatDate(job.startDate)}</Meta>
                        <Meta icon={MapPin}>{job.town}</Meta>
                      </p>
                    </div>
                    <Badge tone={APP_LABEL[app.status][1]}>{APP_LABEL[app.status][0]}</Badge>
                    <div className="hidden w-28 text-right sm:block">
                      <Rate cents={job.rateCents} />
                    </div>
                    {arrow}
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
