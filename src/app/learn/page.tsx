import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { Markdown } from "@/components/Markdown";

export const dynamic = "force-dynamic";

export default async function Learn({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; slug?: string }>;
}) {
  const sp = await searchParams;

  // Reached from a problem page, so a slug is the more natural way in.
  let key = sp.topic;
  if (!key && sp.slug) {
    const [p] = await db
      .select({ topic: schema.problems.topic })
      .from(schema.problems)
      .where(eq(schema.problems.slug, sp.slug));
    key = p?.topic;
  }

  const rows = await db
    .select({
      key: schema.topics.key,
      label: schema.topics.label,
      order: schema.topics.order,
      total: sql<number>`count(${schema.problems.slug})::int`,
      done: sql<number>`count(${schema.cards.slug})::int`,
    })
    .from(schema.topics)
    .leftJoin(schema.problems, eq(schema.problems.topic, schema.topics.key))
    .leftJoin(schema.cards, eq(schema.cards.slug, schema.problems.slug))
    // A custom category is a grab bag, not a pattern, so it has no lesson to show.
    .where(sql`${schema.topics.key} not like 'custom:%'`)
    .groupBy(schema.topics.key, schema.topics.label, schema.topics.order)
    .orderBy(asc(schema.topics.order));

  const current = key ? await db.select().from(schema.topics).where(eq(schema.topics.key, key)).then((r) => r[0]) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-medium text-neutral-100">
          {current ? current.label : "Patterns"}
        </h1>
        <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300">
          ← dashboard
        </Link>
      </div>

      {current?.lesson ? (
        <>
          <Markdown text={current.lesson} />
          <p className="mt-10 text-xs text-neutral-600">
            <Link href="/learn" className="hover:text-neutral-400">
              all patterns
            </Link>
          </p>
        </>
      ) : (
        <ul className="mt-6 space-y-1.5">
          {rows.map((t) => (
            <li key={t.key} className="flex items-center gap-3 text-sm">
              <Link href={`/learn?topic=${t.key}`} className="flex-1 truncate text-neutral-300 hover:text-emerald-400">
                {t.label}
              </Link>
              <span className="h-1.5 w-28 overflow-hidden rounded-full bg-neutral-800">
                <span
                  className="block h-full rounded-full bg-emerald-500"
                  style={{ width: `${t.total ? (t.done / t.total) * 100 : 0}%` }}
                />
              </span>
              <span className="w-12 shrink-0 text-right tabular-nums text-neutral-600">
                {t.done}/{t.total}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
