import { CountUp } from "../../motion/CountUp.jsx";
import { MX_DATA_LEAD_MS, MX_STAGGER_MS } from "../../../lib/useCountUp.js";
import { formatEstimate } from "../../../lib/weightDisplay.js";

/**
 * Headline tiles in StatTiles style: two biggest positive e1rm deltas,
 * On plan %, Off-block workouts.
 */

function Tile({ label, value, sub, tone = null, index = 0 }) {
  return (
    <div className="card stat-tile">
      <span className="stat-tile-label muted small">{label}</span>
      <span className={`stat-tile-value${tone ? ` stat-tile-value--${tone}` : ""}`}>
        <CountUp text={value} delay={MX_DATA_LEAD_MS + index * MX_STAGGER_MS} />
      </span>
      {sub ? <span className="stat-tile-sub muted small">{sub}</span> : null}
    </div>
  );
}

export function pickTopGainLifts(lifts, n = 2) {
  const list = Array.isArray(lifts) ? lifts : [];
  return list
    .filter((l) => l?.e1rm?.delta != null && l.e1rm.delta > 0)
    .slice()
    .sort((a, b) => b.e1rm.delta - a.e1rm.delta)
    .slice(0, n);
}

export function BlockStatTiles({ summary }) {
  const gains = pickTopGainLifts(summary?.lifts, 2);
  const onPlanPct = summary?.onPlan?.onPlanPct;
  const offBlock = summary?.offBlockWorkouts ?? 0;

  const tiles = [];
  gains.forEach((lift, i) => {
    tiles.push(
      <Tile
        key={lift.key}
        label={`Since week 1 · ${lift.name}`}
        value={`+${formatEstimate(lift.e1rm.delta)}`}
        sub="estimated 1RM"
        tone="up"
        index={i}
      />
    );
  });
  while (tiles.length < 2) {
    const i = tiles.length;
    tiles.push(
      <Tile
        key={`gain-empty-${i}`}
        label="Since week 1"
        value="-"
        sub="no measured gain yet"
        index={i}
      />
    );
  }

  tiles.push(
    <Tile
      key="on-plan"
      label="On plan"
      value={onPlanPct == null ? "-" : `${onPlanPct}%`}
      sub={onPlanPct == null ? "no planned sets yet" : "sets logged as planned"}
      index={2}
    />
  );
  tiles.push(
    <Tile
      key="off-block"
      label="Off-block workouts"
      value={String(offBlock)}
      sub="left out of this view"
      index={3}
    />
  );

  return <div className="analytics-kpis mx-cascade">{tiles}</div>;
}
