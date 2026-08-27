import { NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";
import { updateSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * Receives a fresh LeetCode session from the userscript. This is what removes
 * the recurring "re-paste your cookie" chore entirely.
 */
export async function POST(req: Request) {
  const token = req.headers.get("x-driver-token");
  if (!token || token !== process.env.DRIVER_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { session, csrf, username } = (await req.json()) as {
    session?: string; csrf?: string; username?: string;
  };
  if (!session || !csrf) {
    return NextResponse.json({ ok: false, error: "missing session or csrf" }, { status: 400 });
  }

  await updateSettings({
    sessionCookieEnc: encrypt(session),
    csrfTokenEnc: encrypt(csrf),
    cookieUpdatedAt: new Date(),
    ...(username ? { leetcodeUsername: username } : {}),
  });
  return NextResponse.json({ ok: true }, { headers: cors() });
}

const cors = () => ({
  "Access-Control-Allow-Origin": "https://leetcode.com",
  "Access-Control-Allow-Headers": "content-type,x-driver-token",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
});

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors() });
}
