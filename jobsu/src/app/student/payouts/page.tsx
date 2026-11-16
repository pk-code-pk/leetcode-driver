import { eq } from "drizzle-orm";
import { refreshPayoutStatus, startPayoutSetup } from "@/app/actions/social";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Back, Notice, Page, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { paymentsProvider } from "@/lib/payments";

const STEPS: [string, string][] = [
  ["A family books you", "Their payment is held by JobsU, so the money is there before you start."],
  ["You do the job", "Mark it done with the hours you worked."],
  ["You get paid", "The family confirms, the 10% service fee comes out, and the rest goes to your bank account."],
];

export default async function Payouts() {
  const user = await requireUser("student");
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id)).limit(1);
  const live = paymentsProvider() === "stripe";

  return (
    <Page narrow>
      <Back href="/student/profile">Your profile</Back>
      <div className="mt-8">
        <PageHeader eyebrow="For students" title="Getting paid" subtitle="Families pay through JobsU, and your earnings go straight to your bank account." />
      </div>

      <ol className="border-b border-line">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="rule grid grid-cols-[3rem_1fr] gap-4 py-6">
            <span className="num text-[14px] text-faint">0{i + 1}</span>
            <span>
              <span className="block text-[22px] tracking-tight">{title}</span>
              <span className="mt-1 block text-muted">{body}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-8 space-y-4">
        {!live ? (
          <Notice>Payments are running in test mode here, so payouts are simulated and there&apos;s nothing to set up yet.</Notice>
        ) : profile.payoutsEnabled ? (
          <Notice tone="green">Payouts are set up. You&apos;re ready to be booked.</Notice>
        ) : (
          <>
            <p className="text-muted">Connect your bank account through Stripe so families can book you. It takes about 5 minutes.</p>
            <div className="flex flex-wrap gap-3">
              <ActionForm action={startPayoutSetup}>
                <SubmitButton>{profile.stripeAccountId ? "Continue setup" : "Set up payouts"}</SubmitButton>
              </ActionForm>
              {profile.stripeAccountId && (
                <ActionForm action={refreshPayoutStatus}>
                  <SubmitButton className="btn btn-outline">I&apos;ve finished — check again</SubmitButton>
                </ActionForm>
              )}
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
