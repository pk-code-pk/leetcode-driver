import { eq } from "drizzle-orm";
import { changePassword, updateAccount } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Page, PageHeader, SectionTitle } from "@/components/ui";
import { db } from "@/db";
import { residentProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { TOWNS } from "@/lib/config";

export default async function Account() {
  const user = await requireUser();
  const [resident] =
    user.role === "resident" ? await db.select().from(residentProfiles).where(eq(residentProfiles.userId, user.id)).limit(1) : [];

  return (
    <Page narrow>
      <PageHeader eyebrow="Account" title="Your account" subtitle={user.email} />

      <section>
        <SectionTitle>Your details</SectionTitle>
        <ActionForm action={updateAccount} className="rule mt-5 space-y-6 pt-7">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="First name">
              <input name="firstName" className="input" required defaultValue={user.firstName} />
            </Field>
            <Field label="Last name">
              <input name="lastName" className="input" defaultValue={user.lastName} />
            </Field>
          </div>
          <Field label="Phone (optional)" hint={user.role === "student" ? "Only shared with a family once they've booked you." : undefined}>
            <input name="phone" type="tel" className="input" defaultValue={user.phone} />
          </Field>
          {resident && (
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Town">
                <select name="town" className="input" defaultValue={resident.town}>
                  {TOWNS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Nearby landmark" hint="Used as the default on new jobs. It is never shown publicly.">
                <input name="landmark" className="input" defaultValue={resident.landmark} maxLength={120} />
              </Field>
            </div>
          )}
          <SubmitButton>Save changes</SubmitButton>
        </ActionForm>
      </section>

      <section className="mt-16">
        <SectionTitle>Password</SectionTitle>
        <ActionForm action={changePassword} className="rule mt-5 space-y-6 pt-7">
          <Field label="Current password">
            <input name="currentPassword" type="password" className="input" required autoComplete="current-password" />
          </Field>
          <Field label="New password" hint="At least 8 characters.">
            <input name="newPassword" type="password" className="input" required minLength={8} autoComplete="new-password" />
          </Field>
          <SubmitButton className="btn btn-outline">Change password</SubmitButton>
        </ActionForm>
      </section>
    </Page>
  );
}
