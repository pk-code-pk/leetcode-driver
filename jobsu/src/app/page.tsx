import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { MIN_RATE_CENTS } from "@/lib/config";
import { JOB_TYPES } from "@/lib/jobTypes";
import { formatCents } from "@/lib/money";

const TRUST = [
  ["✓", ".edu-confirmed students", "Every student account requires a valid .edu email address. No anonymous profiles."],
  ["📍", "Hyper-local by design", "We started at Boston College and are expanding outward from campus."],
  ["💵", "Fair pay", `No job on JobsU pays less than ${formatCents(MIN_RATE_CENTS)} an hour, and the rate is shown before a student applies.`],
  ["★", "Ratings both ways", "Residents and students rate each other after every completed job."],
];

const STEPS: [string, string[]][] = [
  ["For residents", ["Post a job in a couple of minutes", "Students nearby apply, and you pick who you like", "Pay through JobsU once the job is done"]],
  ["For students", ["Create your profile with your .edu email", "Browse nearby jobs by type, pay and date", "Apply in one click and get paid when the job is done"]],
];

export default async function Home() {
  const user = await currentUser();
  if (user?.emailVerifiedAt && !user.suspendedAt) redirect(homeFor(user.role));

  return (
    <div className="space-y-16">
      <section className="pt-6 text-center">
        <div className="flex flex-wrap justify-center gap-2">
          <span className="badge bg-green-bg text-green-deep">✓ .edu-confirmed students</span>
          <span className="badge bg-white text-navy ring-1 ring-line">📍 Newton · Brookline · Brighton</span>
        </div>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
          Real help from <span className="text-blue">students</span> down the road.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          JobsU connects families in Newton, Brookline and Brighton with .edu-confirmed Boston College students for
          babysitting, tutoring, yard work and more.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/sign-up/resident" className="btn btn-primary px-6 py-3 text-base">
            Post a job
          </Link>
          <Link href="/sign-up/student" className="btn btn-green px-6 py-3 text-base">
            Sign up as a student
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-center text-2xl font-extrabold tracking-tight">Simple for everyone</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {STEPS.map(([title, steps]) => (
            <div key={title} className="card">
              <p className="font-extrabold">{title}</p>
              <ol className="mt-3 space-y-2 text-sm text-muted">
                {steps.map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-center text-2xl font-extrabold tracking-tight">What students can help with</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {JOB_TYPES.filter((t) => t.slug !== "other").map((t) => (
            <span key={t.slug} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold">
              {t.emoji} {t.label}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-center text-2xl font-extrabold tracking-tight">
          Built for trust, designed for your neighborhood
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {TRUST.map(([icon, title, body]) => (
            <div key={title} className="card">
              <p className="text-2xl">{icon}</p>
              <p className="mt-2 font-extrabold">{title}</p>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card bg-navy text-center text-white">
        <h2 className="text-2xl font-extrabold tracking-tight">Post a job today — or sign up as a student.</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/70">
          Whether you need help around the house or want to earn money between classes, JobsU gets you there in
          minutes.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/sign-up/resident" className="btn bg-white text-navy hover:bg-ice">
            Post a job
          </Link>
          <Link href="/sign-up/student" className="btn btn-green">
            Sign up as a student
          </Link>
        </div>
      </section>
    </div>
  );
}
