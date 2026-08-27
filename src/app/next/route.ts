import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { problemUrl } from "@/lib/leetcode";
import { openAttempt, pickNext } from "@/lib/queue";
import { serveNext } from "@/lib/engine";

export const dynamic = "force-dynamic";

/**
 * The entire interface: one bookmark that redirects straight to whatever you
 * should be solving. Never renders a page, never asks you to choose.
 */
export async function GET() {
  const existing = await openAttempt();
  if (existing) {
    if (!existing.openedAt) {
      // First open starts the clock the rescue timer and grading read from.
      await db.update(schema.attempts).set({ openedAt: new Date() }).where(eq(schema.attempts.id, existing.id));
    }
    return NextResponse.redirect(problemUrl(existing.slug), 302);
  }

  const pick = await pickNext();
  if (!pick) return NextResponse.json({ message: "Nothing due. Queue is empty." });

  await serveNext();
  const opened = await openAttempt();
  if (opened) await db.update(schema.attempts).set({ openedAt: new Date() }).where(eq(schema.attempts.id, opened.id));
  return NextResponse.redirect(problemUrl(pick.slug), 302);
}
