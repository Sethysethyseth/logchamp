/**
 * "Sets logged, of planned": one bar per block week. Current week is hatched
 * while unfinished (thisWeek.done < thisWeek.total).
 */

export function BlockSetsLoggedCard({ summary }) {
  const weeks = Array.isArray(summary?.weeks) ? summary.weeks : [];
  const currentWeek = summary?.run?.currentWeek ?? null;
  const thisWeek = summary?.progress?.thisWeek;
  const currentUnfinished =
    thisWeek != null && Number(thisWeek.done) < Number(thisWeek.total);

  return (
    <section className="card analytics-table-card ba-sets-card">
      <div className="analytics-card-head stack">
        <h2>Sets logged, of planned</h2>
        <p className="muted small analytics-card-sub">
          Only workouts started from this block, by block week.
        </p>
      </div>
      {weeks.length === 0 ? (
        <div className="analytics-chart-body">
          <p className="muted small" style={{ margin: 0 }}>
            This block has no weeks yet.
          </p>
        </div>
      ) : (
        <div className="analytics-chart-body ba-sets">
          {weeks.map((w, i) => {
            const planned = w.plannedSets ?? 0;
            const logged = w.loggedSets ?? 0;
            const pct =
              planned > 0 ? Math.min(100, Math.round((100 * logged) / planned)) : 0;
            const isCurrent = currentWeek != null && w.week === currentWeek;
            const hatch = isCurrent && currentUnfinished;
            return (
              <div
                key={w.week}
                className="ba-sets-row"
                style={{ "--row": i }}
              >
                <span className="ba-sets-label">W{w.week}</span>
                <span
                  className="ba-sets-track"
                  role="img"
                  aria-label={`Week ${w.week}: ${logged} of ${planned} sets${
                    hatch ? ", in progress" : ""
                  }`}
                >
                  <span
                    className={`ba-sets-fill${hatch ? " ba-sets-fill--current" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="ba-sets-count muted small">
                  {logged}/{planned}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
