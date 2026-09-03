/**
 * SM-2 scheduling plus the grade-inference layer that removes self-rating.
 *
 * Standard SM-2 asks the user for a 0-5 recall grade. We derive it instead from
 * submission telemetry: how long the attempt took relative to a difficulty
 * baseline, how many submissions were rejected, and how many hints were spent.
 */

export type CardState = {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
};

export type Telemetry = {
  durationSec: number | null;
  failedSubmissions: number;
  hintLevel: number;
  difficulty: string; // Easy | Medium | Hard
  isReview: boolean;
};

const MAX_INTERVAL_DAYS = 180;

/** Minutes a clean first solve is expected to take. */
export const BASELINE_MIN: Record<string, number> = { Easy: 12, Medium: 25, Hard: 45 };

/**
 * Map telemetry onto the SM-2 0-5 scale.
 * 5 = instant and clean, 3 = solved but a struggle, <3 = a lapse.
 */
export function inferGrade(t: Telemetry): number {
  let score = 5;

  // A review should be markedly faster than a first encounter.
  const baseline = (BASELINE_MIN[t.difficulty] ?? 25) * (t.isReview ? 0.5 : 1);

  // A problem left open overnight says nothing about how hard it was. Past this
  // point the timing signal is noise, so treat it as missing rather than as a
  // catastrophic solve.
  const STALE_SEC = 4 * 3600;
  const timed = t.durationSec != null && t.durationSec > 0 && t.durationSec < STALE_SEC;

  if (timed) {
    const ratio = t.durationSec! / 60 / baseline;
    if (ratio > 2.0) score -= 2.5;      // more than double the baseline
    else if (ratio > 1.5) score -= 2;
    else if (ratio > 1.0) score -= 1;   // over baseline, but not badly
    else if (ratio > 0.5) score -= 0.5;
  } else {
    // No timing signal (e.g. solved outside a served attempt): stay neutral.
    score -= 1;
  }

  const f = t.failedSubmissions;
  if (f >= 5) score -= 2;
  else if (f >= 3) score -= 1.5;
  else if (f === 2) score -= 1;
  else if (f === 1) score -= 0.5;

  score -= Math.min(3, t.hintLevel);

  // Round ties DOWN: a half-point penalty must always cost something, otherwise
  // a baseline-speed clean solve (4.5) reads as "Easy" and the interval overshoots.
  return Math.max(0, Math.min(5, Math.floor(score + 0.5 - 1e-9)));
}

/** Apply one graded review to a card, returning the next state and due date. */
export function schedule(card: CardState, grade: number, now: Date) {
  let { ease, intervalDays, reps, lapses } = card;

  // Ease is updated *before* the interval is derived, per SM-2. Doing it after
  // makes this repetition's multiplier ignore this repetition's grade, so a
  // shaky recall and a fluent one schedule identically.
  ease = Math.max(1.3, ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));

  if (grade < 3) {
    // Lapse. Textbook SM-2 resets to a 1-day interval and reps=0, which makes
    // lapsed problems pile up and re-lapse. Instead: step the ladder *back*
    // rather than to zero, and floor the interval at 3 days.
    // (Anti-pileup idea adapted from JMoooore/GoStudyNeetCode, MIT.)
    lapses += 1;
    // On a first encounter there is no ladder to step back down, and a 3-day
    // floor would delay a failed problem longer than an aced one.
    const firstEncounter = reps === 0;
    reps = Math.max(0, reps - 2);
    intervalDays = firstEncounter ? 1 : 3;
  } else {
    reps += 1;
    // A first pass still separates a fluent solve from a shaky one, otherwise
    // every grade above 2 collapses to the same one-day interval.
    if (reps === 1) intervalDays = grade >= 5 ? 3 : grade === 4 ? 2 : 1;
    else if (reps === 2) intervalDays = 6;
    else intervalDays = Math.min(MAX_INTERVAL_DAYS, Math.round(intervalDays * ease));
  }

  const dueAt = new Date(now.getTime() + intervalDays * 86_400_000);
  const state: "learning" | "review" = grade < 3 || reps < 2 ? "learning" : "review";

  return { ease, intervalDays, reps, lapses, dueAt, state };
}

export const GRADE_LABEL: Record<number, string> = {
  0: "Blank", 1: "Failed", 2: "Hard", 3: "Struggled", 4: "Good", 5: "Easy",
};
