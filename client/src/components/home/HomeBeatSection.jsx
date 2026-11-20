import { useEffect, useState } from "react";
import * as sessionApi from "../../api/sessionApi.js";
import { formatRepsValue } from "../../lib/repsDisplay.js";
import { loadWeightUnit } from "../../lib/weightUnitPref.js";
import { HomeSectionCard } from "./HomeSectionCard.jsx";

function plainWeight(n) {
  const s = Number(n).toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

function subtitleFor(source) {
  if (source?.kind === "block") {
    return source.name ? `${source.name} · up next` : "up next";
  }
  return "your top lifts";
}

/**
 * "Beat last time": up to 3 lifts with last time's top set and the one-rep
 * step past it. Renders nothing until the rows load, and nothing without
 * rows. Bump `reloadKey` to refetch.
 */
export function HomeBeatSection({ reloadKey = 0 }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await sessionApi.getNextTargets();
        if (!cancelled) setData(next);
      } catch (err) {
        console.error("HomeBeatSection: failed to load next targets", err);
        if (!cancelled) setData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const rows = Array.isArray(data?.rows) ? data.rows : [];
  if (rows.length === 0) return null;
  const unit = loadWeightUnit();

  return (
    <HomeSectionCard id="beat" title="Beat last time" aside={subtitleFor(data.source)}>
      <ul className="home-beat__list">
        {rows.map((row) => {
          const last = `${plainWeight(row.last.weight)} × ${formatRepsValue(row.last.reps)}`;
          const next = `${plainWeight(row.next.weight)} × ${formatRepsValue(row.next.reps)}`;
          return (
            <li
              key={`${row.exerciseId ?? ""}:${row.userExerciseId ?? ""}:${row.name}`}
              className="home-beat__row"
              aria-label={`${row.name}: last time ${plainWeight(row.last.weight)} ${unit} for ${row.last.reps}, next ${plainWeight(row.next.weight)} ${unit} for ${row.next.reps}`}
            >
              <span className="home-beat__name">{row.name}</span>
              <span className="home-beat__sets" aria-hidden="true">
                <b className="home-beat__last">{last}</b>
                <span className="home-beat__next">→ {next}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </HomeSectionCard>
  );
}
