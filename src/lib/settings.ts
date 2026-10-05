import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { decrypt } from "./crypto";
import type { Auth } from "./leetcode";

export type Settings = typeof schema.settings.$inferSelect;

export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(schema.settings).where(eq(schema.settings.id, 1));
  if (rows[0]) return rows[0];
  const [created] = await db.insert(schema.settings).values({ id: 1 }).returning();
  return created;
}

/** Debt never exceeds this many days of target; past that the nag is noise. */
export const MAX_DEBT_DAYS = 7;

/** Outstanding problems from missed days, capped so an old runaway value heals. */
export const debtOf = (s: Settings) => Math.min(Math.max(0, s.debt), s.dailyNewTarget * MAX_DEBT_DAYS);

/** Today's target: the day row's if one was sealed in, otherwise daily + debt — both capped. */
export function dailyTarget(s: Settings, row?: { targetCount: number } | null): number {
  const max = s.dailyNewTarget + s.dailyNewTarget * MAX_DEBT_DAYS;
  return Math.min(row?.targetCount ?? s.dailyNewTarget + debtOf(s), max);
}

export async function updateSettings(patch: Partial<Settings>) {
  await db.update(schema.settings).set(patch).where(eq(schema.settings.id, 1));
}

/** Decrypted LeetCode credentials, or null when we only have public access. */
export async function getAuth(s?: Settings): Promise<Auth> {
  const settings = s ?? (await getSettings());
  const session = decrypt(settings.sessionCookieEnc);
  const csrf = decrypt(settings.csrfTokenEnc);
  if (!session || !csrf) return null;
  return { session, csrf };
}
