import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { openAttempt } from "@/lib/queue";

export const dynamic = "force-dynamic";

/**
 * Manual control over the attempt clock.
 *
 * Duration drives the inferred grade, so time spent away from the problem has
 * to be subtractable — otherwise stepping out for lunch reads as a hard solve.
 */
export async function POST(req: Request) {
  if (req.headers.get("x-driver-token") !== process.env.DRIVER_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 401, headers: cors(req) });
  }

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400, headers: cors(req) });
  }

  const a = await openAttempt();
  if (!a) return NextResponse.json({ ok: true, attempt: null }, { headers: cors(req) });

  const now = new Date();
  const patch: Partial<typeof schema.attempts.$inferInsert> = {};

  switch (body.action) {
    case "pause":
      if (!a.pausedAt) patch.pausedAt = now;
      break;
    case "resume":
      if (a.pausedAt) {
        patch.pausedSec = a.pausedSec + Math.floor((now.getTime() - a.pausedAt.getTime()) / 1000);
        patch.pausedAt = null;
      }
      break;
    case "reset":
      patch.openedAt = now;
      patch.pausedSec = 0;
      patch.pausedAt = null;
      break;
    default:
      return NextResponse.json({ ok: false, error: "bad action" }, { status: 400, headers: cors(req) });
  }

  if (Object.keys(patch).length) {
    await db.update(schema.attempts).set(patch).where(eq(schema.attempts.id, a.id));
  }
  return NextResponse.json({ ok: true }, { headers: cors(req) });
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
