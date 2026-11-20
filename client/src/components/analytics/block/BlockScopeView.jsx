import { Cascade } from "../../motion/Cascade.jsx";
import { BlockProgressCard } from "./BlockProgressCard.jsx";
import { BlockStatTiles } from "./BlockStatTiles.jsx";
import { BlockSetsLoggedCard } from "./BlockSetsLoggedCard.jsx";
import { BlockLiftChart, liftsWithChartData } from "./BlockLiftChart.jsx";

/**
 * Block-scoped Analytics body: progress, headline tiles, sets-of-planned,
 * per-lift charts, then the caller's Execution card (passed as children so
 * AnalyticsPage can reuse its existing ExecutionSection).
 */
export function BlockScopeView({ summary, loading, children }) {
  const chartLifts = liftsWithChartData(summary?.lifts);
  const hasLogged =
    (summary?.progress?.daysDone ?? 0) > 0 ||
    (Array.isArray(summary?.weeks) &&
      summary.weeks.some((w) => (w.loggedSets ?? 0) > 0));

  return (
    <Cascade
      className={`stack analytics-content mx-fade-in${loading ? " is-refreshing" : ""}`}
    >
      <BlockProgressCard summary={summary} />
      <BlockStatTiles summary={summary} />
      {!hasLogged ? (
        <section className="card stack analytics-page-empty analytics-empty-surface">
          <p className="analytics-unlock" style={{ margin: 0 }}>
            No workouts logged from this block yet.
          </p>
          <p className="muted small" style={{ margin: 0 }}>
            Start a day from the block page and the sets, plan bars, and lift
            charts fill in here.
          </p>
        </section>
      ) : null}
      <Cascade className="stack analytics-view">
        <BlockSetsLoggedCard summary={summary} />
        {chartLifts.map((lift) => (
          <BlockLiftChart key={lift.key} lift={lift} />
        ))}
        {children}
      </Cascade>
    </Cascade>
  );
}
