const { buildBlockSummary } = require("../../src/analytics/blockSummary");
const { buildUserExerciseIndex } = require("../../src/analytics/userExercises");

const SQUAT_ID = "Barbell_Squat";
const BENCH_ID = "Barbell_Bench_Press_-_Medium_Grip";
const BSS_USER_ID = 7;

const RUN = {
  id: 10,
  startedAt: new Date("2026-11-02T00:00:00.000Z"),
  endedAt: null,
};
const NOW = new Date("2026-11-20T12:00:00.000Z");

const userIndex = buildUserExerciseIndex([
  { id: BSS_USER_ID, name: "Bulgarian Split Squat", muscles: { quadriceps: "primary" } },
]);

function plannedSets(n, weight) {
  return Array.from({ length: n }, (_, i) => ({
    order: i + 1,
    reps: 5,
    repsMax: null,
    weight,
    rpe: null,
    rir: null,
    durationSec: null,
  }));
}

// 3 weeks x 2 workouts. Day A: squat (3 planned rows; weight 100 in week 1
// only) + Bulgarian split squat (per side, targetSets 2, no rows). Day B:
// bench (targetSets 3, no rows). 8 planned sets per week.
function threeWeekTemplate() {
  return {
    id: 1,
    name: "Strength 3",
    weeks: [1, 2, 3].map((order) => ({
      order,
      workouts: [
        {
          order: 1,
          name: "A",
          exercises: [
            {
              order: 1,
              exerciseName: "Barbell Squat",
              exerciseId: SQUAT_ID,
              userExerciseId: null,
              targetSets: 3,
              perSide: null,
              blockWorkoutSets: plannedSets(3, order === 1 ? 100 : null),
            },
            {
              order: 2,
              exerciseName: "Bulgarian Split Squat",
              exerciseId: null,
              userExerciseId: BSS_USER_ID,
              targetSets: 2,
              perSide: true,
              blockWorkoutSets: [],
            },
          ],
        },
        {
          order: 2,
          name: "B",
          exercises: [
            {
              order: 1,
              exerciseName: "Barbell Bench Press - Medium Grip",
              exerciseId: BENCH_ID,
              userExerciseId: null,
              targetSets: 3,
              perSide: null,
              blockWorkoutSets: [],
            },
          ],
        },
      ],
    })),
  };
}

let seId = 100;
function sessionExercise(exerciseName, exerciseId, userExerciseId, plan) {
  seId += 1;
  return { id: seId, exerciseName, exerciseId, userExerciseId, plan };
}

function snapshot(n, weight) {
  return {
    v: 1,
    effort: null,
    effortCap: false,
    sets: plannedSets(n, weight).map(({ order, ...s }) => s),
  };
}

function set(order, se, weight, reps, side = null) {
  return {
    order,
    weight,
    reps,
    rir: null,
    rpe: null,
    durationSec: null,
    side,
    sessionExercise: se,
  };
}

function session({ id, runId = RUN.id, week, workout, day, completed = true, sets }) {
  const performedAt = new Date(`2026-11-${String(day).padStart(2, "0")}T10:00:00.000Z`);
  return {
    id,
    blockRunId: runId,
    blockWeekOrder: week,
    blockWorkoutOrder: workout,
    performedAt,
    completedAt: completed ? performedAt : null,
    sets,
  };
}

function dayA(id, week, day, squatWeights, bss, planWeight) {
  const squat = sessionExercise("Barbell Squat", SQUAT_ID, null, snapshot(3, planWeight));
  const split = sessionExercise("Bulgarian Split Squat", null, BSS_USER_ID, snapshot(2, null));
  return session({
    id,
    week,
    workout: 1,
    day,
    sets: [
      ...squatWeights.map(([w, r], i) => set(i + 1, squat, w, r)),
      set(4, split, bss.L, 8, "L"),
      set(5, split, bss.R, 8, "R"),
    ],
  });
}

function fixtureSessions() {
  const bench1 = sessionExercise("Barbell Bench Press - Medium Grip", BENCH_ID, null, null);
  const bench2 = sessionExercise("Barbell Bench Press - Medium Grip", BENCH_ID, null, null);
  const benchOther = sessionExercise("Barbell Bench Press - Medium Grip", BENCH_ID, null, null);
  return [
    dayA(1, 1, 2, [[100, 5], [100, 5], [100, 5]], { L: 50, R: 55 }, 100),
    session({
      id: 2,
      week: 1,
      workout: 2,
      day: 4,
      sets: [1, 2, 3].map((o) => set(o, bench1, 80, 8)),
    }),
    dayA(3, 2, 9, [[110, 5], [110, 5], [110, 3]], { L: 55, R: 60 }, null),
    // Week 2 day B: in progress, one set logged and one empty row.
    session({
      id: 4,
      week: 2,
      workout: 2,
      day: 11,
      completed: false,
      sets: [set(1, bench2, 85, 8), set(2, bench2, null, null)],
    }),
    // ANOTHER run's session passed in by mistake - must be ignored.
    session({
      id: 5,
      runId: 99,
      week: 2,
      workout: 2,
      day: 12,
      sets: [1, 2, 3].map((o) => set(o, benchOther, 200, 8)),
    }),
  ];
}

function build(overrides = {}) {
  return buildBlockSummary({
    run: RUN,
    template: threeWeekTemplate(),
    sessions: fixtureSessions(),
    userIndex,
    offBlockCount: 2,
    now: NOW,
    ...overrides,
  });
}

describe("buildBlockSummary", () => {
  test("run header: weeks total and current week from the highest logged week", () => {
    expect(build().run).toEqual({
      id: 10,
      name: "Strength 3",
      startedAt: "2026-11-02T00:00:00.000Z",
      endedAt: null,
      weeksTotal: 3,
      currentWeek: 2,
    });
  });

  test("week 2 half logged: exact logged sets per week and days done", () => {
    const out = build();
    expect(out.weeks).toEqual([
      { week: 1, plannedSets: 8, loggedSets: 8 },
      { week: 2, plannedSets: 8, loggedSets: 6 },
      { week: 3, plannedSets: 8, loggedSets: 0 },
    ]);
    expect(out.progress).toEqual({
      daysDone: 3,
      daysTotal: 6,
      thisWeek: { done: 1, total: 2 },
    });
  });

  test("per-side lift: left / right tops per week and perSide true", () => {
    const bss = build().lifts.find((l) => l.key === `user:${BSS_USER_ID}`);
    expect(bss.name).toBe("Bulgarian Split Squat");
    expect(bss.perSide).toBe(true);
    expect(bss.weeks[0]).toEqual({
      week: 1,
      top: { weight: 55, reps: 8 },
      left: { weight: 50, reps: 8 },
      right: { weight: 55, reps: 8 },
      planned: null,
    });
    expect(bss.weeks[1]).toEqual({
      week: 2,
      top: { weight: 60, reps: 8 },
      left: { weight: 55, reps: 8 },
      right: { weight: 60, reps: 8 },
      planned: null,
    });
    expect(bss.weeks[2]).toEqual({
      week: 3,
      top: null,
      left: null,
      right: null,
      planned: null,
    });
  });

  test("planned weight on week 1 only -> planned null on week 2; non per-side lift has null sides", () => {
    const squat = build().lifts.find((l) => l.key === SQUAT_ID);
    expect(squat.perSide).toBe(false);
    expect(squat.weeks[0]).toEqual({
      week: 1,
      top: { weight: 100, reps: 5 },
      left: null,
      right: null,
      planned: 100,
    });
    expect(squat.weeks[1].planned).toBeNull();
    expect(squat.weeks[1].top).toEqual({ weight: 110, reps: 5 });
  });

  test("e1rm delta from the first to the latest week with a top set", () => {
    const squat = build().lifts.find((l) => l.key === SQUAT_ID);
    // Epley: 100 * (1 + 5/30) = 116.67; 110 * (1 + 5/30) = 128.33.
    expect(squat.e1rm).toEqual({ first: 116.67, latest: 128.33, delta: 11.67 });
  });

  test("lifts come in template order, one per lift", () => {
    expect(build().lifts.map((l) => l.key)).toEqual([
      SQUAT_ID,
      `user:${BSS_USER_ID}`,
      BENCH_ID,
    ]);
  });

  test("a session from another run is ignored everywhere", () => {
    const out = build();
    const bench = out.lifts.find((l) => l.key === BENCH_ID);
    expect(bench.weeks[1].top).toEqual({ weight: 85, reps: 8 });
    expect(out.weeks[1].loggedSets).toBe(6);
    const fidelityBench = out.onPlan.fidelity.find((r) => r.exerciseId === BENCH_ID);
    expect(fidelityBench).toBeUndefined();

    const onlyOther = build({ sessions: fixtureSessions().filter((s) => s.blockRunId === 99) });
    expect(onlyOther.weeks.map((w) => w.loggedSets)).toEqual([0, 0, 0]);
    expect(onlyOther.progress.daysDone).toBe(0);
    expect(onlyOther.run.currentWeek).toBe(1);
  });

  test("onPlan: fidelity over the run's sessions plus onPlanPct over past/current weeks", () => {
    const out = build();
    // Weeks 1-2 reached: (8 + 6) / (8 + 8) = 87.5% -> 88.
    expect(out.onPlan.onPlanPct).toBe(88);
    const squat = out.onPlan.fidelity.find((r) => r.exerciseId === SQUAT_ID);
    expect(squat.sessions).toBe(2);
    expect(squat.loadAdherence).toBe(1);
    expect(squat.volumeAdherence).toBe(1);
  });

  test("onPlanPct null before any planned week is reached", () => {
    const template = threeWeekTemplate();
    // Week 1 has nothing planned (no rows, no targetSets); weeks 2-3 do.
    for (const workout of template.weeks[0].workouts) {
      for (const ex of workout.exercises) {
        ex.blockWorkoutSets = [];
        ex.targetSets = null;
      }
    }
    const out = build({ template, sessions: [] });
    expect(out.run.currentWeek).toBe(1);
    expect(out.weeks[0].plannedSets).toBe(0);
    expect(out.onPlan.onPlanPct).toBeNull();

    // Planned week reached with nothing logged is 0, not null.
    expect(build({ sessions: [] }).onPlan.onPlanPct).toBe(0);
  });

  test("offBlockWorkouts passes the loader's count through", () => {
    expect(build().offBlockWorkouts).toBe(2);
  });
});
