"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { residentProfiles, studentProfiles, users, waitlist } from "@/db/schema";
import {
  checkVerificationCode,
  createSession,
  currentUser,
  destroySession,
  hashPassword,
  homeFor,
  issueVerificationCode,
  verifyPassword,
} from "@/lib/auth";
import { TOWNS, adminEmails } from "@/lib/config";
import { checkStudentEmail, isValidEmail, normalizeEmail } from "@/lib/edu";
import { sendEmail } from "@/lib/email";
import type { FormState } from "@/components/forms";

const str = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

async function sendCode(userId: string, email: string, firstName: string) {
  const code = await issueVerificationCode(userId);
  await sendEmail({
    to: email,
    subject: `${code} is your JobsU code`,
    body: `Hi ${firstName},\n\nYour JobsU confirmation code is ${code}. It expires in 15 minutes.`,
  });
}

function commonErrors(data: FormData): string | null {
  if (!str(data, "firstName")) return "Please enter your first name.";
  if (!isValidEmail(str(data, "email"))) return "Please enter a valid email address.";
  if (str(data, "password").length < 8) return "Your password needs at least 8 characters.";
  if (data.get("adult") !== "on") return "You must be 18 or older to use JobsU.";
  if (data.get("terms") !== "on") return "Please accept the Terms of Service to continue.";
  return null;
}

export async function signUpResident(_: FormState, data: FormData): Promise<FormState> {
  const err = commonErrors(data);
  if (err) return { error: err };
  const email = normalizeEmail(str(data, "email"));
  const town = str(data, "town");

  if (!TOWNS.includes(town as (typeof TOWNS)[number])) {
    await db.insert(waitlist).values({ email, kind: "resident", note: town });
    return {
      notice: "JobsU isn't in your town yet. We've added you to the waitlist and will email you when we get there.",
    };
  }
  if ((await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)).length) {
    return { error: "An account with that email already exists. Try logging in." };
  }

  const now = new Date();
  const role = adminEmails().includes(email) ? "admin" : "resident";
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword(str(data, "password")),
      role,
      firstName: str(data, "firstName"),
      lastName: str(data, "lastName"),
      phone: str(data, "phone"),
      acceptedTermsAt: now,
      attested18At: now,
    })
    .returning();
  if (role === "resident") {
    await db.insert(residentProfiles).values({
      userId: user.id,
      town,
      landmark: str(data, "landmark"),
      heardFrom: str(data, "heardFrom"),
    });
  }
  await sendCode(user.id, email, user.firstName);
  await createSession(user.id);
  redirect("/verify");
}

export async function signUpStudent(_: FormState, data: FormData): Promise<FormState> {
  const err = commonErrors(data);
  if (err) return { error: err };
  const email = normalizeEmail(str(data, "email"));

  const check = checkStudentEmail(email);
  if (!check.ok) {
    if (check.reason === "not_edu") return { error: "Students need to sign up with their .edu email address." };
    await db.insert(waitlist).values({ email, kind: "student" });
    return {
      notice: "JobsU isn't live at your campus yet. We've added you to the waitlist and will email you when it is.",
    };
  }
  if ((await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)).length) {
    return { error: "An account with that email already exists. Try logging in." };
  }

  const now = new Date();
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword(str(data, "password")),
      role: "student",
      firstName: str(data, "firstName"),
      lastName: str(data, "lastName"),
      phone: str(data, "phone"),
      acceptedTermsAt: now,
      attested18At: now,
    })
    .returning();
  await db.insert(studentProfiles).values({ userId: user.id, school: check.school });
  await sendCode(user.id, email, user.firstName);
  await createSession(user.id);
  redirect("/verify");
}

export async function verifyEmail(_: FormState, data: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/log-in");
  if (user.emailVerifiedAt) redirect(homeFor(user.role));

  const result = await checkVerificationCode(user.id, str(data, "code"));
  if (result === "wrong") return { error: "That code isn't right. Check the email and try again." };
  if (result === "expired") return { error: "That code has expired. Send a new one below." };
  if (result === "too_many") return { error: "Too many tries. Send a new code below." };

  if (user.role === "student") {
    await db.update(studentProfiles).set({ enrollmentConfirmedAt: new Date() }).where(eq(studentProfiles.userId, user.id));
    redirect("/student/profile?welcome=1");
  }
  redirect(homeFor(user.role));
}

export async function resendCode(_: FormState, __: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/log-in");
  if (user.emailVerifiedAt) redirect(homeFor(user.role));
  await sendCode(user.id, user.email, user.firstName);
  return { notice: `We sent a new code to ${user.email}.` };
}

export async function logIn(_: FormState, data: FormData): Promise<FormState> {
  const email = normalizeEmail(str(data, "email"));
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(str(data, "password"), user.passwordHash))) {
    return { error: "That email and password don't match." };
  }
  await createSession(user.id);
  if (user.suspendedAt) redirect("/suspended");
  if (!user.emailVerifiedAt) redirect("/verify");
  redirect(homeFor(user.role));
}

export async function logOut(): Promise<void> {
  await destroySession();
  redirect("/");
}
