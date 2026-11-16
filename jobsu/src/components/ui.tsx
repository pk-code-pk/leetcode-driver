import Link from "next/link";
import type { BookingStatus, JobStatus } from "@/db/schema";

export function Stars({ rating, count }: { rating: number | null; count?: number }) {
  if (rating == null) return <span className="text-xs text-muted">No ratings yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-navy" aria-label={`${rating} out of 5`}>
      <span className="text-amber-500">★</span>
      {rating.toFixed(1)}
      {count != null && <span className="font-normal text-muted">({count})</span>}
    </span>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-blue font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

const JOB_STATUS: Record<JobStatus, [string, string]> = {
  pending_review: ["In review", "bg-amber-100 text-amber-800"],
  open: ["Open", "bg-green-bg text-green-deep"],
  booked: ["Booked", "bg-blue/10 text-blue"],
  completed: ["Completed", "bg-slate-100 text-slate-700"],
  cancelled: ["Cancelled", "bg-red-50 text-red-700"],
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const [label, cls] = JOB_STATUS[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

const BOOKING_STATUS: Record<BookingStatus, [string, string]> = {
  awaiting_payment: ["Awaiting payment", "bg-amber-100 text-amber-800"],
  authorized: ["Booked", "bg-blue/10 text-blue"],
  completed_pending: ["Awaiting confirmation", "bg-amber-100 text-amber-800"],
  completed: ["Paid", "bg-green-bg text-green-deep"],
  disputed: ["Disputed", "bg-red-50 text-red-700"],
  cancelled: ["Cancelled", "bg-red-50 text-red-700"],
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const [label, cls] = BOOKING_STATUS[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function EduBadge() {
  return <span className="badge bg-green-bg text-green-deep">✓ .edu-confirmed</span>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="card py-10 text-center">
      <p className="font-bold text-navy">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{body}</p>
      {href && cta && (
        <Link href={href} className="btn btn-primary mt-4">
          {cta}
        </Link>
      )}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint block">{hint}</span>}
    </label>
  );
}
