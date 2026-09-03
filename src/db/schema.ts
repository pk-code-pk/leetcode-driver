import {
  pgTable, text, integer, real, timestamp, boolean, jsonb, index,
} from "drizzle-orm/pg-core";

/** Static catalog: the NeetCode 150, seeded once from data/neetcode150.json. */
export const problems = pgTable("problems", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  difficulty: text("difficulty").notNull(), // Easy | Medium | Hard
  topic: text("topic").notNull(),           // topic key
  topicOrder: integer("topic_order").notNull(),
  orderInTopic: integer("order_in_topic").notNull(),
  url: text("url").notNull(),
  /** Official LeetCode topic tags, e.g. ["Array","Stack","Monotonic Stack"]. */
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  /** LeetCode's own hints. Public, but present for only ~30% of the 150. */
  officialHints: jsonb("official_hints").$type<string[]>().notNull().default([]),
});

export const topics = pgTable("topics", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  prereqs: jsonb("prereqs").$type<string[]>().notNull().default([]),
  order: integer("order").notNull(),
});

/** One row per problem you've ever been served. The SM-2 state lives here. */
export const cards = pgTable("cards", {
  slug: text("slug").primaryKey().references(() => problems.slug),
  state: text("state").notNull().default("new"), // new | learning | review | buried
  ease: real("ease").notNull().default(2.5),
  intervalDays: real("interval_days").notNull().default(0),
  reps: integer("reps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
  dueAt: timestamp("due_at", { withTimezone: true }),
  lastGrade: integer("last_grade"),
  lastGradeSource: text("last_grade_source"), // inferred | manual
  lastSolvedAt: timestamp("last_solved_at", { withTimezone: true }),
  /** Telemetry from the most recent attempt, used to infer the grade. */
  lastDurationSec: integer("last_duration_sec"),
  lastFailedSubmissions: integer("last_failed_submissions"),
  lastHintLevel: integer("last_hint_level").notNull().default(0),
  code: text("code"),                 // your most recent accepted solution
  lang: text("lang"),
  patternNote: text("pattern_note"),  // one-line auto-generated summary
  /** Your own account of the attempt, typed on the page after solving. */
  userNote: text("user_note"),
  /** Scheduling state *before* the last solve, so a regrade can replay cleanly. */
  preEase: real("pre_ease"),
  preIntervalDays: integer("pre_interval_days"),
  preReps: integer("pre_reps"),
  preLapses: integer("pre_lapses"),
}, (t) => [index("cards_due_idx").on(t.dueAt)]);

/** An attempt that is currently in flight: served, not yet accepted. */
export const attempts = pgTable("attempts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().references(() => problems.slug),
  servedAt: timestamp("served_at", { withTimezone: true }).notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  solvedAt: timestamp("solved_at", { withTimezone: true }),
  failedSubmissions: integer("failed_submissions").notNull().default(0),
  hintLevel: integer("hint_level").notNull().default(0),
  /** Wall-clock the timer spent paused, so duration reflects real work. */
  pausedSec: integer("paused_sec").notNull().default(0),
  /** Set while the timer is paused; null when running. */
  pausedAt: timestamp("paused_at", { withTimezone: true }),
  rescueSentAt: timestamp("rescue_sent_at", { withTimezone: true }),
  abandoned: boolean("abandoned").notNull().default(false),
  isReview: boolean("is_review").notNull().default(false),
  telegramMessageId: integer("telegram_message_id"),
}, (t) => [index("attempts_open_idx").on(t.solvedAt, t.abandoned)]);

/** Escalation ladder bookkeeping, one row per day. */
export const days = pgTable("days", {
  day: text("day").primaryKey(), // YYYY-MM-DD in the user's timezone
  targetCount: integer("target_count").notNull(),
  solvedCount: integer("solved_count").notNull().default(0),
  tierSent: integer("tier_sent").notNull().default(0), // highest escalation tier fired
  lastNagAt: timestamp("last_nag_at", { withTimezone: true }), // relentless mode
  debtAtStart: integer("debt_at_start").notNull().default(0),
  closed: boolean("closed").notNull().default(false),
});

/** Single-row config table. */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  leetcodeUsername: text("leetcode_username"),
  sessionCookieEnc: text("session_cookie_enc"),
  csrfTokenEnc: text("csrf_token_enc"),
  cookieUpdatedAt: timestamp("cookie_updated_at", { withTimezone: true }),
  telegramChatId: text("telegram_chat_id"),
  timezone: text("timezone").notNull().default("America/New_York"),
  dailyNewTarget: integer("daily_new_target").notNull().default(2),
  dailyMaxTotal: integer("daily_max_total").notNull().default(6),
  quietStartHour: integer("quiet_start_hour").notNull().default(22),
  quietEndHour: integer("quiet_end_hour").notNull().default(8),
  rescueAfterMin: integer("rescue_after_min").notNull().default(25),
  debt: integer("debt").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  paused: boolean("paused").notNull().default(false),
  /** After the last tier, re-nag on this interval until the target is met. */
  relentless: boolean("relentless").notNull().default(true),
  relentlessEveryMin: integer("relentless_every_min").notNull().default(10),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
});

/** Append-only log, for the stats page and for debugging the scheduler. */
export const events = pgTable("events", {
  id: text("id").primaryKey(),
  at: timestamp("at", { withTimezone: true }).notNull(),
  kind: text("kind").notNull(),
  slug: text("slug"),
  data: jsonb("data").$type<Record<string, unknown>>(),
}, (t) => [index("events_at_idx").on(t.at)]);
