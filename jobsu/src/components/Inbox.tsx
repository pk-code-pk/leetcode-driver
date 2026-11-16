import Link from "next/link";
import { desc, eq, or, sql } from "drizzle-orm";
import { Avatar } from "./ui";
import { db } from "@/db";
import { conversations, jobs, messages, users, type User } from "@/db/schema";
import { timeAgo } from "@/lib/dates";
import { publicName } from "@/lib/queries";

/** The list of conversations, shown beside the open thread on wide screens. */
export async function ConversationList({
  user,
  activeId,
  activeOnWide,
}: {
  user: User;
  activeId?: string;
  /** Highlight the active row only on wide screens, where its thread is shown beside the list. */
  activeOnWide?: boolean;
}) {
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

  if (rows.length === 0) return null;

  return (
    <nav aria-label="Conversations" className="rows">
      {rows.map(({ convo, jobTitle, other: o, lastBody, lastSender }) => {
        const lastRead = isResident ? convo.residentLastReadAt : convo.studentLastReadAt;
        const active = convo.id === activeId;
        const unread =
          (!active || activeOnWide) && convo.lastMessageAt != null && lastSender !== user.id && (lastRead == null || lastRead < convo.lastMessageAt);
        const name = isResident ? publicName(o) : o.firstName;
        return (
          <Link
            key={convo.id}
            href={`/messages/${convo.id}`}
            aria-current={active ? "page" : undefined}
            data-testid="conversation"
            className={`flex items-center gap-3.5 px-4 py-4 transition-colors ${active ? (activeOnWide ? "hover:bg-ice lg:bg-tint" : "bg-tint") : "hover:bg-ice"}`}
          >
            <Avatar name={name} size={44} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 truncate text-[17px]">
                  {name}
                  {unread && <span className="sq text-blue" aria-label="Unread" />}
                </span>
                {convo.lastMessageAt && <span className="shrink-0 text-[12px] text-faint">{timeAgo(convo.lastMessageAt)}</span>}
              </span>
              <span className="caption block truncate">{jobTitle}</span>
              <span className={`mt-0.5 block truncate text-[14px] ${unread ? "text-ink" : "text-muted"}`}>
                {lastBody ?? "No messages yet"}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
