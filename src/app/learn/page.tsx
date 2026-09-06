import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Renders the lesson without pulling in a markdown dependency: the generator is
 * told exactly which headings to emit, so the shapes here are the shapes it uses.
 */
function Lesson({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = text.split("\n");
  let code: string[] | null = null;
  let list: string[] = [];

  const flushList = (k: string) => {
    if (!list.length) return;
    blocks.push(
      <ul key={k} className="mt-2 space-y-1.5 text-neutral-300">
        {list.map((li, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-neutral-600">·</span>
            <span dangerouslySetInnerHTML={{ __html: inline(li) }} />
          </li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line.startsWith("```")) {
      if (code) {
        blocks.push(
          <pre key={`c${i}`} className="mt-3 overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs leading-relaxed text-emerald-200">
            <code>{code.join("\n")}</code>
          </pre>,
        );
        code = null;
      } else {
        flushList(`l${i}`);
        code = [];
      }
      return;
    }
    if (code) return void code.push(raw);
    if (line.startsWith("## ")) {
      flushList(`l${i}`);
      blocks.push(
        <h2 key={`h${i}`} className="mt-7 text-sm font-medium tracking-wide text-emerald-400">
          {line.slice(3)}
        </h2>,
      );
      return;
    }
    if (line.startsWith("- ")) return void list.push(line.slice(2));
    if (!line.trim()) return void flushList(`l${i}`);
    flushList(`l${i}`);
    blocks.push(
      <p key={`p${i}`} className="mt-2 text-neutral-300" dangerouslySetInnerHTML={{ __html: inline(line) }} />,
    );
  });
  flushList("last");
  return <div className="text-sm leading-relaxed">{blocks}</div>;
}

/** Bold and inline code only — everything else is left as written. */
function inline(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium text-neutral-100">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-neutral-800 px-1 py-0.5 text-[12px] text-emerald-200">$1</code>');
}

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
          <Lesson text={current.lesson} />
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
