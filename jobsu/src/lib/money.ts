import { MIN_RATE_CENTS, PLATFORM_FEE_BPS } from "./config";

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`;
}

export function formatRate(cents: number | null): string {
  return cents == null ? "Rate to be suggested" : `${formatCents(cents)}/hr`;
}

export function formatHours(minutes: number): string {
  const h = minutes / 60;
  const s = Number.isInteger(h) ? String(h) : String(Math.round(h * 100) / 100);
  return `${s} ${h === 1 ? "hour" : "hours"}`;
}

/** Parse "25", "$25", "25.50" into cents. Returns null when it isn't a valid amount. */
export function parseDollars(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}

export function rateError(cents: number): string | null {
  if (cents < MIN_RATE_CENTS) return `No job on JobsU pays less than ${formatCents(MIN_RATE_CENTS)} an hour.`;
  if (cents > 50000) return "That rate looks too high. Please check it.";
  return null;
}

/** Total for a number of minutes at an hourly rate, rounded to the nearest cent. */
export function jobTotalCents(rateCents: number, minutes: number): number {
  return Math.round((rateCents * minutes) / 60);
}

export type Settlement = { amountCents: number; feeCents: number; payoutCents: number };

/**
 * What the resident pays and the student receives when a job is released.
 * The charge can never exceed the amount held at booking.
 */
export function settle(rateCents: number, actualMinutes: number, authorizedCents: number): Settlement {
  const amountCents = Math.min(jobTotalCents(rateCents, actualMinutes), authorizedCents);
  const feeCents = Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
  return { amountCents, feeCents, payoutCents: amountCents - feeCents };
}
