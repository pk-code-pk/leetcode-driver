// Steps in the job lifecycle that are triggered by the server itself (after a
// payment hold, or when staff approve a job). Kept out of "use server" files so
// they can never be called directly from a browser.
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, bookings, jobs, studentProfiles, users } from "@/db/schema";
import { appUrl } from "./config";
import { formatDate } from "./dates";
import { sendEmail, sendMany } from "./email";
import { jobType } from "./jobTypes";
import { formatRate } from "./money";

/** Email students whose profile lists this job type. */
export async function notifyMatchingStudents(jobId: string): Promise<void> {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) return;
  const matches = await db
    .select({ email: users.email, firstName: users.firstName })
    .from(studentProfiles)
    .innerJoin(users, eq(users.id, studentProfiles.userId))
    .where(
      and(
        sql`${job.type} = any(${studentProfiles.jobTypes})`,
        sql`${users.emailVerifiedAt} is not null`,
        sql`${users.suspendedAt} is null`,
      ),
    );
  await sendMany(
    matches.map((s) => ({
      to: s.email,
      subject: `New ${jobType(job.type).label.toLowerCase()} job in ${job.town}: ${formatRate(job.rateCents)}`,
      body: `Hi ${s.firstName},\n\n"${job.title}" in ${job.town} on ${formatDate(job.startDate)} pays ${formatRate(job.rateCents)}.\n\nApply in one click: ${appUrl()}/student/jobs/${job.id}`,
    })),
  );
}

/** Called once the payment hold is in place: locks in the booking and tells everyone. */
export async function confirmBooking(bookingId: string, paymentRef: string): Promise<void> {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking || booking.status !== "awaiting_payment") return;
  await db.update(bookings).set({ status: "authorized", paymentRef }).where(eq(bookings.id, bookingId));
  await db.update(jobs).set({ status: "booked" }).where(eq(jobs.id, booking.jobId));
  await db.update(applications).set({ status: "selected" }).where(eq(applications.id, booking.applicationId));
  const declined = await db
    .update(applications)
    .set({ status: "declined" })
    .where(and(eq(applications.jobId, booking.jobId), ne(applications.id, booking.applicationId), eq(applications.status, "applied")))
    .returning();

  const [job] = await db.select().from(jobs).where(eq(jobs.id, booking.jobId)).limit(1);
  const people = await db
    .select()
    .from(users)
    .where(inArray(users.id, [booking.studentId, booking.residentId, ...declined.map((d) => d.studentId)]));
  const student = people.find((u) => u.id === booking.studentId)!;
  const resident = people.find((u) => u.id === booking.residentId)!;
  await sendEmail({
    to: student.email,
    subject: `You got the job: ${job.title}`,
    body: `Hi ${student.firstName},\n\n${resident.firstName} picked you for "${job.title}" on ${formatDate(job.startDate)}${
      job.startTime ? ` at ${job.startTime}` : ""
    }, ${formatRate(booking.rateCents)}.\n\nMessage them to sort out details: ${appUrl()}/student/jobs/${job.id}`,
  });
  await sendMany(
    declined.map((d) => {
      const s = people.find((u) => u.id === d.studentId)!;
      return {
        to: s.email,
        subject: `Update on "${job.title}"`,
        body: `Hi ${s.firstName},\n\nThe family went with another student for "${job.title}". New jobs are posted every day: ${appUrl()}/student/jobs`,
      };
    }),
  );
}

