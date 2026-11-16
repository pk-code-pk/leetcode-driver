import { AUTO_RELEASE_DAYS } from "./config";

export function todayISO(now = new Date()): string {
  // Dates are handled in Eastern time since every job is in the Boston area.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** A booking auto-releases once today is at least 7 days past the scheduled job date. */
export function autoReleaseDue(scheduledFor: string, today = todayISO()): boolean {
  return today >= addDaysISO(scheduledFor, AUTO_RELEASE_DAYS);
}

export function timeAgo(date: Date, now = new Date()): string {
  const s = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
