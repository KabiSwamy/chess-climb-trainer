import type { Puzzle, PuzzleTheme } from '../types/puzzle';
import type { Stats, ThemeStat, PuzzleHistoryEntry } from '../types/stats';
import { recordMiss, recordSolve } from './spacedRepetition';

const STORAGE_KEY = 'chess-climb-trainer.stats.v1';
const MAX_HISTORY = 200;
const DEFAULT_DIFFICULTY = 450;

export function todayString(date = new Date()): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function defaultStats(): Stats {
  return {
    totalAttempted: 0,
    totalSolved: 0,
    firstTryCorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    themeStats: {},
    history: [],
    reviewQueue: [],
    dailyClimb: null,
    difficultyTarget: DEFAULT_DIFFICULTY,
    lastPlayedDate: null,
  };
}

export function loadStats(): Stats {
  if (typeof localStorage === 'undefined') return defaultStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStats();
    const parsed = JSON.parse(raw) as Partial<Stats>;
    return { ...defaultStats(), ...parsed };
  } catch {
    return defaultStats();
  }
}

export function saveStats(stats: Stats): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Storage full or unavailable — fail silently, progress is non-critical.
  }
}

export function resetStats(): Stats {
  const fresh = defaultStats();
  saveStats(fresh);
  return fresh;
}

export interface AttemptResult {
  solved: boolean;
  firstTry: boolean;
  attempts: number;
}

/**
 * Adjust the floating difficulty target based on the latest result.
 * Many first-try solves nudge difficulty up; misses nudge it down.
 * Clamped so beginners stay mostly in the 400-700 range until they improve.
 */
function adaptDifficulty(current: number, result: AttemptResult): number {
  let next = current;
  if (result.solved && result.firstTry) next += 20;
  else if (!result.solved) next -= 30;
  else next -= 5; // solved but not first try
  return Math.max(350, Math.min(950, next));
}

export function recordAttempt(prev: Stats, puzzle: Puzzle, result: AttemptResult): Stats {
  const now = Date.now();
  const today = todayString();

  const themeStats: Record<string, ThemeStat> = { ...prev.themeStats };
  const t: ThemeStat = themeStats[puzzle.theme]
    ? { ...themeStats[puzzle.theme] }
    : { attempted: 0, solved: 0, firstTry: 0 };
  t.attempted += 1;
  if (result.solved) t.solved += 1;
  if (result.solved && result.firstTry) t.firstTry += 1;
  themeStats[puzzle.theme] = t;

  const currentStreak = result.solved ? prev.currentStreak + 1 : 0;
  const bestStreak = Math.max(prev.bestStreak, currentStreak);

  const entry: PuzzleHistoryEntry = {
    puzzleId: puzzle.id,
    theme: puzzle.theme,
    solved: result.solved,
    firstTry: result.firstTry,
    attempts: result.attempts,
    timestamp: now,
  };
  const history = [entry, ...prev.history].slice(0, MAX_HISTORY);

  // A clean first-try solve graduates the puzzle out of review; a miss schedules
  // it; a solve that needed extra tries still counts as progress.
  const reviewQueue = result.solved
    ? recordSolve(prev.reviewQueue, puzzle.id, now)
    : recordMiss(prev.reviewQueue, puzzle.id, now);

  // Daily climb progress.
  let dailyClimb = prev.dailyClimb;
  if (dailyClimb && dailyClimb.date === today && dailyClimb.puzzleIds.includes(puzzle.id)) {
    if (result.solved && !dailyClimb.completedIds.includes(puzzle.id)) {
      dailyClimb = {
        ...dailyClimb,
        completedIds: [...dailyClimb.completedIds, puzzle.id],
      };
    }
  }

  return {
    ...prev,
    totalAttempted: prev.totalAttempted + 1,
    totalSolved: prev.totalSolved + (result.solved ? 1 : 0),
    firstTryCorrect: prev.firstTryCorrect + (result.solved && result.firstTry ? 1 : 0),
    currentStreak,
    bestStreak,
    themeStats,
    history,
    reviewQueue,
    dailyClimb,
    difficultyTarget: adaptDifficulty(prev.difficultyTarget, result),
    lastPlayedDate: today,
  };
}

// ---- Derived selectors -----------------------------------------------------

export function overallAccuracy(stats: Stats): number {
  if (stats.totalAttempted === 0) return 0;
  return Math.round((stats.totalSolved / stats.totalAttempted) * 100);
}

export function firstTryAccuracy(stats: Stats): number {
  if (stats.totalAttempted === 0) return 0;
  return Math.round((stats.firstTryCorrect / stats.totalAttempted) * 100);
}

export function themeAccuracy(stat: ThemeStat): number {
  if (stat.attempted === 0) return 0;
  return Math.round((stat.solved / stat.attempted) * 100);
}

export interface RankedTheme {
  theme: PuzzleTheme;
  accuracy: number;
  attempted: number;
}

function rankedThemes(stats: Stats, minAttempts: number): RankedTheme[] {
  return Object.entries(stats.themeStats)
    .filter(([, s]) => s.attempted >= minAttempts)
    .map(([theme, s]) => ({
      theme: theme as PuzzleTheme,
      accuracy: themeAccuracy(s),
      attempted: s.attempted,
    }));
}

export function weakestThemes(stats: Stats, limit = 3, minAttempts = 2): RankedTheme[] {
  return rankedThemes(stats, minAttempts)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted)
    .slice(0, limit);
}

export function strongestThemes(stats: Stats, limit = 3, minAttempts = 2): RankedTheme[] {
  return rankedThemes(stats, minAttempts)
    .sort((a, b) => b.accuracy - a.accuracy || b.attempted - a.attempted)
    .slice(0, limit);
}

export function solvedToday(stats: Stats): number {
  const today = todayString();
  return stats.history.filter(
    (h) => h.solved && todayString(new Date(h.timestamp)) === today,
  ).length;
}
