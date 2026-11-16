import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  index,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const ts = (name: string) => timestamp(name, { withTimezone: true });

export type Role = "resident" | "student" | "admin";

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<Role>().notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  emailVerifiedAt: ts("email_verified_at"),
  suspendedAt: ts("suspended_at"),
  suspendedReason: text("suspended_reason"),
  acceptedTermsAt: ts("accepted_terms_at").notNull(),
  attested18At: ts("attested_18_at").notNull(),
  createdAt: createdAt(),
});

export const sessions = pgTable("sessions", {
  id: id(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: ts("expires_at").notNull(),
  createdAt: createdAt(),
});

export const verificationCodes = pgTable("verification_codes", {
  id: id(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  expiresAt: ts("expires_at").notNull(),
  usedAt: ts("used_at"),
  attempts: integer("attempts").notNull().default(0),
  createdAt: createdAt(),
});

export const studentProfiles = pgTable("student_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  school: text("school").notNull(),
  gradYear: integer("grad_year"),
  major: text("major").notNull().default(""),
  bio: text("bio").notNull().default(""),
  jobTypes: text("job_types").array().notNull().default([]),
  hasCar: boolean("has_car").notNull().default(false),
  certifications: text("certifications").notNull().default(""), // self-reported, not verified
  availability: text("availability").notNull().default(""),
  strikes: integer("strikes").notNull().default(0),
  stripeAccountId: text("stripe_account_id"),
  payoutsEnabled: boolean("payouts_enabled").notNull().default(false),
  enrollmentConfirmedAt: ts("enrollment_confirmed_at"),
});

export const residentProfiles = pgTable("resident_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  town: text("town").notNull(),
  landmark: text("landmark").notNull().default(""), // never shown publicly
  heardFrom: text("heard_from").notNull().default(""),
});

export const waitlist = pgTable("waitlist", {
  id: id(),
  email: text("email").notNull(),
  kind: text("kind").notNull(), // "student" | "resident"
  note: text("note").notNull().default(""),
  createdAt: createdAt(),
});

export type JobStatus = "pending_review" | "open" | "booked" | "completed" | "cancelled";

export const jobs = pgTable(
  "jobs",
  {
    id: id(),
    residentId: uuid("resident_id").notNull().references(() => users.id),
    type: text("type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
    town: text("town").notNull(),
    landmark: text("landmark").notNull().default(""), // private: resident + admin only
    timing: text("timing").notNull(),
    startDate: date("start_date").notNull(),
    startTime: text("start_time").notNull().default(""),
    estMinutes: integer("est_minutes").notNull(),
    rateCents: integer("rate_cents"), // null = "not sure", admin suggests one
    status: text("status").$type<JobStatus>().notNull(),
    reviewReasons: text("review_reasons").array().notNull().default([]),
    adminNote: text("admin_note").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("jobs_status_idx").on(t.status), index("jobs_resident_idx").on(t.residentId)],
);

export type ApplicationStatus = "applied" | "selected" | "declined" | "withdrawn";

export const applications = pgTable(
  "applications",
  {
    id: id(),
    jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").notNull().references(() => users.id),
    note: text("note").notNull().default(""),
    status: text("status").$type<ApplicationStatus>().notNull().default("applied"),
    recommended: boolean("recommended").notNull().default(false), // picked out by JobsU staff
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("applications_job_student_idx").on(t.jobId, t.studentId)],
);

export type BookingStatus =
  | "awaiting_payment" // resident chose a student but the payment hold isn't in place yet
  | "authorized" // hold in place, job upcoming or in progress
  | "completed_pending" // student marked it done, waiting for the resident
  | "completed" // paid out
  | "disputed"
  | "cancelled";

export const bookings = pgTable(
  "bookings",
  {
    id: id(),
    jobId: uuid("job_id").notNull().references(() => jobs.id),
    applicationId: uuid("application_id").notNull().references(() => applications.id),
    residentId: uuid("resident_id").notNull().references(() => users.id),
    studentId: uuid("student_id").notNull().references(() => users.id),
    rateCents: integer("rate_cents").notNull(),
    estMinutes: integer("est_minutes").notNull(),
    authorizedCents: integer("authorized_cents").notNull(),
    scheduledFor: date("scheduled_for").notNull(),
    status: text("status").$type<BookingStatus>().notNull(),
    paymentProvider: text("payment_provider").notNull(),
    paymentRef: text("payment_ref"),
    studentCompletedAt: ts("student_completed_at"),
    actualMinutes: integer("actual_minutes"),
    residentConfirmedAt: ts("resident_confirmed_at"),
    releasedAt: ts("released_at"),
    releaseKind: text("release_kind"), // "confirmed" | "auto" | "admin"
    amountCents: integer("amount_cents"),
    feeCents: integer("fee_cents"),
    payoutCents: integer("payout_cents"),
    cancelledBy: text("cancelled_by"), // "resident" | "student" | "admin"
    cancelledAt: ts("cancelled_at"),
    disputeReason: text("dispute_reason"),
    disputedAt: ts("disputed_at"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("bookings_job_idx").on(t.jobId), index("bookings_status_idx").on(t.status)],
);

export const conversations = pgTable(
  "conversations",
  {
    id: id(),
    jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    residentId: uuid("resident_id").notNull().references(() => users.id),
    studentId: uuid("student_id").notNull().references(() => users.id),
    residentLastReadAt: ts("resident_last_read_at"),
    studentLastReadAt: ts("student_last_read_at"),
    lastMessageAt: ts("last_message_at"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("conversations_job_student_idx").on(t.jobId, t.studentId)],
);

export const messages = pgTable(
  "messages",
  {
    id: id(),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").notNull().references(() => users.id),
    body: text("body").notNull(),
    flagged: boolean("flagged").notNull().default(false),
    flagReasons: text("flag_reasons").array().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: id(),
    bookingId: uuid("booking_id").notNull().references(() => bookings.id),
    authorId: uuid("author_id").notNull().references(() => users.id),
    subjectId: uuid("subject_id").notNull().references(() => users.id),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull().default(""),
    removedAt: ts("removed_at"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("reviews_booking_author_idx").on(t.bookingId, t.authorId), index("reviews_subject_idx").on(t.subjectId)],
);

export const reports = pgTable("reports", {
  id: id(),
  reporterId: uuid("reporter_id").notNull().references(() => users.id),
  subjectId: uuid("subject_id").references(() => users.id),
  jobId: uuid("job_id").references(() => jobs.id),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  reason: text("reason").notNull(),
  details: text("details").notNull().default(""),
  status: text("status").notNull().default("open"), // "open" | "resolved"
  adminNote: text("admin_note").notNull().default(""),
  createdAt: createdAt(),
});

export const emails = pgTable("emails", {
  id: id(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  provider: text("provider").notNull(), // "outbox" | "resend"
  error: text("error"),
  createdAt: createdAt(),
});

export type User = typeof users.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type ResidentProfile = typeof residentProfiles.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
