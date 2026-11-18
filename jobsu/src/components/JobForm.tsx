"use client";

import { useState } from "react";
import { CalendarDays, Car, Clock, MapPin, Minus, Plus, ShieldCheck, Users } from "lucide-react";
import { ActionForm, SubmitButton, type FormAction } from "./forms";
import { Field, JobIcon } from "./ui";
import { JOB_TYPES, TIMINGS, TRANSPORT, jobType, payGuide, transportOption } from "@/lib/jobTypes";

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-line py-8 first:border-t-0 first:pt-0 md:grid-cols-[11rem_1fr] md:gap-10">
      <div>
        <p className="num text-[13px] text-faint">0{n}</p>
        <h2 className="mt-1 text-[19px] tracking-tight text-ink">{title}</h2>
        {hint && <p className="mt-1.5 text-[14px] leading-snug text-muted">{hint}</p>}
      </div>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}

/** Values to start the form with, e.g. when reposting an earlier job. */
export type JobFormInitial = {
  type: string;
  title: string;
  description: string;
  hours: string;
  rate: string;
  town: string;
  timing: string;
  studentsNeeded: number;
  transport: string;
  answers: Record<string, string>;
};

/** Where the entered rate sits against what most residents pay for this kind of job. */
function PayGuide({ type, rate, onPick, minRate }: { type: string; rate: number; onPick: (n: number) => void; minRate: number }) {
  const [low, high] = payGuide(type);
  const lo = minRate;
  const hi = high + 10;
  const pos = (n: number) => `${Math.min(100, Math.max(0, ((n - lo) / (hi - lo)) * 100))}%`;
  const mid = Math.round((low + high) / 2);
  return (
    <div className="inset" data-testid="pay-guide">
      <p className="text-[15px] text-ink">
        Most residents pay <span className="num">${low}–${high}</span>/hr{type ? ` for ${jobType(type).label.toLowerCase()}` : ""}
      </p>
      <div className="relative mt-4 h-1.5 rounded-full bg-line">
        <span className="absolute inset-y-0 rounded-full bg-deep/70" style={{ left: pos(low), right: `calc(100% - ${pos(high)})` }} />
        {rate > 0 && (
          <span
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue shadow"
            style={{ left: pos(rate) }}
          />
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[12px] text-faint">
        <span className="num">${lo}</span>
        <span className="num">${hi}+</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[low, mid, high].map((n) => (
          <button key={n} type="button" onClick={() => onPick(n)} className="chip">
            ${n}/hr
          </button>
        ))}
      </div>
    </div>
  );
}

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export function JobForm({
  action,
  towns,
  defaultTown,
  defaultLandmark,
  minDate,
  rateHint,
  minRate,
  initial,
  invite,
}: {
  action: FormAction;
  towns: readonly string[];
  defaultTown: string;
  defaultLandmark: string;
  minDate: string;
  rateHint: string;
  minRate: number;
  initial?: JobFormInitial;
  /** A student to tell about this job ("Hire again"). */
  invite?: string;
}) {
  const [type, setType] = useState(initial?.type ?? "");
  const [notSure, setNotSure] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [hours, setHours] = useState(initial?.hours ?? "");
  const [rate, setRate] = useState(initial?.rate ?? "");
  const [town, setTown] = useState(initial?.town ?? defaultTown);
  const [people, setPeople] = useState(initial?.studentsNeeded ?? 1);
  const [transport, setTransport] = useState(initial?.transport ?? "");
  const questions = type ? jobType(type).questions : [];

  const h = Number(hours);
  const r = Number(rate.replace(/[$,\s]/g, ""));
  const total = !notSure && h > 0 && r > 0 ? h * r * people : null;
  const when = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
      (time ? ` at ${time}` : "")
    : null;

  return (
    <ActionForm action={action} className="grid items-start gap-10 lg:grid-cols-[1fr_21rem]">
      <div className="min-w-0">
        {invite && <input type="hidden" name="invite" value={invite} />}
        <Step n={1} title="The job" hint="Pick the closest match, then describe it in your own words.">
          <div>
            <p className="label">What do you need?</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {JOB_TYPES.map((t) => {
                const on = t.slug === type;
                return (
                  <button
                    key={t.slug}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setType(t.slug)}
                    className={`flex h-[4.75rem] flex-col items-start justify-between rounded-lg p-3 text-left text-[14px] leading-tight transition-colors ${
                      on
                        ? "bg-deep text-white"
                        : "text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:shadow-[inset_0_0_0_1px_var(--color-ink)]"
                    }`}
                  >
                    <JobIcon type={t.slug} size={18} />
                    {t.label}
                  </button>
                );
              })}
            </div>
            {/* The real field. Kept for keyboard and screen-reader users, and so the form can require a choice. */}
            <select
              name="type"
              className="sr-only"
              required
              aria-label="Job type"
              tabIndex={-1}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="" disabled>
                Choose a job type…
              </option>
              {JOB_TYPES.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <Field label="Job title" hint="A few words students will see in the list.">
            <input
              name="title"
              className="input"
              required
              maxLength={80}
              placeholder="Rake leaves in the back yard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          <Field label="Tell us about the job">
            <textarea
              name="description"
              className="input min-h-28"
              required
              maxLength={2000}
              placeholder="What needs doing, anything a student should bring or know."
              defaultValue={initial?.description}
            />
          </Field>

          {questions.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              {questions.map((q) => (
                <Field key={`${type}-${q.key}`} label={q.label}>
                  {q.kind === "select" ? (
                    <select name={`q_${q.key}`} className="input" defaultValue={initial?.answers[q.key] ?? ""}>
                      <option value="">Choose one…</option>
                      {q.options!.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={`q_${q.key}`}
                      className="input"
                      placeholder={q.placeholder}
                      maxLength={200}
                      defaultValue={initial?.answers[q.key]}
                    />
                  )}
                </Field>
              ))}
            </div>
          )}
        </Step>

        <Step n={2} title="When" hint="A best guess on hours is fine. You pay for the time actually worked.">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Date">
              <input name="startDate" type="date" className="input" required min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Start time">
              <input name="startTime" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
            <Field label="Hours needed">
              <input
                name="hours"
                type="number"
                className="input"
                required
                min={0.5}
                max={12}
                step={0.25}
                placeholder="2"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </Field>
          </div>
          <Field label="How often?">
            <select name="timing" className="input" required defaultValue={initial?.timing ?? "one-time"}>
              {TIMINGS.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        </Step>

        <Step n={3} title="Pay and people" hint="Students see the rate before they apply. Each student is paid this rate.">
          <PayGuide type={type} rate={notSure ? 0 : r} minRate={minRate} onPick={(n) => (setNotSure(false), setRate(String(n)))} />
          <div>
            <Field label="Hourly rate" hint={rateHint}>
              <input
                name="rate"
                className="input"
                inputMode="decimal"
                placeholder="$30"
                disabled={notSure}
                required={!notSure}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </Field>
            <label className="mt-3 flex items-center gap-3 text-[14px] text-ink">
              <input type="checkbox" name="rateNotSure" checked={notSure} onChange={(e) => setNotSure(e.target.checked)} />
              Not sure — suggest a rate for me
            </label>
          </div>
          <div>
            <p className="label">Students needed</p>
            <div className="flex items-center gap-3">
              <button type="button" className="btn btn-outline btn-sm w-10 px-0" aria-label="Fewer students" onClick={() => setPeople((n) => Math.max(1, n - 1))} disabled={people <= 1}>
                <Minus size={15} />
              </button>
              <span className="num w-6 text-center text-[19px] text-ink" data-testid="students-needed">
                {people}
              </span>
              <button type="button" className="btn btn-outline btn-sm w-10 px-0" aria-label="More students" onClick={() => setPeople((n) => Math.min(6, n + 1))} disabled={people >= 6}>
                <Plus size={15} />
              </button>
              <span className="text-[14px] text-muted">{people > 1 ? "You'll pick each student from the applicants." : "Need a team? Add more."}</span>
            </div>
            <input type="hidden" name="studentsNeeded" value={people} />
          </div>
        </Step>

        <Step n={4} title="Where" hint="Students only see your town until you book one.">
          <div>
            <p className="label">Getting there</p>
            <div className="flex flex-wrap gap-2">
              {TRANSPORT.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  aria-pressed={transport === t.slug}
                  onClick={() => setTransport(transport === t.slug ? "" : t.slug)}
                  className={`chip ${transport === t.slug ? "chip-on" : ""}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="hint">Optional. If a car is needed, students without one will see it sorted lower.</p>
            <input type="hidden" name="transport" value={transport} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Town">
              <select name="town" className="input" required value={town} onChange={(e) => setTown(e.target.value)}>
                {towns.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Nearby landmark" hint="Helps students judge how far you are from campus. It is never shown publicly.">
              <input name="landmark" className="input" defaultValue={defaultLandmark} maxLength={120} />
            </Field>
          </div>
        </Step>
      </div>

      {/* Live summary: what students will see, and what it will cost. */}
      <aside className="glass rounded-xl p-6 lg:sticky lg:top-28">
        <p className="caption text-muted">Your post</p>
        <div className="mt-4 flex items-start gap-3">
          <span className="tile h-11 w-11 shrink-0">
            <JobIcon type={type || "other"} size={19} />
          </span>
          <div className="min-w-0">
            <p className={`text-[19px] leading-snug tracking-tight ${title ? "text-ink" : "text-faint"}`}>{title || "Your job title"}</p>
            <p className="text-[14px] text-muted">{type ? jobType(type).label : "Job type"}</p>
          </div>
        </div>
        <ul className="mt-5 space-y-2.5 text-[15px] text-ink">
          <li className="flex items-center gap-2.5">
            <CalendarDays size={16} strokeWidth={1.5} className="text-faint" />
            {when ?? <span className="text-faint">Date and time</span>}
          </li>
          <li className="flex items-center gap-2.5">
            <Clock size={16} strokeWidth={1.5} className="text-faint" />
            {h > 0 ? `${h} ${h === 1 ? "hour" : "hours"}` : <span className="text-faint">Hours needed</span>}
          </li>
          <li className="flex items-center gap-2.5">
            <MapPin size={16} strokeWidth={1.5} className="text-faint" />
            {town}
          </li>
          <li className="flex items-center gap-2.5">
            <Users size={16} strokeWidth={1.5} className="text-faint" />
            {people} {people === 1 ? "student" : "students"}
          </li>
          {transport && (
            <li className="flex items-center gap-2.5">
              <Car size={16} strokeWidth={1.5} className="text-faint" />
              {transportOption(transport)?.label}
            </li>
          )}
        </ul>
        <div className="rule mt-5 pt-5">
          <div className="flex items-baseline justify-between">
            <span className="text-[14px] text-muted">Estimated total</span>
            <span className="num text-[28px] tracking-tight text-ink">
              {notSure ? "—" : total != null ? money(total) : "$0"}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-faint">
            {notSure
              ? "We'll suggest a fair rate before your job goes live."
              : total != null
                ? `${money(r)}/hr for ${h} ${h === 1 ? "hour" : "hours"}${people > 1 ? `, ${people} students` : ""}. Posting is free.`
                : "Rate times hours. Posting is free."}
          </p>
        </div>
        <SubmitButton className="btn btn-primary btn-lg mt-5 w-full">Post job</SubmitButton>
        <p className="mt-4 flex items-start gap-2 text-[13px] leading-snug text-faint">
          <ShieldCheck size={15} strokeWidth={1.5} className="mt-px shrink-0" />
          You&apos;re only charged after you book a student and the job is done.
        </p>
      </aside>
    </ActionForm>
  );
}
