import { DateTime } from "luxon";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "@/lib/settings";
import { dueCount } from "@/lib/queue";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Timestamps read as wrong unless they are in the timezone you practise in. */
const stamp = (d: Date, zone: string, fmt = "MM-dd HH:mm") =>
  DateTime.fromJSDate(d).setZone(zone).toFormat(fmt);

/** The grade is the whole point of the log, so say what it means. */
const GRADE_LABEL: Record<number, string> = {
  5: "optimal, instant",
  4: "optimal, some friction",
  3: "solved, not optimal",
  2: "needed a hint",
  1: "walked through",
  0: "did not solve",
};

const gradeTone = (g: number | null) =>
  g == null ? "text-neutral-600"
    : g >= 4 ? "text-emerald-400"
    : g === 3 ? "text-amber-400"
    : "text-rose-400";

/** Read-only. The bot is the interface; this is just the look-back. */
export default async function Home() {
  // Sequential on purpose: through a transaction-mode pooler, firing these
  // concurrently over a small pool stalls until the function times out.
  const s = await getSettings();
  const due = await dueCount();
  const totals = await db
    .select({
      solved: sql<number>`count(*)::int`,
      avgEase: sql<number>`coalesce(avg(${schema.cards.ease}), 0)::float`,
      lapses: sql<number>`coalesce(sum(${schema.cards.lapses}), 0)::int`,
    })
    .from(schema.cards);
  const byTopic = await db
    .select({
      topic: schema.problems.topic,
      total: sql<number>`count(*)::int`,
      done: sql<number>`count(${schema.cards.slug})::int`,
    })
    .from(schema.problems)
    .leftJoin(schema.cards, sql`${schema.cards.slug} = ${schema.problems.slug}`)
    .groupBy(schema.problems.topic, schema.problems.topicOrder)
    .orderBy(schema.problems.topicOrder);
  // Per problem, not per event: the raw feed repeated every resubmit and never
  // said how any of it went.
  const history = await db
    .select({
      slug: schema.cards.slug,
      title: schema.problems.title,
      lastGrade: schema.cards.lastGrade,
      lastSolvedAt: schema.cards.lastSolvedAt,
      lastDurationSec: schema.cards.lastDurationSec,
      dueAt: schema.cards.dueAt,
    })
    .from(schema.cards)
    .innerJoin(schema.problems, eq(schema.problems.slug, schema.cards.slug))
    .orderBy(desc(schema.cards.lastSolvedAt))
    .limit(15);

  const t = totals[0] ?? { solved: 0, avgEase: 0, lapses: 0 };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">LeetCode Driver</h1>
      <p className="mt-1 text-sm text-neutral-400">It picks, it nags, you solve.</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Due now" value={due} accent={due > 0} />
        <Stat label="Streak" value={s.streak} />
        <Stat label="Debt" value={s.debt} accent={s.debt > 0} />
        <Stat label="Solved" value={`${t.solved}/150`} />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-neutral-300">Coverage</h2>
        <ul className="mt-3 space-y-1.5">
          {byTopic.map((row) => (
            <li key={row.topic} className="flex items-center gap-3 text-sm">
              <span className="w-44 shrink-0 truncate text-neutral-400">{row.topic}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-800">
                <span
                  className="block h-full rounded-full bg-emerald-500"
                  style={{ width: `${(row.done / row.total) * 100}%` }}
                />
              </span>
              <span className="w-12 shrink-0 text-right tabular-nums text-neutral-500">
                {row.done}/{row.total}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-neutral-300">Recent</h2>
        <ul className="mt-3 space-y-1.5">
          {history.map((h) => (
            <li key={h.slug} className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0 tabular-nums text-neutral-600">
                {h.lastSolvedAt ? stamp(h.lastSolvedAt, s.timezone) : "—"}
              </span>
              <span
                className={`w-6 shrink-0 text-center font-medium tabular-nums ${gradeTone(h.lastGrade)}`}
                title={GRADE_LABEL[h.lastGrade ?? -1] ?? ""}
              >
                {h.lastGrade ?? "—"}
              </span>
              <span className="flex-1 truncate text-neutral-300">{h.title}</span>
              <span className="w-32 shrink-0 truncate text-right text-neutral-600">
                {GRADE_LABEL[h.lastGrade ?? -1] ?? ""}
              </span>
              <span className="w-12 shrink-0 text-right tabular-nums text-neutral-500">
                {h.lastDurationSec ? `${Math.round(h.lastDurationSec / 60)}m` : "—"}
              </span>
              <span className="w-16 shrink-0 text-right tabular-nums text-neutral-600">
                {h.dueAt ? `due ${stamp(h.dueAt, s.timezone, "MM-dd")}` : "—"}
              </span>
            </li>
          ))}
          {history.length === 0 && <li className="text-neutral-600">nothing yet</li>}
        </ul>
      </section>

      <p className="mt-10 text-xs text-neutral-600">
        avg ease {t.avgEase.toFixed(2)} · {t.lapses} lapses · last sync{" "}
        {s.lastSyncAt ? stamp(s.lastSyncAt, s.timezone, "MM-dd HH:mm ZZZZ") : "never"}
      </p>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className={`mt-0.5 text-xl font-semibold tabular-nums ${accent ? "text-amber-400" : ""}`}>
        {value}
      </div>
    </div>
  );
}
