import type { Stats } from '../types/stats';
import {
  overallAccuracy,
  firstTryAccuracy,
  solvedToday,
} from '../utils/progressStorage';
import { dueReviewCount } from '../utils/spacedRepetition';

interface ProgressStatsProps {
  stats: Stats;
}

interface StatPillProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

function StatPill({ label, value, accent }: StatPillProps) {
  return (
    <div className={`stat-pill ${accent ? 'accent' : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function ProgressStats({ stats }: ProgressStatsProps) {
  return (
    <div className="progress-stats">
      <StatPill label="Streak" value={stats.currentStreak} accent />
      <StatPill label="Best streak" value={stats.bestStreak} />
      <StatPill label="Accuracy" value={`${overallAccuracy(stats)}%`} />
      <StatPill label="First try" value={`${firstTryAccuracy(stats)}%`} />
      <StatPill label="Solved today" value={solvedToday(stats)} />
      <StatPill label="To review" value={dueReviewCount(stats.reviewQueue)} />
    </div>
  );
}

export default ProgressStats;
