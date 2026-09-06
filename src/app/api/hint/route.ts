import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { openAttempt } from "@/lib/queue";
import { getHint } from "@/lib/hints";
import { PREMIUM_ON_NEETCODE } from "@/lib/leetcode";

export const dynamic = "force-dynamic";

const FROM_NEETCODE = Object.fromEntries(
  Object.entries(PREMIUM_ON_NEETCODE).map(([leet, neet]) => [neet, leet]),
);

/**
 * One rung of the hint ladder, for the page rather than Telegram.
 *
 * Asking for help is recorded on the attempt, so the grade reflects what it
 * actually took — the point is to unblock without quietly rewriting the story.
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
  if (!attempt || (slug && attempt.slug !== slug)) {
    return NextResponse.json(
      { ok: true, hint: null, error: "start the timer on this problem first" },
      { headers: cors(req) },
    );
  }

  const level = attempt.hintLevel + 1;
  if (level > 4) {
    return NextResponse.json({ ok: true, hint: null, level: 4, exhausted: true }, { headers: cors(req) });
  }
  await db.update(schema.attempts).set({ hintLevel: level }).where(eq(schema.attempts.id, attempt.id));

  const [problem] = await db.select().from(schema.problems).where(eq(schema.problems.slug, attempt.slug));
  const hint = await getHint({
    title: problem?.title ?? attempt.slug,
    slug: attempt.slug,
    level,
    officialHints: problem?.officialHints ?? [],
    tags: problem?.tags ?? [],
  });

  return NextResponse.json(
    { ok: true, level, of: 4, text: hint.text, source: hint.source, html: hint.html ?? false },
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
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { headers: cors(req) });
}
