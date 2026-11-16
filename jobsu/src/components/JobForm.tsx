"use client";

import { useState } from "react";
import { ActionForm, SubmitButton, type FormAction } from "./forms";
import { Field } from "./ui";
import { JOB_TYPES, TIMINGS, jobType } from "@/lib/jobTypes";

export function JobForm({
  action,
  towns,
  defaultTown,
  defaultLandmark,
  minDate,
  rateHint,
}: {
  action: FormAction;
  towns: readonly string[];
  defaultTown: string;
  defaultLandmark: string;
  minDate: string;
  rateHint: string;
}) {
  const [type, setType] = useState("");
  const [notSure, setNotSure] = useState(false);
  const questions = type ? jobType(type).questions : [];

  return (
    <ActionForm action={action} className="space-y-6 rounded-xl border border-line bg-white p-7 sm:p-9">
      <Field label="What do you need?">
        <select name="type" className="input" required value={type} onChange={(e) => setType(e.target.value)}>
          <option value="" disabled>
            Choose a job type…
          </option>
          {JOB_TYPES.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Job title" hint="A few words students will see in the list.">
        <input name="title" className="input" required maxLength={80} placeholder="Rake leaves in the back yard" />
      </Field>

      <Field label="Tell us about the job">
        <textarea
          name="description"
          className="input min-h-28"
          required
          maxLength={2000}
          placeholder="What needs doing, anything a student should bring or know."
        />
      </Field>

      {questions.map((q) => (
        <Field key={`${type}-${q.key}`} label={q.label}>
          {q.kind === "select" ? (
            <select name={`q_${q.key}`} className="input" defaultValue="">
              <option value="">Choose one…</option>
              {q.options!.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input name={`q_${q.key}`} className="input" placeholder={q.placeholder} maxLength={200} />
          )}
        </Field>
      ))}

      <Field label="How often?">
        <select name="timing" className="input" required defaultValue="one-time">
          {TIMINGS.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Date">
          <input name="startDate" type="date" className="input" required min={minDate} />
        </Field>
        <Field label="Start time">
          <input name="startTime" type="time" className="input" />
        </Field>
        <Field label="Hours needed">
          <input name="hours" type="number" className="input" required min={0.5} max={12} step={0.25} placeholder="2" />
        </Field>
      </div>

      <div>
        <Field label="Hourly rate" hint={rateHint}>
          <input
            name="rate"
            className="input"
            inputMode="decimal"
            placeholder="$30"
            disabled={notSure}
            required={!notSure}
          />
        </Field>
        <label className="mt-3 flex items-center gap-3 text-[14px] text-ink">
          <input type="checkbox" name="rateNotSure" checked={notSure} onChange={(e) => setNotSure(e.target.checked)} />
          Not sure — suggest a rate for me
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Town">
          <select name="town" className="input" required defaultValue={defaultTown}>
            {towns.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Nearby landmark" hint="Helps students judge how far you are from campus. It is never shown publicly.">
          <input name="landmark" className="input" defaultValue={defaultLandmark} maxLength={120} />
        </Field>
      </div>

      <SubmitButton className="btn btn-primary btn-lg w-full">Post job</SubmitButton>
    </ActionForm>
  );
}
