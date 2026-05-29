import type { Stats } from '../types/stats';
import type { TrainingMode } from '../utils/puzzleSelector';
import {
  overallAccuracy,
  firstTryAccuracy,
  weakestThemes,
  strongestThemes,
  solvedToday,
} from '../utils/progressStorage';
import { recommendedMode } from '../utils/puzzleSelector';

interface DashboardProps {
  stats: Stats;
  dailyCompleted: number;
  dailyTotal: number;
  onStartRecommended: (mode: TrainingMode) => void;
  onReset: () => void;
}

function interpretation(stats: Stats): string {
  if (stats.totalAttempted === 0) {
    return 'No puzzles yet. Solve a few and your coach notes will appear here.';
  }
  const acc = overallAccuracy(stats);
  const weak = weakestThemes(stats, 1, 2)[0];
  if (weak && weak.accuracy < 60) {
    return `Your ${weak.theme.toLowerCase()} accuracy is ${weak.accuracy}%, so you should train ${weak.theme.toLowerCase()} next. Slow down and run the checklist before every move.`;
  }
  if (acc >= 80) {
    return 'Great accuracy! You are spotting the key ideas. Try a harder theme or the Daily Climb to keep climbing.';
  }
  return 'Solid progress. Keep asking “checks, captures, threats?” before every move — that habit is what raises your rating.';
}

export function Dashboard({
  stats,
  dailyCompleted,
  dailyTotal,
  onStartRecommended,
  onReset,
}: DashboardProps) {
  const weak = weakestThemes(stats);
  const strong = strongestThemes(stats);
  const rec = recommendedMode(stats);

  return (
    <section className="dashboard">
      <div className="dashboard-grid">
        <div className="dash-card">
          <h3>Overall accuracy</h3>
          <p className="dash-big">{overallAccuracy(stats)}%</p>
          <p className="dash-sub">
            {stats.totalSolved} solved of {stats.totalAttempted} attempted
          </p>
        </div>
        <div className="dash-card">
          <h3>First-try accuracy</h3>
          <p className="dash-big">{firstTryAccuracy(stats)}%</p>
          <p className="dash-sub">solved with no hints or retries</p>
        </div>
        <div className="dash-card">
          <h3>Streak</h3>
          <p className="dash-big">{stats.currentStreak}</p>
          <p className="dash-sub">best: {stats.bestStreak}</p>
        </div>
        <div className="dash-card">
          <h3>Daily Climb</h3>
          <p className="dash-big">
            {dailyTotal > 0 ? `${dailyCompleted}/${dailyTotal}` : '—'}
          </p>
          <p className="dash-sub">{solvedToday(stats)} solved today</p>
        </div>
      </div>

      <div className="coach-note">
        <h3>Your coach says</h3>
        <p>{interpretation(stats)}</p>
        <button
          type="button"
          className="btn primary"
          onClick={() => onStartRecommended(rec.mode)}
        >
          Train this next: {rec.reason}
        </button>
      </div>

      <div className="dashboard-grid two">
        <div className="dash-card">
          <h3>Weakest themes</h3>
          {weak.length === 0 ? (
            <p className="dash-sub">Solve a few more puzzles to see this.</p>
          ) : (
            <ul className="theme-bars">
              {weak.map((w) => (
                <li key={w.theme}>
                  <span>{w.theme}</span>
                  <span className="bar">
                    <span
                      className="bar-fill weak"
                      style={{ width: `${w.accuracy}%` }}
                    />
                  </span>
                  <span className="bar-num">{w.accuracy}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="dash-card">
          <h3>Strongest themes</h3>
          {strong.length === 0 ? (
            <p className="dash-sub">Solve a few more puzzles to see this.</p>
          ) : (
            <ul className="theme-bars">
              {strong.map((s) => (
                <li key={s.theme}>
                  <span>{s.theme}</span>
                  <span className="bar">
                    <span
                      className="bar-fill strong"
                      style={{ width: `${s.accuracy}%` }}
                    />
                  </span>
                  <span className="bar-num">{s.accuracy}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button type="button" className="btn ghost reset-btn" onClick={onReset}>
        Reset all progress
      </button>
    </section>
  );
}

export default Dashboard;
