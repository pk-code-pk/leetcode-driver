"use server";

import { savePhotoFromForm } from "@/lib/photos";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { bookings, conversations, jobs, messages, reports, reviews, studentProfiles, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { appUrl } from "@/lib/config";
import { sendEmail, sendMany } from "@/lib/email";
import { JOB_TYPE_SLUGS } from "@/lib/jobTypes";
import { paymentsProvider, payoutsEnabled, studentOnboardingLink } from "@/lib/payments";
import { staffEmails } from "@/lib/queries";
import { screenMessage } from "@/lib/screening";
import type { FormState } from "@/components/forms";

const str = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

export async function sendMessage(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser(["resident", "student"]);
  const raw = str(data, "body");
  if (!raw) return { error: "Write a message first." };
  if (raw.length > 2000) return { error: "That message is too long." };

  const [convo] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, str(data, "conversationId")),
        or(eq(conversations.residentId, user.id), eq(conversations.studentId, user.id)),
      ),
    )
    .limit(1);
  if (!convo) return { error: "We couldn't find that conversation." };

  // Contact details are allowed once this pair has a booking together.
  const booked = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.residentId, convo.residentId),
        eq(bookings.studentId, convo.studentId),
        inArray(bookings.status, ["authorized", "completed_pending", "completed", "disputed"]),
      ),
    )
    .limit(1);
  const screened = screenMessage(raw, booked.length > 0);

  const now = new Date();
  const isResident = convo.residentId === user.id;
  const recipientId = isResident ? convo.studentId : convo.residentId;
  const recipientLastRead = isResident ? convo.studentLastReadAt : convo.residentLastReadAt;
  // Email only when the recipient was caught up, so a burst of messages sends one email.
  const recipientCaughtUp = !convo.lastMessageAt || (recipientLastRead != null && recipientLastRead >= convo.lastMessageAt);

  await db.insert(messages).values({
    conversationId: convo.id,
    senderId: user.id,
    body: screened.body,
    flagged: screened.flagged,
    flagReasons: screened.reasons,
  });
  await db
    .update(conversations)
    .set({ lastMessageAt: now, ...(isResident ? { residentLastReadAt: now } : { studentLastReadAt: now }) })
    .where(eq(conversations.id, convo.id));

  if (recipientCaughtUp) {
    const [recipient] = await db.select().from(users).where(eq(users.id, recipientId)).limit(1);
    const [job] = await db.select().from(jobs).where(eq(jobs.id, convo.jobId)).limit(1);
    await sendEmail({
      to: recipient.email,
      subject: `New message from ${user.firstName} about "${job.title}"`,
      body: `Hi ${recipient.firstName},\n\n${user.firstName} sent you a message about "${job.title}". Read and reply here: ${appUrl()}/messages/${convo.id}`,
    });
  }

  revalidatePath(`/messages/${convo.id}`);
  if (screened.flagged) {
    return {
      notice:
        "Sent. A reminder: payments and first-time arrangements need to stay on JobsU, so contact details and payment apps are hidden or flagged until you've booked together.",
    };
  }
  return {};
}

export async function submitReview(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser(["resident", "student"]);
  const rating = parseInt(str(data, "rating"), 10);
  if (!(rating >= 1 && rating <= 5)) return { error: "Please choose a rating from 1 to 5 stars." };

  const [booking] = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.id, str(data, "bookingId")),
        eq(bookings.status, "completed"),
        or(eq(bookings.residentId, user.id), eq(bookings.studentId, user.id)),
      ),
    )
    .limit(1);
  if (!booking) return { error: "Ratings open once the job is completed." };

  const subjectId = booking.residentId === user.id ? booking.studentId : booking.residentId;
  const inserted = await db
    .insert(reviews)
    .values({ bookingId: booking.id, authorId: user.id, subjectId, rating, comment: str(data, "comment").slice(0, 1000) })
    .onConflictDoNothing()
    .returning();
  if (!inserted.length) return { error: "You've already rated this job." };

  revalidatePath(user.role === "resident" ? `/resident/jobs/${booking.jobId}` : `/student/jobs/${booking.jobId}`);
  return { notice: "Thanks for your rating." };
}

export async function submitReport(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser(["resident", "student"]);
  const reason = str(data, "reason");
  const details = str(data, "details");
  if (!reason) return { error: "Please choose a reason." };
  if (details.length < 10) return { error: "Please tell us what happened." };

  const conversationId = str(data, "conversationId") || null;
  const jobId = str(data, "jobId") || null;
  let subjectId: string | null = str(data, "subjectId") || null;

  // Only accept references the reporter can actually see.
  if (conversationId) {
    const [c] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), or(eq(conversations.residentId, user.id), eq(conversations.studentId, user.id))))
      .limit(1);
    if (!c) return { error: "We couldn't find that conversation." };
    subjectId = c.residentId === user.id ? c.studentId : c.residentId;
  }

  await db.insert(reports).values({ reporterId: user.id, subjectId, jobId, conversationId, reason, details });
  await sendMany(
    (await staffEmails()).map((to) => ({
      to,
      subject: `New report: ${reason}`,
      body: `${user.firstName} (${user.email}) reported: ${reason}\n\n${details}\n\nReview it: ${appUrl()}/admin/reports`,
    })),
  );
  redirect("/report/sent");
}

export async function updateStudentProfile(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser("student");
  const firstName = str(data, "firstName");
  if (!firstName) return { error: "Please enter your first name." };
  const gradYear = parseInt(str(data, "gradYear"), 10);
  const jobTypes = data.getAll("jobTypes").map(String).filter((t) => JOB_TYPE_SLUGS.includes(t));

  await db
    .update(users)
    .set({ firstName, lastName: str(data, "lastName"), phone: str(data, "phone") })
    .where(eq(users.id, user.id));
  await db
    .update(studentProfiles)
    .set({
      gradYear: Number.isFinite(gradYear) ? gradYear : null,
      major: str(data, "major").slice(0, 100),
      bio: str(data, "bio").slice(0, 1000),
      jobTypes,
      hasCar: data.get("hasCar") === "on",
      certifications: str(data, "certifications").slice(0, 300),
      availability: str(data, "availability").slice(0, 300),
      minor: str(data, "minor").slice(0, 100),
      hometown: str(data, "hometown").slice(0, 80),
      gettingAround: str(data, "gettingAround").slice(0, 160),
      funFacts: [str(data, "fact1"), str(data, "fact2")].map((f) => f.slice(0, 100)).filter(Boolean),
    })
    .where(eq(studentProfiles.userId, user.id));
  const photoError = await savePhotoFromForm(user.id, data);
  if (photoError) return { error: photoError };
  revalidatePath("/student/profile");
  return { notice: "Profile saved." };
}

/** The optional "profile card" questions shown after a student's application. */
export async function updateProfileCard(_: FormState, data: FormData): Promise<FormState> {
  const user = await requireUser("student");
  await db
    .update(studentProfiles)
    .set({
      hometown: str(data, "hometown").slice(0, 80),
      gettingAround: str(data, "gettingAround").slice(0, 160),
      funFacts: [str(data, "fact1"), str(data, "fact2")].map((f) => f.slice(0, 100)).filter(Boolean),
    })
    .where(eq(studentProfiles.userId, user.id));
  // The page isn't refreshed, so the student sees this confirmation; the prompt is gone on their next visit.
  return { notice: "Saved. Families will see this on your profile." };
}

export async function startPayoutSetup(_: FormState, __: FormData): Promise<FormState> {
  const user = await requireUser("student");
  if (paymentsProvider() !== "stripe") return { notice: "Payouts are simulated in this environment, so there's nothing to set up." };
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id)).limit(1);
  let link;
  try {
    link = await studentOnboardingLink({ email: user.email, existingAccountId: profile.stripeAccountId });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "We couldn't start payout setup. Please try again." };
  }
  await db.update(studentProfiles).set({ stripeAccountId: link.accountId }).where(eq(studentProfiles.userId, user.id));
  redirect(link.url);
}

export async function refreshPayoutStatus(_: FormState, __: FormData): Promise<FormState> {
  const user = await requireUser("student");
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id)).limit(1);
  if (!profile.stripeAccountId) return { error: "Start payout setup first." };
  const enabled = await payoutsEnabled(profile.stripeAccountId);
  await db.update(studentProfiles).set({ payoutsEnabled: enabled }).where(eq(studentProfiles.userId, user.id));
  revalidatePath("/student/payouts");
  return enabled ? { notice: "Payouts are set up." } : { error: "Stripe still needs a few details from you." };
}
