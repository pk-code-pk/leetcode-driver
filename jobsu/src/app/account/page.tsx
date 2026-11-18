import { eq } from "drizzle-orm";
import { changePassword, updateAccount } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { PhotoInput } from "@/components/PhotoInput";
import { ReferralCard } from "@/components/ReferralCard";
import { Field, Page, PageHeader, SectionTitle, photoUrl } from "@/components/ui";
import { db } from "@/db";
import { residentProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { TOWNS, appUrl } from "@/lib/config";
import { referralCodeFor, referralCount } from "@/lib/referrals";

export default async function Account() {
  const user = await requireUser();
  const [resident] =
    user.role === "resident" ? await db.select().from(residentProfiles).where(eq(residentProfiles.userId, user.id)).limit(1) : [];
  const [code, referred] = await Promise.all([referralCodeFor(user), referralCount(user.id)]);

  return (
    <Page narrow>
      <PageHeader eyebrow="Account" title="Your account" subtitle={user.email} />

      <section>
        <SectionTitle>Your details</SectionTitle>
        <ActionForm action={updateAccount} className="rule mt-5 space-y-6 pt-7">
          <Field label="Photo" hint={user.role === "resident" ? "Helps students recognise you when they arrive." : undefined}>
            <PhotoInput current={photoUrl(user)} />
          </Field>
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
          {resident && (
            <div className="space-y-4">
              <p className="label">About your home</p>
              <label className="flex items-center gap-3 text-ink">
                <input type="checkbox" name="hasPets" defaultChecked={resident.hasPets} /> We have pets
              </label>
              <label className="flex items-center gap-3 text-ink">
                <input type="checkbox" name="hasKids" defaultChecked={resident.hasKids} /> We have children at home
              </label>
              <Field label="Notes for students (optional)" hint="Shown to students on every job you post.">
                <textarea
                  name="notesForStudents"
                  className="input min-h-20"
                  maxLength={500}
                  defaultValue={resident.notesForStudents}
                  placeholder="The dog is friendly but excitable. Park in the driveway."
                />
              </Field>
            </div>
          )}
          <SubmitButton>Save changes</SubmitButton>
        </ActionForm>
      </section>

      <div className="mt-16">
        <ReferralCard url={`${appUrl()}/r/${code}`} count={referred} who={user.role === "student" ? "a friend" : "a neighbor"} />
      </div>

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
