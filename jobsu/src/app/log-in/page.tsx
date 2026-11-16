import Link from "next/link";
import { Backdrop } from "@/components/motion";
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
      <Backdrop />
      <PageHeader eyebrow="Welcome back" title="Log in" />
      <ActionForm action={logIn} className="space-y-6 rounded-xl border border-line bg-white p-7 sm:p-9">
        <Field label="Email">
          <input name="email" type="email" className="input" required autoComplete="email" />
        </Field>
        <Field label="Password">
          <input name="password" type="password" className="input" required autoComplete="current-password" />
        </Field>
        <SubmitButton className="btn btn-primary btn-lg w-full">Log in</SubmitButton>
      </ActionForm>
      <p className="mt-6 text-muted">
        New here?{" "}
        <Link href="/sign-up" className="link">
          Create an account
        </Link>
      </p>
    </Page>
  );
}
