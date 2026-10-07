import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SITE_COOKIE = "driver_token";

function same(a: string | null | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * DRIVER_TOKEN may be a comma-separated list: the first is the one to hand out,
 * the rest are old tokens kept alive so clients still holding them don't break.
 */
const tokens = () =>
  (process.env.DRIVER_TOKEN ?? "").split(",").map((t) => t.trim()).filter(Boolean);

// no short-circuit, so timing doesn't reveal which slot matched
export const tokenValid = (t: string | null | undefined) =>
  tokens().reduce((ok, k) => same(t, k) || ok, false);

function cookieOf(req: Request, name: string): string | null {
  for (const part of (req.headers.get("cookie") ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

/**
 * The extension sends the token as a header; the site sends it as a SameSite=Strict
 * cookie set at sign-in, so a cross-site page can't ride it into a state change.
 */
export function authorized(req: Request): boolean {
  return tokenValid(req.headers.get("x-driver-token")) || tokenValid(cookieOf(req, SITE_COOKIE));
}

/** For server components: is the person viewing the site signed in? */
export async function siteAuthed(): Promise<boolean> {
  return tokenValid((await cookies()).get(SITE_COOKIE)?.value);
}
