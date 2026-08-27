import "dotenv/config";
import { readFileSync } from "fs";
import { db, schema } from "../src/db";
import { problemUrl, questionMeta } from "../src/lib/leetcode";

type Data = {
  topics: {
    key: string; label: string; prereqs: string[];
    problems: { slug: string; title: string; difficulty: string; number: number }[];
  }[];
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const data = JSON.parse(
    readFileSync(new URL("../data/neetcode150.json", import.meta.url), "utf8"),
  ) as Data;

  const skipTags = process.argv.includes("--no-tags");
  let n = 0;
  let tagged = 0;
  let hinted = 0;

  for (const [topicOrder, topic] of data.topics.entries()) {
    const t = { key: topic.key, label: topic.label, prereqs: topic.prereqs, order: topicOrder };
    await db.insert(schema.topics).values(t).onConflictDoUpdate({ target: schema.topics.key, set: t });

    for (const [orderInTopic, p] of topic.problems.entries()) {
      // Official LeetCode tags are the pattern label — free, no key, no scraping.
      let tags: string[] = [];
      let officialHints: string[] = [];
      if (!skipTags) {
        try {
          const meta = await questionMeta(p.slug);
          tags = meta?.topicTags?.map((x) => x.name) ?? [];
          officialHints = meta?.hints ?? [];
          if (tags.length) tagged++;
          if (officialHints.length) hinted++;
        } catch (e) {
          console.warn(`  ! tags failed for ${p.slug}: ${(e as Error).message}`);
        }
        await sleep(150); // be polite to the public endpoint
      }

      const row = {
        slug: p.slug, title: p.title, difficulty: p.difficulty,
        topic: topic.key, topicOrder, orderInTopic, url: problemUrl(p.slug), tags, officialHints,
      };
      await db.insert(schema.problems).values(row).onConflictDoUpdate({
        target: schema.problems.slug,
        // Don't clobber good tags with an empty array if a fetch failed.
        set: tags.length ? row : { ...row, tags: undefined as unknown as string[] },
      });
      n++;
      if (n % 25 === 0) console.log(`  ${n}/150…`);
    }
  }

  await db.insert(schema.settings).values({ id: 1 }).onConflictDoNothing();
  console.log(`seeded ${data.topics.length} topics, ${n} problems, ${tagged} tagged, ${hinted} with official hints`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
