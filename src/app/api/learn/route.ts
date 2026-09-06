import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { generateLesson } from "@/lib/hints";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Habits worth naming in a lesson, so it corrects the mistakes actually made. */
const WEAK_SPOTS =
  "Tends not to trust a data structure to do its job — adds guards or scanning on top " +
  "instead of choosing the shape that makes the bad case impossible. Writes C-style index " +
  "loops in Python (range(len(x)), manual while loops with sentinels) rather than iterating " +
  "directly, which adds state to track by hand.";

/**
 * The lesson for a topic, generated once and cached.
 *
 * Regenerating on every read would be slow and pointless: a pattern does not
 * change between visits.
 */
export async function GET(req: Request) {
  if (req.headers.get("x-driver-token") !== process.env.DRIVER_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 401, headers: cors(req) });
  }

  const key = new URL(req.url).searchParams.get("topic")?.trim();
  if (!key) return NextResponse.json({ ok: false, error: "no topic" }, { status: 400, headers: cors(req) });

  const [topic] = await db.select().from(schema.topics).where(eq(schema.topics.key, key));
  if (!topic) return NextResponse.json({ ok: false, error: "unknown topic" }, { status: 404, headers: cors(req) });

  if (topic.lesson) {
    return NextResponse.json({ ok: true, key, label: topic.label, lesson: topic.lesson, cached: true }, { headers: cors(req) });
  }

  const problems = await db
    .select({ title: schema.problems.title })
    .from(schema.problems)
    .where(eq(schema.problems.topic, key))
    .orderBy(asc(schema.problems.orderInTopic));

  const labels = await db.select({ key: schema.topics.key, label: schema.topics.label }).from(schema.topics);
  const nameOf = (k: string) => labels.find((l) => l.key === k)?.label ?? k;

  const lesson = await generateLesson({
    label: topic.label,
    problems: problems.map((p) => p.title),
    prereqs: (topic.prereqs ?? []).map(nameOf),
    weakSpots: WEAK_SPOTS,
  });
  if (!lesson) {
    return NextResponse.json({ ok: false, error: "generation failed" }, { status: 502, headers: cors(req) });
  }

  await db.update(schema.topics).set({ lesson, lessonAt: new Date() }).where(eq(schema.topics.key, key));
  return NextResponse.json({ ok: true, key, label: topic.label, lesson, cached: false }, { headers: cors(req) });
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
