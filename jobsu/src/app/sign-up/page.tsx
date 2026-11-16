import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";

export default async function SignUpChooser() {
  const user = await currentUser();
  if (user) redirect(homeFor(user.role));
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-center text-3xl font-black tracking-tight">How do you want to use JobsU?</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/sign-up/resident" className="card hover:border-blue">
          <p className="text-3xl">🏡</p>
          <p className="mt-2 text-lg font-extrabold">I need help</p>
          <p className="mt-1 text-sm text-muted">
            Post a job for babysitting, tutoring, yard work, moving and more. Requesting a job is free.
          </p>
          <span className="btn btn-primary mt-4">Sign up as a resident</span>
        </Link>
        <Link href="/sign-up/student" className="card hover:border-blue">
          <p className="text-3xl">🎓</p>
          <p className="mt-2 text-lg font-extrabold">I&apos;m a student</p>
          <p className="mt-1 text-sm text-muted">
            Earn money between classes with jobs near campus. No application, no resume needed.
          </p>
          <span className="btn btn-green mt-4">Sign up as a student</span>
        </Link>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/log-in" className="font-semibold text-blue underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
