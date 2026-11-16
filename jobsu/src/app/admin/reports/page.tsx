import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { resolveReport } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Page, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/dates";

export default async function AdminReports() {
  await requireUser("admin");
  const subject = alias(users, "subject");
  const rows = await db
    .select({ report: reports, reporter: users.email, subjectEmail: subject.email, subjectId: subject.id })
    .from(reports)
    .innerJoin(users, eq(users.id, reports.reporterId))
    .leftJoin(subject, eq(subject.id, reports.subjectId))
    .orderBy(desc(reports.createdAt))
    .limit(200);

  return (
    <Page>
      <PageHeader eyebrow="Staff" title="Reports" />
      {rows.length === 0 && <p className="text-sm font-medium text-muted">No reports.</p>}
      <div className="space-y-4">
        {rows.map(({ report, reporter, subjectEmail }) => (
          <div key={report.id} className="card" data-testid="report">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-lg font-extrabold">{report.reason}</p>
              <span className={`badge ${report.status === "open" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                {report.status === "open" ? "Open" : "Resolved"}
              </span>
            </div>
            <p className="text-sm font-medium text-muted">
              From {reporter}
              {subjectEmail ? ` about ${subjectEmail}` : ""} · {timeAgo(report.createdAt)}
            </p>
            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-ice px-4 py-3 text-sm font-medium">{report.details}</p>
            {report.jobId && (
              <Link href={`/admin/jobs/${report.jobId}`} className="mt-2 inline-block text-sm font-bold text-blue underline">
                View the job
              </Link>
            )}
            {report.status === "open" ? (
              <ActionForm action={resolveReport} className="mt-4 flex flex-wrap items-center gap-3">
                <input type="hidden" name="reportId" value={report.id} />
                <input name="note" className="input max-w-md" placeholder="What you did about it" />
                <SubmitButton className="btn btn-outline">Mark resolved</SubmitButton>
              </ActionForm>
            ) : (
              report.adminNote && <p className="mt-3 text-sm font-medium text-muted">Resolution: {report.adminNote}</p>
            )}
          </div>
        ))}
      </div>
    </Page>
  );
}
