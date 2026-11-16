import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bookings, jobs, users } from "@/db/schema";
import { autoReleaseDue, todayISO } from "./dates";
import { sendEmail } from "./email";
import { formatCents, settle } from "./money";
import { capturePayment } from "./payments";
import { appUrl } from "./config";

export type ReleaseKind = "confirmed" | "auto" | "admin";

/**
 * Capture the payment for a finished job and pay the student.
 * Safe to call twice: a booking that is already released is left alone.
 */
export async function releaseBooking(bookingId: string, kind: ReleaseKind): Promise<boolean> {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) return false;
  if (!["authorized", "completed_pending", "disputed"].includes(booking.status)) return false;
  if (booking.status === "disputed" && kind !== "admin") return false;

  const minutes = booking.actualMinutes ?? booking.estMinutes;
  const s = settle(booking.rateCents, minutes, booking.authorizedCents);
  if (booking.paymentRef) await capturePayment(booking.paymentRef, s.amountCents, s.feeCents);

  const now = new Date();
  await db
    .update(bookings)
    .set({
      status: "completed",
      actualMinutes: minutes,
      releasedAt: now,
      releaseKind: kind,
      residentConfirmedAt: kind === "confirmed" ? now : booking.residentConfirmedAt,
      amountCents: s.amountCents,
      feeCents: s.feeCents,
      payoutCents: s.payoutCents,
    })
    .where(eq(bookings.id, bookingId));
  await db.update(jobs).set({ status: "completed" }).where(eq(jobs.id, booking.jobId));

  const people = await db.select().from(users).where(inArray(users.id, [booking.residentId, booking.studentId]));
  const resident = people.find((u) => u.id === booking.residentId);
  const student = people.find((u) => u.id === booking.studentId);
  const [job] = await db.select().from(jobs).where(eq(jobs.id, booking.jobId)).limit(1);
  if (student) {
    await sendEmail({
      to: student.email,
      subject: `You've been paid ${formatCents(s.payoutCents)} for "${job.title}"`,
      body: `Hi ${student.firstName},\n\nPayment for "${job.title}" was released. Job total ${formatCents(s.amountCents)}, JobsU fee ${formatCents(s.feeCents)}, your payout ${formatCents(s.payoutCents)}.\n\nPlease leave a rating: ${appUrl()}/student/jobs/${job.id}`,
    });
  }
  if (resident) {
    await sendEmail({
      to: resident.email,
      subject: `Receipt for "${job.title}": ${formatCents(s.amountCents)}`,
      body: `Hi ${resident.firstName},\n\nYou were charged ${formatCents(s.amountCents)} for "${job.title}"${
        kind === "auto" ? " (released automatically 7 days after the job date)" : ""
      }.\n\nPlease leave a rating: ${appUrl()}/resident/jobs/${job.id}`,
    });
  }
  return true;
}

/**
 * Release every booking whose job date is at least 7 days past and has no open
 * dispute (Terms §9). Returns the ids that were released.
 */
export async function runAutoRelease(today = todayISO()): Promise<string[]> {
  const candidates = await db
    .select({ id: bookings.id, scheduledFor: bookings.scheduledFor })
    .from(bookings)
    .where(and(inArray(bookings.status, ["authorized", "completed_pending"])));
  const released: string[] = [];
  for (const b of candidates) {
    if (!autoReleaseDue(b.scheduledFor, today)) continue;
    if (await releaseBooking(b.id, "auto")) released.push(b.id);
  }
  return released;
}
