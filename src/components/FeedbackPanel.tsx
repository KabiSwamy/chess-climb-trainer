import type { Puzzle } from '../types/puzzle';

export type FeedbackKind = 'correct' | 'wrong' | 'hint' | 'info';

export interface Feedback {
  kind: FeedbackKind;
  message: string;
}

export type PuzzleStatus = 'playing' | 'solved' | 'revealed';

interface FeedbackPanelProps {
  feedback: Feedback;
  status: PuzzleStatus;
  puzzle: Puzzle;
}

export function FeedbackPanel({ feedback, status, puzzle }: FeedbackPanelProps) {
  const showLesson = status === 'solved' || status === 'revealed';

  return (
    <section className="panel feedback-panel" aria-live="polite">
      <div className={`feedback-banner feedback-${feedback.kind}`}>
        <span className="feedback-icon" aria-hidden="true">
          {feedback.kind === 'correct' && '✓'}
          {feedback.kind === 'wrong' && '✕'}
          {feedback.kind === 'hint' && '💡'}
          {feedback.kind === 'info' && '♟'}
        </span>
        <p>{feedback.message}</p>
      </div>

      {showLesson && (
        <div className="mini-lesson">
          <h3>Mini lesson</h3>
          <dl>
            <dt>Best move</dt>
            <dd className="best-move">{puzzle.bestMoveSan}</dd>

            <dt>Why it works</dt>
            <dd>{puzzle.explanation}</dd>

            <dt>Pattern to remember</dt>
            <dd>{puzzle.patternToRemember}</dd>

            <dt>Why beginners miss this</dt>
            <dd>{puzzle.beginnerMistake}</dd>

            <dt>How to spot it in a real game</dt>
            <dd>{puzzle.howToSpot}</dd>

            <dt>Ask yourself next time</dt>
            <dd>
              “Checks, captures, threats — what is hanging, and what is my
              opponent threatening?”
            </dd>
          </dl>
        </div>
      )}
    </section>
  );
}

export default FeedbackPanel;
