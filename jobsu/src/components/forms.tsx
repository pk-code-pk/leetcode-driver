"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export type FormState = { error?: string; notice?: string };
export type FormAction = (prev: FormState, data: FormData) => Promise<FormState>;

/** A form bound to a server action that shows the action's error or notice. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: FormAction;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      {state.error && (
        <p role="alert" className="mb-5 flex gap-3 rounded-lg bg-red-50 px-4 py-3.5 text-[15px] text-red-800">
          <span className="sq mt-[7px]" />
          <span>{state.error}</span>
        </p>
      )}
      {state.notice && (
        <p role="status" className="mb-5 flex gap-3 rounded-lg bg-green-bg px-4 py-3.5 text-[15px] text-green-deep">
          <span className="sq mt-[7px]" />
          <span>{state.notice}</span>
        </p>
      )}
      {children}
    </form>
  );
}

export function SubmitButton({
  children,
  className = "btn btn-primary",
  name,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value}>
      {pending ? "Working…" : children}
    </button>
  );
}
