import { REVIEW_BLIND_DAYS } from "./config";

/**
 * Reviews are double-blind: neither side sees the other's review until both
 * have submitted, or until the review window has passed.
 */
export function reviewVisible(opts: { bothSubmitted: boolean; completedAt: Date | null; now?: Date }): boolean {
  if (opts.bothSubmitted) return true;
  if (!opts.completedAt) return false;
  const now = opts.now ?? new Date();
  return now.getTime() - opts.completedAt.getTime() >= REVIEW_BLIND_DAYS * 86400_000;
}

export function averageRating(ratings: number[]): number | null {
  if (!ratings.length) return null;
  return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
}
