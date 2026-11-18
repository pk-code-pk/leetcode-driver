"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { applications, bookings, jobs, reports, reviews, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { appUrl } from "@/lib/config";
import { FILLED_STATUSES, releaseBooking, syncJobStatus } from "@/lib/bookings";
import { sendEmail } from "@/lib/email";
import { notifyMatchingStudents } from "@/lib/jobFlow";
import { formatRate, parseDollars, rateError } from "@/lib/money";
import { cancelPayment } from "@/lib/payments";
import type { FormState } from "@/components/forms";

const str = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

export async function reviewJob(_: FormState, data: FormData): Promise<FormState> {
  await requireUser("admin");
  const [job] = await db.select().from(jobs).where(eq(jobs.id, str(data, "jobId"))).limit(1);
  if (!job || job.status !== "pending_review") return { error: "This job isn't waiting for review." };
  const [resident] = await db.select().from(users).where(eq(users.id, job.residentId)).limit(1);
  const note = str(data, "note");

  if (str(data, "decision") === "reject") {
    if (!note) return { error: "Add a short note so the resident knows why." };
    await db.update(jobs).set({ status: "cancelled", adminNote: note }).where(eq(jobs.id, job.id));
    await sendEmail({
      to: resident.email,
      subject: `About your job "${job.title}"`,
      body: `Hi ${resident.firstName},\n\nWe weren't able to post "${job.title}".\n\n${note}\n\nReply to this email if you have questions.`,
    });
    revalidatePath("/admin/jobs");
    return { notice: "Job declined and the resident was emailed." };
  }

  let rateCents = job.rateCents;
  const rateInput = str(data, "rate");
  if (rateInput) {
    rateCents = parseDollars(rateInput);
    if (rateCents == null) return { error: "Enter the rate as a dollar amount." };
    const err = rateError(rateCents);
    if (err) return { error: err };
  }
  if (rateCents == null) return { error: "Suggest an hourly rate before approving." };

  await db.update(jobs).set({ status: "open", rateCents, adminNote: note, reviewReasons: [] }).where(eq(jobs.id, job.id));
  await sendEmail({
    to: resident.email,
    subject: `Your job "${job.title}" is live`,
    body: `Hi ${resident.firstName},\n\n"${job.title}" is now posted at ${formatRate(rateCents)}.${
      job.rateCents == null ? " We suggested that rate based on similar jobs nearby." : ""
    }${note ? `\n\n${note}` : ""}\n\nStudents can apply now: ${appUrl()}/resident/jobs/${job.id}`,
  });
  await notifyMatchingStudents(job.id);
  revalidatePath("/admin/jobs");
  return { notice: "Approved. Students can now apply." };
}

export async function setSuspended(_: FormState, data: FormData): Promise<FormState> {
  const admin = await requireUser("admin");
  const userId = str(data, "userId");
  if (userId === admin.id) return { error: "You can't pause your own account." };
  const suspend = str(data, "suspend") === "1";
  const reason = str(data, "reason");
  if (suspend && !reason) return { error: "Add a reason, which the person will see." };
  await db
    .update(users)
    .set({ suspendedAt: suspend ? new Date() : null, suspendedReason: suspend ? reason : null })
    .where(eq(users.id, userId));
  revalidatePath("/admin/users");
  return { notice: suspend ? "Account paused." : "Account restored." };
}

export async function resolveReport(_: FormState, data: FormData): Promise<FormState> {
  await requireUser("admin");
  await db
    .update(reports)
    .set({ status: "resolved", adminNote: str(data, "note") })
    .where(eq(reports.id, str(data, "reportId")));
  revalidatePath("/admin/reports");
  return { notice: "Marked as resolved." };
}

export async function resolveDispute(_: FormState, data: FormData): Promise<FormState> {
  await requireUser("admin");
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, str(data, "bookingId"))).limit(1);
  if (!booking || booking.status !== "disputed") return { error: "This booking isn't in dispute." };

  if (str(data, "decision") === "release") {
    await releaseBooking(booking.id, "admin");
    revalidatePath("/admin");
    return { notice: "Payment released to the student." };
  }
  await cancelPayment(booking.paymentRef);
  await db
    .update(bookings)
    .set({ status: "cancelled", cancelledBy: "admin", cancelledAt: new Date() })
    .where(eq(bookings.id, booking.id));
  // Close the job unless other students on it are still booked or paid.
  const others = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.jobId, booking.jobId), inArray(bookings.status, [...FILLED_STATUSES])));
  if (others.length === 0) await db.update(jobs).set({ status: "cancelled" }).where(eq(jobs.id, booking.jobId));
  else await syncJobStatus(booking.jobId);
  revalidatePath("/admin");
  return { notice: "Hold released. The resident was not charged." };
}

export async function toggleRecommended(_: FormState, data: FormData): Promise<FormState> {
  await requireUser("admin");
  const [app] = await db.select().from(applications).where(eq(applications.id, str(data, "applicationId"))).limit(1);
  if (!app) return { error: "Application not found." };
  await db.update(applications).set({ recommended: !app.recommended }).where(eq(applications.id, app.id));
  revalidatePath(`/admin/jobs/${app.jobId}`);
  return {};
}

export async function removeReview(_: FormState, data: FormData): Promise<FormState> {
  await requireUser("admin");
  await db
    .update(reviews)
    .set({ removedAt: new Date() })
    .where(and(eq(reviews.id, str(data, "reviewId"))));
  revalidatePath("/admin/users");
  return { notice: "Review removed." };
}
