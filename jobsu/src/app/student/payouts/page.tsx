import { eq } from "drizzle-orm";
import { refreshPayoutStatus, startPayoutSetup } from "@/app/actions/social";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Page, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { paymentsProvider } from "@/lib/payments";

export default async function Payouts() {
  const user = await requireUser("student");
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id)).limit(1);
  const live = paymentsProvider() === "stripe";

  return (
    <Page narrow>
      <PageHeader
        green
        eyebrow="For students"
        title="Getting paid"
        subtitle="Families pay through JobsU. The 10% service fee comes out and the rest goes to your bank account."
      />
      <div className="card space-y-4">
        {!live ? (
          <p className="text-sm font-semibold text-muted">
            Payments are running in test mode here, so payouts are simulated and there&apos;s nothing to set up yet.
          </p>
        ) : profile.payoutsEnabled ? (
          <p className="font-extrabold text-green-deep">✓ Payouts are set up. You&apos;re ready to be booked.</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-muted">
              Connect your bank account through Stripe so families can book you. It takes about 5 minutes.
            </p>
            <ActionForm action={startPayoutSetup}>
              <SubmitButton className="btn btn-green">{profile.stripeAccountId ? "Continue setup" : "Set up payouts"}</SubmitButton>
            </ActionForm>
            {profile.stripeAccountId && (
              <ActionForm action={refreshPayoutStatus}>
                <SubmitButton className="btn btn-outline">I&apos;ve finished — check again</SubmitButton>
              </ActionForm>
            )}
          </>
        )}
      </div>
    </Page>
  );
}
