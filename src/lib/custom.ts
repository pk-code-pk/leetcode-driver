import maxRequestsInWindow from "../../data/custom/max-requests-in-window.json";

/**
 * Questions that aren't on LeetCode — OA questions, your own — solved in the
 * built-in IDE instead. The shape follows cojudge's problem format, collapsed into
 * one JSON file: a statement, the signature to call, and test cases that carry
 * their expected output (there is no reference marker to compute it from).
 */
export type CustomProblem = {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  /** The menu groups by this, e.g. "OA" or "Custom". */
  category: string;
  tags: string[];
  /** Markdown, in the subset the lesson renderer understands. */
  statement: string;
  /** Called as Solution().<functionName>(*args in params order). */
  functionName: string;
  params: string[];
  starterCode: { python: string };
  tests: { args: Record<string, unknown>; expected: unknown }[];
  hints?: string[];
  /** A reference solution, hidden until you ask for it. */
  solution?: string;
};

/** To add a question: drop a JSON file in data/custom/ and list it here. */
export const customProblems: CustomProblem[] = [
  maxRequestsInWindow as CustomProblem,
];

export const customProblem = (slug: string) => customProblems.find((p) => p.slug === slug);
