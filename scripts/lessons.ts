import "dotenv/config";
import { asc, eq, isNull } from "drizzle-orm";
import { db, schema } from "../src/db";
import { generateLesson } from "../src/lib/hints";

const WEAK_SPOTS =
  "Tends not to trust a data structure to do its job — adds guards or scanning on top " +
  "instead of choosing the shape that makes the bad case impossible. Writes C-style index " +
  "loops in Python (range(len(x)), manual while loops with sentinels) rather than iterating " +
  "directly, which adds state to track by hand.";

(async () => {
  const topics = await db.select().from(schema.topics).where(isNull(schema.topics.lesson)).orderBy(asc(schema.topics.order));
  const all = await db.select({ key: schema.topics.key, label: schema.topics.label }).from(schema.topics);
  const nameOf = (k: string) => all.find((l) => l.key === k)?.label ?? k;
  console.log(`generating ${topics.length} lessons`);

  for (const t of topics) {
    const problems = await db
      .select({ title: schema.problems.title })
      .from(schema.problems)
      .where(eq(schema.problems.topic, t.key))
      .orderBy(asc(schema.problems.orderInTopic));
    const t0 = Date.now();
    const lesson = await generateLesson({
      label: t.label,
      problems: problems.map((p) => p.title),
      prereqs: (t.prereqs ?? []).map(nameOf),
      weakSpots: WEAK_SPOTS,
    });
    if (!lesson) { console.log(`  ${t.key.padEnd(22)} FAILED`); continue; }
    await db.update(schema.topics).set({ lesson, lessonAt: new Date() }).where(eq(schema.topics.key, t.key));
    console.log(`  ${t.key.padEnd(22)} ok ${Math.round((Date.now()-t0)/1000)}s ${lesson.length}ch`);
  }
  process.exit(0);
})();
