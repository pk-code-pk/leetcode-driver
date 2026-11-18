import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Leaf, MapPin, Plus, ShieldCheck, Star } from "lucide-react";
import { Particles, Reveal } from "@/components/motion";
import { Avatar } from "@/components/ui";
import { currentUser, homeFor } from "@/lib/auth";
import { MIN_RATE_CENTS } from "@/lib/config";
import { JOB_TYPES } from "@/lib/jobTypes";
import { formatCents } from "@/lib/money";

const ASKS: [string, string[]][] = [
  [
    "Around the house",
    [
      "An extra set of hands on moving day",
      "Leaves, mulch, general yard work",
      "Clearing out a basement, garage or closet",
      "Assembling furniture",
    ],
  ],
  [
    "With the kids",
    [
      "After-school pickup and homework help",
      "Occasional evening sitting, as needed",
      "Covering when the regular sitter cancels",
      "Coaching a skill: goalkeeping, swimming, guitar",
    ],
  ],
  [
    "Technology and errands",
    [
      "Setting up a new phone, printer or Wi-Fi",
      "Grocery runs and errands",
      "Waiting in for a delivery",
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
  ["Create your profile", "Confirm with your .edu email. No application, no resume needed."],
  ["Browse nearby jobs", "Filter by type, pay and date. The rate is shown before you apply."],
  ["Apply in a minute", "Do the job, mark it done, and get paid through JobsU."],
];

const WHY: [string, string][] = [
  [".edu-confirmed students", "Every student account requires a valid .edu email address. There are no anonymous profiles."],
  ["Hyper-local by design", "We started at Boston College and are expanding outward from campus, one neighborhood at a time."],
  ["Fair pay", `No job on JobsU pays less than ${formatCents(MIN_RATE_CENTS)} an hour, and the rate is shown before a student applies.`],
  ["Ratings both ways", "Residents and students rate each other after every completed job, and neither sees the other's rating until both are in."],
];

const FAQ: [string, string][] = [
  ["Does it cost anything to post a job?", "No. Requesting a job is free. You pay for the work itself once it's done."],
  ["Who are the students?", "Boston College students who have confirmed a valid .edu email address. You see each applicant's profile and ratings before you choose."],
  ["How does payment work?", "Your payment is held when you book a student and released when you confirm the job is done. Students receive it minus a 10% JobsU service fee."],
  ["Where is JobsU available?", "Newton, Brookline and Brighton. We started at Boston College and are expanding outward from campus."],
  ["What if something goes wrong?", "You can pause payment and report a problem from the job page. A real person at JobsU reads every report."],
];

/** Headline that slides up word by word. */
function Words({ text, start = 0, className = "" }: { text: string; start?: number; className?: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="word">
          <span className={className} style={{ animationDelay: `${(start + i) * 70}ms` }}>
            {w}&nbsp;
          </span>
        </span>
      ))}
    </>
  );
}

function Steps({ steps }: { steps: [string, string][] }) {
  return (
    <ol className="mt-10">
      {steps.map(([title, body], i) => (
        <li key={title} className="rule grid grid-cols-[3rem_1fr] gap-4 py-6">
          <span className="num text-[14px] text-faint">0{i + 1}</span>
          <span>
            <span className="block text-[22px] tracking-tight">{title}</span>
            <span className="mt-1.5 block text-muted">{body}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default async function Home() {
  const user = await currentUser();
  if (user?.emailVerifiedAt && !user.suspendedAt) redirect(homeFor(user.role));
  const marquee = JOB_TYPES.filter((t) => t.slug !== "other").map((t) => t.label);

  return (
    <>
      {/* Hero */}
      <section
        className="relative -mt-[76px] overflow-hidden"
        style={{ background: "radial-gradient(60rem 40rem at 30% 30%, #ffffff 0%, #f1f6ff 55%, #dfeaff 100%)" }}
      >
        <Particles className="absolute inset-0 h-full w-full" density={2.4} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(46rem 30rem at 22% 46%, rgba(255,255,255,.97) 0%, rgba(255,255,255,.85) 45%, rgba(255,255,255,0) 75%)" }}
        />
        <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-5 pb-10 pt-40 sm:px-10 lg:min-h-[100svh] lg:grid-cols-[1.1fr_.9fr] lg:pt-32">
          <div>
            <h1 className="display max-w-[13ch] sm:text-[4.75rem]">
              <Words text="Real help from" />
              <Words text="students" start={3} className="text-blue" />
              <Words text="down the road." start={4} />
            </h1>
            <p className="rise mt-7 max-w-[30rem] text-[18px] text-muted" style={{ animationDelay: "500ms" }}>
              JobsU connects families in Newton, Brookline and Brighton with .edu-confirmed Boston College students for
              babysitting, tutoring, yard work and more.
            </p>
            <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "620ms" }}>
              <Link href="/sign-up/resident" className="btn btn-lg btn-primary">
                Request a Job
              </Link>
              <Link href="/sign-up/student" className="btn btn-lg btn-outline">
                I&apos;m a Student
              </Link>
            </div>
          </div>

          {/* A glass preview of the product, floating over the squares */}
          <div className="rise relative hidden lg:block" style={{ animationDelay: "400ms" }}>
            <div className="glass ml-auto max-w-[27rem] rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-[13px] text-muted">
                    <Leaf size={15} strokeWidth={1.5} /> Yard work
                  </p>
                  <p className="mt-2 text-[22px] leading-tight tracking-tight">Rake leaves in the back yard</p>
                </div>
                <p className="num whitespace-nowrap">
                  <span className="text-[28px] leading-none tracking-tight">$30</span>
                  <span className="text-[14px] text-faint">/hr</span>
                </p>
              </div>
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} strokeWidth={1.5} /> Newton
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} strokeWidth={1.5} /> Saturday at 10:00
                </span>
              </p>
              <div className="rule mt-5 pt-2">
                {[
                  ["Jake T.", "Class of 2028 · Economics", "4.9"],
                  ["Maya P.", "Class of 2027 · Education", "5.0"],
                ].map(([name, meta, rating], i) => (
                  <div key={name} className={`flex items-center gap-3.5 py-3.5 ${i ? "rule" : ""}`}>
                    <Avatar name={name} size={40} verified />
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px]">{name}</p>
                      <p className="text-[13px] text-muted">{meta}</p>
                    </div>
                    <span className="num inline-flex items-center gap-1 text-[14px]">
                      <Star size={12} className="fill-ink" /> {rating}
                    </span>
                    {i === 0 && <span className="rounded-md bg-deep px-3 py-1.5 text-[13px] text-white">Book</span>}
                  </div>
                ))}
              </div>
              <p className="rule flex items-center gap-2 pt-4 text-[13px] text-muted">
                <ShieldCheck size={15} strokeWidth={1.5} /> Payment is held until the job is done
              </p>
            </div>
          </div>

          <p className="caption rise relative lg:col-span-2" style={{ animationDelay: "800ms" }}>
            .edu-confirmed Boston College students · Newton · Brookline · Brighton
          </p>
        </div>
      </section>

      {/* Moving strip of job types */}
      <div className="overflow-hidden border-y border-line py-5">
        <div className="marquee">
          {[...marquee, ...marquee].map((label, i) => (
            <span key={i} className="mx-8 inline-flex items-center gap-3 whitespace-nowrap text-[18px] text-ink">
              <span className="sq text-blue" /> {label}
            </span>
          ))}
        </div>
      </div>

      {/* What people ask for: three columns divided by hairlines */}
      <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-10 sm:py-32">
        <Reveal>
          <p className="eyebrow">What people ask for</p>
          <h2 className="display mt-5 max-w-[16ch]">Help with the things that pile up.</h2>
        </Reveal>
        <div className="mt-16 grid border-t border-line md:grid-cols-3">
          {ASKS.map(([heading, items], col) => (
            <Reveal key={heading} delay={col * 120} className={`pt-8 md:px-8 ${col ? "md:border-l md:border-line" : "md:pl-0"}`}>
              <span className="sq text-ink" />
              <h3 className="mt-6 text-[26px]">{heading}</h3>
              <ul className="mt-6">
                {items.map((item) => (
                  <li key={item} className="rule py-4 text-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-ice">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-10 sm:py-32">
          <Reveal>
            <p className="eyebrow">How it works</p>
            <h2 className="display mt-5">Simple for everyone.</h2>
            <p className="lede max-w-xl">
              Whether you need help around the house or want to earn money between classes, JobsU gets you there in
              minutes.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
            <Reveal className="bg-white p-8 sm:p-12">
              <p className="eyebrow">For residents</p>
              <h3 className="mt-5 text-[32px] leading-tight">Find reliable local help</h3>
              <Steps steps={RESIDENT_STEPS} />
              <Link href="/sign-up/resident" className="btn btn-primary mt-6">
                Request a Job
              </Link>
            </Reveal>
            <Reveal delay={120} className="bg-white p-8 sm:p-12">
              <p className="eyebrow">For students</p>
              <h3 className="mt-5 text-[32px] leading-tight">Earn on your own schedule</h3>
              <Steps steps={STUDENT_STEPS} />
              <Link href="/sign-up/student" className="btn btn-primary mt-6">
                Sign up as a student
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Why JobsU: dark band with the photo and an accordion */}
      <section className="dark-band text-white">
        <div className="mx-auto grid max-w-[1400px] gap-14 px-5 py-24 sm:px-10 sm:py-32 lg:grid-cols-2">
          <Reveal>
            <p className="inline-block rounded-[4px] bg-white/15 px-2.5 py-1 text-[12px] uppercase tracking-[0.06em]">Why JobsU</p>
            <h2 className="display mt-5 max-w-[14ch]">Built for trust, designed for your neighborhood.</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-image.raking.png"
              alt="A Boston College student raking leaves with a Newton resident"
              className="mt-12 aspect-[16/9] w-full max-w-xl rounded-xl object-cover"
            />
          </Reveal>
          <Reveal delay={150} className="lg:pt-16">
            {WHY.map(([title, body], i) => (
              <details key={title} className="group border-t border-white/20 last:border-b" open={i === 0}>
                <summary className="flex cursor-pointer items-center justify-between gap-6 py-6 text-[26px] tracking-tight">
                  {title}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/40 transition-transform duration-500 group-open:rotate-45">
                    <Plus size={15} strokeWidth={1.5} />
                  </span>
                </summary>
                <p className="max-w-lg pb-7 text-[17px] text-white/75">{body}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Common questions */}
      <section className="mx-auto grid max-w-[1400px] gap-12 px-5 py-24 sm:px-10 sm:py-32 lg:grid-cols-[.8fr_1.2fr]">
        <Reveal>
          <p className="eyebrow">FAQ</p>
          <h2 className="display mt-5">Common questions.</h2>
        </Reveal>
        <Reveal delay={120}>
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border-t border-line last:border-b">
              <summary className="flex cursor-pointer items-center justify-between gap-6 py-6 text-[22px] tracking-tight">
                {q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line transition-transform duration-500 group-open:rotate-45">
                  <Plus size={15} strokeWidth={1.5} />
                </span>
              </summary>
              <p className="max-w-2xl pb-7 text-muted">{a}</p>
            </details>
          ))}
        </Reveal>
      </section>

      {/* Closing call to action over the squares */}
      <section className="px-3 pb-3 sm:px-4">
        <div className="relative overflow-hidden rounded-2xl bg-tint">
          <Particles className="absolute inset-0 h-full w-full" density={2.2} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(38rem 16rem at 50% 50%, rgba(234,241,255,.96), rgba(234,241,255,0))" }}
          />
          <Reveal className="relative px-6 py-28 text-center sm:py-36">
            <h2 className="display mx-auto max-w-[18ch]">Post a job today, or sign up as a student.</h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/sign-up/resident" className="btn btn-lg btn-primary">
                Request a Job
              </Link>
              <Link href="/sign-up/student" className="btn btn-lg btn-outline">
                I&apos;m a Student
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
