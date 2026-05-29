import type { Puzzle } from '../types/puzzle';

interface HintPanelProps {
  puzzle: Puzzle;
  hintLevel: number; // 0-3, how many hints are unlocked
  revealed: boolean; // whether the full answer is shown
}

const HINT_TITLES = [
  'Hint 1 — what to notice',
  'Hint 2 — the tactical theme',
  'Hint 3 — which piece to move',
];

export function HintPanel({ puzzle, hintLevel, revealed }: HintPanelProps) {
  const hints = [puzzle.hint1, puzzle.hint2, puzzle.hint3];

  if (hintLevel === 0 && !revealed) {
    return (
      <section className="panel hint-panel muted">
        <h3>Hints</h3>
        <p className="hint-empty">
          Stuck? Use the <strong>Hint</strong> button for a nudge — try to spot
          checks, captures and threats first.
        </p>
      </section>
    );
  }

  return (
    <section className="panel hint-panel">
      <h3>Hints</h3>
      <ol className="hint-list">
        {hints.slice(0, hintLevel).map((hint, i) => (
          <li key={i}>
            <span className="hint-title">{HINT_TITLES[i]}</span>
            <span>{hint}</span>
          </li>
        ))}
      </ol>
      {revealed && (
        <div className="answer-box">
          <span className="hint-title">Answer</span>
          <p>
            Best move: <strong>{puzzle.bestMoveSan}</strong>
          </p>
        </div>
      )}
    </section>
  );
}

export default HintPanel;
