/**
 * Header card: progress ring (week / weeksTotal), "Week N of M",
 * "X of Y days done - A of B this week".
 */

const RING_R = 24;
const RING_C = 2 * Math.PI * RING_R;

export function BlockProgressCard({ summary }) {
  const run = summary?.run;
  const progress = summary?.progress;
  if (!run) return null;

  const weeksTotal = Math.max(1, run.weeksTotal || 1);
  const currentWeek = Math.min(Math.max(1, run.currentWeek || 1), weeksTotal);
  const frac = currentWeek / weeksTotal;
  const dash = `${RING_C * frac} ${RING_C}`;

  const daysDone = progress?.daysDone ?? 0;
  const daysTotal = progress?.daysTotal ?? 0;
  const thisDone = progress?.thisWeek?.done ?? 0;
  const thisTotal = progress?.thisWeek?.total ?? 0;

  return (
    <section className="card ba-progress">
      <svg
        className="ba-progress-ring"
        width="58"
        height="58"
        viewBox="0 0 58 58"
        aria-hidden="true"
      >
        <circle
          className="ba-progress-ring__track"
          cx="29"
          cy="29"
          r={RING_R}
          fill="none"
          strokeWidth="7"
        />
        <circle
          className="ba-progress-ring__fill"
          cx="29"
          cy="29"
          r={RING_R}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={dash}
          transform="rotate(-90 29 29)"
        />
      </svg>
      <div className="ba-progress-copy stack">
        {run.name ? <span className="ba-progress-name">{run.name}</span> : null}
        <span className="ba-progress-week">
          Week {currentWeek} of {weeksTotal}
        </span>
        <span className="muted small ba-progress-days">
          {daysDone} of {daysTotal} days done - {thisDone} of {thisTotal} this week
        </span>
      </div>
    </section>
  );
}
