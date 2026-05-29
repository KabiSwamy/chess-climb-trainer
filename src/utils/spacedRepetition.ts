import type { ReviewItem } from '../types/stats';

const MINUTE = 60 * 1000;

/**
 * Intervals (in ms) before a review item becomes due again, indexed by how many
 * times in a row it has been solved since the last lapse. Short, session-friendly
 * spacing so missed puzzles resurface during the same training session.
 */
const SOLVE_INTERVALS = [2 * MINUTE, 10 * MINUTE, 60 * MINUTE, 24 * 60 * MINUTE];

export function findReviewItem(queue: ReviewItem[], puzzleId: string): ReviewItem | undefined {
  return queue.find((item) => item.puzzleId === puzzleId);
}

/** Called when a puzzle is missed: add it to the queue or raise its priority. */
export function recordMiss(queue: ReviewItem[], puzzleId: string, now = Date.now()): ReviewItem[] {
  const existing = findReviewItem(queue, puzzleId);
  if (existing) {
    return queue.map((item) =>
      item.puzzleId === puzzleId
        ? {
            ...item,
            priority: item.priority + 2,
            lapses: item.lapses + 1,
            dueAt: now, // due again right away
            lastResult: 'missed',
          }
        : item,
    );
  }
  return [
    ...queue,
    { puzzleId, priority: 3, dueAt: now, lapses: 1, lastResult: 'missed' },
  ];
}

/** Called when a review puzzle is solved: lower its priority and push it out. */
export function recordSolve(queue: ReviewItem[], puzzleId: string, now = Date.now()): ReviewItem[] {
  const existing = findReviewItem(queue, puzzleId);
  if (!existing) return queue;

  const newPriority = existing.priority - 1;
  if (newPriority <= 0) {
    // Graduated — remove from the review queue.
    return queue.filter((item) => item.puzzleId !== puzzleId);
  }

  const intervalIndex = Math.min(SOLVE_INTERVALS.length - 1, Math.max(0, 3 - newPriority));
  return queue.map((item) =>
    item.puzzleId === puzzleId
      ? {
          ...item,
          priority: newPriority,
          dueAt: now + SOLVE_INTERVALS[intervalIndex],
          lastResult: 'solved',
        }
      : item,
  );
}

/** The highest-priority review puzzle that is currently due, if any. */
export function nextDueReview(
  queue: ReviewItem[],
  now = Date.now(),
  excludeId?: string,
): string | null {
  const due = queue
    .filter((item) => item.dueAt <= now && item.puzzleId !== excludeId)
    .sort((a, b) => b.priority - a.priority || a.dueAt - b.dueAt);
  return due.length > 0 ? due[0].puzzleId : null;
}

export function dueReviewCount(queue: ReviewItem[], now = Date.now()): number {
  return queue.filter((item) => item.dueAt <= now).length;
}
