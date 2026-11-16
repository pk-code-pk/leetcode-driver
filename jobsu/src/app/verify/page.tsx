import { redirect } from "next/navigation";
import { Backdrop } from "@/components/motion";
import { desc, eq } from "drizzle-orm";
import { resendCode, verifyEmail } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Page } from "@/components/ui";
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
    <Page narrow>
      <Backdrop />
      <p className="eyebrow">One quick step</p>
      <h1 className="title mt-2">Confirm your email</h1>
      <p className="lede">
        We sent a 6-digit code to <span className="text-ink">{user.email}</span>.
      </p>
      {devCode && (
        <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-[14px] text-amber-900 ring-1 ring-inset ring-amber-600/15">
          Development mode: your code is <span data-testid="dev-code" className="num">{devCode}</span>
        </p>
      )}
      <ActionForm action={verifyEmail} className="mt-8 space-y-6 rounded-xl border border-line bg-white p-7 sm:p-9">
        <Field label="Confirmation code">
          <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} className="input num h-14 text-center text-2xl tracking-[0.4em]" required autoFocus />
        </Field>
        <SubmitButton className="btn btn-primary btn-lg w-full">Confirm</SubmitButton>
      </ActionForm>
      <ActionForm action={resendCode} className="mt-4">
        <SubmitButton className="link cursor-pointer text-[14px]">Send a new code</SubmitButton>
      </ActionForm>
    </Page>
  );
}
