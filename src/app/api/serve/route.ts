import { NextResponse } from "next/server";
import { serveNext } from "@/lib/engine";
import { openAttempt } from "@/lib/queue";
import { problemUrl } from "@/lib/leetcode";

export const dynamic = "force-dynamic";

/**
 * Serve the next problem in NeetCode 150 order and hand back its URL, so the
 * page overlay can move you straight there without a trip through Telegram.
 */
export async function POST(req: Request) {
  if (req.headers.get("x-driver-token") !== process.env.DRIVER_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 401, headers: cors(req) });
  }

  await serveNext();
  // serveNext is a no-op when something is already in flight; either way the
  // open attempt is what you should be looking at.
  const a = await openAttempt();
  if (!a) return NextResponse.json({ ok: true, url: null }, { headers: cors(req) });
  return NextResponse.json({ ok: true, slug: a.slug, url: problemUrl(a.slug) }, { headers: cors(req) });
}

function cors(req?: Request) {
  const origin = req?.headers.get("origin") ?? "";
  const allowed =
    origin === "https://leetcode.com" ||
    origin === "https://neetcode.io" ||
    origin.startsWith("chrome-extension://");
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://leetcode.com",
    "Access-Control-Allow-Headers": "content-type,x-driver-token",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { headers: cors(req) });
}
