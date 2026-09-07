import { and, asc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export type Pick = { slug: string; title: string; difficulty: string; isReview: boolean };

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

/** Reviews always outrank new material — retention beats coverage. */
export async function pickNext(): Promise<Pick | null> {
  const now = new Date();

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

  const unlocked = await unlockedTopics();
  if (unlocked.size === 0) return null;

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
    .limit(1);

  return fresh[0] ? { ...fresh[0], isReview: false } : null;
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
