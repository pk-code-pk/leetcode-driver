import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Backdrop } from "@/components/motion";
import { currentUser, homeFor } from "@/lib/auth";

const CHOICES = [
  {
    href: "/sign-up/resident",
    tag: "For residents",
    title: "I need help",
    body: "Post a job for babysitting, tutoring, yard work, moving and more. Requesting a job is free.",
    cta: "Sign up as a resident",
  },
  {
    href: "/sign-up/student",
    tag: "For students",
    title: "I'm a student",
    body: "Earn money between classes with jobs near campus. No application, no resume needed.",
    cta: "Sign up as a student",
  },
];

export default async function SignUpChooser() {
  const user = await currentUser();
  if (user) redirect(homeFor(user.role));
  return (
    <>
      <Backdrop />
      <div className="rise mx-auto max-w-5xl px-5 pb-20 pt-16 sm:pt-24">
        <p className="eyebrow">Get started</p>
        <h1 className="display mt-5 max-w-[14ch]">How do you want to use JobsU?</h1>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          {CHOICES.map((c) => (
            <Link key={c.href} href={c.href} className="group flex flex-col bg-white p-8 transition-colors hover:bg-ice sm:p-12">
              <span className="eyebrow self-start">{c.tag}</span>
              <span className="mt-8 text-[40px] leading-none tracking-tight">{c.title}</span>
              <span className="mt-4 max-w-sm text-muted">{c.body}</span>
              <span className="mt-12 flex items-center justify-between border-t border-line pt-5 text-[17px]">
                {c.cta}
                <ArrowUpRight
                  size={22}
                  strokeWidth={1.5}
                  className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-muted">
          Already have an account?{" "}
          <Link href="/log-in" className="link">
            Log in
          </Link>
        </p>
      </div>
    </>
  );
}
