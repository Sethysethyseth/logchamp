import { useMemo, useRef, useState } from "react";
import { ChartTableToggle } from "../ChartTableToggle.jsx";
import { formatWeight } from "../../../lib/weightDisplay.js";
import { loadWeightUnit } from "../../../lib/weightUnitPref.js";

/**
 * One lift card: "Top set by block week" with Left/Right (or one line),
 * dashed planned, crosshair tooltip, Chart|Table toggle.
 * Tip (per-side), three lines: "Week 4" / "Left 205 lbs · Right 210 lbs" / "Planned 210 lbs"
 */

function bareWeight(n) {
  return formatWeight(n).replace(/ (lbs|kg)$/, "");
}

function weeksWithData(lift) {
  const weeks = Array.isArray(lift?.weeks) ? lift.weeks : [];
  return weeks.filter((w) => {
    if (lift.perSide) return w.left != null || w.right != null;
    return w.top != null;
  });
}

/** Lifts that have logged top-set data in at least two block weeks. */
export function liftsWithChartData(lifts) {
  return (Array.isArray(lifts) ? lifts : []).filter(
    (lift) => weeksWithData(lift).length >= 2
  );
}

function buildTip(lift, weekCell, unit) {
  const week = weekCell.week;
  if (lift.perSide) {
    const left =
      weekCell.left != null ? formatWeight(weekCell.left.weight, unit) : "—";
    const right =
      weekCell.right != null ? formatWeight(weekCell.right.weight, unit) : "—";
    const planned =
      weekCell.planned != null ? formatWeight(weekCell.planned, unit) : "—";
    return { title: `Week ${week}`, lines: [`Left ${left} · Right ${right}`, `Planned ${planned}`] };
  }
  const top =
    weekCell.top != null ? formatWeight(weekCell.top.weight, unit) : "—";
  const planned =
    weekCell.planned != null ? formatWeight(weekCell.planned, unit) : "—";
  return { title: `Week ${week}`, lines: [`Top set ${top}`, `Planned ${planned}`] };
}

function paddedRange(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.1, 5);
    return { min: min - pad, max: max + pad };
  }
  const span = max - min;
  const pad = span * 0.12;
  return { min: min - pad, max: max + pad };
}

function collectValues(lift) {
  const vals = [];
  for (const w of lift.weeks || []) {
    if (w.planned != null) vals.push(w.planned);
    if (lift.perSide) {
      if (w.left?.weight != null) vals.push(w.left.weight);
      if (w.right?.weight != null) vals.push(w.right.weight);
    } else if (w.top?.weight != null) {
      vals.push(w.top.weight);
    }
  }
  return vals;
}

function LiftPlot({ lift, tipWeek, onTipWeek }) {
  const hostRef = useRef(null);
  const unit = loadWeightUnit();
  const weeks = lift.weeks || [];
  const n = weeks.length;
  const values = collectValues(lift);
  const rawMin = values.length ? Math.min(...values) : 0;
  const rawMax = values.length ? Math.max(...values) : 100;
  const { min, max } = paddedRange(rawMin, rawMax);

  const W = 320;
  const H = 168;
  const m = { l: 36, r: 36, t: 14, b: 26 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;

  const xOf = (i) => (n <= 1 ? m.l + iw / 2 : m.l + (iw * i) / (n - 1));
  const yOf = (v) => m.t + ih - (ih * (v - min)) / (max - min || 1);

  const yTicks = useMemo(() => {
    const span = max - min;
    const step = span <= 40 ? 10 : span <= 100 ? 20 : 25;
    const start = Math.ceil(min / step) * step;
    const ticks = [];
    for (let v = start; v <= max; v += step) ticks.push(v);
    if (ticks.length === 0) ticks.push(Math.round(min), Math.round(max));
    return ticks;
  }, [min, max]);

  function pathFor(getter) {
    const parts = [];
    weeks.forEach((w, i) => {
      const pt = getter(w);
      if (pt == null || pt.weight == null) return;
      parts.push(`${parts.length ? "L" : "M"}${xOf(i)} ${yOf(pt.weight)}`);
    });
    return parts.join(" ");
  }

  function planPath() {
    const parts = [];
    weeks.forEach((w, i) => {
      if (w.planned == null) return;
      parts.push(`${parts.length ? "L" : "M"}${xOf(i)} ${yOf(w.planned)}`);
    });
    return parts.join(" ");
  }

  function nearestIndex(clientX) {
    const svg = hostRef.current?.querySelector("svg");
    if (!svg || n === 0) return 0;
    const r = svg.getBoundingClientRect();
    const px = ((clientX - r.left) * W) / r.width;
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < n; i += 1) {
      const d = Math.abs(xOf(i) - px);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return best;
  }

  function onPointer(ev) {
    onTipWeek(nearestIndex(ev.clientX));
  }

  const tipIdx = tipWeek;
  const tipCell = tipIdx != null ? weeks[tipIdx] : null;
  const tip = tipCell ? buildTip(lift, tipCell, unit) : null;

  return (
    <div
      ref={hostRef}
      className="ba-lift-plot"
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      onPointerLeave={() => onTipWeek(null)}
    >
      <svg
        className="ba-lift-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${lift.name}: top set by block week`}
      >
        {yTicks.map((v) => (
          <g key={v}>
            <line
              className="ba-lift-grid"
              x1={m.l}
              x2={W - m.r}
              y1={yOf(v)}
              y2={yOf(v)}
            />
            <text className="ba-lift-ax" x={m.l - 6} y={yOf(v) + 3} textAnchor="end">
              {bareWeight(v)}
            </text>
          </g>
        ))}
        <line
          className="ba-lift-base"
          x1={m.l}
          x2={W - m.r}
          y1={m.t + ih}
          y2={m.t + ih}
        />
        {weeks.map((w, i) => (
          <text
            key={w.week}
            className="ba-lift-ax"
            x={xOf(i)}
            y={H - 6}
            textAnchor="middle"
          >
            W{w.week}
          </text>
        ))}

        {planPath() ? (
          <path className="ba-lift-plan" d={planPath()} fill="none" />
        ) : null}

        {lift.perSide ? (
          <>
            {pathFor((w) => w.left) ? (
              <path className="ba-lift-line ba-lift-line--left" d={pathFor((w) => w.left)} fill="none" />
            ) : null}
            {pathFor((w) => w.right) ? (
              <path className="ba-lift-line ba-lift-line--right" d={pathFor((w) => w.right)} fill="none" />
            ) : null}
            {weeks.map((w, i) => (
              <g key={`dots-${w.week}`}>
                {w.left?.weight != null ? (
                  <circle
                    className="ba-lift-dot ba-lift-dot--left"
                    cx={xOf(i)}
                    cy={yOf(w.left.weight)}
                    r={i === n - 1 ? 4.5 : 3}
                  />
                ) : null}
                {w.right?.weight != null ? (
                  <circle
                    className="ba-lift-dot ba-lift-dot--right"
                    cx={xOf(i)}
                    cy={yOf(w.right.weight)}
                    r={i === n - 1 ? 4.5 : 3}
                  />
                ) : null}
              </g>
            ))}
          </>
        ) : (
          <>
            {pathFor((w) => w.top) ? (
              <path className="ba-lift-line ba-lift-line--top" d={pathFor((w) => w.top)} fill="none" />
            ) : null}
            {weeks.map((w, i) =>
              w.top?.weight != null ? (
                <circle
                  key={`top-${w.week}`}
                  className="ba-lift-dot ba-lift-dot--top"
                  cx={xOf(i)}
                  cy={yOf(w.top.weight)}
                  r={i === n - 1 ? 4.5 : 3}
                />
              ) : null
            )}
          </>
        )}

        {tipIdx != null ? (
          <line
            className="ba-lift-crosshair"
            x1={xOf(tipIdx)}
            x2={xOf(tipIdx)}
            y1={m.t}
            y2={m.t + ih}
          />
        ) : null}
      </svg>
      {tipCell ? (
        <div
          className="ba-lift-tip"
          style={{
            left: `${Math.min(92, Math.max(8, (xOf(tipIdx) / W) * 100))}%`,
          }}
        >
          <strong className="ba-lift-tip__title">{tip.title}</strong>
          {tip.lines.map((line) => (
            <span key={line} className="ba-lift-tip__line">{line}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LiftTable({ lift }) {
  const unit = loadWeightUnit();
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Week</th>
            {lift.perSide ? (
              <>
                <th scope="col">Left</th>
                <th scope="col">Right</th>
              </>
            ) : (
              <th scope="col">Top set</th>
            )}
            <th scope="col">Planned</th>
          </tr>
        </thead>
        <tbody>
          {(lift.weeks || []).map((w) => (
            <tr key={w.week}>
              <td>W{w.week}</td>
              {lift.perSide ? (
                <>
                  <td className="num">
                    {w.left != null ? formatWeight(w.left.weight, unit) : "—"}
                  </td>
                  <td className="num">
                    {w.right != null ? formatWeight(w.right.weight, unit) : "—"}
                  </td>
                </>
              ) : (
                <td className="num">
                  {w.top != null ? formatWeight(w.top.weight, unit) : "—"}
                </td>
              )}
              <td className="num">
                {w.planned != null ? formatWeight(w.planned, unit) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BlockLiftChart({ lift }) {
  const [view, setView] = useState("chart");
  const [tipWeek, setTipWeek] = useState(null);

  return (
    <section className="card analytics-table-card ba-lift-card">
      <div className="analytics-card-head stack">
        <div className="row">
          <h2>{lift.name}</h2>
          <ChartTableToggle
            value={view}
            onChange={setView}
            cardName={lift.name}
          />
        </div>
        <p className="muted small analytics-card-sub">
          Top set by block week{lift.perSide ? " · per side" : ""}
        </p>
      </div>
      {view === "chart" ? (
        <div className="analytics-chart-body">
          <LiftPlot lift={lift} tipWeek={tipWeek} onTipWeek={setTipWeek} />
          <div className="ba-lift-legend" aria-hidden="true">
            {lift.perSide ? (
              <>
                <span>
                  <i className="ba-lift-swatch ba-lift-swatch--left" />
                  Left
                </span>
                <span>
                  <i className="ba-lift-swatch ba-lift-swatch--right" />
                  Right
                </span>
              </>
            ) : (
              <span>
                <i className="ba-lift-swatch ba-lift-swatch--top" />
                Top set
              </span>
            )}
            <span>
              <i className="ba-lift-swatch ba-lift-swatch--plan" />
              Planned
            </span>
          </div>
        </div>
      ) : (
        <LiftTable lift={lift} />
      )}
    </section>
  );
}
