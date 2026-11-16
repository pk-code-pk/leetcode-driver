import { desc, eq } from "drizzle-orm";
import { resetPassword } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Backdrop } from "@/components/motion";
import { Back, Field, Page, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { emails } from "@/db/schema";
import { showDevCodes } from "@/lib/config";

type Props = { searchParams: Promise<{ email?: string }> };

export default async function Reset({ searchParams }: Props) {
  const { email = "" } = await searchParams;

  // Local development and tests only: show the code instead of requiring a real inbox.
  let devCode: string | null = null;
  if (showDevCodes() && email) {
    const [mail] = await db.select().from(emails).where(eq(emails.to, email)).orderBy(desc(emails.createdAt)).limit(1);
    devCode = mail?.subject.match(/^(\d{6}) is your JobsU password reset/)?.[1] ?? null;
  }

  return (
    <Page narrow>
      <Backdrop />
      <Back href="/forgot">Use a different email</Back>
      <div className="mt-8">
        <PageHeader
          eyebrow="Account"
          title="Choose a new password"
          subtitle={`If ${email || "that email"} has a JobsU account, we've sent it a 6-digit code.`}
        />
      </div>
      {devCode && (
        <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          Development mode: your code is <span data-testid="dev-code" className="num">{devCode}</span>
        </p>
      )}
      <ActionForm action={resetPassword} className="space-y-6 rounded-xl border border-line bg-white p-7 sm:p-9">
        <input type="hidden" name="email" value={email} />
        <Field label="Code">
          <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} className="input num h-14 text-center text-2xl tracking-[0.4em]" required />
        </Field>
        <Field label="New password" hint="At least 8 characters.">
          <input name="password" type="password" className="input" required minLength={8} autoComplete="new-password" />
        </Field>
        <SubmitButton className="btn btn-primary btn-lg w-full">Save and log in</SubmitButton>
      </ActionForm>
    </Page>
  );
}
