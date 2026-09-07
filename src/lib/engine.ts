import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAuth, getSettings, updateSettings, type Settings } from "./settings";
import { recentSubmissions, submissionCode, problemUrl, cookieIsValid, isPremium } from "./leetcode";
import { inferGrade, schedule, GRADE_LABEL } from "./sm2";
import { generatePatternNote } from "./hints";
import { sendMessage, editMessage, esc, type Button } from "./telegram";
import { pickNext, dueCount, openAttempt } from "./queue";

const ESCALATION_HOURS = [9, 11, 13, 17];

async function log(kind: string, slug?: string, data?: Record<string, unknown>) {
  await db.insert(schema.events).values({ id: randomUUID(), at: new Date(), kind, slug, data });
}

const today = (s: Settings) => DateTime.now().setZone(s.timezone).toFormat("yyyy-LL-dd");

function attemptButtons(slug: string, attemptId: string): Button[][] {
  return [
    [{ text: "▶︎  Open problem", url: problemUrl(slug) }],
    [
      { text: "💡 Stuck", callback_data: `hint:${attemptId}` },
      { text: "⏭ Skip", callback_data: `skip:${attemptId}` },
    ],
  ];
}

/** Elapsed time minus whatever the timer was paused for. */
function workedSec(
  a: { pausedSec: number; pausedAt: Date | null },
  from: Date,
  to: Date,
): number {
  const paused = a.pausedSec + (a.pausedAt ? Math.floor((to.getTime() - a.pausedAt.getTime()) / 1000) : 0);
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000) - paused);
}

/** Push the next problem and open an attempt against it. */
export async function serveNext(prefix = ""): Promise<string | null> {
  const s = await getSettings();
  if (!s.telegramChatId) return null;
  if (await openAttempt()) return null; // one problem in flight at a time

  const pick = await pickNext();
  if (!pick) {
    await sendMessage(s.telegramChatId, "🎉 Queue empty — nothing due and no unlocked problems left.");
    return null;
  }

  const attemptId = randomUUID();
  await db.insert(schema.attempts).values({
    id: attemptId,
    slug: pick.slug,
    servedAt: new Date(),
    isReview: pick.isReview,
  });

  const tag = pick.isReview ? "🔁 Review" : "🆕 New";
  const body =
    `${prefix}${tag} · ${esc(pick.difficulty)}\n\n<b>${esc(pick.title)}</b>\n\n` +
    (pick.isReview ? "You solved this before. Attempt it blind first." : "");

  const msg = await sendMessage(s.telegramChatId, body, { buttons: attemptButtons(pick.slug, attemptId) });
  if (msg) await db.update(schema.attempts).set({ telegramMessageId: msg.message_id }).where(eq(schema.attempts.id, attemptId));

  await log("served", pick.slug, { isReview: pick.isReview });
  return attemptId;
}

/**
 * Poll LeetCode, close out any attempt that got accepted, infer its grade from
 * telemetry, and reschedule. This is what removes both the "mark done" tap and
 * the "how hard was it" tap.
 */
export async function syncSolves(): Promise<number> {
  const s = await getSettings();
  if (!s.leetcodeUsername) return 0;

  const auth = await getAuth(s);
  let subs;
  try {
    subs = await recentSubmissions(s.leetcodeUsername, 20, auth);
  } catch (e) {
    console.error("[sync] leetcode fetch failed:", e);
    return 0;
  }
  await updateSettings({ lastSyncAt: new Date() });

  const attempt = await openAttempt();
  if (!attempt) return 0;

  const servedSec = Math.floor(attempt.servedAt.getTime() / 1000);
  const mine = subs.filter((x) => x.titleSlug === attempt.slug && x.timestamp >= servedSec);
  const accepted = mine.find((x) => x.statusDisplay === "Accepted");
  if (!accepted) return 0;

  const failed = mine.filter(
    (x) => x.statusDisplay !== "Accepted" && x.timestamp <= accepted.timestamp,
  ).length;

  const solvedAt = new Date(accepted.timestamp * 1000);
  const startedAt = attempt.openedAt ?? attempt.servedAt;
  const durationSec = workedSec(attempt, startedAt, solvedAt);

  const [problem] = await db.select().from(schema.problems).where(eq(schema.problems.slug, attempt.slug));
  const [existing] = await db.select().from(schema.cards).where(eq(schema.cards.slug, attempt.slug));

  const grade = inferGrade({
    durationSec,
    failedSubmissions: failed,
    hintLevel: attempt.hintLevel,
    difficulty: problem?.difficulty ?? "Medium",
    isReview: attempt.isReview,
  });

  const next = schedule(
    {
      ease: existing?.ease ?? 2.5,
      intervalDays: existing?.intervalDays ?? 0,
      reps: existing?.reps ?? 0,
      lapses: existing?.lapses ?? 0,
    },
    grade,
    solvedAt,
  );

  // Best-effort enrichment: your own code plus a one-line pattern note.
  let code: string | null = null;
  let lang: string | null = null;
  let patternNote: string | null = existing?.patternNote ?? null;
  const detail = await submissionCode(accepted.id, auth);
  if (detail) {
    code = detail.code;
    lang = detail.lang;
    try {
      patternNote = (await generatePatternNote(problem?.title ?? attempt.slug, detail.code, detail.lang)) ?? patternNote;
    } catch (e) {
      console.error("[sync] pattern note failed:", e);
    }
  }

  const card = {
    slug: attempt.slug,
    state: next.state,
    ease: next.ease,
    intervalDays: next.intervalDays,
    reps: next.reps,
    lapses: next.lapses,
    dueAt: next.dueAt,
    lastGrade: grade,
    lastGradeSource: "inferred",
    lastSolvedAt: solvedAt,
    lastDurationSec: durationSec,
    lastFailedSubmissions: failed,
    lastHintLevel: attempt.hintLevel,
    preEase: existing?.ease ?? 2.5,
    preIntervalDays: existing?.intervalDays ?? 0,
    preReps: existing?.reps ?? 0,
    preLapses: existing?.lapses ?? 0,
    ...(code ? { code, lang } : {}),
    ...(patternNote ? { patternNote } : {}),
  };
  await db.insert(schema.cards).values(card).onConflictDoUpdate({ target: schema.cards.slug, set: card });
  await db.update(schema.attempts)
    .set({ solvedAt, failedSubmissions: failed })
    .where(eq(schema.attempts.id, attempt.id));

  // Resubmitting a problem you already finished today is not a second problem.
  const day = today(s);
  const alreadyToday =
    existing?.lastSolvedAt != null &&
    DateTime.fromJSDate(existing.lastSolvedAt).setZone(s.timezone).toFormat("yyyy-LL-dd") === day;
  await db.insert(schema.days)
    .values({
      day,
      targetCount: s.dailyNewTarget,
      solvedCount: alreadyToday ? 0 : 1,
      newCount: alreadyToday || attempt.isReview ? 0 : 1,
    })
    .onConflictDoUpdate({
      target: schema.days.day,
      set: {
        solvedCount: alreadyToday ? sql`${schema.days.solvedCount}` : sql`${schema.days.solvedCount} + 1`,
        newCount:
          alreadyToday || attempt.isReview
            ? sql`${schema.days.newCount}`
            : sql`${schema.days.newCount} + 1`,
      },
    });

  await notifySolved(
    s, problem?.title ?? attempt.slug, attempt.slug, grade, durationSec, failed,
    next.intervalDays, patternNote, problem?.tags ?? [],
  );
  await log("solved", attempt.slug, { grade, durationSec, failed, intervalDays: next.intervalDays });
  return 1;
}

/**
 * Close the open attempt by hand.
 *
 * The six Premium problems live on NeetCode, where LeetCode never sees a
 * submission — without this they could never be completed. Grade is inferred
 * from time and hints, with no failed-submission signal available.
 */
export async function manualSolve(opts: {
  failedSubmissions?: number;
  code?: string | null;
  lang?: string | null;
  source?: string;
  expectSlug?: string;
} = {}): Promise<string | null> {
  const s = await getSettings();
  let attempt = await openAttempt();

  // Solving counts whether or not the driver served it. If a report arrives for
  // some other problem — or with nothing in flight at all — open an attempt
  // retroactively so the solve still lands, just without a timing signal.
  if (opts.expectSlug && attempt?.slug !== opts.expectSlug) {
    const [p] = await db
      .select()
      .from(schema.problems)
      .where(eq(schema.problems.slug, opts.expectSlug));
    if (!p) return null;

    const id = randomUUID();
    const now = new Date();
    const [existingCard] = await db
      .select()
      .from(schema.cards)
      .where(eq(schema.cards.slug, opts.expectSlug));
    await db.insert(schema.attempts).values({
      id,
      slug: opts.expectSlug,
      servedAt: now,
      openedAt: now, // no real start time, so duration reads as ~0 and is ignored
      isReview: Boolean(existingCard),
    });
    [attempt] = await db.select().from(schema.attempts).where(eq(schema.attempts.id, id));
  }

  if (!attempt) return null;
  const failed = Math.max(0, opts.failedSubmissions ?? 0);

  const solvedAt = new Date();
  const startedAt = attempt.openedAt ?? attempt.servedAt;
  const durationSec = workedSec(attempt, startedAt, solvedAt);

  const [problem] = await db.select().from(schema.problems).where(eq(schema.problems.slug, attempt.slug));
  const [existing] = await db.select().from(schema.cards).where(eq(schema.cards.slug, attempt.slug));

  const grade = inferGrade({
    durationSec,
    failedSubmissions: failed,
    hintLevel: attempt.hintLevel,
    difficulty: problem?.difficulty ?? "Medium",
    isReview: attempt.isReview,
  });

  const next = schedule(
    {
      ease: existing?.ease ?? 2.5,
      intervalDays: existing?.intervalDays ?? 0,
      reps: existing?.reps ?? 0,
      lapses: existing?.lapses ?? 0,
    },
    grade,
    solvedAt,
  );

  let patternNote: string | null = existing?.patternNote ?? null;
  if (opts.code) {
    try {
      patternNote =
        (await generatePatternNote(problem?.title ?? attempt.slug, opts.code, opts.lang ?? "")) ?? patternNote;
    } catch (e) {
      console.error("[solve] pattern note failed:", e);
    }
  }

  // A resubmit opens its attempt retroactively, so duration and failure counts
  // are both zero — no signal. Overwriting a measured grade with that neutral
  // default loses the only real reading of the attempt, so keep what we had and
  // just refresh the code.
  const noSignal = durationSec === 0 && failed === 0;
  const keepGrade = noSignal && existing?.lastGrade != null;

  const card = {
    slug: attempt.slug,
    state: keepGrade ? existing.state : next.state,
    ease: keepGrade ? existing.ease : next.ease,
    intervalDays: keepGrade ? existing.intervalDays : next.intervalDays,
    reps: keepGrade ? existing.reps : next.reps,
    lapses: keepGrade ? existing.lapses : next.lapses,
    dueAt: keepGrade ? existing.dueAt : next.dueAt,
    lastGrade: keepGrade ? existing.lastGrade : grade,
    lastGradeSource: keepGrade ? existing.lastGradeSource : (opts.source ?? "manual"),
    lastSolvedAt: solvedAt,
    // Telemetry is what the note grader reads, so a signal-free resubmit must
    // not blank it — and the snapshot must not advance, or a later regrade
    // replays from the wrong base.
    lastDurationSec: keepGrade ? existing.lastDurationSec : durationSec,
    lastFailedSubmissions: keepGrade ? existing.lastFailedSubmissions : failed,
    lastHintLevel: keepGrade ? existing.lastHintLevel : attempt.hintLevel,
    preEase: keepGrade ? existing.preEase : (existing?.ease ?? 2.5),
    preIntervalDays: keepGrade ? existing.preIntervalDays : (existing?.intervalDays ?? 0),
    preReps: keepGrade ? existing.preReps : (existing?.reps ?? 0),
    preLapses: keepGrade ? existing.preLapses : (existing?.lapses ?? 0),
    ...(opts.code ? { code: opts.code, lang: opts.lang ?? null } : {}),
    ...(patternNote ? { patternNote } : {}),
  };
  await db.insert(schema.cards).values(card).onConflictDoUpdate({ target: schema.cards.slug, set: card });
  await db.update(schema.attempts).set({ solvedAt, failedSubmissions: failed }).where(eq(schema.attempts.id, attempt.id));

  // Resubmitting a problem you already finished today is not a second problem.
  const day = today(s);
  const alreadyToday =
    existing?.lastSolvedAt != null &&
    DateTime.fromJSDate(existing.lastSolvedAt).setZone(s.timezone).toFormat("yyyy-LL-dd") === day;
  await db.insert(schema.days)
    .values({
      day,
      targetCount: s.dailyNewTarget,
      solvedCount: alreadyToday ? 0 : 1,
      newCount: alreadyToday || attempt.isReview ? 0 : 1,
    })
    .onConflictDoUpdate({
      target: schema.days.day,
      set: {
        solvedCount: alreadyToday ? sql`${schema.days.solvedCount}` : sql`${schema.days.solvedCount} + 1`,
        newCount:
          alreadyToday || attempt.isReview
            ? sql`${schema.days.newCount}`
            : sql`${schema.days.newCount} + 1`,
      },
    });

  const shownGrade = keepGrade ? existing.lastGrade! : grade;
  const shownInterval = keepGrade ? existing.intervalDays : next.intervalDays;
  await notifySolved(
    s, problem?.title ?? attempt.slug, attempt.slug, shownGrade, durationSec, failed,
    shownInterval, patternNote, problem?.tags ?? [],
  );
  await log("solved", attempt.slug, {
    grade: shownGrade, durationSec, failed, source: opts.source ?? "manual", kept: keepGrade,
  });
  return problem?.title ?? attempt.slug;
}

async function notifySolved(
  s: Settings, title: string, slug: string, grade: number,
  durationSec: number, failed: number, intervalDays: number, note: string | null,
  tags: string[] = [],
) {
  if (!s.telegramChatId) return;
  const mins = Math.round(durationSec / 60);
  const nextOn = DateTime.now().setZone(s.timezone).plus({ days: intervalDays }).toFormat("LLL d");
  const text =
    `✅ <b>${esc(title)}</b>\n\n` +
    `${mins}m · ${failed} failed submission${failed === 1 ? "" : "s"} · graded <b>${GRADE_LABEL[grade]}</b>\n` +
    `Next review: <b>${nextOn}</b> (${intervalDays}d)\n` +
    // Prefer the note about *your* solution; fall back to the canonical tags.
    (note ? `\n<i>${esc(note)}</i>` : tags.length ? `\n<i>${esc(tags.join(" · "))}</i>` : "");
  await sendMessage(s.telegramChatId, text, {
    buttons: [[
      { text: "Too hard", callback_data: `rate:${slug}:2` },
      { text: "Too easy", callback_data: `rate:${slug}:5` },
    ]],
  });
}

/** 25 minutes into an unsolved attempt, offer the ladder instead of letting you grind. */
async function rescueCheck(s: Settings) {
  const attempt = await openAttempt();
  if (!attempt || attempt.rescueSentAt || !s.telegramChatId) return;
  const elapsedMin = (Date.now() - (attempt.openedAt ?? attempt.servedAt).getTime()) / 60000;
  if (elapsedMin < s.rescueAfterMin) return;

  await db.update(schema.attempts).set({ rescueSentAt: new Date() }).where(eq(schema.attempts.id, attempt.id));
  await sendMessage(
    s.telegramChatId,
    `⏱ ${Math.round(elapsedMin)} minutes on this one.\n\nGrinding past here has poor returns. Take a hint — it costs you a fraction of a grade, not the problem.`,
    { buttons: [[{ text: "💡 Give me a hint", callback_data: `hint:${attempt.id}` }]] },
  );
  await log("rescue_offered", attempt.slug, { elapsedMin });
}

const TIER_COPY = [
  (n: number) => `${n} due today. Starting now:`,
  (n: number) => `Still ${n} due. This is reminder 2.`,
  (n: number) => `⚠️ ${n} due, nothing done. Debt accrues at midnight.`,
  (n: number) => `🚨 Last call — ${n} due. Skip and tomorrow's queue grows.`,
];

/** Escalation ladder: louder each tier, and unmet days compound into debt. */
async function escalate(s: Settings) {
  if (!s.telegramChatId || s.paused) return;
  const now = DateTime.now().setZone(s.timezone);
  const day = today(s);

  const [row] = await db.select().from(schema.days).where(eq(schema.days.day, day));
  const target = s.dailyNewTarget + s.debt;
  if (!row) {
    await db.insert(schema.days).values({ day, targetCount: target, debtAtStart: s.debt }).onConflictDoNothing();
  }
  const solved = row?.newCount ?? 0;
  const tierSent = row?.tierSent ?? 0;
  if (solved >= target) return;

  const tier = ESCALATION_HOURS.filter((h) => now.hour >= h).length;
  if (tier === 0) return;
  const n = Math.max(target - solved, await dueCount());

  if (tier > tierSent) {
    await db.update(schema.days).set({ tierSent: tier, lastNagAt: new Date() }).where(eq(schema.days.day, day));
    await sendMessage(s.telegramChatId, TIER_COPY[tier - 1](n), { silent: tier === 1 && now.hour < 9 });
    await serveNext();
    await log("escalated", undefined, { tier, target, solved });
    return;
  }

  // Past the last tier the ladder stops climbing, so it starts repeating instead.
  // There is no snooze: solving is the only thing that stops it.
  if (!s.relentless || tier < ESCALATION_HOURS.length) return;
  const lastNag = row?.lastNagAt?.getTime() ?? 0;
  if (Date.now() - lastNag < s.relentlessEveryMin * 60_000) return;

  await db.update(schema.days).set({ lastNagAt: new Date() }).where(eq(schema.days.day, day));
  await sendMessage(
    s.telegramChatId,
    `🔁 Still ${n} unsolved. I'll keep asking every ${s.relentlessEveryMin} minutes until you do one.`,
  );
  await log("relentless", undefined, { n, target, solved });
}

/** At quiet hours: bank the streak or convert the shortfall into debt. */
async function closeDay(s: Settings) {
  // Close the day that has actually ended. Sealing at the start of quiet hours
  // ended the day at 22:00: the streak reset and debt was charged while there
  // were still hours left to solve in, and nothing solved after counted.
  const now = DateTime.now().setZone(s.timezone);
  const day = now.minus({ days: 1 }).toFormat("yyyy-LL-dd");
  const [row] = await db.select().from(schema.days).where(eq(schema.days.day, day));
  if (!row || row.closed) return;

  const met = row.newCount >= row.targetCount;
  const debt = met ? Math.max(0, s.debt - 1) : s.debt + (row.targetCount - row.newCount);
  const streak = met ? s.streak + 1 : 0;

  await db.update(schema.days).set({ closed: true }).where(eq(schema.days.day, day));
  await updateSettings({ debt, streak });

  if (s.telegramChatId) {
    await sendMessage(
      s.telegramChatId,
      met
        ? `🌙 Day closed. ${row.newCount}/${row.targetCount} new (${row.solvedCount} solved in all). Streak: <b>${streak}</b>.`
        : `🌙 Day closed. ${row.newCount}/${row.targetCount} new (${row.solvedCount} solved in all). Streak reset. Debt now <b>${debt}</b> — tomorrow's target is ${s.dailyNewTarget + debt}.`,
      { silent: true },
    );
  }
  await log("day_closed", undefined, { met, debt, streak });
}

/** Warn once when the stored cookie stops working. */
async function cookieCheck(s: Settings) {
  const auth = await getAuth(s);
  if (!auth || !s.telegramChatId) return;
  if (await cookieIsValid(auth)) return;
  await updateSettings({ sessionCookieEnc: null, csrfTokenEnc: null });
  await sendMessage(s.telegramChatId, "🔑 LeetCode session expired. Visit leetcode.com once with the userscript installed and it will refresh itself.");
  await log("cookie_expired");
}

/** Single cron entry point. Every step is independently guarded. */
export async function tick() {
  const s = await getSettings();
  const now = DateTime.now().setZone(s.timezone);
  const quiet = now.hour >= s.quietStartHour || now.hour < s.quietEndHour;

  for (const [name, fn] of [
    ["sync", () => syncSolves()],
    ["rescue", () => (quiet ? Promise.resolve() : rescueCheck(s))],
    ["escalate", () => (quiet ? Promise.resolve() : escalate(s))],
    ["closeDay", () => closeDay(s)],
  ] as const) {
    try {
      await fn();
    } catch (e) {
      console.error(`[tick:${name}]`, e);
    }
  }
}

/** Hourly: cheap enough to check the cookie once an hour, not every tick. */
export async function hourly() {
  try {
    await cookieCheck(await getSettings());
  } catch (e) {
    console.error("[hourly]", e);
  }
}
