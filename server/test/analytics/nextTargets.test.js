const { buildNextTargets, rankTopLifts } = require("../../src/analytics/nextTargets");

const BENCH_ID = "Barbell_Bench_Press_-_Medium_Grip";

function session(performedAt, exercises) {
  return { performedAt: new Date(performedAt), exercises };
}

function exercise(fields, sets) {
  return { order: 1, exerciseId: null, userExerciseId: null, exerciseName: "", ...fields, sets };
}

function set(fields) {
  return { order: 1, side: null, weight: null, reps: null, durationSec: null, ...fields };
}

function target(name, extra = {}) {
  return { exerciseName: name, exerciseId: null, userExerciseId: null, ...extra };
}

describe("buildNextTargets", () => {
  test("last top set is the heaviest weight, ties broken by more reps", () => {
    const rows = buildNextTargets({
      targets: [target("Deadlift Custom")],
      priorSessions: [
        session("2026-11-17T15:00:00.000Z", [
          exercise({ exerciseName: "Deadlift Custom" }, [
            set({ order: 1, weight: 315, reps: 5 }),
            set({ order: 2, weight: 345, reps: 2 }),
            set({ order: 3, weight: 345, reps: 3 }),
            set({ order: 4, weight: 300, reps: 8 }),
          ]),
        ]),
      ],
      userIndex: new Map(),
    });

    expect(rows).toEqual([
      {
        name: "Deadlift Custom",
        exerciseId: null,
        userExerciseId: null,
        last: { weight: 345, reps: 3, performedAt: "2026-11-17T15:00:00.000Z" },
        next: { weight: 345, reps: 4 },
      },
    ]);
  });

  test("next is the same weight and one more rep, from the most recent session only", () => {
    const rows = buildNextTargets({
      targets: [target("Bench", { exerciseId: BENCH_ID })],
      priorSessions: [
        session("2026-11-01T15:00:00.000Z", [
          exercise({ exerciseId: BENCH_ID, exerciseName: "Bench" }, [set({ weight: 250, reps: 3 })]),
        ]),
        session("2026-11-15T15:00:00.000Z", [
          exercise({ exerciseId: BENCH_ID, exerciseName: "Bench" }, [set({ weight: 225, reps: 6 })]),
        ]),
      ],
      userIndex: new Map(),
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].exerciseId).toBe(BENCH_ID);
    expect(rows[0].last).toEqual({ weight: 225, reps: 6, performedAt: "2026-11-15T15:00:00.000Z" });
    expect(rows[0].next).toEqual({ weight: 225, reps: 7 });
  });

  test("a lift with only timed sets is omitted", () => {
    const rows = buildNextTargets({
      targets: [target("Plank Custom"), target("Squat Custom")],
      priorSessions: [
        session("2026-11-18T15:00:00.000Z", [
          exercise({ exerciseName: "Plank Custom" }, [
            set({ order: 1, durationSec: 60 }),
            set({ order: 2, durationSec: 45 }),
          ]),
          exercise({ order: 2, exerciseName: "Squat Custom" }, [set({ weight: 260, reps: 5 })]),
        ]),
      ],
      userIndex: new Map(),
    });

    expect(rows.map((r) => r.name)).toEqual(["Squat Custom"]);
  });

  test("a lift with no history is omitted", () => {
    const rows = buildNextTargets({
      targets: [target("Never Logged Lift")],
      priorSessions: [],
      userIndex: new Map(),
    });
    expect(rows).toEqual([]);
  });

  test("at most 3 rows, in target order, duplicate targets kept once", () => {
    const names = ["Lift A", "Lift B", "Lift B", "Lift C", "Lift D"];
    const rows = buildNextTargets({
      targets: names.map((n) => target(n)),
      priorSessions: [
        session(
          "2026-11-18T15:00:00.000Z",
          ["Lift A", "Lift B", "Lift C", "Lift D"].map((n, i) =>
            exercise({ order: i + 1, exerciseName: n }, [set({ weight: 100 + i, reps: 5 })])
          )
        ),
      ],
      userIndex: new Map(),
    });

    expect(rows.map((r) => r.name)).toEqual(["Lift A", "Lift B", "Lift C"]);
  });

  test("only the sessions passed in are used (the handler scopes them to the user)", () => {
    const rows = buildNextTargets({
      targets: [target("Row Custom")],
      priorSessions: [
        session("2026-11-10T15:00:00.000Z", [
          exercise({ exerciseName: "Row Custom" }, [set({ weight: 135, reps: 10 })]),
        ]),
      ],
      userIndex: new Map(),
    });
    expect(rows[0].last.weight).toBe(135);
  });
});

describe("rankTopLifts", () => {
  test("ranks by sessions, then sets; timed-only work never counts", () => {
    const ranked = rankTopLifts({
      sessions: [
        session("2026-11-18T15:00:00.000Z", [
          exercise({ exerciseName: "Squat Custom" }, [set({ weight: 200, reps: 5 })]),
          exercise({ order: 2, exerciseName: "Plank Custom" }, [set({ durationSec: 60 })]),
          exercise({ order: 3, exerciseName: "Curl Custom" }, [
            set({ weight: 30, reps: 10 }),
            set({ order: 2, weight: 30, reps: 10 }),
          ]),
        ]),
        session("2026-11-16T15:00:00.000Z", [
          exercise({ exerciseName: "Squat Custom" }, [set({ weight: 200, reps: 5 })]),
          exercise({ order: 2, exerciseName: "Plank Custom" }, [set({ durationSec: 60 })]),
          exercise({ order: 3, exerciseName: "Press Custom" }, [set({ weight: 95, reps: 5 })]),
        ]),
      ],
      userIndex: new Map(),
    });

    expect(ranked.map((t) => t.exerciseName)).toEqual(["Squat Custom", "Curl Custom", "Press Custom"]);
  });
});
