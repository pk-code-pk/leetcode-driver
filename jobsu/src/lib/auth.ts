import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual, randomInt } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt, isNull, desc } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, verificationCodes, type Role, type User } from "@/db/schema";
import { SESSION_DAYS, VERIFICATION_CODE_MINUTES } from "./config";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = "jobsu_session";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(sessions).values({ tokenHash: sha256(token), userId, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.APP_URL?.startsWith("http://"),
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  jar.delete(COOKIE);
}

/** The signed-in user for this request, or null. */
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
});

export function homeFor(role: Role): string {
  return role === "admin" ? "/admin" : role === "student" ? "/student/jobs" : "/resident/jobs";
}

/** Require a signed-in, verified, non-suspended user; optionally of a given role. */
export async function requireUser(role?: Role | Role[]): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/log-in");
  if (user.suspendedAt) redirect("/suspended");
  if (!user.emailVerifiedAt) redirect("/verify");
  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role)) redirect(homeFor(user.role));
  }
  return user;
}

export async function issueVerificationCode(userId: string): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(verificationCodes).values({
    userId,
    codeHash: sha256(code),
    expiresAt: new Date(Date.now() + VERIFICATION_CODE_MINUTES * 60_000),
  });
  return code;
}

export type CodeResult = "ok" | "wrong" | "expired" | "too_many";

export async function checkVerificationCode(userId: string, code: string): Promise<CodeResult> {
  const [latest] = await db
    .select()
    .from(verificationCodes)
    .where(and(eq(verificationCodes.userId, userId), isNull(verificationCodes.usedAt)))
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1);
  if (!latest || latest.expiresAt < new Date()) return "expired";
  if (latest.attempts >= 5) return "too_many";
  if (latest.codeHash !== sha256(code.trim())) {
    await db.update(verificationCodes).set({ attempts: latest.attempts + 1 }).where(eq(verificationCodes.id, latest.id));
    return "wrong";
  }
  await db.update(verificationCodes).set({ usedAt: new Date() }).where(eq(verificationCodes.id, latest.id));
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId));
  return "ok";
}
