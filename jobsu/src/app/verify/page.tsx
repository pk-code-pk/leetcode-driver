import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { resendCode, verifyEmail } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { db } from "@/db";
import { emails } from "@/db/schema";
import { currentUser, homeFor } from "@/lib/auth";
import { showDevCodes } from "@/lib/config";

export default async function Verify() {
  const user = await currentUser();
  if (!user) redirect("/log-in");
  if (user.emailVerifiedAt) redirect(homeFor(user.role));

  // Local development and tests only: show the code instead of requiring a real inbox.
  let devCode: string | null = null;
  if (showDevCodes()) {
    const [mail] = await db.select().from(emails).where(eq(emails.to, user.email)).orderBy(desc(emails.createdAt)).limit(1);
    devCode = mail?.subject.match(/^(\d{6})/)?.[1] ?? null;
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-extrabold tracking-tight">Confirm your email</h1>
      <p className="mt-1 text-sm text-muted">
        We sent a 6-digit code to <span className="font-semibold text-navy">{user.email}</span>.
      </p>
      {devCode && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Development mode: your code is <span data-testid="dev-code" className="font-mono font-bold">{devCode}</span>
        </p>
      )}
      <ActionForm action={verifyEmail} className="card mt-6 space-y-4">
        <Field label="Confirmation code">
          <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} className="input font-mono tracking-widest" required autoFocus />
        </Field>
        <SubmitButton>Confirm</SubmitButton>
      </ActionForm>
      <ActionForm action={resendCode} className="mt-4">
        <SubmitButton className="text-sm font-semibold text-blue underline">Send a new code</SubmitButton>
      </ActionForm>
    </div>
  );
}
