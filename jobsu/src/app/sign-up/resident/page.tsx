import { redirect } from "next/navigation";
import { signUpResident } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AccountFields, Confirmations } from "@/components/SignUpFields";
import { Field } from "@/components/ui";
import { currentUser, homeFor } from "@/lib/auth";
import { TOWNS } from "@/lib/config";

export default async function ResidentSignUp() {
  const user = await currentUser();
  if (user) redirect(homeFor(user.role));
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-extrabold tracking-tight">Sign up as a resident</h1>
      <p className="mt-1 text-sm text-muted">
        Get help from .edu-confirmed Boston College students down the road. Requesting a job is free.
      </p>
      <ActionForm action={signUpResident} className="card mt-6 space-y-4">
        <AccountFields />
        <Field label="Town">
          <select name="town" className="input" required defaultValue="">
            <option value="" disabled>
              Choose your town
            </option>
            {TOWNS.map((t) => (
              <option key={t}>{t}</option>
            ))}
            <option value="Somewhere else">Somewhere else</option>
          </select>
        </Field>
        <Field
          label="Nearby landmark"
          hint="A school, park or intersection near you. We use it to judge distance from campus. It is never shown publicly."
        >
          <input name="landmark" className="input" placeholder="Near Newton Centre T stop" />
        </Field>
        <Field label="How did you hear about JobsU? (optional)">
          <input name="heardFrom" className="input" />
        </Field>
        <Confirmations />
        <SubmitButton>Create account</SubmitButton>
      </ActionForm>
    </div>
  );
}
