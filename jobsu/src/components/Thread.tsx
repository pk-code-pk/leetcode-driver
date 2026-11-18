import Link from "next/link";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { Banknote, CalendarDays, MapPin } from "lucide-react";
import { sendMessage } from "@/app/actions/social";
import { ActionForm, SubmitButton } from "./forms";
import { Avatar, JobStatusBadge, Meta, photoUrl } from "./ui";
import { db } from "@/db";
import { conversations, jobs, messages, users, type User } from "@/db/schema";
import { formatDate, timeAgo } from "@/lib/dates";
import { formatRate } from "@/lib/money";
import { publicName } from "@/lib/queries";

/** The id of the viewer's most recently active conversation, if they have one. */
export async function latestConversationId(user: User): Promise<string | null> {
  const [row] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(or(eq(conversations.residentId, user.id), eq(conversations.studentId, user.id)))
    .orderBy(desc(sql`coalesce(${conversations.lastMessageAt}, ${conversations.createdAt})`))
    .limit(1);
  return row?.id ?? null;
}

/** One conversation: who it's with, which job it's about, the messages, and the reply box. */
export async function Thread({ user, id, markRead }: { user: User; id: string; markRead?: boolean }) {
  const [convo] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), or(eq(conversations.residentId, user.id), eq(conversations.studentId, user.id))))
    .limit(1);
  if (!convo) return null;

  const isResident = convo.residentId === user.id;
  const [other] = await db
    .select()
    .from(users)
    .where(eq(users.id, isResident ? convo.studentId : convo.residentId))
    .limit(1);
  const [job] = await db.select().from(jobs).where(eq(jobs.id, convo.jobId)).limit(1);
  const thread = await db.select().from(messages).where(eq(messages.conversationId, convo.id)).orderBy(asc(messages.createdAt));

  if (markRead) {
    await db
      .update(conversations)
      .set(isResident ? { residentLastReadAt: new Date() } : { studentLastReadAt: new Date() })
      .where(eq(conversations.id, convo.id));
  }

  const name = isResident ? publicName(other) : other.firstName;
  const jobHref = isResident ? `/resident/jobs/${job.id}` : `/student/jobs/${job.id}`;

  return (
    <section className="overflow-hidden rounded-xl border border-line">
      <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={name} size={48} verified={isResident} src={photoUrl(other)} />
          <div className="min-w-0">
            <h1 className="truncate text-[24px] leading-tight tracking-tight">{name}</h1>
            <p className="text-[14px] text-muted">{isResident ? "Boston College student" : `Family in ${job.town}`}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {isResident && (
            <Link href={`/students/${other.id}`} className="btn btn-outline btn-sm hidden sm:inline-flex">
              Profile
            </Link>
          )}
          <Link href={`/report?conversationId=${convo.id}`} className="text-[14px] text-faint hover:text-red-700">
            Report
          </Link>
        </div>
      </header>

      <Link
        href={jobHref}
        className="group flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-y border-line bg-white px-5 py-3 transition-colors hover:bg-ice sm:px-6"
      >
        <span className="min-w-0">
          <span className="block truncate text-[16px] text-ink group-hover:underline">{job.title}</span>
          <span className="mt-0.5 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
            <Meta icon={CalendarDays}>{formatDate(job.startDate)}</Meta>
            <Meta icon={MapPin}>{job.town}</Meta>
            {job.rateCents != null && <Meta icon={Banknote}>{formatRate(job.rateCents)}</Meta>}
          </span>
        </span>
        <JobStatusBadge status={job.status} />
      </Link>

      <div className="min-h-[22rem] space-y-3 bg-ice px-5 py-6 sm:px-6" data-testid="thread">
        {thread.length === 0 && <p className="py-16 text-center text-muted">No messages yet. Say hello and sort out the details.</p>}
        {thread.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[78%]">
                <p
                  className={`whitespace-pre-wrap break-words rounded-xl px-4 py-3 text-[16px] leading-normal ${
                    mine ? "rounded-br-sm bg-deep text-white" : "rounded-bl-sm bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-line)]"
                  }`}
                >
                  {m.body}
                </p>
                <p className={`mt-1 text-[12px] text-faint ${mine ? "text-right" : ""}`}>{timeAgo(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <ActionForm action={sendMessage} className="border-t border-line p-4 sm:p-5">
        <input type="hidden" name="conversationId" value={convo.id} />
        <div className="flex items-end gap-3">
          <textarea
            key={thread.length}
            name="body"
            className="input min-h-12 flex-1 resize-none"
            rows={2}
            required
            maxLength={2000}
            placeholder={`Message ${other.firstName}…`}
          />
          <SubmitButton>Send</SubmitButton>
        </div>
        <p className="mt-3 text-[13px] text-faint">Keep payments on JobsU. Contact details are shared once you&apos;ve booked together.</p>
      </ActionForm>
    </section>
  );
}
