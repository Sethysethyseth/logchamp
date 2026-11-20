import { useEffect, useMemo, useState } from "react";
import * as analyticsApi from "../../api/analyticsApi.js";
import { localDayRange } from "../../lib/dateRange.js";
import { HomeSectionCard } from "./HomeSectionCard.jsx";

const DUE_WEEKS = 8;
const DUE_ROWS = 3;

/** Muscles ranked by days since last trained, longest first. */
function rankDueMuscles(perMuscle, limit = DUE_ROWS) {
  return (Array.isArray(perMuscle) ? perMuscle : [])
    .filter((m) => m && m.muscle && Number.isFinite(Number(m.daysSinceLast)))
    .map((m) => ({ muscle: m.muscle, days: Math.round(Number(m.daysSinceLast)) }))
    .sort((a, b) => b.days - a.days)
    .slice(0, limit);
}

/**
 * "Due": the 8-week summary's longest-waiting muscles. It fetches only
 * when mounted, so DashboardPage must not render it while the section is
 * off. Renders nothing until loaded, and nothing without rows.
 */
export function HomeDueSection({ reloadKey = 0 }) {
  const range = useMemo(() => localDayRange(DUE_WEEKS * 7), []);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const summary = await analyticsApi.getSummary(range);
        if (!cancelled) setRows(rankDueMuscles(summary?.perMuscle));
      } catch (err) {
        console.error("HomeDueSection: failed to load summary", err);
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range, reloadKey]);

  if (rows.length === 0) return null;
  const top = rows[0].days;

  return (
    <HomeSectionCard id="due" title="Due" aside="longest since trained">
      <ul className="home-due__list">
        {rows.map((row) => (
          <li key={row.muscle} className="home-due__row">
            <span className="home-due__muscle">{row.muscle}</span>
            <span className="home-due__track" aria-hidden="true">
              <span
                className="home-due__bar"
                style={{ width: `${top > 0 ? Math.round((100 * row.days) / top) : 0}%` }}
              />
            </span>
            <span className="home-due__days">{row.days} d</span>
          </li>
        ))}
      </ul>
    </HomeSectionCard>
  );
}
