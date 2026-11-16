import { notFound } from "next/navigation";
import { ConversationList } from "@/components/Inbox";
import { Thread } from "@/components/Thread";
import { Back, Page } from "@/components/ui";
import { requireUser } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export default async function Conversation({ params }: Props) {
  const user = await requireUser(["resident", "student"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  // Render the thread first: opening it marks it read, so the list beside it is up to date.
  const thread = await Thread({ user, id, markRead: true });
  if (!thread) notFound();

  return (
    <Page>
      <div className="lg:hidden">
        <Back href="/messages">Messages</Back>
      </div>
      <div className="mt-6 grid items-start gap-8 lg:mt-0 lg:grid-cols-[24rem_1fr]">
        <div className="hidden lg:block">
          <ConversationList user={user} activeId={id} />
        </div>
        {thread}
      </div>
    </Page>
  );
}
