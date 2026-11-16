import { MessagesSquare } from "lucide-react";
import { ConversationList } from "@/components/Inbox";
import { latestConversationId, Thread } from "@/components/Thread";
import { Empty, Page, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function Messages() {
  const user = await requireUser(["resident", "student"]);
  // On wide screens the newest conversation is already open beside the list; phones get the list alone.
  const latest = await latestConversationId(user);
  const list = await ConversationList({ user, activeId: latest ?? undefined, activeOnWide: true });

  return (
    <Page>
      <div className="lg:hidden">
        <PageHeader eyebrow="Inbox" title="Messages" />
      </div>
      {list && latest ? (
        <div className="grid items-start gap-8 lg:grid-cols-[24rem_1fr]">
          {list}
          <div className="hidden lg:block">
            <Thread user={user} id={latest} />
          </div>
        </div>
      ) : (
        <Empty
          icon={MessagesSquare}
          title="No conversations yet"
          body={
            user.role === "resident"
              ? "When a student applies to one of your jobs, you can message them here."
              : "When you apply to a job, you can message the family here."
          }
        />
      )}
    </Page>
  );
}
