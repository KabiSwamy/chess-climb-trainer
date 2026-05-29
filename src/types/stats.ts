import type { PuzzleTheme } from './puzzle';

export interface ThemeStat {
  attempted: number;
  solved: number;
  firstTry: number;
}

export interface PuzzleHistoryEntry {
  puzzleId: string;
  theme: PuzzleTheme;
  solved: boolean;
  firstTry: boolean;
  attempts: number;
  timestamp: number; // epoch ms
}

export interface ReviewItem {
  puzzleId: string;
  priority: number; // higher = show sooner
  dueAt: number; // epoch ms
  lapses: number;
  lastResult: 'solved' | 'missed';
}

export interface DailyClimbState {
  date: string; // YYYY-MM-DD
  puzzleIds: string[];
  completedIds: string[];
}

export interface Stats {
  totalAttempted: number;
  totalSolved: number;
  firstTryCorrect: number;
  currentStreak: number;
  bestStreak: number;
  themeStats: Record<string, ThemeStat>;
  history: PuzzleHistoryEntry[];
  reviewQueue: ReviewItem[];
  dailyClimb: DailyClimbState | null;
  /** A floating difficulty target that adapts to the player's recent results. */
  difficultyTarget: number;
  lastPlayedDate: string | null;
}
