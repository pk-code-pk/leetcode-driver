import { MessagesSquare } from "lucide-react";
import { ConversationList } from "@/components/Inbox";
import { Empty, Page, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function Messages() {
  const user = await requireUser(["resident", "student"]);
  const list = await ConversationList({ user });

  return (
    <Page>
      <PageHeader eyebrow="Inbox" title="Messages" />
      {list ? (
        <div className="grid items-start gap-8 lg:grid-cols-[24rem_1fr]">
          {list}
          <div className="hidden rounded-xl border border-dashed border-line px-6 py-28 text-center lg:block">
            <span className="tile mx-auto mb-5 h-14 w-14">
              <MessagesSquare size={24} strokeWidth={1.4} />
            </span>
            <p className="text-[22px] tracking-tight">Pick a conversation</p>
            <p className="mt-1 text-muted">Choose someone on the left to read and reply.</p>
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
