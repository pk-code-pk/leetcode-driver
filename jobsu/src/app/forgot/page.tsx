import { requestPasswordReset } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Backdrop } from "@/components/motion";
import { Back, Field, Page, PageHeader } from "@/components/ui";

export default function Forgot() {
  return (
    <Page narrow>
      <Backdrop />
      <Back href="/log-in">Log in</Back>
      <div className="mt-8">
        <PageHeader eyebrow="Account" title="Reset your password" subtitle="Enter your email and we'll send you a 6-digit code." />
      </div>
      <ActionForm action={requestPasswordReset} className="space-y-6 rounded-xl border border-line bg-white p-7 sm:p-9">
        <Field label="Email">
          <input name="email" type="email" className="input" required autoComplete="email" />
        </Field>
        <SubmitButton className="btn btn-primary btn-lg w-full">Send code</SubmitButton>
      </ActionForm>
    </Page>
  );
}
