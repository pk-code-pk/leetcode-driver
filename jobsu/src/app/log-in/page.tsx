import Link from "next/link";
import { redirect } from "next/navigation";
import { logIn } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { currentUser, homeFor } from "@/lib/auth";

export default async function LogIn() {
  const user = await currentUser();
  if (user?.emailVerifiedAt && !user.suspendedAt) redirect(homeFor(user.role));
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-extrabold tracking-tight">Log in</h1>
      <ActionForm action={logIn} className="card mt-6 space-y-4">
        <Field label="Email">
          <input name="email" type="email" className="input" required autoComplete="email" />
        </Field>
        <Field label="Password">
          <input name="password" type="password" className="input" required autoComplete="current-password" />
        </Field>
        <SubmitButton>Log in</SubmitButton>
      </ActionForm>
      <p className="mt-4 text-sm text-muted">
        New here?{" "}
        <Link href="/sign-up" className="font-semibold text-blue underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
