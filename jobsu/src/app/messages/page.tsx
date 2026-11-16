import Link from "next/link";
import { desc, eq, or, sql } from "drizzle-orm";
import { Avatar, Empty, Page, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { conversations, jobs, messages, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/dates";
import { publicName } from "@/lib/queries";

export default async function Messages() {
  const user = await requireUser(["resident", "student"]);
  const isResident = user.role === "resident";
  const other = isResident ? conversations.studentId : conversations.residentId;

  const rows = await db
    .select({
      convo: conversations,
      jobTitle: jobs.title,
      other: { firstName: users.firstName, lastName: users.lastName },
      lastBody: sql<string | null>`(select m.body from ${messages} m where m.conversation_id = ${conversations.id} order by m.created_at desc limit 1)`,
      lastSender: sql<string | null>`(select m.sender_id from ${messages} m where m.conversation_id = ${conversations.id} order by m.created_at desc limit 1)`,
    })
    .from(conversations)
    .innerJoin(jobs, eq(jobs.id, conversations.jobId))
    .innerJoin(users, eq(users.id, other))
    .where(or(eq(conversations.residentId, user.id), eq(conversations.studentId, user.id)))
    .orderBy(desc(sql`coalesce(${conversations.lastMessageAt}, ${conversations.createdAt})`));

  return (
    <Page narrow>
      <PageHeader eyebrow="Inbox" title="Messages" green={!isResident} />
      {rows.length === 0 ? (
        <Empty
          title="No conversations yet"
          body={
            isResident
              ? "When a student applies to one of your jobs, you can message them here."
              : "When you apply to a job, you can message the family here."
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map(({ convo, jobTitle, other: o, lastBody, lastSender }) => {
            const lastRead = isResident ? convo.residentLastReadAt : convo.studentLastReadAt;
            const unread =
              convo.lastMessageAt != null && lastSender !== user.id && (lastRead == null || lastRead < convo.lastMessageAt);
            const name = isResident ? publicName(o) : o.firstName;
            return (
              <Link key={convo.id} href={`/messages/${convo.id}`} className="card flex items-center gap-4 hover:border-blue">
                <Avatar name={name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-extrabold">
                    {name}
                    {unread && <span className="h-2.5 w-2.5 rounded-full bg-blue" aria-label="Unread" />}
                  </p>
                  <p className="truncate text-xs font-bold uppercase tracking-wide text-muted">{jobTitle}</p>
                  <p className={`truncate text-sm ${unread ? "font-bold text-navy" : "font-medium text-muted"}`}>
                    {lastBody ?? "No messages yet. Say hello."}
                  </p>
                </div>
                {convo.lastMessageAt && (
                  <span className="shrink-0 text-xs font-semibold text-muted">{timeAgo(convo.lastMessageAt)}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </Page>
  );
}
