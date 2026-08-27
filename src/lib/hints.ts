import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5";

/** Optional feature. Without a key the app runs fine, minus generated hints. */
export const hintsAvailable = () => Boolean(process.env.ANTHROPIC_API_KEY);

let cached: Anthropic | null = null;
function client(): Anthropic {
  if (!cached) cached = new Anthropic();
  return cached;
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

function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

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
    const response = await client().messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system:
        "You are a LeetCode coach helping someone who is stuck mid-attempt. " +
        "Escalate hints slowly. Never reveal a full working solution, even if asked. " +
        "Be terse — this is read on a phone lock screen.",
      messages: [
        {
          role: "user",
          content: `Problem: "${title}" (leetcode.com/problems/${slug}/)\n\nHint level ${level}. ${instruction}`,
        },
      ],
    });
    return textOf(response.content) || null;
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
    const response = await client().messages.create({
      model: MODEL,
      max_tokens: 1000,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      system:
        "Summarize the algorithmic technique in a submitted solution in ONE sentence " +
        "under 20 words. Name the pattern and the key invariant. No preamble.",
      messages: [
        { role: "user", content: `Problem: ${title}\nLanguage: ${lang}\n\n\`\`\`\n${code.slice(0, 8000)}\n\`\`\`` },
      ],
    });
    return textOf(response.content).slice(0, 300) || null;
  } catch (e) {
    console.error("[hints] pattern note failed:", e);
    return null;
  }
}
