import type { PuzzleTheme } from '../types/puzzle';
import type { TrainingMode } from '../utils/puzzleSelector';
import { MODE_LABELS } from '../utils/puzzleSelector';

const MODE_HINTS: Record<TrainingMode, string> = {
  random: 'A mix of beginner puzzles near your level.',
  theme: 'Drill one tactical idea at a time.',
  weakness: 'Focuses on the themes you miss most.',
  daily: 'Today’s 10-puzzle climb.',
  checklist: 'Forces the checks-captures-threats routine before each reveal.',
};

const MODES: TrainingMode[] = ['random', 'theme', 'weakness', 'daily', 'checklist'];

interface ModeSelectorProps {
  mode: TrainingMode;
  onModeChange: (mode: TrainingMode) => void;
  themes: PuzzleTheme[];
  selectedTheme: PuzzleTheme;
  onThemeChange: (theme: PuzzleTheme) => void;
  dailyCompleted: number;
  dailyTotal: number;
}

export function ModeSelector({
  mode,
  onModeChange,
  themes,
  selectedTheme,
  onThemeChange,
  dailyCompleted,
  dailyTotal,
}: ModeSelectorProps) {
  return (
    <section className="panel mode-selector">
      <h3>Training mode</h3>
      <div className="mode-buttons">
        {MODES.map((m) => (
          <button
            key={m}
            className={`mode-btn ${mode === m ? 'active' : ''}`}
            onClick={() => onModeChange(m)}
            type="button"
          >
            {MODE_LABELS[m]}
            {m === 'daily' && dailyTotal > 0 && (
              <span className="mode-badge">
                {dailyCompleted}/{dailyTotal}
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="mode-hint">{MODE_HINTS[mode]}</p>

      {mode === 'theme' && (
        <label className="theme-select">
          <span>Theme</span>
          <select
            value={selectedTheme}
            onChange={(e) => onThemeChange(e.target.value as PuzzleTheme)}
          >
            {themes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}

export default ModeSelector;
