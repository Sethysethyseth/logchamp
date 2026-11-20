import { useEffect, useMemo, useState } from "react";
import * as analyticsApi from "../../api/analyticsApi.js";
import { localDayRange } from "../../lib/dateRange.js";
import { formatRepsValue } from "../../lib/repsDisplay.js";
import { formatEstimate, formatWeight } from "../../lib/weightDisplay.js";
import { buildExecutionVerdict } from "../../lib/executionVerdict.js";
import { publishArenaFacts } from "../../lib/arenaFacts.js";
import { MX_DATA_LEAD_MS } from "../../lib/useCountUp.js";
import { CountUp } from "../motion/CountUp.jsx";

/* Home's rolling-week data layer. The Home sections that read it ("This
   week", "Highlights") live in components/home/; one fetch feeds both. */

/** Current + prior 7 local-day windows as ISO datetimes (end-of-local-day). */
export function weeklyReportWindows(now = new Date()) {
  const priorEnd = new Date(now);
  priorEnd.setDate(priorEnd.getDate() - 7);
  return {
    current: localDayRange(7, now),
    prior: localDayRange(7, priorEnd),
  };
}

function hasSummaryData(summary) {
  if (!summary) return false;
  return (summary.perMuscle?.length ?? 0) > 0 || (summary.perExercise?.length ?? 0) > 0;
}

const WEEKLY_MODE_KEY = "workoutdb-weekly-mode";

export function readWeeklyMode() {
  try {
    return sessionStorage.getItem(WEEKLY_MODE_KEY) === "full" ? "full" : "compact";
  } catch {
    return "compact";
  }
}

export function writeWeeklyMode(mode) {
  try {
    sessionStorage.setItem(WEEKLY_MODE_KEY, mode);
  } catch {
    /* private mode */
  }
}

/**
 * Current + prior 7-day summaries. Bump `reloadKey` to refetch (e.g. after
 * an in-place discard). Publishes the arena's `week` fact on every load.
 *
 * @returns {{ status: "loading" | "failed" | "ready", current: object|null, prior: object|null }}
 */
export function useWeeklyReport(reloadKey = 0) {
  const windows = useMemo(() => weeklyReportWindows(), []);
  const [state, setState] = useState({ key: null, status: "loading", current: null, prior: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [current, prior] = await Promise.all([
          analyticsApi.getSummary(windows.current),
          analyticsApi.getSummary(windows.prior),
        ]);
        if (cancelled) return;
        setState({ key: reloadKey, status: "ready", current, prior });
        publishArenaFacts({ week: { summary: current } });
      } catch (err) {
        console.error("WeeklyReport: failed to load summaries", err);
        if (!cancelled) setState({ key: reloadKey, status: "failed", current: null, prior: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [windows, reloadKey]);

  /* A result for an older reloadKey reads as loading until the refetch lands. */
  if (state.key !== reloadKey) return { status: "loading", current: null, prior: null };
  return state;
}

/** Derived facts both Home week sections branch on. */
export function weeklyFacts(current, prior) {
  const currentWorkouts = current?.workoutCount ?? 0;
  const priorWorkouts = prior?.workoutCount ?? 0;
  const currentHasData = currentWorkouts > 0 || hasSummaryData(current);
  const priorHasData = priorWorkouts > 0 || hasSummaryData(prior);
  return {
    currentWorkouts,
    priorWorkouts,
    currentHasData,
    priorHasData,
    priorEmpty: !priorHasData,
    prCount: Array.isArray(current?.prs) ? current.prs.length : 0,
  };
}

export function formatCountDelta(current, prior, priorEmpty) {
  if (priorEmpty) return "first 7 days tracked";
  const delta = current - prior;
  if (delta > 0) return `+${delta} vs the 7 days before`;
  if (delta < 0) return `${delta} vs the 7 days before`;
  return "same as the 7 days before";
}

export function deltaTone(delta, priorEmpty) {
  if (priorEmpty || delta <= 0) return null;
  return "up";
}

function sumEffectiveSets(summary) {
  return (summary?.perMuscle ?? []).reduce((sum, m) => sum + m.effectiveSets, 0);
}

function computeMuscleMovers(currentPerMuscle, priorPerMuscle) {
  if (!currentPerMuscle || !priorPerMuscle) return [];
  const priorMap = new Map(priorPerMuscle.map((m) => [m.muscle, m.effectiveSets]));
  const deltas = currentPerMuscle
    .map((m) => ({
      muscle: m.muscle,
      delta: m.effectiveSets - (priorMap.get(m.muscle) ?? 0),
    }))
    .filter((m) => m.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);
  return deltas;
}

function formatMoverDelta(delta) {
  const sign = delta > 0 ? "+" : "";
  const rounded = Number(Number(delta).toFixed(1));
  const s = rounded.toFixed(1);
  const num = s.endsWith(".0") ? s.slice(0, -2) : s;
  return `${sign}${num}`;
}

function formatMoversLine(movers) {
  if (movers.length === 0) return null;
  return movers.map((m) => `${m.muscle} ${formatMoverDelta(m.delta)} sets`).join(" - ");
}

function groupPRsByExercise(prs) {
  if (!prs || prs.length === 0) return { groups: [], overflow: 0 };
  const shown = prs.slice(0, 3);
  const overflow = prs.length > 3 ? prs.length - 3 : 0;
  const grouped = new Map();
  for (const pr of shown) {
    const name = pr.exerciseName;
    if (!grouped.has(name)) {
      grouped.set(name, []);
    }
    grouped.get(name).push(pr);
  }
  const groups = Array.from(grouped.entries()).map(([name, items]) => ({
    exerciseName: name,
    achievements: items.map((pr) => {
      if (pr.type === "e1rmPR") {
        return { text: `e1RM ${formatEstimate(pr.value)}`, isE1rm: true };
      }
      return { text: `${formatWeight(pr.weight)} × ${formatRepsValue(pr.reps)}`, isE1rm: false };
    }),
  }));
  return { groups, overflow };
}

function computeOverallExecutionVerdict(execution) {
  if (!execution || execution.length === 0) return null;
  const withData = execution.filter(
    (ex) => ex.loadAdherence !== null || ex.volumeAdherence !== null || ex.effortDrift !== null
  );
  if (withData.length === 0) return null;
  const avgLoad =
    withData.filter((ex) => ex.loadAdherence !== null).length > 0
      ? withData.reduce((sum, ex) => sum + (ex.loadAdherence ?? 0), 0) /
        withData.filter((ex) => ex.loadAdherence !== null).length
      : null;
  const avgVolume =
    withData.filter((ex) => ex.volumeAdherence !== null).length > 0
      ? withData.reduce((sum, ex) => sum + (ex.volumeAdherence ?? 0), 0) /
        withData.filter((ex) => ex.volumeAdherence !== null).length
      : null;
  const avgEffort =
    withData.filter((ex) => ex.effortDrift !== null).length > 0
      ? withData.reduce((sum, ex) => sum + (ex.effortDrift ?? 0), 0) /
        withData.filter((ex) => ex.effortDrift !== null).length
      : null;
  return buildExecutionVerdict({
    loadAdherence: avgLoad,
    volumeAdherence: avgVolume,
    effortDrift: avgEffort,
  });
}

function computeNudgeLine(currentSummary, priorSummary) {
  const effortCoverage = currentSummary?.meta?.effortCoverage;
  if (effortCoverage !== null && effortCoverage < 0.6) {
    return "Logging RIR or RPE unlocks better volume insights.";
  }
  const currentSets = sumEffectiveSets(currentSummary);
  const priorSets = sumEffectiveSets(priorSummary);
  if (priorSets > 0 && currentSets < priorSets * 0.8) {
    return "Volume is down from the 7 days before.";
  }
  const currentPerMuscle = currentSummary?.perMuscle ?? [];
  const priorPerMuscle = priorSummary?.perMuscle ?? [];
  for (const pm of priorPerMuscle) {
    if (pm.effectiveSets >= 3) {
      const currentMuscle = currentPerMuscle.find((m) => m.muscle === pm.muscle);
      if (!currentMuscle || currentMuscle.effectiveSets === 0) {
        return `${pm.muscle} went quiet in the last 7 days.`;
      }
    }
  }
  return null;
}

/** One stat column; the leading number rolls in via CountUp. */
export function ReportStat({ label, value, delta, deltaTone: tone }) {
  return (
    <div className="weekly-report__stat">
      <span className="weekly-report__stat-label muted small">{label}</span>
      <span className={`weekly-report__stat-value${tone ? " weekly-report__stat-value--up" : ""}`}>
        <CountUp text={value} delay={MX_DATA_LEAD_MS} />
      </span>
      {delta ? (
        <span
          className={`weekly-report__stat-delta muted small${tone ? " weekly-report__stat-delta--up" : ""}`}
        >
          {delta}
        </span>
      ) : null}
    </div>
  );
}

function PRRows({ prs }) {
  const { groups, overflow } = groupPRsByExercise(prs);
  if (groups.length === 0) return null;

  return (
    <div className="weekly-report__prs">
      {groups.map((group) => (
        <div key={group.exerciseName} className="weekly-report__pr-row">
          <span className="session-set-pr-chip" title="Personal record">PR</span>
          <span className="weekly-report__pr-achievements">
            {group.achievements.map((a, i) => (
              <span key={i} className="weekly-report__pr-achievement">{a.text}</span>
            ))}
          </span>
          <span className="weekly-report__pr-exercise">{group.exerciseName}</span>
        </div>
      ))}
      {overflow > 0 ? (
        <p className="weekly-report__pr-overflow muted small">+{overflow} more</p>
      ) : null}
    </div>
  );
}

/** The digest's lines (PRs, Movers, Execution, Note), or null when none apply. */
export function weeklyDigest(currentSummary, priorSummary, priorEmpty) {
  const movers = priorEmpty
    ? []
    : computeMuscleMovers(currentSummary?.perMuscle, priorSummary?.perMuscle);
  const moversLine = formatMoversLine(movers);
  const prs = currentSummary?.prs ?? [];
  const executionVerdict = computeOverallExecutionVerdict(currentSummary?.execution);
  const nudgeLine = computeNudgeLine(currentSummary, priorSummary);

  if (!moversLine && prs.length === 0 && !executionVerdict && !nudgeLine) {
    return null;
  }
  return { prs, moversLine, executionVerdict, nudgeLine };
}

/** Renders `weeklyDigest(...)`'s result. */
export function WeeklyDigest({ digest }) {
  if (!digest) return null;
  const { prs, moversLine, executionVerdict, nudgeLine } = digest;

  return (
    <div className="weekly-report__digest">
      <PRRows prs={prs} />
      {moversLine ? (
        <p className="weekly-report__digest-line weekly-report__digest-line--supporting">
          <span className="weekly-report__digest-label">Movers</span>
          {moversLine}
        </p>
      ) : null}
      {executionVerdict ? (
        <p className="weekly-report__digest-line weekly-report__digest-line--supporting">
          <span className="weekly-report__digest-label">Execution</span>
          {executionVerdict}.
        </p>
      ) : null}
      {nudgeLine ? (
        <p className="weekly-report__digest-line weekly-report__digest-line--supporting">
          <span className="weekly-report__digest-label">Note</span>
          {nudgeLine}
        </p>
      ) : null}
    </div>
  );
}
