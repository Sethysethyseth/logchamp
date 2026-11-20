// Block summary: analytics for ONE block run, measured in block weeks.
// Pure - no Prisma, no clock. The caller passes `now`; every number here is
// pinned by its inputs so fixtures can assert them exactly.
//
// Inputs (shapes as loaded by analyticsAccess.loadBlockSummary):
// - run:       { id, startedAt, endedAt }
// - template:  BlockTemplate with weeks -> workouts -> exercises ->
//              blockWorkoutSets (blockWeekInclude shape)
// - sessions:  WorkoutSession rows { id, blockRunId, blockWeekOrder,
//              blockWorkoutOrder, performedAt, completedAt, sets: [{ order,
//              weight, reps, rir, rpe, durationSec, side, sessionExercise:
//              { id, exerciseName, exerciseId, userExerciseId, plan } }] }
//              Sessions whose blockRunId is not run.id are ignored.
// - userIndex: buildUserExerciseIndex(...) for user-exercise identity
// - offBlockCount: completed non-block sessions inside the run's window
//   (counted by the loader; passed through)

const { enrichSet } = require("./enrichSet");
const { computeExecutionFidelity } = require("./planVsActual");
const { estimateOneRepMax } = require("./setMetrics");
const { normalizeExerciseName } = require("./normalize");

function round2(n) {
  return Math.round(n * 100) / 100;
}

function sortedByOrder(items) {
  return [...(items || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
}

function toIso(value) {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function isCoreLogged(set) {
  if (set.durationSec != null) return true;
  return set.weight != null && set.reps != null;
}

// Strength candidate for "top set": weight and reps, not a timed hold.
function isLoadedSet(set) {
  return set.weight != null && set.reps != null;
}

function heavier(a, b) {
  if (!b) return a;
  if (a.weight !== b.weight) return a.weight > b.weight ? a : b;
  return a.reps >= b.reps ? a : b;
}

// Same identity rule as the engine: enrichSet's resolution (catalog id, or
// `user:<id>` for user exercises), else `name:<normalized>` like
// lastPerformance. Returns { key, name } or null.
function liftIdentity(fields, userIndex) {
  const { resolution } = enrichSet(
    {
      exerciseName: fields.exerciseName ?? null,
      exerciseId: fields.exerciseId ?? null,
      userExerciseId: fields.userExerciseId ?? null,
    },
    userIndex
  );
  if (resolution.resolved && resolution.catalogEntry && resolution.catalogEntry.id) {
    return { key: resolution.catalogEntry.id, name: resolution.catalogEntry.name };
  }
  const normalized = normalizeExerciseName(fields.exerciseName);
  if (!normalized) return null;
  return { key: `name:${normalized}`, name: fields.exerciseName };
}

function plannedSetCount(exercise) {
  const rows = exercise.blockWorkoutSets || [];
  if (rows.length > 0) return rows.length;
  return exercise.targetSets != null && exercise.targetSets > 0
    ? exercise.targetSets
    : 0;
}

function buildBlockSummary({
  run,
  template,
  sessions,
  userIndex = new Map(),
  offBlockCount = 0,
  now,
} = {}) {
  const weeksIn = sortedByOrder(template && template.weeks);
  const runSessions = (sessions || []).filter(
    (s) => s && run && s.blockRunId === run.id
  );

  // --- currentWeek: highest week with a logged workout (completed, or at
  // least one core-logged set), else 1.
  let currentWeek = 1;
  for (const s of runSessions) {
    if (s.blockWeekOrder == null) continue;
    const logged =
      s.completedAt != null || (s.sets || []).some((set) => isCoreLogged(set));
    if (logged && s.blockWeekOrder > currentWeek) currentWeek = s.blockWeekOrder;
  }

  // --- progress
  let daysDone = 0;
  let daysTotal = 0;
  const thisWeek = { done: 0, total: 0 };
  for (const week of weeksIn) {
    for (const workout of sortedByOrder(week.workouts)) {
      const done = runSessions.some(
        (s) =>
          s.completedAt != null &&
          s.blockWeekOrder === week.order &&
          s.blockWorkoutOrder === workout.order
      );
      daysTotal += 1;
      if (done) daysDone += 1;
      if (week.order === currentWeek) {
        thisWeek.total += 1;
        if (done) thisWeek.done += 1;
      }
    }
  }

  // --- lifts in template order (first appearance wins the name)
  const lifts = new Map();
  for (const week of weeksIn) {
    for (const workout of sortedByOrder(week.workouts)) {
      for (const ex of sortedByOrder(workout.exercises)) {
        const id = liftIdentity(ex, userIndex);
        if (!id) continue;
        let lift = lifts.get(id.key);
        if (!lift) {
          lift = {
            key: id.key,
            name: id.name,
            perSide: false,
            weeks: new Map(),
          };
          lifts.set(id.key, lift);
        }
        if (ex.perSide === true) lift.perSide = true;
        for (const ps of ex.blockWorkoutSets || []) {
          if (ps.weight == null) continue;
          const cell = liftWeek(lift, week.order);
          if (cell.planned == null || ps.weight > cell.planned) {
            cell.planned = ps.weight;
          }
        }
      }
    }
  }

  // --- walk logged sets once: weekly logged counts, lift tops, fidelity input
  const loggedByWeek = new Map();
  const enriched = [];
  const planLookup = {};
  for (const s of runSessions) {
    for (const set of s.sets || []) {
      const se = set.sessionExercise || null;
      if (s.blockWeekOrder != null && isCoreLogged(set)) {
        loggedByWeek.set(
          s.blockWeekOrder,
          (loggedByWeek.get(s.blockWeekOrder) || 0) + 1
        );
      }

      let planKey = null;
      if (se && se.plan && Array.isArray(se.plan.sets) && se.plan.sets.length > 0) {
        planKey = `block:${se.id}`;
        planLookup[planKey] = se.plan;
      }
      enriched.push(
        enrichSet(
          {
            performedAt: s.performedAt,
            exerciseName: se ? se.exerciseName : null,
            exerciseId: se ? se.exerciseId : null,
            userExerciseId: se ? se.userExerciseId : null,
            weight: set.weight,
            reps: set.reps,
            rir: set.rir,
            rpe: set.rpe,
            durationSec: set.durationSec,
            order: set.order,
            templateExerciseId: planKey,
          },
          userIndex
        )
      );

      if (!se || s.blockWeekOrder == null || !isLoadedSet(set)) continue;
      const id = liftIdentity(se, userIndex);
      const lift = id && lifts.get(id.key);
      if (!lift) continue;
      const side = set.side === "L" || set.side === "R" ? set.side : null;
      if (side) lift.perSide = true;
      const cell = liftWeek(lift, s.blockWeekOrder);
      const entry = { weight: set.weight, reps: set.reps };
      cell.top = heavier(entry, cell.top);
      if (side === "L") cell.left = heavier(entry, cell.left);
      if (side === "R") cell.right = heavier(entry, cell.right);
    }
  }

  // --- weeks
  const weeks = weeksIn.map((week) => {
    let plannedSets = 0;
    for (const workout of week.workouts || []) {
      for (const ex of workout.exercises || []) plannedSets += plannedSetCount(ex);
    }
    return {
      week: week.order,
      plannedSets,
      loggedSets: loggedByWeek.get(week.order) || 0,
    };
  });

  // --- onPlan
  let plannedToDate = 0;
  let loggedToDate = 0;
  for (const w of weeks) {
    if (w.week > currentWeek) continue;
    plannedToDate += w.plannedSets;
    loggedToDate += w.loggedSets;
  }
  const onPlanPct =
    plannedToDate === 0 ? null : Math.round((loggedToDate / plannedToDate) * 100);

  return {
    run: {
      id: run.id,
      name: template && template.name != null ? template.name : null,
      startedAt: toIso(run.startedAt),
      endedAt: toIso(run.endedAt),
      weeksTotal: weeksIn.length,
      currentWeek,
    },
    progress: { daysDone, daysTotal, thisWeek },
    weeks,
    lifts: Array.from(lifts.values()).map((lift) => finishLift(lift, weeksIn)),
    onPlan: {
      fidelity: computeExecutionFidelity(enriched, planLookup),
      onPlanPct,
    },
    offBlockWorkouts: offBlockCount,
    asOf: toIso(now),
  };
}

function liftWeek(lift, weekOrder) {
  let cell = lift.weeks.get(weekOrder);
  if (!cell) {
    cell = { top: null, left: null, right: null, planned: null };
    lift.weeks.set(weekOrder, cell);
  }
  return cell;
}

function finishLift(lift, weeksIn) {
  const weeks = weeksIn.map((week) => {
    const cell = lift.weeks.get(week.order) || {
      top: null,
      left: null,
      right: null,
      planned: null,
    };
    return {
      week: week.order,
      top: cell.top,
      left: lift.perSide ? cell.left : null,
      right: lift.perSide ? cell.right : null,
      planned: cell.planned,
    };
  });

  const withE1rm = weeks
    .map((w) => (w.top ? estimateOneRepMax(w.top.weight, w.top.reps).epley : null))
    .filter((v) => v != null);
  const first = withE1rm.length > 0 ? withE1rm[0] : null;
  const latest = withE1rm.length > 0 ? withE1rm[withE1rm.length - 1] : null;

  return {
    key: lift.key,
    name: lift.name,
    perSide: lift.perSide,
    weeks,
    e1rm: {
      first: first == null ? null : round2(first),
      latest: latest == null ? null : round2(latest),
      delta: first == null ? null : round2(latest - first),
    },
  };
}

module.exports = { buildBlockSummary };
