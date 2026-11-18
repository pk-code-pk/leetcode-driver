import { and, eq } from "drizzle-orm";
import { createJob } from "@/app/actions/jobs";
import { JobForm } from "@/components/JobForm";
import { Page, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { jobs, residentProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { MIN_RATE_CENTS, TOWNS } from "@/lib/config";
import { todayISO } from "@/lib/dates";
import { formatCents } from "@/lib/money";

type Props = { searchParams: Promise<{ from?: string; invite?: string }> };

export default async function NewJob({ searchParams }: Props) {
  const user = await requireUser("resident");
  const [profile] = await db.select().from(residentProfiles).where(eq(residentProfiles.userId, user.id)).limit(1);
  // "Repost" starts from one of the resident's earlier jobs.
  const { from, invite } = await searchParams;
  const [source] =
    from && /^[0-9a-f-]{36}$/.test(from)
      ? await db.select().from(jobs).where(and(eq(jobs.id, from), eq(jobs.residentId, user.id))).limit(1)
      : [];
  return (
    <Page>
      <PageHeader
        eyebrow="For residents"
        title={source ? "Post it again" : "Post a job"}
        subtitle={
          source
            ? "We've filled this in from your earlier job. Pick a new date and check the details."
            : "Describe what you need, set a date and rate. Takes under 2 minutes, and posting is free."
        }
      />
      <JobForm
        action={createJob}
        towns={TOWNS}
        defaultTown={profile?.town ?? TOWNS[0]}
        defaultLandmark={profile?.landmark ?? ""}
        minDate={todayISO()}
        invite={invite && /^[0-9a-f-]{36}$/.test(invite) ? invite : undefined}
        minRate={MIN_RATE_CENTS / 100}
        initial={
          source && {
            type: source.type,
            title: source.title,
            description: source.description,
            hours: String(source.estMinutes / 60),
            rate: source.rateCents != null ? String(source.rateCents / 100) : "",
            town: source.town,
            timing: source.timing,
            studentsNeeded: source.studentsNeeded,
            transport: source.transport,
            answers: source.answers,
          }
        }
        rateHint={`Each student is paid this rate. The minimum is ${formatCents(MIN_RATE_CENTS)} an hour.`}
      />
    </Page>
  );
}
