import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { MIN_RATE_CENTS } from "@/lib/config";
import { formatCents } from "@/lib/money";

const ASKS: [string, string[]][] = [
  [
    "Around the house",
    [
      "An extra set of hands on moving day",
      "Leaves, mulch, general yard work",
      "Clearing out and reorganizing a basement, garage or closet",
      "Assembling furniture",
    ],
  ],
  [
    "With the kids",
    [
      "After-school pickup and homework help",
      "Occasional evening sitting, as needed",
      "Covering when the regular sitter cancels",
      "Coaching a skill a kid is learning: goalkeeping, swimming, guitar",
    ],
  ],
  [
    "Technology and errands",
    [
      "Setting up a new phone, printer or Wi-Fi",
      "Grocery runs and errands",
      "Waiting for a delivery",
      "Someone who comes by weekly for whatever needs doing",
    ],
  ],
];

const RESIDENT_STEPS: [string, string][] = [
  ["Post your job", "Describe what you need, set a date and rate. Takes under 2 minutes."],
  ["Pick your student", "Students nearby apply. Read their profiles and ratings, and choose who you like."],
  ["Pay when it's done", "Your payment is held when you book and released once the job is complete."],
];
const STUDENT_STEPS: [string, string][] = [
  ["Create your profile", "Confirm with your .edu email — no application, no resume needed."],
  ["Browse nearby jobs", "Filter by type, pay and date. The rate is shown before you apply."],
  ["Apply in one click", "Do the job, mark it done, and get paid through JobsU."],
];

const WHY: [string, string][] = [
  [".edu-confirmed students", "Every student account requires a valid .edu email address. No anonymous profiles."],
  ["Hyper-local by design", "We started at Boston College and are expanding outward from campus."],
  ["Fair pay", `No job on JobsU pays less than ${formatCents(MIN_RATE_CENTS)} an hour.`],
  ["Ratings both ways", "Residents and students rate each other after every completed job."],
];

function Steps({ steps, green }: { steps: [string, string][]; green?: boolean }) {
  return (
    <ol className="mt-6 space-y-5 border-t border-line pt-6">
      {steps.map(([title, body], i) => (
        <li key={title} className="flex gap-4">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
              green ? "bg-green-mid text-green-deep" : "bg-line text-blue"
            }`}
          >
            {i + 1}
          </span>
          <span>
            <span className="block font-extrabold text-navy">{title}</span>
            <span className="block text-sm font-medium leading-relaxed text-muted">{body}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default async function Home() {
  const user = await currentUser();
  if (user?.emailVerifiedAt && !user.suspendedAt) redirect(homeFor(user.role));

  return (
    <>
      <section
        className="relative bg-navy bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(rgba(11,27,58,.72), rgba(11,27,58,.72)), url(/hero-image.raking.png)" }}
      >
        <div className="mx-auto max-w-3xl px-5 py-24 text-center sm:py-32">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-white">
            Boston College students · Newton, Brookline and Brighton
          </p>
          <h1 className="mt-5 text-5xl font-black leading-[1.05] text-white sm:text-6xl">
            Real help from <span className="text-sky">students</span> down the road.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-medium leading-relaxed text-white/85">
            JobsU connects families in Newton, Brookline and Brighton with .edu-confirmed Boston College students for
            babysitting, tutoring, yard work and more.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/sign-up/resident" className="btn btn-primary px-7 py-3.5 text-base">
              🏡 Request a Job
            </Link>
            <Link href="/sign-up/student" className="btn btn-white px-7 py-3.5 text-base">
              🎓 I&apos;m a Student
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-[13px] font-bold text-white">
            <span className="rounded-full border border-white/30 bg-white/15 px-3.5 py-1">✓ .edu-confirmed students</span>
            <span className="rounded-full border border-white/30 bg-white/15 px-3.5 py-1">📍 Newton · Brookline · Brighton</span>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-4xl font-black">What people ask for</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {ASKS.map(([heading, items]) => (
              <div key={heading}>
                <p className="eyebrow border-b border-line pb-4">{heading}</p>
                <ul>
                  {items.map((item) => (
                    <li key={item} className="border-b border-line py-4 font-semibold leading-snug text-navy">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 text-4xl font-black">Simple for everyone</h2>
          <p className="lede max-w-xl text-lg">
            Whether you need help around the house or want to earn money between classes, JobsU gets you there in
            minutes.
          </p>
          <div className="mt-10 grid overflow-hidden rounded-[24px] border border-line bg-white md:grid-cols-2">
            <div className="p-8 sm:p-12">
              <p className="eyebrow">For residents</p>
              <h3 className="mt-2 text-2xl font-extrabold tracking-tight">Find reliable local help</h3>
              <Steps steps={RESIDENT_STEPS} />
              <Link href="/sign-up/resident" className="btn btn-primary mt-8">
                Request a Job
              </Link>
            </div>
            <div className="border-t border-line p-8 sm:p-12 md:border-l md:border-t-0">
              <p className="eyebrow-green">For students</p>
              <h3 className="mt-2 text-2xl font-extrabold tracking-tight">Earn on your own schedule</h3>
              <Steps steps={STUDENT_STEPS} green />
              <Link href="/sign-up/student" className="btn btn-green mt-8">
                Sign up as a student
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <p className="eyebrow">Why JobsU</p>
          <h2 className="mt-2 max-w-2xl text-4xl font-black">Built for trust, designed for your neighborhood</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {WHY.map(([title, body]) => (
              <div key={title} className="card bg-ice">
                <p className="text-lg font-extrabold tracking-tight">{title}</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="text-3xl font-black text-white sm:text-4xl">Post a job today — or sign up as a student.</h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/sign-up/resident" className="btn btn-primary px-7 py-3.5 text-base">
              Request a Job
            </Link>
            <Link href="/sign-up/student" className="btn btn-white px-7 py-3.5 text-base">
              I&apos;m a Student
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
