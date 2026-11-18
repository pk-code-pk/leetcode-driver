"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  applications,
  bookings,
  conversations,
  jobs,
  residentProfiles,
  studentProfiles,
  users,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { TOWNS, appUrl } from "@/lib/config";
import { todayISO, formatDate } from "@/lib/dates";
import { sendEmail, sendMany } from "@/lib/email";
import { JOB_TYPE_SLUGS, TIMINGS, TRANSPORT, jobType, prohibitedReasons } from "@/lib/jobTypes";
import { formatCents, formatRate, jobTotalCents, parseDollars, rateError } from "@/lib/money";
import { authorizePayment, cancelPayment, paymentsProvider } from "@/lib/payments";
import { FILLED_STATUSES, releaseBooking, syncJobStatus } from "@/lib/bookings";
import { publicName, staffEmails } from "@/lib/queries";
import { confirmBooking, notifyMatchingStudents } from "@/lib/jobFlow";
import { savePhotoFromForm } from "@/lib/photos";
import type { FormState } from "@/components/forms";

const str = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

export async function createJob(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser("resident");
  const [profile] = await db.select().from(residentProfiles).where(eq(residentProfiles.userId, user.id)).limit(1);

  const type = str(data, "type");
  const title = str(data, "title");
  const description = str(data, "description");
  const town = str(data, "town") || profile?.town || "";
  const timing = str(data, "timing");
  const startDate = str(data, "startDate");
  const hours = parseFloat(str(data, "hours"));
  const notSure = data.get("rateNotSure") === "on";
  const studentsNeeded = Math.min(6, Math.max(1, parseInt(str(data, "studentsNeeded") || "1", 10) || 1));
  const transport = TRANSPORT.some((t) => t.slug === str(data, "transport")) ? str(data, "transport") : "";

  if (!JOB_TYPE_SLUGS.includes(type)) return { error: "Please choose what kind of job this is." };
  if (title.length < 4) return { error: "Please give the job a short title." };
  if (description.length < 15) return { error: "Please describe the job in a sentence or two." };
  if (!TOWNS.includes(town as (typeof TOWNS)[number])) return { error: "Please choose your town." };
  if (!TIMINGS.some((t) => t.slug === timing)) return { error: "Please choose how often you need help." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || startDate < todayISO()) {
    return { error: "Please choose a start date that is today or later." };
  }
  if (!Number.isFinite(hours) || hours < 0.5 || hours > 12) {
    return { error: "Please enter how long the job should take, between 0.5 and 12 hours." };
  }

  let rateCents: number | null = null;
  if (!notSure) {
    rateCents = parseDollars(str(data, "rate"));
    if (rateCents == null) return { error: "Please enter an hourly rate, or tick \"Not sure\" and we'll suggest one." };
    const err = rateError(rateCents);
    if (err) return { error: err };
  }

  const answers: Record<string, string> = {};
  for (const q of jobType(type).questions) {
    const v = str(data, `q_${q.key}`);
    if (v) answers[q.key] = v;
  }

  const reasons = prohibitedReasons(`${title} ${description} ${Object.values(answers).join(" ")}`).map(
    (r) => `May involve ${r}`,
  );
  if (rateCents == null) reasons.unshift("Needs a suggested rate");
  const status = reasons.length ? "pending_review" : "open";

  const [job] = await db
    .insert(jobs)
    .values({
      residentId: user.id,
      type,
      title,
      description,
      answers,
      town,
      landmark: str(data, "landmark") || profile?.landmark || "",
      timing,
      startDate,
      startTime: str(data, "startTime"),
      estMinutes: Math.round(hours * 60),
      rateCents,
      studentsNeeded,
      transport,
      status,
      reviewReasons: reasons,
    })
    .returning();

  if (status === "open") await notifyMatchingStudents(job.id);
  // "Hire again": let the student from an earlier job know this one is for them.
  const invite = str(data, "invite");
  if (/^[0-9a-f-]{36}$/.test(invite)) {
    const [past] = await db
      .select({ student: users })
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.studentId))
      .where(and(eq(bookings.residentId, user.id), eq(bookings.studentId, invite), eq(bookings.status, "completed")))
      .limit(1);
    if (past) {
      await sendEmail({
        to: past.student.email,
        subject: `${user.firstName} wants to hire you again`,
        body: `Hi ${past.student.firstName},\n\n${user.firstName} in ${town} posted "${title}" and would love to have you back.${
          status === "open" ? ` Apply here: ${appUrl()}/student/jobs/${job.id}` : " It goes live after a quick review, and we'll send you the link."
        }`,
      });
    }
  }
  else {
    await sendMany(
      (await staffEmails()).map((to) => ({
        to,
        subject: `Job needs review: ${title}`,
        body: `${user.firstName} in ${town} posted "${title}".\n\n${reasons.join("\n")}\n\nReview it: ${appUrl()}/admin/jobs`,
      })),
    );
  }
  redirect(`/resident/jobs/${job.id}?posted=1`);
}

export async function cancelJob(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser("resident");
  const jobId = str(data, "jobId");
  const [job] = await db.select().from(jobs).where(and(eq(jobs.id, jobId), eq(jobs.residentId, user.id))).limit(1);
  if (!job) return { error: "We couldn't find that job." };
  if (job.status === "completed" || job.status === "cancelled") return { error: "This job is already closed." };

  const live = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.jobId, job.id), inArray(bookings.status, ["authorized", "completed_pending", "disputed"])));
  if (live.some((b) => b.status !== "authorized")) {
    return { error: "A student has marked this job done. Confirm it or raise a problem instead of cancelling." };
  }
  for (const booking of live) {
    await cancelPayment(booking.paymentRef);
    await db
      .update(bookings)
      .set({ status: "cancelled", cancelledBy: "resident", cancelledAt: new Date() })
      .where(eq(bookings.id, booking.id));
    const [student] = await db.select().from(users).where(eq(users.id, booking.studentId)).limit(1);
    await sendEmail({
      to: student.email,
      subject: `Cancelled: ${job.title}`,
      body: `Hi ${student.firstName},\n\n${user.firstName} cancelled "${job.title}" on ${formatDate(job.startDate)}. Sorry about that. There are more jobs here: ${appUrl()}/student/jobs`,
    });
  }
  await db.update(jobs).set({ status: "cancelled" }).where(eq(jobs.id, job.id));
  revalidatePath(`/resident/jobs/${job.id}`);
  return { notice: "This job is cancelled." };
}

export async function applyToJob(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser("student");
  const jobId = str(data, "jobId");
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job || job.status !== "open") return { error: "This job is no longer open." };
  const note = str(data, "note");
  if (note.length < 20) return { error: "Tell the family in a sentence or two why you're a good fit." };

  // The first application fills in the basics families look at.
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id)).limit(1);
  if (!user.photoAt && !str(data, "photo")) return { error: "Please add a profile photo so the family knows who's coming." };
  const photoError = await savePhotoFromForm(user.id, data);
  if (photoError) return { error: photoError };
  const basics: Partial<typeof studentProfiles.$inferInsert> = {};
  if (!profile.gradYear) {
    const year = parseInt(str(data, "gradYear"), 10);
    if (!Number.isFinite(year) || year < 2000 || year > 2100) return { error: "Please choose your class year." };
    basics.gradYear = year;
  }
  if (!profile.bio) {
    const bio = str(data, "bio");
    if (bio.length < 20) return { error: "Please write a short bio, a sentence or two." };
    if (!["yes", "no"].includes(str(data, "hasCar"))) return { error: "Please say whether you have a car." };
    basics.bio = bio.slice(0, 500);
    basics.hasCar = str(data, "hasCar") === "yes";
  }
  if (Object.keys(basics).length) await db.update(studentProfiles).set(basics).where(eq(studentProfiles.userId, user.id));

  const inserted = await db
    .insert(applications)
    .values({ jobId, studentId: user.id, note: note.slice(0, 600) })
    .onConflictDoNothing()
    .returning();
  if (!inserted.length) return { error: "You've already applied to this job." };

  await db
    .insert(conversations)
    .values({ jobId, residentId: job.residentId, studentId: user.id })
    .onConflictDoNothing();

  const [resident] = await db.select().from(users).where(eq(users.id, job.residentId)).limit(1);
  await sendEmail({
    to: resident.email,
    subject: `${publicName(user)} applied to "${job.title}"`,
    body: `Hi ${resident.firstName},\n\n${publicName(user)} applied to your job "${job.title}". See their profile and choose who you'd like: ${appUrl()}/resident/jobs/${job.id}`,
  });
  revalidatePath(`/student/jobs/${jobId}`);
  return { notice: "You've applied. We'll email you if the family picks you." };
}

export async function withdrawApplication(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser("student");
  const jobId = str(data, "jobId");
  const updated = await db
    .update(applications)
    .set({ status: "withdrawn" })
    .where(and(eq(applications.jobId, jobId), eq(applications.studentId, user.id), eq(applications.status, "applied")))
    .returning();
  if (!updated.length) return { error: "There's no open application to withdraw." };
  revalidatePath(`/student/jobs/${jobId}`);
  return { notice: "Your application is withdrawn." };
}

export async function declineApplicant(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser("resident");
  const [row] = await db
    .select({ app: applications, job: jobs })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(and(eq(applications.id, str(data, "applicationId")), eq(jobs.residentId, user.id)))
    .limit(1);
  if (!row || row.app.status !== "applied") return { error: "This application is no longer open." };
  await db.update(applications).set({ status: "passed" }).where(eq(applications.id, row.app.id));
  const [student] = await db.select().from(users).where(eq(users.id, row.app.studentId)).limit(1);
  await sendEmail({
    to: student.email,
    subject: `Update on "${row.job.title}"`,
    body: `Hi ${student.firstName},\n\nThe family went another way for "${row.job.title}". New jobs are posted every day: ${appUrl()}/student/jobs`,
  });
  revalidatePath(`/resident/jobs/${row.job.id}`);
  redirect(`/resident/jobs/${row.job.id}`);
}

export async function selectApplicant(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser("resident");
  const applicationId = str(data, "applicationId");
  const [row] = await db
    .select({ app: applications, job: jobs })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(and(eq(applications.id, applicationId), eq(jobs.residentId, user.id)))
    .limit(1);
  if (!row) return { error: "We couldn't find that application." };
  const { app, job } = row;
  if (job.status !== "open" || app.status !== "applied") return { error: "This job can't be booked right now." };
  const [{ filled }] = await db
    .select({ filled: sql<number>`count(*)::int` })
    .from(bookings)
    .where(and(eq(bookings.jobId, job.id), inArray(bookings.status, [...FILLED_STATUSES])));
  if (filled >= job.studentsNeeded) return { error: "Every place on this job is already filled." };
  if (job.rateCents == null) return { error: "This job is waiting for a rate before it can be booked." };

  const [student] = await db
    .select({ user: users, profile: studentProfiles })
    .from(users)
    .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(eq(users.id, app.studentId))
    .limit(1);
  if (!student || student.user.suspendedAt) return { error: "This student isn't available any more." };
  if (paymentsProvider() === "stripe" && !student.profile.payoutsEnabled) {
    return { error: `${student.user.firstName} hasn't finished setting up payouts yet. Send them a message, or pick another student.` };
  }

  const authorizedCents = jobTotalCents(job.rateCents, job.estMinutes);
  // A stale unpaid booking from an abandoned checkout is replaced.
  await db.delete(bookings).where(and(eq(bookings.applicationId, app.id), eq(bookings.status, "awaiting_payment")));
  const [booking] = await db
    .insert(bookings)
    .values({
      jobId: job.id,
      applicationId: app.id,
      residentId: user.id,
      studentId: app.studentId,
      rateCents: job.rateCents,
      estMinutes: job.estMinutes,
      authorizedCents,
      scheduledFor: job.startDate,
      status: "awaiting_payment",
      paymentProvider: paymentsProvider(),
    })
    .returning();

  const result = await authorizePayment({
    bookingId: booking.id,
    jobId: job.id,
    jobTitle: job.title,
    amountCents: authorizedCents,
    residentEmail: user.email,
    studentStripeAccountId: student.profile.stripeAccountId,
  });
  await db.update(bookings).set({ paymentRef: result.ref }).where(eq(bookings.id, booking.id));

  if (result.kind === "redirect") redirect(result.url);
  await confirmBooking(booking.id, result.ref);
  revalidatePath(`/resident/jobs/${job.id}`);
  return { notice: `${student.user.firstName} is booked.` };
}

export async function studentCancelBooking(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser("student");
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, str(data, "bookingId")), eq(bookings.studentId, user.id)))
    .limit(1);
  if (!booking || booking.status !== "authorized") return { error: "This booking can't be cancelled." };

  await cancelPayment(booking.paymentRef);
  // The booking row is removed so the job can be booked again; the strike keeps the record.
  await db.delete(bookings).where(eq(bookings.id, booking.id));
  await db.update(applications).set({ status: "withdrawn" }).where(eq(applications.id, booking.applicationId));
  // A place opened up again, so students turned down for being full are back in the running.
  await db
    .update(applications)
    .set({ status: "applied" })
    .where(and(eq(applications.jobId, booking.jobId), eq(applications.status, "declined")));
  await syncJobStatus(booking.jobId);
  await db
    .update(studentProfiles)
    .set({ strikes: sql`${studentProfiles.strikes} + 1` })
    .where(eq(studentProfiles.userId, user.id));

  const [job] = await db.select().from(jobs).where(eq(jobs.id, booking.jobId)).limit(1);
  const [resident] = await db.select().from(users).where(eq(users.id, booking.residentId)).limit(1);
  await sendEmail({
    to: resident.email,
    subject: `${user.firstName} can't make "${job.title}"`,
    body: `Hi ${resident.firstName},\n\n${user.firstName} had to cancel "${job.title}". You haven't been charged, and your job is open again so you can pick another student: ${appUrl()}/resident/jobs/${job.id}`,
  });
  revalidatePath(`/student/jobs/${job.id}`);
  return { notice: "You've cancelled this job. Cancelling booked jobs counts against your profile." };
}

export async function markComplete(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser("student");
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, str(data, "bookingId")), eq(bookings.studentId, user.id)))
    .limit(1);
  if (!booking || booking.status !== "authorized") return { error: "This job can't be marked done right now." };

  const hours = parseFloat(str(data, "hours"));
  if (!Number.isFinite(hours) || hours <= 0) return { error: "Please enter how many hours you worked." };
  const minutes = Math.round(hours * 60);
  if (minutes > booking.estMinutes) {
    return {
      error: `This job was booked for ${booking.estMinutes / 60} hours, so that's the most that can be billed. If it ran longer, message the family.`,
    };
  }

  await db
    .update(bookings)
    .set({ status: "completed_pending", studentCompletedAt: new Date(), actualMinutes: minutes })
    .where(eq(bookings.id, booking.id));
  const [job] = await db.select().from(jobs).where(eq(jobs.id, booking.jobId)).limit(1);
  const [resident] = await db.select().from(users).where(eq(users.id, booking.residentId)).limit(1);
  await sendEmail({
    to: resident.email,
    subject: `${user.firstName} finished "${job.title}"`,
    body: `Hi ${resident.firstName},\n\n${user.firstName} marked "${job.title}" as done (${hours} hours, ${formatCents(
      jobTotalCents(booking.rateCents, minutes),
    )}). Please confirm so they get paid: ${appUrl()}/resident/jobs/${job.id}\n\nIf you don't respond, payment is released automatically 7 days after the job date.`,
  });
  revalidatePath(`/student/jobs/${job.id}`);
  return { notice: "Marked as done. You'll be paid once the family confirms." };
}

export async function confirmComplete(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser("resident");
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, str(data, "bookingId")), eq(bookings.residentId, user.id)))
    .limit(1);
  if (!booking || !["authorized", "completed_pending"].includes(booking.status)) {
    return { error: "This job can't be confirmed right now." };
  }
  await releaseBooking(booking.id, "confirmed");
  revalidatePath(`/resident/jobs/${booking.jobId}`);
  return { notice: "Thanks! Payment has been released." };
}

export async function disputeBooking(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser("resident");
  const reason = str(data, "reason");
  if (reason.length < 10) return { error: "Please tell us what went wrong." };
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, str(data, "bookingId")), eq(bookings.residentId, user.id)))
    .limit(1);
  if (!booking || !["authorized", "completed_pending"].includes(booking.status)) {
    return { error: "A problem can't be raised on this job right now." };
  }
  await db
    .update(bookings)
    .set({ status: "disputed", disputeReason: reason, disputedAt: new Date() })
    .where(eq(bookings.id, booking.id));
  const [job] = await db.select().from(jobs).where(eq(jobs.id, booking.jobId)).limit(1);
  await sendMany(
    (await staffEmails()).map((to) => ({
      to,
      subject: `Problem raised on "${job.title}"`,
      body: `${user.firstName} raised a problem:\n\n${reason}\n\nPayment is on hold. Review it: ${appUrl()}/admin`,
    })),
  );
  revalidatePath(`/resident/jobs/${booking.jobId}`);
  return { notice: "We've paused payment and will be in touch shortly." };
}
