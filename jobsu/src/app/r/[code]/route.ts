import { NextResponse } from "next/server";
import { REF_COOKIE } from "@/lib/referrals";

// A shared referral link: remember who sent the visitor, then show sign-up.
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const res = NextResponse.redirect(new URL("/sign-up", req.url));
  if (/^[a-z]+-[0-9a-f]{4}$/.test(code)) {
    res.cookies.set(REF_COOKIE, code, { maxAge: 60 * 60 * 24 * 30, httpOnly: true, sameSite: "lax", path: "/" });
  }
  return res;
}
