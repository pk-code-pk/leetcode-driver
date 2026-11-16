import Link from "next/link";
import { desc } from "drizzle-orm";
import { setSuspended } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Avatar, Badge, Page, PageHeader } from "@/components/ui";
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
      <div className="rows">
        {all.map((u) => (
          <div key={u.id} className="card rounded-none border-0 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={`${u.firstName} ${u.lastName}`} size={44} verified={u.role === "student" && Boolean(u.emailVerifiedAt)} />
              <div className="min-w-0 flex-1">
                <p className="text-[19px] tracking-tight">
                  {u.role === "student" ? (
                    <Link href={`/students/${u.id}`} className="link">
                      {u.firstName} {u.lastName}
                    </Link>
                  ) : (
                    `${u.firstName} ${u.lastName}`
                  )}
                </p>
                <p className="text-[14px] text-muted">
                  {u.email} · joined {timeAgo(u.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={u.role === "admin" ? "blue" : "slate"}>{u.role}</Badge>
                {!u.emailVerifiedAt && <Badge tone="amber">Email not confirmed</Badge>}
                {u.suspendedAt && <Badge tone="red">Paused</Badge>}
              </div>
            </div>
            {u.id !== admin.id &&
              (u.suspendedAt ? (
                <ActionForm action={setSuspended} className="mt-4 flex flex-wrap items-center gap-3 pl-[60px]">
                  <input type="hidden" name="userId" value={u.id} />
                  <input type="hidden" name="suspend" value="0" />
                  <span className="text-[14px] text-muted">Reason: {u.suspendedReason}</span>
                  <SubmitButton className="btn btn-outline btn-sm">Restore account</SubmitButton>
                </ActionForm>
              ) : (
                <details className="mt-2 pl-[60px]">
                  <summary className="cursor-pointer text-[14px] text-faint hover:text-red-700">Pause account</summary>
                  <ActionForm action={setSuspended} className="mt-3 flex flex-wrap items-center gap-3">
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="suspend" value="1" />
                    <input name="reason" className="input max-w-md" placeholder="Reason (the person will see this)" />
                    <SubmitButton className="btn btn-danger btn-sm">Pause</SubmitButton>
                  </ActionForm>
                </details>
              ))}
          </div>
        ))}
      </div>
    </Page>
  );
}
