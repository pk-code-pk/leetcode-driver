import { NextResponse } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/db";
import { openAttempt } from "@/lib/queue";
import { PREMIUM_ON_NEETCODE } from "@/lib/leetcode";

export const dynamic = "force-dynamic";

const FROM_NEETCODE = Object.fromEntries(
  Object.entries(PREMIUM_ON_NEETCODE).map(([leet, neet]) => [neet, leet]),
);

/**
 * Marks when the problem page was actually opened.
 *
 * Without this, duration is measured from when the problem was *served*, so
 * anything left sitting overnight grades as a 21-hour solve and its review
 * interval collapses.
 */
export async function POST(req: Request) {
  if (req.headers.get("x-driver-token") !== process.env.DRIVER_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 401, headers: cors(req) });
  }
  let body: { slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400, headers: cors(req) });
  }

  const raw = (body.slug ?? "").trim();
  const slug = FROM_NEETCODE[raw] ?? raw;
  const attempt = await openAttempt();
  if (!attempt || attempt.slug !== slug) {
    return NextResponse.json({ ok: true, recorded: false }, { headers: cors(req) });
  }

  // First open wins; re-opening the tab later must not restart the clock.
  await db
    .update(schema.attempts)
    .set({ openedAt: new Date() })
    .where(and(eq(schema.attempts.id, attempt.id), isNull(schema.attempts.openedAt)));

  return NextResponse.json({ ok: true, recorded: true }, { headers: cors(req) });
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
