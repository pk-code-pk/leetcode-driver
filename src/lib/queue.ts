import { and, asc, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export type Pick = { slug: string; title: string; difficulty: string; isReview: boolean };

/**
 * After this many reviews in a row, the next serve is a new problem even while
 * reviews are still due, so a backlog slows progress through the list instead
 * of stopping it.
 */
export const REVIEWS_PER_NEW = 2;

/** A topic opens once its prerequisites are meaningfully underway. */
const PREREQ_THRESHOLD = 0.6;

async function unlockedTopics(): Promise<Set<string>> {
  const topicRows = await db.select().from(schema.topics).orderBy(asc(schema.topics.order));

  const progress = await db
    .select({
      topic: schema.problems.topic,
      total: sql<number>`count(*)::int`,
      // Having a card means the problem was worked, which is what gates the next
      // topic. Counting reps instead made struggling look like never starting:
      // a grade under 3 resets reps, so a topic fought through and failed scored
      // as untouched and its dependent stayed locked.
      started: sql<number>`count(${schema.cards.slug})::int`,
    })
    .from(schema.problems)
    .leftJoin(schema.cards, eq(schema.cards.slug, schema.problems.slug))
    .groupBy(schema.problems.topic);

  const ratio = new Map(progress.map((p) => [p.topic, p.total ? p.started / p.total : 0]));

  const unlocked = new Set<string>();
  // topicRows is in dependency order, so a single forward pass resolves the DAG.
  for (const t of topicRows) {
    const ready = t.prereqs.every((p) => (ratio.get(p) ?? 0) >= PREREQ_THRESHOLD);
    if (ready) unlocked.add(t.key);
  }
  // Never hand back an empty queue just because nothing is started yet.
  if (unlocked.size === 0 && topicRows[0]) unlocked.add(topicRows[0].key);
  return unlocked;
}

/** How many of the latest attempts were reviews, counting back to the last new one. */
async function reviewsInARow(): Promise<number> {
  const recent = await db
    .select({ isReview: schema.attempts.isReview })
    .from(schema.attempts)
    .where(eq(schema.attempts.abandoned, false))
    .orderBy(desc(schema.attempts.servedAt))
    .limit(REVIEWS_PER_NEW);
  const firstNew = recent.findIndex((a) => !a.isReview);
  return firstNew === -1 ? recent.length : firstNew;
}

/** Reviews come first, but every REVIEWS_PER_NEW of them a new problem cuts in. */
export async function pickNext(): Promise<Pick | null> {
  const now = new Date();

  if ((await reviewsInARow()) >= REVIEWS_PER_NEW) {
    const [fresh] = await newProblems(1);
    if (fresh) return fresh;
  }

  const due = await db
    .select({
      slug: schema.problems.slug,
      title: schema.problems.title,
      difficulty: schema.problems.difficulty,
    })
    .from(schema.cards)
    .innerJoin(schema.problems, eq(schema.problems.slug, schema.cards.slug))
    .where(and(lte(schema.cards.dueAt, now), sql`${schema.cards.state} <> 'buried'`))
    .orderBy(asc(schema.cards.dueAt))
    .limit(1);

  if (due[0]) return { ...due[0], isReview: true };
  const [fresh] = await newProblems(1);
  return fresh ?? null;
}

/**
 * The order pickNext will serve things in, assuming each is solved as served:
 * the same two-reviews-then-a-new rhythm, over what is due now and the next
 * new problems in NeetCode 150 order.
 */
export async function upNext(limit = 12): Promise<(Pick & { dueAt: Date | null })[]> {
  const now = new Date();
  const due = (await dueList(0)).filter((d) => d.overdue);
  const fresh = await newProblems(limit);
  let inARow = await reviewsInARow();

  const out: (Pick & { dueAt: Date | null })[] = [];
  while (out.length < limit && (due.length || fresh.length)) {
    if (fresh.length && (inARow >= REVIEWS_PER_NEW || !due.length)) {
      out.push({ ...fresh.shift()!, dueAt: null });
      inARow = 0;
    } else {
      const r = due.shift()!;
      out.push({ slug: r.slug, title: r.title, difficulty: r.difficulty, isReview: true, dueAt: r.dueAt ?? now });
      inARow += 1;
    }
  }
  return out;
}

/** The next unseen problems in NeetCode 150 order, among topics that are open. */
async function newProblems(n: number): Promise<Pick[]> {
  const unlocked = await unlockedTopics();
  if (unlocked.size === 0) return [];

  const fresh = await db
    .select({
      slug: schema.problems.slug,
      title: schema.problems.title,
      difficulty: schema.problems.difficulty,
      topic: schema.problems.topic,
    })
    .from(schema.problems)
    .leftJoin(schema.cards, eq(schema.cards.slug, schema.problems.slug))
    .where(
      and(
        isNull(schema.cards.slug),
        sql`${schema.problems.topic} = ANY(${sql.raw(`ARRAY[${[...unlocked].map((t) => `'${t}'`).join(",")}]`)})`,
      ),
    )
    .orderBy(asc(schema.problems.topicOrder), asc(schema.problems.orderInTopic))
    .limit(n);

  return fresh.map((f) => ({ ...f, isReview: false }));
}

/** How many reviews are already overdue — drives the escalation copy. */
export async function dueCount(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.cards)
    .where(and(lte(schema.cards.dueAt, new Date()), sql`${schema.cards.state} <> 'buried'`));
  return row?.n ?? 0;
}

export async function openAttempt() {
  const rows = await db
    .select()
    .from(schema.attempts)
    .where(and(isNull(schema.attempts.solvedAt), eq(schema.attempts.abandoned, false)))
    .orderBy(asc(schema.attempts.servedAt))
    .limit(1);
  return rows[0] ?? null;
}

/** What is owed now, plus what comes due in the next week. */
export async function dueList(horizonDays = 7) {
  const now = new Date();
  const horizon = new Date(now.getTime() + horizonDays * 86_400_000);
  // `lte` encodes the Date through the column; a Date inside a raw sql`` fragment
  // reaches postgres-js unencoded and throws ERR_INVALID_ARG_TYPE.
  const rows = await db
    .select({
      slug: schema.problems.slug,
      title: schema.problems.title,
      difficulty: schema.problems.difficulty,
      dueAt: schema.cards.dueAt,
    })
    .from(schema.cards)
    .innerJoin(schema.problems, eq(schema.problems.slug, schema.cards.slug))
    .where(and(lte(schema.cards.dueAt, horizon), sql`${schema.cards.state} <> 'buried'`))
    .orderBy(asc(schema.cards.dueAt));
  return rows.map((r) => ({ ...r, overdue: Boolean(r.dueAt && r.dueAt <= now) }));
}
