# TASK bl2: Home "This week" as sections - Beat last time on, Due off, no copies of Analytics

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
Block Lens wave (BL). Home's "Last 7 days" card repeats two of the
Analytics headline tiles (Top set and Top gain, same pick functions:
`pickTopSet`, `pickTopGain`). Seth ruled (Nov 20): Home answers "what do I
do now", Analytics answers "how is it going". Home's card becomes separate
SECTIONS so a later unit (bl5) can let the user hide, show and reorder
them. This unit builds the sections and a section registry with defaults;
it does NOT build the Customize UI or any storage.
Design of record: `docs/design/mocks/block-lens/customize.html` (open it
from that folder; Home in Customize and in Preview) and
`mock/home-1.jpg` / `mock/home-2.jpg`. The prototype's contract table
lists the ids. Match its layout, order and copy.

FILES TO TOUCH:
- client/src/pages/DashboardPage.jsx
- client/src/components/analytics/WeeklyReport.jsx   (split into sections)
- client/src/components/home/                         (new: one file per
                                                       section + index)
- client/src/lib/screenLayout.js                      (new: registry +
                                                       pure resolver)
- client/src/index.css                                (section styles,
                                                       tokens only)
- client/src/api/sessionApi.js                        (one new call)
- server/src/analytics/nextTargets.js                 (new, pure)
- server/test/analytics/nextTargets.test.js           (new)
- server/src/controllers/sessionController.js         (one handler)
- server/src/routes/sessionRoutes.js                  (one route)
Do NOT modify anything outside these files. Do NOT touch
server/src/analytics/index.js or the analytics routes/controller (bl3
owns those and runs in parallel).

CHANGE:
1. Sections, in this default order (ids are the contract - bl5 stores
   them):
   - `start` - the existing Start a workout hero (ActiveWorkoutHero /
     StartWorkoutHero + picker), unchanged. `locked: true` (cannot be
     hidden; bl5 lets it move).
   - `upnext` - the existing UpNextCard, unchanged (still renders only
     while a block runs; DashboardPage's existing guards stay).
   - `week` - "This week": title, "Analytics ->" link, the existing
     WeekStrip, and two stats: Workouts (existing delta copy) and PRs
     (count of PR rows in the last 7 days, sub "this week"). Top set,
     Top gain and the Sets stat leave Home.
   - `beat` - "Beat last time", ON by default. Subtitle = the next block
     day's name + "up next" while a block runs, else "your top lifts".
     Up to 3 rows: lift name, last top set, and the target: same weight,
     one more rep ("345 x 3 -> 345 x 4"). Data from the new endpoint (5).
     Timed-only lifts are left out. No rows -> the section renders nothing.
   - `due` - "Due", OFF by default. Muscles ranked by `daysSinceLast`
     (summary `perMuscle`, last 8 weeks), top 3, bar = days / the top
     muscle's days, "12 d". Fetch the 8-week summary ONLY when this
     section is on.
   - `highlights` - "Highlights": the existing digest (PR rows, Movers,
     Execution, Note lines) moved out of WeeklyReport as its own card.
   - `recent` - Recent workouts, unchanged.
2. `client/src/lib/screenLayout.js`: `HOME_SECTIONS` (id, label, default
   on/off, locked) in the order above, and a pure
   `resolveLayout(registry, saved)` -> ordered `[{ id, on }]`: unknown
   saved ids dropped, missing ids appended in registry order with their
   defaults, locked ids always on. DashboardPage renders from
   `resolveLayout(HOME_SECTIONS, null)` this unit (bl5 passes the saved
   value). No storage here.
3. Keep `publishArenaFacts({ week: ... })` and every arena publish the
   card makes today - the arena's Home faces must not change.
4. Motion: sections keep the existing Home entrance (Cascade /
   `mx-cascade`); counts use the existing CountUp. Nothing new animates.
5. Server: `GET /sessions/next-targets` (declare it BEFORE `/:id`
   routes), auth required, user-scoped exactly like `getLastPerformance`.
   Pure `buildNextTargets({ targets, priorSessions, userIndex })` in
   `server/src/analytics/nextTargets.js`, reusing `buildLastPerformance`
   identity rules (require `./lastPerformance` directly). Targets: the
   active block run's next day's exercises if one runs (reuse how
   `getActiveBlockRun` / UpNextCard pick the next day), else the user's 3
   most-logged lifts in the last 28 days. Response:
   `{ source: { kind: "block" | "top", name: string | null },
      rows: [{ name, exerciseId, userExerciseId, last: { weight, reps,
      performedAt }, next: { weight, reps } }] }` - at most 3 rows,
   timed-only lifts omitted, top set = heaviest weight (ties: more reps).

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with new tests for
  `buildNextTargets`: last top set picked by heaviest weight then reps;
  next = { same weight, reps + 1 }; a lift with only timed sets is
  omitted; another user's sessions are never passed in (the handler's
  query is `where: { userId }`, quote it in DELIVERY.md); max 3 rows.
- Client `npm run build` clean; `node scripts/check-hex.mjs` clean.
- `resolveLayout` examples (node one-liner, output in DELIVERY.md):
  `resolveLayout(HOME_SECTIONS, null)` ->
  start,upnext,week,beat,highlights,recent on and due off;
  `resolveLayout(HOME_SECTIONS, [{id:"recent",on:true},{id:"start",on:false},{id:"bogus",on:true}])`
  -> recent first, start on (locked), bogus gone, the rest appended with
  defaults.
- `grep -n "Top set\|Top gain" client/src/components/analytics/WeeklyReport.jsx client/src/components/home/` returns nothing.
- Cloud smoke rig, Arena + Classic, 412 wide: Home matches
  `mock/home-1.jpg` / `home-2.jpg` (contact sheet) with Due absent;
  STATE MATRIX with every control on screen and usable: idle, live
  workout (Active hero), resting, just finished, a running block (Up next
  + Beat last time subtitle from the block), new account with no workouts
  (no empty cards left behind); request list shows NO 8-week summary call
  while Due is off; zero console errors; `scrollWidth == innerWidth`.

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
