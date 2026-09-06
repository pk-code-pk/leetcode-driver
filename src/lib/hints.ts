import OpenAI from "openai";

/** Override if you want a cheaper or newer model; verified at call time. */
const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-terra";

/** Optional feature. Without a key the app runs fine, minus generated hints. */
export const hintsAvailable = () => Boolean(process.env.OPENAI_API_KEY);

let cached: OpenAI | null = null;
function client(): OpenAI {
  if (!cached) cached = new OpenAI();
  return cached;
}

/** One place to issue a completion, so every caller shares the same shape. */
async function complete(system: string, user: string, maxTokens: number): Promise<string> {
  const r = await client().chat.completions.create({
    model: MODEL,
    max_completion_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return (r.choices[0]?.message?.content ?? "").trim();
}

/**
 * The rescue ladder. Level 1 is a nudge; level 4 is a plan. We never emit a
 * complete solution — the point is to unblock, not to hand over the answer.
 */
const LADDER: Record<number, string> = {
  1: "Name the algorithmic pattern this problem wants, and nothing else. One short sentence.",
  2: "Give the single key insight that unlocks this problem. Two sentences maximum. No code, no step-by-step.",
  3: "Outline the approach in 3-5 bullets: data structure, invariant, and how the loop advances. No code.",
  4: "Give language-agnostic pseudocode plus the time and space complexity. Real compilable code is forbidden.",
};

export type Hint = { text: string; source: "official" | "generated" | "tags" | "link"; html?: boolean };

/**
 * The layered ladder. Sourced free wherever possible, generated only to fill
 * the gaps — LeetCode publishes hints for just ~30% of the NeetCode 150, so
 * generation is what makes the other 70% work at all.
 *
 *   1. LeetCode's own hint for this level  (free, best, ~30% coverage)
 *   2. Claude-generated hint at this level (needs a key, 100% coverage)
 *   3. Official topic tags                 (free, 100%, level 1 only)
 *   4. A link to NeetCode's walkthrough    (free, always available)
 */
export async function getHint(opts: {
  title: string;
  slug: string;
  level: number;
  officialHints: string[];
  tags: string[];
}): Promise<Hint> {
  const { title, slug, level, officialHints, tags } = opts;

  const official = officialHints[level - 1];
  if (official) return { text: official, source: "official", html: true };

  const generated = await generateHint(title, slug, level);
  if (generated) return { text: generated, source: "generated" };

  if (level === 1 && tags.length) {
    return { text: `Tagged: <b>${tags.join(" · ")}</b>`, source: "tags", html: true };
  }

  const search = `https://www.youtube.com/results?search_query=${encodeURIComponent(`neetcode ${title}`)}`;
  return { text: `No free hint available for this one.

<a href="${search}">NeetCode walkthrough →</a>`, source: "link", html: true };
}

/**
 * Returns null when generation is unavailable so callers can fall back rather
 * than surface an error to the phone.
 */
export async function generateHint(title: string, slug: string, level: number): Promise<string | null> {
  if (!hintsAvailable()) return null;
  const instruction = LADDER[Math.min(4, Math.max(1, level))];
  try {
    const text = await complete(
      "You are a LeetCode coach helping someone who is stuck mid-attempt. " +
        "Escalate hints slowly. Never reveal a full working solution, even if asked. " +
        "Be terse — this is read on a phone lock screen.",
      `Problem: "${title}" (leetcode.com/problems/${slug}/)\n\nHint level ${level}. ${instruction}`,
      2000,
    );
    return text || null;
  } catch (e) {
    console.error("[hints] generation failed:", e);
    return null;
  }
}

/**
 * One-line pattern summary of your own accepted solution, generated on solve so
 * that a review three weeks later has context without you ever writing a note.
 */
export async function generatePatternNote(
  title: string,
  code: string,
  lang: string,
): Promise<string | null> {
  if (!hintsAvailable()) return null;
  try {
    const text = await complete(
      "Summarize the algorithmic technique in a submitted solution in ONE sentence " +
        "under 20 words. Name the pattern and the key invariant. No preamble.",
      `Problem: ${title}\nLanguage: ${lang}\n\n\`\`\`\n${code.slice(0, 8000)}\n\`\`\``,
      400,
    );
    return text.slice(0, 300) || null;
  } catch (e) {
    console.error("[hints] pattern note failed:", e);
    return null;
  }
}

/**
 * Turn your own account of the attempt into an SM-2 grade.
 *
 * Timing and failed submissions are proxies; what you actually remember about
 * the struggle is the better signal, so a written note outranks the inferred
 * grade when one is given.
 */
export async function gradeFromNotes(
  title: string,
  notes: string,
  difficulty: string,
  durationSec: number | null,
  code?: string | null,
  telemetry?: { failedSubmissions?: number; hintLevel?: number },
): Promise<{ grade: number; summary: string } | null> {
  if (!hintsAvailable()) return null;
  const mins = durationSec ? Math.round(durationSec / 60) : null;
  try {
    const raw = await complete(
      "You convert a solver's own account of an attempt into a spaced-repetition grade.\n" +
        "Scale: 5 = instant and certain, and the intended optimal approach; " +
        "4 = optimal approach with minor friction; " +
        "3 = solved unaided but not optimally (brute force, or worse time or space " +
        "complexity than the problem is asking for), or optimal but slow and shaky; " +
        "2 = heavy struggle, needed a hint or the key idea from outside; " +
        "1 = could not produce a working solution without being walked through it; " +
        "0 = did not solve it at all.\n" +
        "You are shown their accepted code when available: judge optimality from it, " +
        "not from how confident the note sounds.\n" +
        "Reserve 0 and 1 for cases where they could NOT produce working code themselves. " +
        "Needing a nudge or a single key idea and then writing correct code unaided is a 2, " +
        "never a 1.\n" +
        "Weigh the writer's description of struggle far more than elapsed time.\n" +
        "Solving quickly after being given the key idea is not fluency: grade what it " +
        "took them to FIND the approach, not how fast they wrote it once they had it. " +
        "A hint from any source — a friend, a video, an editorial, a search — counts " +
        "as help even when the app recorded no hint.\n" +
        "Failed attempts are a weak signal: the count cannot distinguish a wrong " +
        "submission from running the code against sample tests, so treat it as " +
        "corroboration of what they wrote, never as evidence against it.\n" +
        'Reply as strict JSON only: {"grade": <0-5 integer>, "summary": "<max 15 words>"}',
      `Problem: ${title} (${difficulty})\n` +
        (mins != null ? `Time: ${mins} min\n` : "") +
        (telemetry?.failedSubmissions
          ? `Failed attempts (may include test runs): ${telemetry.failedSubmissions}\n`
          : "") +
        (telemetry?.hintLevel ? `In-app hints used: ${telemetry.hintLevel} of 4\n` : "") +
        `\nTheir notes:\n${notes.slice(0, 4000)}` +
        (code ? `\n\nTheir accepted solution:\n\`\`\`\n${code.slice(0, 4000)}\n\`\`\`` : ""),
      600,
    );
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as { grade?: unknown; summary?: unknown };
    const grade = Number(parsed.grade);
    if (!Number.isFinite(grade)) return null;
    return {
      grade: Math.max(0, Math.min(5, Math.round(grade))),
      summary: String(parsed.summary ?? "").slice(0, 200),
    };
  } catch (e) {
    console.error("[hints] note grading failed:", e);
    return null;
  }
}

/**
 * Teach a pattern before the problems test it.
 *
 * The driver is otherwise pure assessment: it can tell you a topic went badly
 * but never that you have not met it yet. Sixteen of the eighteen topics are
 * untouched at the point of writing, so "never learned it" is the common case,
 * not the edge one.
 */
export async function generateLesson(opts: {
  label: string;
  problems: string[];
  prereqs: string[];
  weakSpots?: string;
}): Promise<string | null> {
  if (!hintsAvailable()) return null;
  const { label, problems, prereqs, weakSpots } = opts;
  try {
    return (
      (await complete(
        "You teach one algorithmic pattern to someone preparing for interviews, who has " +
          "not met it before. Write for someone who codes in Python.\n" +
          "Structure, using these exact headings:\n" +
          "## The idea\n(the mental model in 3-4 sentences — what the pattern exploits, and why it works)\n" +
          "## When it applies\n(3-5 concrete signals in a problem statement that should make them reach for it)\n" +
          "## The shape\n(a short Python template, under 15 lines, with the invariant named in a comment)\n" +
          "## Complexity\n(one line, and what it replaces — e.g. O(n) instead of the O(n^2) brute force)\n" +
          "## Where it goes wrong\n(3-4 specific mistakes, not generic advice)\n" +
          "## The variants\n(one line per problem listed, saying what that problem twists)\n\n" +
          "Be concrete and terse. No pep talk, no restating the headings. Never give a " +
          "complete solution to any named problem — the template plus what each variant " +
          "twists is the limit.",
        `Pattern: ${label}\n` +
          (prereqs.length ? `Assumes they already know: ${prereqs.join(", ")}\n` : "") +
          `Problems in this topic: ${problems.join(", ")}\n` +
          (weakSpots ? `\nKnown habits of this learner, address them where relevant:\n${weakSpots}\n` : ""),
        4000,
      )) || null
    );
  } catch (e) {
    console.error("[hints] lesson failed:", e);
    return null;
  }
}
