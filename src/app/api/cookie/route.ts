import { NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";
import { updateSettings } from "@/lib/settings";
import { whoAmI } from "@/lib/leetcode";

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

  // Derive the username from the session itself so nothing has to be typed in.
  const resolved = username ?? (await whoAmI({ session, csrf }));

  await updateSettings({
    sessionCookieEnc: encrypt(session),
    csrfTokenEnc: encrypt(csrf),
    cookieUpdatedAt: new Date(),
    ...(resolved ? { leetcodeUsername: resolved } : {}),
  });
  return NextResponse.json({ ok: true, username: resolved }, { headers: cors() });
}

const cors = () => ({
  "Access-Control-Allow-Origin": "https://leetcode.com",
  "Access-Control-Allow-Headers": "content-type,x-driver-token",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
});

export async function OPTIONS() {
  return new NextResponse(null, { headers: cors() });
}
