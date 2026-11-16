import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { resolveReport } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Badge, Page, PageHeader } from "@/components/ui";
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
      {rows.length === 0 && <p className="rule border-b border-line py-8 text-muted">No reports.</p>}
      <div className="border-b border-line">
        {rows.map(({ report, reporter, subjectEmail }) => (
          <article key={report.id} className="rule grid gap-6 py-8 lg:grid-cols-[1fr_22rem]" data-testid="report">
            <div>
              <Badge tone={report.status === "open" ? "amber" : "slate"}>{report.status === "open" ? "Open" : "Resolved"}</Badge>
              <h2 className="mt-4 text-[28px] leading-tight tracking-tight">{report.reason}</h2>
              <p className="mt-2 text-[14px] text-muted">
                From {reporter}
                {subjectEmail ? ` about ${subjectEmail}` : ""} · {timeAgo(report.createdAt)}
              </p>
              <p className="inset mt-5 max-w-[62ch] whitespace-pre-wrap">{report.details}</p>
              {report.jobId && (
                <Link href={`/admin/jobs/${report.jobId}`} className="link mt-4 inline-block text-[15px]">
                  View the job
                </Link>
              )}
            </div>
            {report.status === "open" ? (
              <ActionForm action={resolveReport} className="tinted h-fit space-y-4">
                <input type="hidden" name="reportId" value={report.id} />
                <label className="block">
                  <span className="label">What you did about it</span>
                  <textarea name="note" className="input min-h-20" />
                </label>
                <SubmitButton className="btn btn-primary w-full">Mark resolved</SubmitButton>
              </ActionForm>
            ) : (
              report.adminNote && (
                <div className="tinted h-fit">
                  <p className="caption text-muted">Resolution</p>
                  <p className="mt-2">{report.adminNote}</p>
                </div>
              )
            )}
          </article>
        ))}
      </div>
    </Page>
  );
}
