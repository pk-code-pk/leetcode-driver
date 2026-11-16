import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, or } from "drizzle-orm";
import { sendMessage } from "@/app/actions/social";
import { ActionForm, SubmitButton } from "@/components/forms";
import { ConversationList } from "@/components/Inbox";
import { Avatar, Back, Page } from "@/components/ui";
import { db } from "@/db";
import { conversations, jobs, messages, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/dates";
import { publicName } from "@/lib/queries";

type Props = { params: Promise<{ id: string }> };

export default async function Conversation({ params }: Props) {
  const user = await requireUser(["resident", "student"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [convo] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), or(eq(conversations.residentId, user.id), eq(conversations.studentId, user.id))))
    .limit(1);
  if (!convo) notFound();

  const isResident = convo.residentId === user.id;
  const [other] = await db
    .select()
    .from(users)
    .where(eq(users.id, isResident ? convo.studentId : convo.residentId))
    .limit(1);
  const [job] = await db.select().from(jobs).where(eq(jobs.id, convo.jobId)).limit(1);
  const thread = await db.select().from(messages).where(eq(messages.conversationId, convo.id)).orderBy(asc(messages.createdAt));

  // Opening the conversation marks it read.
  await db
    .update(conversations)
    .set(isResident ? { residentLastReadAt: new Date() } : { studentLastReadAt: new Date() })
    .where(eq(conversations.id, convo.id));

  const name = isResident ? publicName(other) : other.firstName;
  const jobHref = isResident ? `/resident/jobs/${job.id}` : `/student/jobs/${job.id}`;

  return (
    <Page>
      <div className="lg:hidden">
        <Back href="/messages">Messages</Back>
      </div>
      <div className="mt-6 grid items-start gap-8 lg:mt-0 lg:grid-cols-[24rem_1fr]">
        <div className="hidden lg:block">
          <ConversationList user={user} activeId={convo.id} />
        </div>

        <section className="overflow-hidden rounded-xl border border-line">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div className="flex items-center gap-4">
              <Avatar name={name} size={48} verified={isResident} />
              <div>
                <h1 className="text-[24px] leading-tight tracking-tight">{name}</h1>
                <Link href={jobHref} className="link text-[14px]">
                  {job.title}
                </Link>
              </div>
            </div>
            <Link href={`/report?conversationId=${convo.id}`} className="text-[14px] text-faint hover:text-red-700">
              Report
            </Link>
          </header>

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
      </div>
    </Page>
  );
}
