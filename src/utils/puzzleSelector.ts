import type { Puzzle, PuzzleTheme } from '../types/puzzle';
import type { Stats } from '../types/stats';
import { weakestThemes } from './progressStorage';
import { nextDueReview } from './spacedRepetition';

export type TrainingMode = 'random' | 'theme' | 'weakness' | 'daily' | 'checklist';

export const MODE_LABELS: Record<TrainingMode, string> = {
  random: 'Random',
  theme: 'By Theme',
  weakness: 'Weakness',
  daily: 'Daily Climb',
  checklist: 'Real-Game Checklist',
};

function byId(puzzles: Puzzle[], id: string): Puzzle | undefined {
  return puzzles.find((p) => p.id === id);
}

/**
 * Pick randomly from the `k` puzzles whose difficulty is closest to `target`,
 * skipping any recently-seen puzzle so the trainer rotates through the pool
 * instead of repeating the same handful. If every near-difficulty candidate is
 * excluded, the exclusion is progressively relaxed so we always return a puzzle.
 */
function pickNearDifficulty(
  pool: Puzzle[],
  target: number,
  exclude: Set<string>,
  k = 14,
): Puzzle | null {
  if (pool.length === 0) return null;

  const ranked = [...pool].sort(
    (a, b) => Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target),
  );

  // Prefer unseen puzzles near the target difficulty.
  const fresh = ranked.filter((p) => !exclude.has(p.id));
  const usable = fresh.length > 0 ? fresh : ranked;
  const window = usable.slice(0, Math.min(k, usable.length));
  return window[Math.floor(Math.random() * window.length)];
}

export function listThemes(puzzles: Puzzle[]): PuzzleTheme[] {
  return Array.from(new Set(puzzles.map((p) => p.theme))).sort();
}

const MATERIAL_THEMES: PuzzleTheme[] = [
  'Hanging piece',
  'Free queen',
  'Free rook',
  'Capture the undefended piece',
];
const TACTIC_THEMES: PuzzleTheme[] = [
  'Fork',
  'Knight fork',
  'Pin',
  'Skewer',
  'Discovered attack',
  'Removing the defender',
];

function takeRandom(pool: Puzzle[], n: number, used: Set<string>): Puzzle[] {
  const available = pool.filter((p) => !used.has(p.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, n);
  chosen.forEach((p) => used.add(p.id));
  return chosen;
}

/**
 * Build a 10-puzzle daily set:
 *   3 hanging piece / free material, 2 mate, 3 tactics, 2 blunder prevention.
 * Falls back to filling any remaining slots from the rest of the pool so the
 * climb is always exactly 10 (or as many as exist).
 */
export function buildDailyClimb(puzzles: Puzzle[]): string[] {
  const used = new Set<string>();
  const picks: Puzzle[] = [];

  picks.push(...takeRandom(puzzles.filter((p) => MATERIAL_THEMES.includes(p.theme)), 3, used));
  picks.push(...takeRandom(puzzles.filter((p) => p.outcomeType === 'mate'), 2, used));
  picks.push(...takeRandom(puzzles.filter((p) => TACTIC_THEMES.includes(p.theme)), 3, used));
  picks.push(
    ...takeRandom(
      puzzles.filter(
        (p) => p.outcomeType === 'blunder prevention' || p.outcomeType === 'defensive move',
      ),
      2,
      used,
    ),
  );

  if (picks.length < 10) {
    picks.push(...takeRandom(puzzles, 10 - picks.length, used));
  }

  return picks.slice(0, 10).map((p) => p.id);
}

export interface SelectOptions {
  mode: TrainingMode;
  theme?: PuzzleTheme;
  excludeId?: string;
  /** Recently-shown puzzle ids to avoid repeating (rotation window). */
  recentIds?: string[];
  /** For daily mode: ids the user has already completed today. */
  completedIds?: string[];
  /** For daily mode: the ordered list of puzzle ids for today. */
  dailyIds?: string[];
  /** Whether to allow surfacing a due review puzzle (skipped in theme/daily). */
  allowReview?: boolean;
}

/**
 * Central puzzle picker used by every mode. Returns the next puzzle to show,
 * honouring the player's difficulty target and the spaced-repetition queue.
 */
export function selectPuzzle(
  puzzles: Puzzle[],
  stats: Stats,
  options: SelectOptions,
): Puzzle | null {
  if (puzzles.length === 0) return null;
  const { mode, theme, excludeId } = options;
  const allowReview = options.allowReview ?? mode !== 'theme';

  const exclude = new Set<string>(options.recentIds ?? []);
  if (excludeId) exclude.add(excludeId);

  // Daily climb: serve the next uncompleted puzzle in order.
  if (mode === 'daily') {
    const ids = options.dailyIds ?? [];
    const completed = new Set(options.completedIds ?? []);
    const nextId = ids.find((id) => !completed.has(id) && id !== excludeId)
      ?? ids.find((id) => !completed.has(id));
    return nextId ? (byId(puzzles, nextId) ?? null) : null;
  }

  // Occasionally surface a due review puzzle (spaced repetition).
  if (allowReview && Math.random() < 0.35) {
    const reviewId = nextDueReview(stats.reviewQueue, Date.now(), excludeId);
    const reviewPuzzle = reviewId ? byId(puzzles, reviewId) : undefined;
    if (reviewPuzzle) return reviewPuzzle;
  }

  if (mode === 'theme') {
    const pool = puzzles.filter((p) => p.theme === theme);
    return pickNearDifficulty(pool.length ? pool : puzzles, stats.difficultyTarget, exclude);
  }

  if (mode === 'weakness') {
    const weak = weakestThemes(stats, 3, 1).map((w) => w.theme);
    const pool = weak.length
      ? puzzles.filter((p) => weak.includes(p.theme))
      : puzzles;
    return pickNearDifficulty(pool.length ? pool : puzzles, stats.difficultyTarget, exclude);
  }

  // random + checklist both draw from the whole pool near the difficulty target.
  return pickNearDifficulty(puzzles, stats.difficultyTarget, exclude);
}

/**
 * A human-readable recommendation for what to train next, used by the dashboard.
 */
export function recommendedMode(stats: Stats): { mode: TrainingMode; reason: string } {
  if (stats.totalAttempted < 5) {
    return {
      mode: 'random',
      reason: 'Warm up with a mix of beginner puzzles to find your level.',
    };
  }
  const weak = weakestThemes(stats, 1, 2);
  if (weak.length > 0 && weak[0].accuracy < 60) {
    return {
      mode: 'weakness',
      reason: `Your ${weak[0].theme.toLowerCase()} accuracy is ${weak[0].accuracy}%, so drill your weak spots next.`,
    };
  }
  return {
    mode: 'daily',
    reason: 'Your fundamentals look solid — take on today’s Daily Climb to stay sharp.',
  };
}
