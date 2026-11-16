// Business rules for JobsU. Money is always in cents.

export const MIN_RATE_CENTS = 1875; // "No job on JobsU pays less than $18.75 an hour."
export const TYPICAL_RATE_LOW_CENTS = 2500;
export const TYPICAL_RATE_HIGH_CENTS = 4500;
export const PLATFORM_FEE_BPS = 1000; // 10% of the job amount, deducted before payout
export const AUTO_RELEASE_DAYS = 7; // funds release 7 days after the scheduled job date
export const REVIEW_BLIND_DAYS = 14; // a review shows once both sides submit, or after this long
export const VERIFICATION_CODE_MINUTES = 15;
export const SESSION_DAYS = 30;

export const TOWNS = ["Newton", "Brookline", "Brighton"] as const;
export type Town = (typeof TOWNS)[number];

export const SCHOOLS: Record<string, string> = {
  "bc.edu": "Boston College",
};

export function studentEmailDomains(): string[] {
  return (process.env.STUDENT_EMAIL_DOMAINS || "bc.edu")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function appUrl(): string {
  return (
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3100")
  ).replace(/\/$/, "");
}

export function showDevCodes(): boolean {
  return process.env.DEV_SHOW_CODES === "true";
}
