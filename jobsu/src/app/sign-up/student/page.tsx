import { redirect } from "next/navigation";
import { signUpStudent } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AccountFields, Confirmations } from "@/components/SignUpFields";
import { currentUser, homeFor } from "@/lib/auth";
import { MIN_RATE_CENTS } from "@/lib/config";
import { formatCents } from "@/lib/money";

export default async function StudentSignUp() {
  const user = await currentUser();
  if (user) redirect(homeFor(user.role));
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-extrabold tracking-tight">Sign up as a student</h1>
      <p className="mt-1 text-sm text-muted">
        Flexible jobs near campus, with the rate shown before you apply. No job pays less than{" "}
        {formatCents(MIN_RATE_CENTS)} an hour.
      </p>
      <ActionForm action={signUpStudent} className="card mt-6 space-y-4">
        <AccountFields
          emailHint="Use your school .edu address. We'll send a code to confirm it."
          emailPlaceholder="you@bc.edu"
        />
        <Confirmations />
        <SubmitButton className="btn btn-green">Create account</SubmitButton>
      </ActionForm>
    </div>
  );
}
