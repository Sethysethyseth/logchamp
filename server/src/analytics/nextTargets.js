const { buildLastPerformance } = require("./lastPerformance");
const { resolveExercise } = require("./resolve");
const { normalizeExerciseName } = require("./normalize");

const MAX_ROWS = 3;

/**
 * "Beat last time" rows for Home: per target lift, the top set of the most
 * recent prior session that has it, and the next target (same weight, one
 * more rep).
 *
 * History matching is `buildLastPerformance` (same identity rules, same
 * most-recent-session-wins rule). The top set is the heaviest weighted set
 * in that session, ties broken by more reps. A lift whose last session has
 * no weight+reps set (timed-only) is omitted. Targets that share an
 * identity keep only the first. At most 3 rows, in target order.
 *
 * Caller contract: `priorSessions` are the requesting user's own completed
 * sessions, shaped `{ performedAt, exercises: [{ order, exerciseId,
 * userExerciseId, exerciseName, sets }] }`.
 *
 * @param {{ targets?: object[], priorSessions?: object[], userIndex?: Map }} input
 * @returns {{ name: string, exerciseId: string|null, userExerciseId: number|null,
 *   last: { weight: number, reps: number, performedAt: string },
 *   next: { weight: number, reps: number } }[]}
 */
function buildNextTargets({ targets, priorSessions, userIndex } = {}) {
  const list = Array.isArray(targets) ? targets : [];
  const seen = new Set();
  const unique = [];
  for (const target of list) {
    const key = identityKey(target, userIndex);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(target);
  }

  const last = buildLastPerformance({
    targets: unique.map((target, index) => ({
      sessionExerciseId: index,
      exerciseId: target.exerciseId,
      userExerciseId: target.userExerciseId,
      exerciseName: target.exerciseName,
    })),
    priorSessions,
    userIndex,
  });
  const byIndex = new Map(last.map((row) => [row.sessionExerciseId, row]));

  const rows = [];
  for (let i = 0; i < unique.length && rows.length < MAX_ROWS; i += 1) {
    const hit = byIndex.get(i);
    if (!hit) continue;
    const top = pickTopSet(hit.sets);
    if (!top) continue;
    const target = unique[i];
    rows.push({
      name: String(target.exerciseName || "").trim(),
      exerciseId: target.exerciseId != null ? target.exerciseId : null,
      userExerciseId: target.userExerciseId != null ? target.userExerciseId : null,
      last: { weight: top.weight, reps: top.reps, performedAt: hit.lastPerformedAt },
      next: { weight: top.weight, reps: top.reps + 1 },
    });
  }
  return rows;
}

/**
 * The user's most-logged lifts in `sessions`, as targets for
 * `buildNextTargets`: ranked by sessions containing a weight+reps set,
 * then by such sets, then by most recent. Timed-only work never counts.
 * Name and ids come from the most recent occurrence.
 *
 * @param {{ sessions?: object[], userIndex?: Map }} input
 * @returns {{ exerciseName: string, exerciseId: string|null, userExerciseId: number|null }[]}
 */
function rankTopLifts({ sessions, userIndex } = {}) {
  const ordered = (Array.isArray(sessions) ? sessions : [])
    .filter((s) => performedMs(s) != null)
    .sort((a, b) => performedMs(b) - performedMs(a));

  const stats = new Map();
  for (const session of ordered) {
    const ms = performedMs(session);
    const counted = new Set();
    for (const exercise of Array.isArray(session.exercises) ? session.exercises : []) {
      const weighted = (Array.isArray(exercise?.sets) ? exercise.sets : []).filter(isWeighted).length;
      if (weighted === 0) continue;
      const key = identityKey(exercise, userIndex);
      if (!key) continue;
      let row = stats.get(key);
      if (!row) {
        row = {
          sessions: 0,
          sets: 0,
          latestMs: ms,
          target: {
            exerciseName: exercise.exerciseName,
            exerciseId: exercise.exerciseId != null ? exercise.exerciseId : null,
            userExerciseId: exercise.userExerciseId != null ? exercise.userExerciseId : null,
          },
        };
        stats.set(key, row);
      }
      row.sets += weighted;
      if (!counted.has(key)) {
        counted.add(key);
        row.sessions += 1;
      }
    }
  }

  return [...stats.values()]
    .sort((a, b) => b.sessions - a.sessions || b.sets - a.sets || b.latestMs - a.latestMs)
    .map((row) => row.target);
}

function pickTopSet(sets) {
  let top = null;
  for (const set of Array.isArray(sets) ? sets : []) {
    if (!isWeighted(set)) continue;
    const weight = Number(set.weight);
    const reps = Number(set.reps);
    if (!top || weight > top.weight || (weight === top.weight && reps > top.reps)) {
      top = { weight, reps };
    }
  }
  return top;
}

function isWeighted(set) {
  return asNumber(set?.weight) != null && asNumber(set?.reps) != null && Number(set.reps) > 0;
}

/* Same key shape as lastPerformance's identityKeyFor: catalog id, `user:<id>`,
   else `name:<normalized>`. */
function identityKey(input, userIndex) {
  const resolution = resolveExercise(
    {
      exerciseName: input?.exerciseName,
      exerciseId: input?.exerciseId,
      userExerciseId: input?.userExerciseId,
    },
    undefined,
    userIndex
  );
  if (resolution.resolved && resolution.userExercise) {
    return `user:${resolution.userExercise.id}`;
  }
  if (resolution.resolved && resolution.catalogEntry && resolution.catalogEntry.id) {
    return resolution.catalogEntry.id;
  }
  const normalized = normalizeExerciseName(input?.exerciseName);
  return normalized ? `name:${normalized}` : null;
}

function asNumber(value) {
  if (value == null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function performedMs(session) {
  const t = new Date(session?.performedAt).getTime();
  return Number.isFinite(t) ? t : null;
}

module.exports = { buildNextTargets, rankTopLifts };
