import { redirect } from "next/navigation";
import { signUpResident } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AccountFields, Confirmations } from "@/components/SignUpFields";
import { Field, Page, PageHeader } from "@/components/ui";
import { currentUser, homeFor } from "@/lib/auth";
import { TOWNS } from "@/lib/config";

export default async function ResidentSignUp() {
  const user = await currentUser();
  if (user) redirect(homeFor(user.role));
  return (
    <Page narrow>
      <PageHeader
        eyebrow="For residents"
        title="Let's get your job done."
        subtitle="Create your account, then post what you need. .edu-confirmed Boston College students nearby will apply. Requesting a job is free."
      />
      <ActionForm action={signUpResident} className="card space-y-5">
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
    </Page>
  );
}
