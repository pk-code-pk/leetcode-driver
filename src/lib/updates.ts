import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings, updateSettings } from "@/lib/settings";
import { answerCallback, sendMessage, esc } from "@/lib/telegram";
import { getHint } from "@/lib/hints";
import { serveNext, manualSolve } from "@/lib/engine";
import { schedule } from "@/lib/sm2";
import { dueCount } from "@/lib/queue";

export type Update = {
  message?: { chat: { id: number }; text?: string };
  callback_query?: { id: string; data?: string; message?: { chat: { id: number } } };
};

/** Shared by the webhook route and the local long-polling loop. */
export async function handleUpdate(update: Update) {
  try {
    if (update.callback_query) await onCallback(update.callback_query);
    else if (update.message) await onMessage(update.message);
  } catch (e) {
    console.error("[telegram] update failed:", e);
  }
}

async function onCallback(cb: NonNullable<Update["callback_query"]>) {
  const s = await getSettings();
  const from = String(cb.message?.chat.id ?? "");
  // Bot usernames are searchable, so anyone could otherwise drive this instance.
  if (s.telegramChatId && from && from !== s.telegramChatId) {
    await answerCallback(cb.id, "Not your driver.");
    return;
  }
  const [action, ...rest] = (cb.data ?? "").split(":");
  const chatId = s.telegramChatId ?? from;

  if (action === "hint") {
    const [attemptId] = rest;
    const [attempt] = await db.select().from(schema.attempts).where(eq(schema.attempts.id, attemptId));
    if (!attempt) return answerCallback(cb.id, "That attempt is closed.");

    const level = attempt.hintLevel + 1;
    if (level > 4) return answerCallback(cb.id, "No hints left on this one.");
    await answerCallback(cb.id, `Hint ${level}…`);
    await db.update(schema.attempts).set({ hintLevel: level }).where(eq(schema.attempts.id, attemptId));

    const [problem] = await db.select().from(schema.problems).where(eq(schema.problems.slug, attempt.slug));
    const hint = await getHint({
      title: problem?.title ?? attempt.slug,
      slug: attempt.slug,
      level,
      officialHints: problem?.officialHints ?? [],
      tags: problem?.tags ?? [],
    });

    const LABEL = { official: "LeetCode", generated: "", tags: "tags", link: "" } as const;
    const badge = LABEL[hint.source] ? ` · <i>${LABEL[hint.source]}</i>` : "";
    const body = hint.html ? hint.text : esc(hint.text);
    const deeper = level < 4 && hint.source !== "link";

    await sendMessage(chatId, `💡 <b>Hint ${level}/4</b>${badge}\n\n${body}`, {
      buttons: deeper ? [[{ text: "Still stuck — go deeper", callback_data: `hint:${attemptId}` }]] : undefined,
    });
    return;
  }

  if (action === "skip") {
    const [attemptId] = rest;
    await db.update(schema.attempts).set({ abandoned: true }).where(eq(schema.attempts.id, attemptId));
    await answerCallback(cb.id, "Skipped.");
    await serveNext("Skipped. Next up:\n\n");
    return;
  }

  if (action === "rate") {
    // Manual override of an inferred grade.
    const [slug, gradeStr] = rest;
    const grade = Number(gradeStr);
    const [card] = await db.select().from(schema.cards).where(eq(schema.cards.slug, slug));
    if (!card) return answerCallback(cb.id, "No card for that problem.");

    const next = schedule(
      { ease: card.ease, intervalDays: card.intervalDays, reps: card.reps, lapses: card.lapses },
      grade,
      new Date(),
    );
    await db.update(schema.cards)
      .set({ ...next, lastGrade: grade, lastGradeSource: "manual" })
      .where(eq(schema.cards.slug, slug));
    await answerCallback(cb.id, `Rescheduled: ${next.intervalDays}d`);
    return;
  }
}

async function onMessage(msg: NonNullable<Update["message"]>) {
  const chatId = String(msg.chat.id);
  const text = (msg.text ?? "").trim().toLowerCase();
  const s = await getSettings();

  // First contact binds the bot to this chat; everyone after that is a stranger.
  if (!s.telegramChatId) {
    await updateSettings({ telegramChatId: chatId });
  } else if (chatId !== s.telegramChatId) {
    await sendMessage(chatId, "This driver is already bound to someone else.");
    return;
  }

  if (text.startsWith("/start")) {
    await sendMessage(chatId, "Connected. I'll push problems on schedule.\n\n/next — serve one now\n/solved — mark the open one done\n/status — where you stand\n/pause · /resume");
    return;
  }
  if (text.startsWith("/next")) { await serveNext(); return; }
  // The six Premium problems live on NeetCode, where no LeetCode submission
  // exists to detect — this is the only way to close them.
  if (text.startsWith("/solved") || text.startsWith("/done")) {
    const title = await manualSolve();
    if (!title) await sendMessage(chatId, "Nothing open. /next to start one.");
    return;
  }
  if (text.startsWith("/pause")) { await updateSettings({ paused: true }); await sendMessage(chatId, "Paused. /resume when ready."); return; }
  if (text.startsWith("/resume")) { await updateSettings({ paused: false }); await sendMessage(chatId, "Resumed."); return; }
  if (text.startsWith("/status")) {
    const due = await dueCount();
    await sendMessage(chatId, `Due now: <b>${due}</b>\nStreak: <b>${s.streak}</b>\nDebt: <b>${s.debt}</b>\nTarget/day: ${s.dailyNewTarget + s.debt}${s.paused ? "\n\n⏸ Paused" : ""}`);
  }
}
