import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { openAttempt } from "@/lib/queue";
import { PREMIUM_ON_NEETCODE } from "@/lib/leetcode";

export const dynamic = "force-dynamic";

const FROM_NEETCODE = Object.fromEntries(
  Object.entries(PREMIUM_ON_NEETCODE).map(([leet, neet]) => [neet, leet]),
);

/**
 * Start the clock on whatever problem you actually opened.
 *
 * The queue decides what you *should* do next, but if you go open something
 * else the driver should follow you rather than lose the attempt.
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
  if (!slug) return NextResponse.json({ ok: false, error: "no slug" }, { status: 400, headers: cors(req) });

  const [problem] = await db.select().from(schema.problems).where(eq(schema.problems.slug, slug));
  if (!problem) {
    // Not part of the NeetCode 150 — nothing to track, and that's fine.
    return NextResponse.json({ ok: true, tracked: false }, { headers: cors(req) });
  }

  const current = await openAttempt();
  if (current?.slug === slug) {
    return NextResponse.json({ ok: true, tracked: true, already: true }, { headers: cors(req) });
  }
  // Only one problem in flight: moving on abandons the one you left.
  if (current) {
    await db.update(schema.attempts).set({ abandoned: true }).where(eq(schema.attempts.id, current.id));
  }

  const [card] = await db.select().from(schema.cards).where(eq(schema.cards.slug, slug));
  const now = new Date();
  await db.insert(schema.attempts).values({
    id: randomUUID(),
    slug,
    servedAt: now,
    openedAt: now,
    isReview: Boolean(card),
  });

  return NextResponse.json({ ok: true, tracked: true, title: problem.title }, { headers: cors(req) });
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
