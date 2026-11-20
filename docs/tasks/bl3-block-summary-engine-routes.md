# TASK bl3: Block summary - analytics for one block run, in block weeks (engine + routes)

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
Block Lens wave (BL). Seth wants analytics that count ONLY a block's
workouts, so a block's progress is not tangled with workouts logged on the
side. No schema change is needed: every block workout already stores
`WorkoutSession.blockRunId`, `blockWeekOrder`, `blockWorkoutOrder`, its
plan snapshot in `SessionExercise.plan`, and each set's `side` ("L" / "R"
/ null). The planned block is `BlockTemplate -> BlockWeek -> BlockWorkout
-> BlockWorkoutExercise -> BlockWorkoutSet`. This unit is the server half;
bl4 draws it. Cross-user isolation is the security surface here - the
frontier seat reads it at the gate.
Design of record for what the numbers feed: `docs/design/mocks/block-lens/
mock/block-1.jpg`, `block-2.jpg`, and `plan.html` section 3.

FILES TO TOUCH:
- server/src/analytics/blockSummary.js          (new, pure - no Prisma)
- server/test/analytics/blockSummary.test.js    (new, fixtures)
- server/src/ai/analyticsAccess.js              (new loaders)
- server/src/controllers/analyticsController.js (two handlers)
- server/src/routes/analyticsRoutes.js          (two routes)
- client/src/api/analyticsApi.js                (two calls)
Do NOT modify anything outside these files. Do NOT touch
server/src/analytics/index.js (bl2 runs in parallel; require the new
module directly).

CHANGE:
1. `GET /analytics/block-runs` -> `{ runs: [{ id, name, startedAt,
   endedAt, weeksTotal, active }] }`, the authed user's runs, newest
   first. `name` = the block template's name.
2. `GET /analytics/block-run/:id` -> 404 `{ error }` unless the run
   belongs to the authed user (same shape as a missing run - never leak
   existence); 400 for a non-integer id. 200 body is
   `buildBlockSummary(...)`:
   - `run`: `{ id, name, startedAt, endedAt, weeksTotal, currentWeek }`
     (`currentWeek` = the highest `blockWeekOrder` with a logged workout,
     or 1).
   - `progress`: `{ daysDone, daysTotal, thisWeek: { done, total } }` -
     a day is done when a completed session exists for that
     (week, workout) pair; totals from the template.
   - `weeks`: `[{ week, plannedSets, loggedSets }]` for every template
     week. Planned = the week's planned sets (BlockWorkoutSet rows, or
     `targetSets` when an exercise has none). Logged = core-logged sets
     (weight and reps, or durationSec) in that week's sessions of THIS run.
   - `lifts`: one entry per lift in the template (identity rules as the
     engine: `resolveExercise` / `enrichSet`, user exercises as
     `user:<id>`): `{ key, name, perSide, weeks: [{ week, top, left,
     right, planned }] , e1rm: { first, latest, delta } }`. `top` =
     heaviest set that week ({ weight, reps } or null); `left` / `right`
     the same per side (null when the lift is not per-side); `planned` =
     the heaviest planned weight for that lift that week or null;
     `e1rm` uses the engine's existing estimator on each week's top set
     (first and latest weeks that have one).
   - `onPlan`: the run's execution fidelity from `computeExecutionFidelity`
     on the run's sessions, plus `onPlanPct` (sets logged / sets planned
     over weeks that are past or current, rounded integer, null if none
     planned yet).
   - `offBlockWorkouts`: count of the user's completed sessions with no
     `blockRunId` between the run's start and its end (or now).
3. Loading (in `analyticsAccess.js`, beside `loadSummary`, same doctrine):
   every session and set reached through `where: { userId, blockRunId }`;
   the run fetched with `where: { id, userId }`; the template through the
   run. Comment the isolation the way `loadSummary` does.
4. Pure function signature: `buildBlockSummary({ run, template, sessions,
   userIndex, offBlockCount, now })` - no Prisma, no Date.now() inside
   (take `now`), so fixtures pin every number.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` with fixture tests covering:
  a 3-week template with 2 workouts a week; week 2 half logged ->
  `weeks[1].loggedSets` exact, `progress.daysDone` exact; a per-side lift
  with L 50/55 and R 55/60 across weeks 1-2 -> `left` / `right` tops and
  `perSide: true`; a planned weight on week 1 only -> `planned` null on
  week 2; a session from ANOTHER run passed in by mistake is ignored (the
  function filters by `run.id`); `onPlanPct` null before any planned week
  is reached; e1rm delta from first to latest week.
- `GET /analytics/block-run/:id` handler: DELIVERY.md quotes the Prisma
  where-clauses and shows that a run id owned by another user takes the
  same 404 path as a missing id (code path, since the integration lane
  cannot run in the lane worktree - flag that the reviewer should run it
  in the smoke rig).
- Smoke rig: create a block + run for the smoke account through the
  existing UI/API, log two workouts in it and one off-block; curl both
  endpoints with the smoke account's token and paste the JSON in
  DELIVERY.md; `offBlockWorkouts` = 1. A second account gets 404 for the
  same id.
- Client `npm run build` clean.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
