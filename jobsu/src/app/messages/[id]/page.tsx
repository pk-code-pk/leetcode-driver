import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, or } from "drizzle-orm";
import { sendMessage } from "@/app/actions/social";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Page } from "@/components/ui";
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
    <Page narrow>
      <Link href="/messages" className="text-sm font-bold text-muted hover:text-blue">
        ← Messages
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{name}</h1>
          <Link href={jobHref} className="text-sm font-bold text-blue underline">
            {job.title}
          </Link>
        </div>
        <Link href={`/report?conversationId=${convo.id}`} className="text-sm font-bold text-muted underline hover:text-red-700">
          Report
        </Link>
      </div>

      <div className="card mt-6 space-y-3" data-testid="thread">
        {thread.length === 0 && (
          <p className="text-sm font-medium text-muted">No messages yet. Say hello and sort out the details.</p>
        )}
        {thread.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-medium ${
                  mine ? "bg-blue text-white" : "bg-ice text-navy"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 text-[11px] font-semibold ${mine ? "text-white/70" : "text-muted"}`}>
                  {timeAgo(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <ActionForm action={sendMessage} className="mt-4">
        <input type="hidden" name="conversationId" value={convo.id} />
        <textarea
          key={thread.length}
          name="body"
          className="input min-h-20"
          required
          maxLength={2000}
          placeholder={`Message ${other.firstName}…`}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="hint mt-0">Keep payments on JobsU. Contact details are shared once you&apos;ve booked together.</p>
          <SubmitButton>Send</SubmitButton>
        </div>
      </ActionForm>
    </Page>
  );
}
