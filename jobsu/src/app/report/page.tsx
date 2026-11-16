import { submitReport } from "@/app/actions/social";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Page, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

const REASONS = [
  "Asked to pay or be paid outside JobsU",
  "Didn't show up",
  "Unsafe or inappropriate behavior",
  "Job wasn't as described",
  "Fake or misleading profile",
  "Something else",
];

type Props = { searchParams: Promise<{ conversationId?: string; jobId?: string; subjectId?: string }> };
const uuid = (v?: string) => (v && /^[0-9a-f-]{36}$/.test(v) ? v : "");

export default async function Report({ searchParams }: Props) {
  await requireUser(["resident", "student"]);
  const q = await searchParams;
  return (
    <Page narrow>
      <PageHeader
        eyebrow="Safety"
        title="Report a problem"
        subtitle="A real person at JobsU reads every report. If someone is in danger, call 911 first."
      />
      <ActionForm action={submitReport} className="space-y-6 rounded-xl border border-line bg-white p-7 sm:p-9">
        <input type="hidden" name="conversationId" value={uuid(q.conversationId)} />
        <input type="hidden" name="jobId" value={uuid(q.jobId)} />
        <input type="hidden" name="subjectId" value={uuid(q.subjectId)} />
        <Field label="What's the problem?">
          <select name="reason" className="input" required defaultValue="">
            <option value="" disabled>
              Choose one…
            </option>
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="What happened?">
          <textarea name="details" className="input min-h-28" required maxLength={3000} />
        </Field>
        <SubmitButton>Send report</SubmitButton>
      </ActionForm>
    </Page>
  );
}
