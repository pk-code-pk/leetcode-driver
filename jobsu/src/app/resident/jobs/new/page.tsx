import { eq } from "drizzle-orm";
import { createJob } from "@/app/actions/jobs";
import { JobForm } from "@/components/JobForm";
import { Page, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { residentProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { MIN_RATE_CENTS, TOWNS, TYPICAL_RATE_HIGH_CENTS, TYPICAL_RATE_LOW_CENTS } from "@/lib/config";
import { todayISO } from "@/lib/dates";
import { formatCents } from "@/lib/money";

export default async function NewJob() {
  const user = await requireUser("resident");
  const [profile] = await db.select().from(residentProfiles).where(eq(residentProfiles.userId, user.id)).limit(1);
  return (
    <Page>
      <PageHeader
        eyebrow="For residents"
        title="Post a job"
        subtitle="Describe what you need, set a date and rate. Takes under 2 minutes, and posting is free."
      />
      <JobForm
        action={createJob}
        towns={TOWNS}
        defaultTown={profile?.town ?? TOWNS[0]}
        defaultLandmark={profile?.landmark ?? ""}
        minDate={todayISO()}
        rateHint={`Most families here pay ${formatCents(TYPICAL_RATE_LOW_CENTS)} to ${formatCents(
          TYPICAL_RATE_HIGH_CENTS,
        )} an hour depending on the job. The minimum is ${formatCents(MIN_RATE_CENTS)}.`}
      />
    </Page>
  );
}
