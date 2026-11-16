import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, reviews, users } from "@/db/schema";
import { REVIEW_BLIND_DAYS, adminEmails } from "./config";
import { averageRating } from "./reviews";

export type RatingSummary = { average: number | null; count: number };

// A review counts once the other side has also reviewed, or the blind window has passed.
const visibleReview = sql`(
  exists (select 1 from ${reviews} r2 where r2.booking_id = ${reviews.bookingId} and r2.author_id <> ${reviews.authorId})
  or ${bookings.releasedAt} < now() - make_interval(days => ${REVIEW_BLIND_DAYS})
)`;

export async function visibleReviewsFor(subjectIds: string[]) {
  if (!subjectIds.length) return [];
  return db
    .select({
      id: reviews.id,
      subjectId: reviews.subjectId,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      authorFirstName: users.firstName,
    })
    .from(reviews)
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .innerJoin(users, eq(users.id, reviews.authorId))
    .where(and(inArray(reviews.subjectId, subjectIds), isNull(reviews.removedAt), visibleReview))
    .orderBy(sql`${reviews.createdAt} desc`);
}

export async function ratingsFor(subjectIds: string[]): Promise<Map<string, RatingSummary>> {
  const rows = await visibleReviewsFor(subjectIds);
  const out = new Map<string, RatingSummary>();
  for (const id of subjectIds) {
    const mine = rows.filter((r) => r.subjectId === id).map((r) => r.rating);
    out.set(id, { average: averageRating(mine), count: mine.length });
  }
  return out;
}

export async function completedJobCounts(studentIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>(studentIds.map((id) => [id, 0]));
  if (!studentIds.length) return out;
  const rows = await db
    .select({ studentId: bookings.studentId, n: sql<number>`count(*)::int` })
    .from(bookings)
    .where(and(inArray(bookings.studentId, studentIds), eq(bookings.status, "completed")))
    .groupBy(bookings.studentId);
  for (const r of rows) out.set(r.studentId, r.n);
  return out;
}

/** Where staff notifications go: every admin account, plus the configured admin emails. */
export async function staffEmails(): Promise<string[]> {
  const admins = await db.select({ email: users.email }).from(users).where(eq(users.role, "admin"));
  return [...new Set([...admins.map((a) => a.email), ...adminEmails()])];
}

export function fullName(u: { firstName: string; lastName: string }): string {
  return `${u.firstName} ${u.lastName}`.trim();
}

/** Residents see a student's first name and last initial until they've booked them. */
export function publicName(u: { firstName: string; lastName: string }): string {
  return u.lastName ? `${u.firstName} ${u.lastName[0]}.` : u.firstName;
}
