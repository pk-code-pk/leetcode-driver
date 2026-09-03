import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { openAttempt } from "@/lib/queue";
import { BASELINE_MIN } from "@/lib/sm2";
import { PREMIUM_ON_NEETCODE } from "@/lib/leetcode";

export const dynamic = "force-dynamic";

/** What the on-page timer needs: which problem is live, and since when. */
export async function GET(req: Request) {
  if (req.headers.get("x-driver-token") !== process.env.DRIVER_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 401, headers: cors(req) });
  }

  const attempt = await openAttempt();
  if (!attempt) return NextResponse.json({ ok: true, attempt: null }, { headers: cors(req) });

  const [p] = await db.select().from(schema.problems).where(eq(schema.problems.slug, attempt.slug));
  const baseline = (BASELINE_MIN[p?.difficulty ?? "Medium"] ?? 25) * (attempt.isReview ? 0.5 : 1);

  return NextResponse.json(
    {
      ok: true,
      attempt: {
        slug: attempt.slug,
        // The page knows itself by NeetCode's slug when it's hosted there.
        neetcodeSlug: PREMIUM_ON_NEETCODE[attempt.slug] ?? null,
        title: p?.title ?? attempt.slug,
        difficulty: p?.difficulty ?? "Medium",
        isReview: attempt.isReview,
        hintLevel: attempt.hintLevel,
        startedAt: (attempt.openedAt ?? attempt.servedAt).toISOString(),
        pausedSec: attempt.pausedSec,
        pausedAt: attempt.pausedAt ? attempt.pausedAt.toISOString() : null,
        baselineMin: baseline,
      },
    },
    { headers: cors(req) },
  );
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
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { headers: cors(req) });
}
