import { SCHOOLS, studentEmailDomains } from "./config";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function emailDomain(email: string): string {
  return normalizeEmail(email).split("@")[1] ?? "";
}

export type StudentEmailCheck =
  | { ok: true; school: string }
  | { ok: false; reason: "not_edu" | "campus_not_live" };

/** Students need a .edu address from a campus where JobsU is live (subdomains count). */
export function checkStudentEmail(email: string, allowed = studentEmailDomains()): StudentEmailCheck {
  const domain = emailDomain(email);
  if (!domain.endsWith(".edu")) return { ok: false, reason: "not_edu" };
  const match = allowed.find((d) => domain === d || domain.endsWith("." + d));
  if (!match) return { ok: false, reason: "campus_not_live" };
  return { ok: true, school: SCHOOLS[match] ?? match };
}
