import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { customProblems } from "./custom";

/** Topic key for a custom category. The prefix is what marks a row as ours. */
export const customTopic = (category: string) =>
  `custom:${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/** Hints are sent to Telegram as HTML, the way LeetCode's own hints are stored. */
const html = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Put the custom questions into the catalog, so they get cards, attempts and
 * reviews exactly like the NeetCode 150.
 *
 * Each category becomes a topic with no prerequisites, ordered ahead of the
 * NeetCode topics: you added a question because you want it soon, so it is
 * served as the next new problem rather than after the other 150.
 */
async function upsert() {
  const categories = [...new Set(customProblems.map((p) => p.category))];
  for (const [i, category] of categories.entries()) {
    const t = {
      key: customTopic(category),
      label: category === "OA" ? "OA questions" : category,
      prereqs: [],
      order: i - categories.length,
    };
    await db.insert(schema.topics).values(t)
      .onConflictDoUpdate({ target: schema.topics.key, set: { label: t.label, order: t.order } });

    const list = customProblems.filter((p) => p.category === category);
    for (const [orderInTopic, p] of list.entries()) {
      const row = {
        slug: p.slug,
        title: p.title,
        difficulty: p.difficulty,
        topic: t.key,
        topicOrder: t.order,
        orderInTopic,
        url: `/ide/${p.slug}`,
        tags: p.tags,
        officialHints: (p.hints ?? []).map(html),
      };
      await db.insert(schema.problems).values(row).onConflictDoUpdate({
        target: schema.problems.slug,
        set: row,
        // A slug that collides with a LeetCode problem must not hijack it.
        setWhere: sql`${schema.problems.topic} like 'custom:%'`,
      });
    }
  }
}

let synced: Promise<void> | null = null;

/**
 * Once per process: adding a JSON file and deploying is enough, with no seed
 * step. A failure is retried on the next call rather than cached.
 */
export function syncCustomProblems(): Promise<void> {
  synced ??= upsert().catch((e) => {
    synced = null;
    console.error("[custom] catalog sync failed:", e);
  });
  return synced;
}
