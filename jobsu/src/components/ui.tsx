import Link from "next/link";
import {
  Baby,
  BadgeCheck,
  BookOpen,
  Dog,
  Home,
  Laptop,
  Leaf,
  Music,
  Package,
  ShoppingBag,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import type { BookingStatus, JobStatus } from "@/db/schema";

const JOB_ICONS: Record<string, LucideIcon> = {
  babysitting: Baby,
  tutoring: BookOpen,
  moving: Package,
  "yard-work": Leaf,
  "pet-care": Dog,
  lessons: Music,
  "tech-setup": Laptop,
  errands: ShoppingBag,
  organizing: Home,
  other: Sparkles,
};

export function JobIcon({ type, size = 18, className }: { type: string; size?: number; className?: string }) {
  const Icon = JOB_ICONS[type] ?? Sparkles;
  return <Icon size={size} strokeWidth={1.5} className={className} aria-hidden />;
}

/** The job-type icon in a tinted square, used at the start of rows and headers. */
export function JobTile({ type, size = 44, green }: { type: string; size?: number; green?: boolean }) {
  return (
    <span className={`tile ${green ? "tile-green" : ""}`} style={{ width: size, height: size }}>
      <JobIcon type={type} size={Math.round(size * 0.45)} />
    </span>
  );
}

/** One star and a number, the way listings show ratings. */
export function Stars({ rating, count }: { rating: number | null; count?: number }) {
  if (rating == null) return <span className="text-[14px] text-faint">New on JobsU</span>;
  return (
    <span className="num inline-flex items-center gap-1.5 text-[14px] text-ink" aria-label={`${rating} out of 5`}>
      <Star size={13} className="fill-ink text-ink" aria-hidden />
      {rating.toFixed(1)}
      {count != null && <span className="text-faint">({count})</span>}
    </span>
  );
}

/** Initials in a rounded square; verified students get a small check. */
export function Avatar({ name, size = 40, verified }: { name: string; size?: number; verified?: boolean }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }} aria-hidden>
      <span
        className="flex h-full w-full items-center justify-center bg-deep text-white"
        style={{ fontSize: size * 0.36, borderRadius: Math.max(6, size * 0.2), letterSpacing: "0.02em" }}
      >
        {initials}
      </span>
      {verified && (
        <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-px">
          <BadgeCheck size={Math.max(14, size * 0.34)} className="fill-blue text-white" />
        </span>
      )}
    </span>
  );
}

const TONES = {
  amber: "bg-amber-50 text-amber-800",
  green: "bg-green-bg text-green-deep",
  blue: "bg-tint text-ink",
  slate: "bg-slate-100 text-slate-600",
  red: "bg-red-50 text-red-700",
} as const;
export type Tone = keyof typeof TONES;

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`badge ${TONES[tone]}`}>{children}</span>;
}

const JOB_STATUS: Record<JobStatus, [string, Tone]> = {
  pending_review: ["In review", "amber"],
  open: ["Open", "green"],
  booked: ["Booked", "blue"],
  completed: ["Completed", "slate"],
  cancelled: ["Cancelled", "red"],
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const [label, tone] = JOB_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const BOOKING_STATUS: Record<BookingStatus, [string, Tone]> = {
  awaiting_payment: ["Awaiting payment", "amber"],
  authorized: ["Booked", "blue"],
  completed_pending: ["Awaiting confirmation", "amber"],
  completed: ["Paid", "green"],
  disputed: ["Disputed", "red"],
  cancelled: ["Cancelled", "red"],
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const [label, tone] = BOOKING_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function EduBadge() {
  return <span className="badge bg-tint text-ink">.edu-confirmed</span>;
}

/** Standard page container. `narrow` suits forms. */
export function Page({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return <div className={`rise mx-auto px-5 pb-16 pt-8 sm:pt-11 ${narrow ? "max-w-[42rem]" : "max-w-[1320px] sm:px-10"}`}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  green,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  green?: boolean;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        {eyebrow && <p className={green ? "eyebrow-green" : "eyebrow"}>{eyebrow}</p>}
        <h1 className="title mt-3">{title}</h1>
        {subtitle && <p className="lede">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Section heading with the square mark. */
export function SectionTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h2 className="flex items-center gap-3 text-[22px] tracking-tight text-ink">
      <span className="sq" />
      {children}
      {count != null && <span className="num text-[15px] text-faint">{String(count).padStart(2, "0")}</span>}
    </h2>
  );
}

export function Empty({
  icon: Icon,
  title,
  body,
  href,
  cta,
}: {
  icon?: LucideIcon;
  title: string;
  body: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-20 text-center">
      {Icon && (
        <span className="tile mx-auto mb-6 h-14 w-14">
          <Icon size={24} strokeWidth={1.4} aria-hidden />
        </span>
      )}
      <p className="text-[26px] tracking-tight text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-muted">{body}</p>
      {href && cta && (
        <Link href={href} className="btn btn-primary mt-7">
          {cta}
        </Link>
      )}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint block">{hint}</span>}
    </label>
  );
}

/** A callout for status messages inside a page, marked with the square. */
export function Notice({ tone = "blue", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <div className={`flex gap-3 rounded-lg px-4 py-3.5 text-[15px] leading-normal ${TONES[tone]}`}>
      <span className="sq mt-[7px]" />
      <div>{children}</div>
    </div>
  );
}

/** Icon + text pairs for the facts on a row (where, when, how long). */
export function Meta({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={14} strokeWidth={1.5} className="text-faint" aria-hidden />
      {children}
    </span>
  );
}

/** "$30" large with "/hr" small. */
export function Rate({ cents, size = "md" }: { cents: number | null; size?: "md" | "lg" }) {
  if (cents == null) return <span className="whitespace-nowrap text-[14px] text-faint">Rate pending</span>;
  const dollars = cents / 100;
  return (
    <span className="num whitespace-nowrap text-ink">
      <span className={size === "lg" ? "text-[40px] leading-none tracking-tight" : "text-[26px] leading-none tracking-tight"}>
        ${dollars % 1 === 0 ? dollars : dollars.toFixed(2)}
      </span>
      <span className="ml-0.5 text-[14px] text-faint">/hr</span>
    </span>
  );
}

/** Back link with the square mark. */
export function Back({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5 text-[15px] text-muted transition-colors hover:text-ink">
      <span className="sq transition-transform duration-500 group-hover:-translate-x-1 group-hover:rotate-45" />
      {children}
    </Link>
  );
}
