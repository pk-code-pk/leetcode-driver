import { NextResponse } from "next/server";
import { SITE_COOKIE, tokenValid } from "@/lib/auth";

export const dynamic = "force-dynamic";

const YEAR = 60 * 60 * 24 * 365;

/** Sign in to the site with the same DRIVER_TOKEN the extension uses. */
export async function POST(req: Request) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!tokenValid(body.token?.trim())) {
    return NextResponse.json({ ok: false, error: "wrong token" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SITE_COOKIE, body.token!.trim(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: YEAR,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SITE_COOKIE);
  return res;
}
