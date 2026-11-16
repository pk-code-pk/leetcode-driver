import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { reviewJob } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { JobFacts } from "@/components/job";
import { Field, JobStatusBadge, Page, PageHeader } from "@/components/ui";
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
      applicants: sql<number>`(select count(*)::int from ${applications} a where a.job_id = ${jobs.id})`,
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
        <p className="eyebrow">Waiting for review ({pending.length})</p>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm font-medium text-muted">Nothing to review.</p>
        ) : (
          <div className="mt-3 space-y-6">
            {pending.map(({ job, resident }) => (
              <div key={job.id} className="rounded-[24px] border border-amber-200 bg-amber-50/50 p-4" data-testid="pending-job">
                <p className="px-2 text-xl font-extrabold tracking-tight">{job.title}</p>
                <p className="px-2 text-sm font-medium text-muted">
                  {resident.firstName} {resident.lastName} · {resident.email}
                </p>
                <p className="mt-2 flex flex-wrap gap-2 px-2">
                  {job.reviewReasons.map((r) => (
                    <span key={r} className="badge bg-amber-100 text-amber-800">
                      {r}
                    </span>
                  ))}
                </p>
                <div className="mt-3">
                  <JobFacts job={job} showLandmark />
                </div>
                <ActionForm action={reviewJob} className="card mt-3 space-y-4">
                  <input type="hidden" name="jobId" value={job.id} />
                  <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
                    <Field label="Hourly rate" hint={job.rateCents == null ? "The resident asked for a suggestion." : "Leave as is, or adjust."}>
                      <input name="rate" className="input" inputMode="decimal" defaultValue={job.rateCents != null ? job.rateCents / 100 : ""} placeholder="$30" />
                    </Field>
                    <Field label="Note to the resident (required when declining)">
                      <input name="note" className="input" maxLength={500} />
                    </Field>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SubmitButton className="btn btn-green" name="decision" value="approve">
                      Approve and post
                    </SubmitButton>
                    <SubmitButton className="btn btn-danger" name="decision" value="reject">
                      Decline
                    </SubmitButton>
                  </div>
                </ActionForm>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <p className="eyebrow">All jobs</p>
        <div className="card mt-3 overflow-x-auto p-0">
          <table className="w-full text-left text-sm font-medium">
            <thead>
              <tr className="border-b border-line">
                {["Job", "Resident", "Date", "Rate", "Applicants", "Status"].map((h) => (
                  <th key={h} className="label px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ job, resident, applicants }) => (
                <tr key={job.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <Link href={`/admin/jobs/${job.id}`} className="font-bold text-blue underline">
                      {job.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    {resident.firstName} {resident.lastName}
                  </td>
                  <td className="px-5 py-3">{formatDate(job.startDate)}</td>
                  <td className="px-5 py-3">{formatRate(job.rateCents)}</td>
                  <td className="px-5 py-3">{applicants}</td>
                  <td className="px-5 py-3">
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
