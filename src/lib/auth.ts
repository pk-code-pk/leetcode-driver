import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SITE_COOKIE = "driver_token";

function same(a: string | null | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const tokenValid = (t: string | null | undefined) => same(t, process.env.DRIVER_TOKEN);

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
