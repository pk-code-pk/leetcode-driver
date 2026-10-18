import Link from "next/link";
import { customProblems } from "@/lib/custom";

const tone: Record<string, string> = {
  Easy: "text-emerald-400",
  Medium: "text-amber-400",
  Hard: "text-rose-400",
};

/** The menu for questions that live here rather than on LeetCode, grouped by category. */
export default function IdeMenu() {
  const groups = new Map<string, typeof customProblems>();
  for (const p of customProblems) groups.set(p.category, [...(groups.get(p.category) ?? []), p]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-medium text-neutral-100">Custom & OA questions</h1>
        <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300">
          ← dashboard
        </Link>
      </div>
      <p className="mt-1 text-sm text-neutral-400">
        Not on LeetCode, so they run here: Python in your browser, checked against the stored tests.
      </p>

      {[...groups].map(([category, list]) => (
        <section key={category} className="mt-8">
          <h2 className="text-sm font-medium text-neutral-300">
            {category} <span className="text-neutral-600">· {list.length}</span>
          </h2>
          <ul className="mt-3 space-y-1.5">
            {list.map((p) => (
              <li key={p.slug} className="flex items-center gap-3 text-sm">
                <Link href={`/ide/${p.slug}`} className="flex-1 truncate text-neutral-300 hover:text-emerald-400">
                  {p.title}
                </Link>
                <span className="hidden truncate text-neutral-600 sm:block">{p.tags.join(" · ")}</span>
                <span className={`w-16 shrink-0 text-right ${tone[p.difficulty] ?? ""}`}>{p.difficulty}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
