import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Chess } from 'chess.js';

import { puzzles } from './data/puzzles';
import type { Puzzle, PuzzleTheme } from './types/puzzle';
import type { Stats } from './types/stats';

import {
  loadStats,
  saveStats,
  recordAttempt,
  resetStats,
  todayString,
} from './utils/progressStorage';
import {
  selectPuzzle,
  buildDailyClimb,
  listThemes,
  MODE_LABELS,
} from './utils/puzzleSelector';
import type { TrainingMode } from './utils/puzzleSelector';

import { ChessBoard } from './components/ChessBoard';
import { FeedbackPanel } from './components/FeedbackPanel';
import type { Feedback, PuzzleStatus } from './components/FeedbackPanel';
import { HintPanel } from './components/HintPanel';
import { ChecklistPanel } from './components/ChecklistPanel';
import { ModeSelector } from './components/ModeSelector';
import { ProgressStats } from './components/ProgressStats';
import { Dashboard } from './components/Dashboard';

const HIGHLIGHT_LAST: CSSProperties = { backgroundColor: 'rgba(255, 213, 79, 0.55)' };
const HIGHLIGHT_BEST: CSSProperties = { backgroundColor: 'rgba(102, 187, 106, 0.6)' };

type View = 'train' | 'dashboard';

interface SquareHighlight {
  from: string;
  to: string;
}

function squareStylesFor(
  last: SquareHighlight | null,
  best: SquareHighlight | null,
): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {};
  if (last) {
    styles[last.from] = HIGHLIGHT_LAST;
    styles[last.to] = HIGHLIGHT_LAST;
  }
  if (best) {
    styles[best.from] = HIGHLIGHT_BEST;
    styles[best.to] = HIGHLIGHT_BEST;
  }
  return styles;
}

const themes = listThemes(puzzles);

export default function App() {
  const [stats, setStats] = useState<Stats>(() => loadStats());
  const [view, setView] = useState<View>('train');
  const [mode, setMode] = useState<TrainingMode>('random');
  const [selectedTheme, setSelectedTheme] = useState<PuzzleTheme>(themes[0]);

  const [puzzle, setPuzzle] = useState<Puzzle>(() => puzzles[0]);
  const [fen, setFen] = useState<string>(puzzles[0].fen);
  const [plyIndex, setPlyIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [status, setStatus] = useState<PuzzleStatus>('playing');
  const [feedback, setFeedback] = useState<Feedback>({
    kind: 'info',
    message: 'Find the best move. Ask: checks, captures, threats — what is hanging?',
  });
  const [lastMove, setLastMove] = useState<SquareHighlight | null>(null);
  const [bestHighlight, setBestHighlight] = useState<SquareHighlight | null>(null);
  const [flip, setFlip] = useState(false);
  const [checklistAnswers, setChecklistAnswers] = useState<boolean[]>(() =>
    Array(5).fill(false),
  );

  const recordedRef = useRef(false);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionToken = useRef(0);

  // Persist stats whenever they change.
  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  // Clean up any pending auto-reply timer on unmount.
  useEffect(
    () => () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    },
    [],
  );

  const orientation: 'white' | 'black' = useMemo(() => {
    const base = puzzle.sideToMove === 'w' ? 'white' : 'black';
    if (!flip) return base;
    return base === 'white' ? 'black' : 'white';
  }, [puzzle.sideToMove, flip]);

  const dailyToday =
    stats.dailyClimb && stats.dailyClimb.date === todayString() ? stats.dailyClimb : null;
  const dailyCompleted = dailyToday ? dailyToday.completedIds.length : 0;
  const dailyTotal = dailyToday ? dailyToday.puzzleIds.length : 0;

  const loadPuzzle = useCallback((next: Puzzle) => {
    sessionToken.current += 1;
    if (replyTimer.current) clearTimeout(replyTimer.current);
    recordedRef.current = false;
    setPuzzle(next);
    setFen(next.fen);
    setPlyIndex(0);
    setAttempts(0);
    setHintLevel(0);
    setStatus('playing');
    setLastMove(null);
    setBestHighlight(null);
    setFlip(false);
    setChecklistAnswers(Array(5).fill(false));
    setFeedback({
      kind: 'info',
      message:
        next.sideToMove === 'w'
          ? 'White to move. Checks, captures, threats — what can you win?'
          : 'Black to move. Checks, captures, threats — what can you win?',
    });
  }, []);

  const goNext = useCallback(
    (overrideMode?: TrainingMode, overrideStats?: Stats) => {
      const useStats = overrideStats ?? stats;
      const useMode = overrideMode ?? mode;
      const daily =
        useStats.dailyClimb && useStats.dailyClimb.date === todayString()
          ? useStats.dailyClimb
          : null;
      const next = selectPuzzle(puzzles, useStats, {
        mode: useMode,
        theme: selectedTheme,
        excludeId: puzzle.id,
        dailyIds: daily?.puzzleIds,
        completedIds: daily?.completedIds,
      });
      if (next) {
        loadPuzzle(next);
      } else {
        setStatus('solved');
        setFeedback({
          kind: 'correct',
          message:
            useMode === 'daily'
              ? 'Daily Climb complete! Come back tomorrow for a fresh set.'
              : 'No more puzzles in this set.',
        });
      }
    },
    [stats, mode, selectedTheme, puzzle.id, loadPuzzle],
  );

  const record = useCallback(
    (solved: boolean, firstTry: boolean, attemptCount: number) => {
      if (recordedRef.current) return;
      recordedRef.current = true;
      setStats((prev) =>
        recordAttempt(prev, puzzle, { solved, firstTry, attempts: attemptCount }),
      );
    },
    [puzzle],
  );

  const revealSolution = useCallback(() => {
    const line = new Chess(puzzle.fen);
    let firstMove: SquareHighlight | null = null;
    for (let i = 0; i < puzzle.solutionMoves.length; i++) {
      const mv = line.move(puzzle.solutionMoves[i]);
      if (i === 0) firstMove = { from: mv.from, to: mv.to };
    }
    setFen(line.fen());
    setBestHighlight(firstMove);
    setLastMove(null);
    setHintLevel(3);
    setStatus('revealed');
    setFeedback({
      kind: 'info',
      message: `The answer is ${puzzle.bestMoveSan}. ${puzzle.explanation}`,
    });
    record(false, false, Math.max(attempts, 1));
  }, [puzzle, attempts, record]);

  const handleSolved = useCallback(
    (firstTry: boolean) => {
      setStatus('solved');
      setBestHighlight(null);
      setFeedback({
        kind: 'correct',
        message: firstTry
          ? `Correct! ${puzzle.explanation}`
          : `Correct — you got there. ${puzzle.explanation}`,
      });
      record(true, firstTry, attempts);
    },
    [puzzle, attempts, record],
  );

  const handleWrong = useCallback(
    (attemptedSan: string) => {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts === 1) {
        setHintLevel((h) => Math.max(h, 1));
        setFeedback({
          kind: 'wrong',
          message: `Not quite — ${attemptedSan} isn't the best move. Don't rush. Look for checks, captures and threats, and check what is hanging. Here's a hint.`,
        });
      } else if (newAttempts === 2) {
        setHintLevel((h) => Math.max(h, 2));
        setFeedback({
          kind: 'wrong',
          message: `Still not best. ${puzzle.commonWrongMoveExplanation} Here's another hint.`,
        });
      } else {
        revealSolution();
      }
    },
    [attempts, puzzle, revealSolution],
  );

  const handleDrop = useCallback(
    (source: string, target: string): boolean => {
      if (status !== 'playing') return false;

      const game = new Chess(fen);
      let move;
      try {
        move = game.move({ from: source, to: target, promotion: 'q' });
      } catch {
        return false; // illegal move — snap back, no penalty
      }

      const expected = puzzle.solutionMoves[plyIndex];
      const isLastPly = plyIndex === puzzle.solutionMoves.length - 1;
      const correct =
        move.san === expected ||
        (puzzle.outcomeType === 'mate' && game.isCheckmate() && isLastPly);

      if (!correct) {
        handleWrong(move.san);
        return false; // revert board to the puzzle position
      }

      // Correct move — commit it.
      setFen(game.fen());
      setLastMove({ from: move.from, to: move.to });

      if (isLastPly) {
        const firstTry = attempts === 0 && hintLevel === 0;
        handleSolved(firstTry);
        return true;
      }

      // Multi-move puzzle: auto-play the forced opponent reply, then it's our move.
      const replySan = puzzle.solutionMoves[plyIndex + 1];
      const token = sessionToken.current;
      setFeedback({ kind: 'correct', message: 'Good move — now finish it.' });
      replyTimer.current = setTimeout(() => {
        if (token !== sessionToken.current) return; // puzzle changed
        const afterReply = new Chess(game.fen());
        const reply = afterReply.move(replySan);
        setFen(afterReply.fen());
        setLastMove({ from: reply.from, to: reply.to });
        setPlyIndex(plyIndex + 2);
      }, 450);

      return true;
    },
    [status, fen, puzzle, plyIndex, attempts, hintLevel, handleWrong, handleSolved],
  );

  const handleHint = useCallback(() => {
    if (status !== 'playing') return;
    setHintLevel((h) => Math.min(3, h + 1));
    setFeedback({
      kind: 'hint',
      message: 'Hint added below. Use the checklist to focus your search.',
    });
  }, [status]);

  const checklistComplete = checklistAnswers.every(Boolean);
  const checklistMode = mode === 'checklist';

  const handleReveal = useCallback(() => {
    if (status !== 'playing') return;
    if (checklistMode && !checklistComplete) {
      setFeedback({
        kind: 'hint',
        message: 'Complete the Real-Game Checklist below before revealing the answer.',
      });
      return;
    }
    revealSolution();
  }, [status, checklistMode, checklistComplete, revealSolution]);

  const handleReset = useCallback(() => {
    loadPuzzle(puzzle);
  }, [loadPuzzle, puzzle]);

  const handleModeChange = useCallback(
    (next: TrainingMode) => {
      setMode(next);
      let workingStats = stats;
      if (next === 'daily') {
        const today = todayString();
        if (!stats.dailyClimb || stats.dailyClimb.date !== today) {
          workingStats = {
            ...stats,
            dailyClimb: { date: today, puzzleIds: buildDailyClimb(puzzles), completedIds: [] },
          };
          setStats(workingStats);
        }
      }
      goNext(next, workingStats);
    },
    [stats, goNext],
  );

  const handleThemeChange = useCallback(
    (theme: PuzzleTheme) => {
      setSelectedTheme(theme);
      const next = selectPuzzle(puzzles, stats, { mode: 'theme', theme });
      if (next) loadPuzzle(next);
    },
    [stats, loadPuzzle],
  );

  const toggleChecklist = useCallback((index: number) => {
    setChecklistAnswers((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const startRecommended = useCallback(
    (recMode: TrainingMode) => {
      setView('train');
      handleModeChange(recMode);
    },
    [handleModeChange],
  );

  const showTheme = mode === 'theme' || status !== 'playing';
  const interactive = status === 'playing';

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            ♞
          </span>
          <div>
            <h1>Chess Climb Trainer</h1>
            <p className="tagline">Checks · Captures · Threats — climb from 400 to 1000.</p>
          </div>
        </div>
        <nav className="view-tabs">
          <button
            type="button"
            className={view === 'train' ? 'active' : ''}
            onClick={() => setView('train')}
          >
            Train
          </button>
          <button
            type="button"
            className={view === 'dashboard' ? 'active' : ''}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
        </nav>
      </header>

      <ProgressStats stats={stats} />

      {view === 'dashboard' ? (
        <Dashboard
          stats={stats}
          dailyCompleted={dailyCompleted}
          dailyTotal={dailyTotal}
          onStartRecommended={startRecommended}
          onReset={() => setStats(resetStats())}
        />
      ) : (
        <main className="trainer">
          <div className="board-column">
            <div className="board-meta">
              <span className="turn-indicator">
                {puzzle.sideToMove === 'w' ? 'White to move' : 'Black to move'}
              </span>
              <span className="puzzle-id">
                {showTheme ? puzzle.theme : 'Find the best move'} · rating {puzzle.difficulty}
              </span>
            </div>

            <ChessBoard
              fen={fen}
              orientation={orientation}
              sideToMove={puzzle.sideToMove}
              interactive={interactive}
              squareStyles={squareStylesFor(lastMove, bestHighlight)}
              onDrop={handleDrop}
            />

            <div className="controls">
              <button type="button" className="btn" onClick={handleHint} disabled={!interactive}>
                Hint
              </button>
              <button type="button" className="btn" onClick={handleReveal} disabled={!interactive}>
                Reveal
              </button>
              <button type="button" className="btn" onClick={handleReset}>
                Reset
              </button>
              <button type="button" className="btn" onClick={() => setFlip((f) => !f)}>
                Flip
              </button>
              <button type="button" className="btn primary" onClick={() => goNext()}>
                Next Puzzle
              </button>
            </div>
          </div>

          <div className="side-column">
            <FeedbackPanel feedback={feedback} status={status} puzzle={puzzle} />
            <ModeSelector
              mode={mode}
              onModeChange={handleModeChange}
              themes={themes}
              selectedTheme={selectedTheme}
              onThemeChange={handleThemeChange}
              dailyCompleted={dailyCompleted}
              dailyTotal={dailyTotal}
            />
            <HintPanel puzzle={puzzle} hintLevel={hintLevel} revealed={status === 'revealed'} />
            <ChecklistPanel
              checklistMode={checklistMode}
              answers={checklistAnswers}
              onToggle={toggleChecklist}
            />
          </div>
        </main>
      )}

      <footer className="app-footer">
        <span>{puzzles.length} validated beginner puzzles</span>
        <span>Mode: {MODE_LABELS[mode]}</span>
        <span>Local-only progress · nothing leaves your browser</span>
      </footer>
    </div>
  );
}
