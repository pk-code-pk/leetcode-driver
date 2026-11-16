import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { reviewJob } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { JobFacts } from "@/components/job";
import { Badge, Field, JobStatusBadge, Page, PageHeader, SectionTitle } from "@/components/ui";
import { db } from "@/db";
import { applications, jobs, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { formatRate } from "@/lib/money";

export default async function AdminJobs() {
  await requireUser("admin");
  const rows = await db
    .select({
      job: jobs,
      resident: { firstName: users.firstName, lastName: users.lastName, email: users.email },
      applicants: sql<number>`(select count(*)::int from applications a where a.job_id = "jobs"."id")`,
    })
    .from(jobs)
    .innerJoin(users, eq(users.id, jobs.residentId))
    .orderBy(desc(jobs.createdAt))
    .limit(200);
  const pending = rows.filter((r) => r.job.status === "pending_review");

  return (
    <Page>
      <PageHeader eyebrow="Staff" title="Jobs" />

      <section>
        <SectionTitle count={pending.length}>Waiting for review</SectionTitle>
        {pending.length === 0 ? (
          <p className="rule mt-5 border-b border-line py-8 text-muted">Nothing to review.</p>
        ) : (
          <div className="mt-5 space-y-6">
            {pending.map(({ job, resident }) => (
              <article key={job.id} className="grid gap-8 rounded-xl border border-line p-6 sm:p-8 lg:grid-cols-[1fr_22rem]" data-testid="pending-job">
                <div>
                  <p className="flex flex-wrap gap-2">
                    {job.reviewReasons.map((r) => (
                      <Badge key={r} tone="amber">
                        {r}
                      </Badge>
                    ))}
                  </p>
                  <h3 className="mt-4 text-[32px] leading-tight tracking-tight">{job.title}</h3>
                  <p className="mt-2 text-muted">
                    {resident.firstName} {resident.lastName} · {resident.email}
                  </p>
                  <div className="mt-8">
                    <JobFacts job={job} showLandmark />
                  </div>
                </div>
                <ActionForm action={reviewJob} className="tinted h-fit space-y-5 lg:sticky lg:top-28">
                  <input type="hidden" name="jobId" value={job.id} />
                  <Field label="Hourly rate" hint={job.rateCents == null ? "The resident asked for a suggestion." : "Leave as is, or adjust."}>
                    <input name="rate" className="input" inputMode="decimal" defaultValue={job.rateCents != null ? job.rateCents / 100 : ""} placeholder="$30" />
                  </Field>
                  <Field label="Note to the resident" hint="Required when declining.">
                    <textarea name="note" className="input min-h-20" maxLength={500} />
                  </Field>
                  <div className="grid gap-2">
                    <SubmitButton className="btn btn-primary w-full" name="decision" value="approve">
                      Approve and post
                    </SubmitButton>
                    <SubmitButton className="btn btn-danger w-full" name="decision" value="reject">
                      Decline
                    </SubmitButton>
                  </div>
                </ActionForm>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-16">
        <SectionTitle count={rows.length}>All jobs</SectionTitle>
        <div className="mt-5 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-ice">
                {["Job", "Resident", "Date", "Rate", "Applicants", "Status"].map((h) => (
                  <th key={h} className="caption px-5 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="num">
              {rows.map(({ job, resident, applicants }) => (
                <tr key={job.id} className="border-b border-line transition-colors last:border-0 hover:bg-ice">
                  <td className="px-5 py-4">
                    <Link href={`/admin/jobs/${job.id}`} className="link">
                      {job.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {resident.firstName} {resident.lastName}
                  </td>
                  <td className="px-5 py-4 text-muted">{formatDate(job.startDate)}</td>
                  <td className="px-5 py-4">{formatRate(job.rateCents)}</td>
                  <td className="px-5 py-4">{applicants}</td>
                  <td className="px-5 py-4">
                    <JobStatusBadge status={job.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  );
}
