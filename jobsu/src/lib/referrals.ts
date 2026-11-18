import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

export const REF_COOKIE = "jobsu_ref";

/** The user's referral code, made on first use, e.g. "sarah-k3x9". */
export async function referralCodeFor(user: User): Promise<string> {
  if (user.referralCode) return user.referralCode;
  const base = user.firstName.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12) || "jobsu";
  for (let i = 0; i < 5; i++) {
    const code = `${base}-${randomBytes(3).toString("hex").slice(0, 4)}`;
    const updated = await db
      .update(users)
      .set({ referralCode: code })
      .where(sql`${users.id} = ${user.id} and ${users.referralCode} is null and not exists (select 1 from users u where u.referral_code = ${code})`)
      .returning({ code: users.referralCode });
    if (updated.length) return code;
  }
  const [row] = await db.select({ code: users.referralCode }).from(users).where(eq(users.id, user.id)).limit(1);
  return row?.code ?? "";
}

export async function referralCount(userId: string): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(users).where(eq(users.referredBy, userId));
  return row?.n ?? 0;
}

/** Who referred the person signing up, from the cookie set by /r/[code]. */
export async function referrerFromCookie(): Promise<string | null> {
  const code = (await cookies()).get(REF_COOKIE)?.value;
  if (!code || !/^[a-z]+-[0-9a-f]{4}$/.test(code)) return null;
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, code)).limit(1);
  return row?.id ?? null;
}
