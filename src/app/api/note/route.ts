import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { gradeFromNotes } from "@/lib/hints";
import { schedule } from "@/lib/sm2";
import { PREMIUM_ON_NEETCODE } from "@/lib/leetcode";
import { getSettings } from "@/lib/settings";
import { sendMessage, esc } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const FROM_NEETCODE = Object.fromEntries(
  Object.entries(PREMIUM_ON_NEETCODE).map(([leet, neet]) => [neet, leet]),
);

/**
 * Regrade a just-solved problem from the solver's own account of it.
 *
 * Time and failed submissions are proxies for difficulty; what you remember
 * about the struggle is the real signal, so this replaces the inferred grade
 * and reschedules from the pre-solve snapshot rather than compounding on it.
 */
export async function POST(req: Request) {
  if (req.headers.get("x-driver-token") !== process.env.DRIVER_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 401, headers: cors(req) });
  }

  let body: { slug?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400, headers: cors(req) });
  }

  const raw = (body.slug ?? "").trim();
  const slug = FROM_NEETCODE[raw] ?? raw;
  const notes = (body.notes ?? "").trim();
  if (!slug || !notes) {
    return NextResponse.json({ ok: false, error: "slug and notes required" }, { status: 400, headers: cors(req) });
  }

  const [card] = await db.select().from(schema.cards).where(eq(schema.cards.slug, slug));
  if (!card) {
    return NextResponse.json({ ok: false, error: "not solved yet" }, { status: 404, headers: cors(req) });
  }
  const [problem] = await db.select().from(schema.problems).where(eq(schema.problems.slug, slug));

  await db.update(schema.cards).set({ userNote: notes }).where(eq(schema.cards.slug, slug));

  const judged = await gradeFromNotes(
    problem?.title ?? slug,
    notes,
    problem?.difficulty ?? "Medium",
    card.lastDurationSec,
    card.code,
  );
  // No key or a bad response: the note is still saved, the grade just stands.
  if (!judged) {
    return NextResponse.json({ ok: true, regraded: false }, { headers: cors(req) });
  }

  const next = schedule(
    {
      ease: card.preEase ?? 2.5,
      intervalDays: card.preIntervalDays ?? 0,
      reps: card.preReps ?? 0,
      lapses: card.preLapses ?? 0,
    },
    judged.grade,
    card.lastSolvedAt ?? new Date(),
  );

  await db.update(schema.cards).set({
    state: next.state,
    ease: next.ease,
    intervalDays: next.intervalDays,
    reps: next.reps,
    lapses: next.lapses,
    dueAt: next.dueAt,
    lastGrade: judged.grade,
    lastGradeSource: "notes",
  }).where(eq(schema.cards.slug, slug));

  const s = await getSettings();
  if (s.telegramChatId) {
    await sendMessage(
      s.telegramChatId,
      `📝 <b>${esc(problem?.title ?? slug)}</b> regraded from your notes\n` +
        `Grade <b>${judged.grade}</b>/5 · next review in <b>${next.intervalDays}d</b>\n` +
        `<i>${esc(judged.summary)}</i>`,
    );
  }

  return NextResponse.json(
    { ok: true, regraded: true, grade: judged.grade, summary: judged.summary, intervalDays: next.intervalDays },
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
