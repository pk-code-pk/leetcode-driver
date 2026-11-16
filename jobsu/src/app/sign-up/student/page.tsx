import { redirect } from "next/navigation";
import { Backdrop } from "@/components/motion";
import { signUpStudent } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AccountFields, Confirmations } from "@/components/SignUpFields";
import { currentUser, homeFor } from "@/lib/auth";
import { MIN_RATE_CENTS } from "@/lib/config";
import { formatCents } from "@/lib/money";
import { Page, PageHeader } from "@/components/ui";

export default async function StudentSignUp() {
  const user = await currentUser();
  if (user) redirect(homeFor(user.role));
  return (
    <Page narrow>
      <Backdrop />
      <PageHeader
        eyebrow="For students"
        title="Earn on your own schedule."
        subtitle={`Flexible jobs near campus, with the rate shown before you apply. No job pays less than ${formatCents(MIN_RATE_CENTS)} an hour.`}
      />
      <ActionForm action={signUpStudent} className="space-y-6 rounded-xl border border-line bg-white p-7 sm:p-9">
        <AccountFields
          emailHint="Use your school .edu address. We'll send a code to confirm it."
          emailPlaceholder="you@bc.edu"
        />
        <Confirmations />
        <SubmitButton className="btn btn-primary btn-lg w-full">Create account</SubmitButton>
      </ActionForm>
    </Page>
  );
}
