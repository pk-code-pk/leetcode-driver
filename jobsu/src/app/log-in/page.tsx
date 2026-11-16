import Link from "next/link";
import { redirect } from "next/navigation";
import { logIn } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Page, PageHeader } from "@/components/ui";
import { currentUser, homeFor } from "@/lib/auth";

export default async function LogIn() {
  const user = await currentUser();
  if (user?.emailVerifiedAt && !user.suspendedAt) redirect(homeFor(user.role));
  return (
    <Page narrow>
      <PageHeader eyebrow="Welcome back" title="Log in" />
      <ActionForm action={logIn} className="card space-y-5">
        <Field label="Email">
          <input name="email" type="email" className="input" required autoComplete="email" />
        </Field>
        <Field label="Password">
          <input name="password" type="password" className="input" required autoComplete="current-password" />
        </Field>
        <SubmitButton>Log in</SubmitButton>
      </ActionForm>
      <p className="mt-5 text-sm font-medium text-muted">
        New here?{" "}
        <Link href="/sign-up" className="font-semibold text-blue underline">
          Create an account
        </Link>
      </p>
    </Page>
  );
}
