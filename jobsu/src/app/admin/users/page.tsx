import Link from "next/link";
import { desc } from "drizzle-orm";
import { setSuspended } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Page, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/dates";

export default async function AdminUsers() {
  const admin = await requireUser("admin");
  const all = await db.select().from(users).orderBy(desc(users.createdAt)).limit(500);

  return (
    <Page>
      <PageHeader eyebrow="Staff" title="People" subtitle={`${all.length} accounts`} />
      <div className="space-y-3">
        {all.map((u) => (
          <div key={u.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-extrabold">
                  {u.role === "student" ? (
                    <Link href={`/students/${u.id}`} className="text-blue underline">
                      {u.firstName} {u.lastName}
                    </Link>
                  ) : (
                    `${u.firstName} ${u.lastName}`
                  )}
                </p>
                <p className="text-sm font-medium text-muted">
                  {u.email} · joined {timeAgo(u.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-ice text-navy">{u.role}</span>
                {!u.emailVerifiedAt && <span className="badge bg-amber-100 text-amber-800">Email not confirmed</span>}
                {u.suspendedAt && <span className="badge bg-red-50 text-red-700">Paused</span>}
              </div>
            </div>
            {u.id !== admin.id &&
              (u.suspendedAt ? (
                <ActionForm action={setSuspended} className="mt-3 flex flex-wrap items-center gap-3">
                  <input type="hidden" name="userId" value={u.id} />
                  <input type="hidden" name="suspend" value="0" />
                  <span className="text-sm font-medium text-muted">Reason: {u.suspendedReason}</span>
                  <SubmitButton className="btn btn-outline">Restore account</SubmitButton>
                </ActionForm>
              ) : (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-bold text-muted hover:text-red-700">Pause account</summary>
                  <ActionForm action={setSuspended} className="mt-3 flex flex-wrap items-center gap-3">
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="suspend" value="1" />
                    <input name="reason" className="input max-w-md" placeholder="Reason (the person will see this)" />
                    <SubmitButton className="btn btn-danger">Pause</SubmitButton>
                  </ActionForm>
                </details>
              ))}
          </div>
        ))}
      </div>
    </Page>
  );
}
