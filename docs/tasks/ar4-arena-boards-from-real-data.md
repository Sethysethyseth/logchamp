# TASK ar4: Arena - the boards read real data (Analytics faces, week faces, program board, chalkboard)

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
ARENA wave unit AR4, after ar1 / ar2 / ar2f / ar3. The room's boards
still say placeholder things: the Analytics scoreboard is one SETS / 8 WK
chart, the Home board cycles only sets / workouts, the rack's program
board reads `PROGRAMS` over empty cells, and the coach's chalkboard
always reads `ASK ME` / `ANYTHING`. The design of record,
`docs/design/mocks/motion/arena-draft-2.html`, draws them from the
lifter's data: the four Analytics views on the board (draw block around
html line 542-548, closed faces 549-558, strip `marqueeLines` 606-616),
week faces `WEEK_FACES` (line 401: 7 DAYS / WORKOUTS / TOP SET /
TOP GAIN / RECORDS), the block grid on the program board (568-580), and
the chalkboard's thinking dots + answer lines (560-567). Recon:
`docs/tasks/ar-fid-FINDINGS.md`, ranked items 4-7 and group (c). Where
the app and the prototype differ and this block does not rule, the
prototype wins.

THE DATA RULE: only data a page has ALREADY fetched. No new endpoints,
no new requests, no extra calls to existing endpoints. Pages publish
what they already hold into one small in-memory store; the arena reads
the store. Until a page has published, its board keeps today's face
(the board must never look broken because a page was not visited yet).

Everything here shows only under Arena view (Profile > Appearance >
"Arena view (beta)", `html[data-arena]`). With the switch off the app
renders exactly as today (a publish into a store nobody reads changes
nothing on screen). The ONE MOTION rule stands untouched: the camera
height never changes, the stage rides the sheet's top edge, gap 0.

FILES TO TOUCH:
- client/src/lib/arenaBoards.js               (NEW - pure: data -> board faces)
- client/src/lib/arenaFacts.js                (NEW - the in-memory store)
- client/src/components/arena/arenaEngine.js  (draw the faces)
- client/src/components/arena/ArenaStage.jsx  (read store + coach, feed the engine)
- client/src/components/arena/arena.css       (only if needed)
- client/src/pages/AnalyticsPage.jsx          (ONE publish of what it holds)
- client/src/components/analytics/WeeklyReport.jsx (ONE publish)
- client/src/pages/MyTemplatesPage.jsx        (ONE publish of the running block)
Do NOT modify anything outside these files (in particular not
`client/src/main.jsx` or anything under `client/src/styles/` - ar3's).

CHANGE:
1. THE STORE (`arenaFacts.js`). A module-level object with
   `publishArenaFacts(patch)` (shallow merge, notifies subscribers only
   when a value actually changed), `readArenaFacts()`, and a hook
   `useArenaFacts()` built on `useSyncExternalStore` (same pattern as
   `client/src/lib/arenaTour.js`). Keys: `analytics: { weeks, summary }`,
   `week: { summary }` (the WeeklyReport's current 7-day summary),
   `block: { name, progress }` (the running block's `progress` object as
   the block-run endpoint already returns it: `currentWeekOrder`,
   `weeks[].days[].status`). Publishers: AnalyticsPage publishes its
   displayed summary and range whenever they change; WeeklyReport
   publishes its current summary when it lands; MyTemplatesPage
   publishes inside `applyRunPayload` (and `block: null` when there is
   no run). One call site per page; no other page logic changes.
2. THE FACES (`arenaBoards.js`, pure, no DOM / React / fetch). Uses
   `ledFit` from `client/src/lib/arenaSheet.js`, `pickTopGain` from
   `client/src/lib/topGain.js`, `buildExecutionVerdict` from
   `client/src/lib/executionVerdict.js`. Weights are passed through an
   injected `toUnit(number) -> number` (default identity) and labelled
   with an injected unit (default `"LB"`); the arena passes the same
   conversion and label the pages use (`weightDisplay.js` /
   `weightUnitPref.js`). Exports:
   - `analyticsFaces(summary, opts?)` -> array of 4 faces in the order
     muscles, strength, exercises, execution. Each face has `title`
     (`MUSCLES`, `STRENGTH`, `EXERCISES`, `EXECUTION`), `lines`
     (the two strip / closed-board lines) and the data to draw:
     - muscles: rows = top 5 of `perMuscle` by `effectiveSets`, each
       `{ label: first 3 letters uppercased, value }`; lines =
       `[ledFit(top muscle, 9), "<round(sets)> SETS"]`.
     - strength: the exercise with the most `e1rmSeries` points (ties:
       first in the list); `spark` = its last 10 `epley` values; lines =
       `["E1RM <round(last epley)>", ledFit(name, 9)]`.
     - exercises: up to 4 rows from `perExercise` with a `topSet`, by
       `topSet.weight` desc (ties: more reps first), each
       `{ name, set: "<w>X<r>" }`; lines = `[ledFit(top name, 9), "<w>X<r>"]`.
     - execution: of the `execution` rows whose verdict is not
       `"not enough paired data"`, the share whose verdict is
       `"executed right on plan"`, rounded percent; lines =
       `["<pct>", "ON PLAN"]`, or `["ON PLAN", "--"]` when none pair.
     Missing / empty summary -> `null` (the board keeps today's face).
   - `weekFaces({ sets, workouts, summary }, opts?)` -> list of
     `[line1, line2]`: always `["7 DAYS", "<n> SETS"]` then
     `["7 DAYS", "<n> WORKOUTS"]` (singulars as ar2f: `1 SET`,
     `1 WORKOUT`); then, only when `summary` has them:
     `["TOP SET", "<w>X<r>"]` (heaviest `topSet`, ties more reps),
     `["TOP GAIN", "+<round delta> <UNIT>"]` (from `pickTopGain`), and
     `["RECORDS", "<n>"]` (n = `summary.prs.length`, omitted when 0).
   - `chalkLines(text)` -> the chalkboard / strip lines for a coach
     answer: the first sentence (up to the first `.`, `!` or `?` that
     ends the text or is followed by a space), cleaned with `ledFit`
     rules, packed greedily into at most 2 lines of at most 9
     characters by whole words (a single word longer than 9 is cut at
     9). Empty / missing text -> `["ASK ME", "ANYTHING"]`.
   - `blockBoard(block)` -> `null` without progress, else
     `{ label: "BLOCK W<currentWeekOrder>", done, total, cells }` where
     `cells[w][d]` is 2 for a done day, 1 for the NEXT day (the first
     not-done day of the current week), 0 otherwise; at most 8 weeks
     shown - when the block is longer, 8 consecutive weeks starting at
     `max(0, min(currentIndex - 3, weeks - 8))`.
3. ANALYTICS BOARD. On `/analytics` the open board draws the face of the
   view the page is on (read `?view=` from the location, default
   `muscles`, the page's own `ANALYTICS_VIEWS` order), the prototype's
   way: title top-left; muscles = labelled horizontal bars, the largest
   bright; strength = the spark as columns with `E1RM <n>` top-right;
   exercises = four name / set rows; execution = the big number + `ON
   PLAN` + a meter. Bars / columns charge in once as the board opens
   (prototype `gr`), not under reduced motion. The strip and the closed
   board read the view's `lines`. The full-view line reads
   `<View> · last <n> weeks` (View capitalised as the page's tab).
   Range follows ar2f (`loadAnalyticsWeeks`); a summary published for a
   different range than the page's is not shown (fall back to today's
   SETS / <n> WK chart). No summary yet -> today's chart, unchanged.
4. HOME WEEK FACES. The Home room board and the Home strip cycle
   `weekFaces(...)` (sets / workouts from today's `roomFacts`, summary
   from the store) every 4.2 s, one face at a time; reduced motion
   shows the first face only (as today).
5. PROGRAM BOARD. The rack's board draws `blockBoard(...)`: header
   `label` instead of `PROGRAMS`, done cells bright, the next day a
   mid tone, the rest dark - STEADY, no blink (zero frames at rest
   rules; the prototype's blink is dropped on purpose). No running
   block / not yet published -> today's `PROGRAMS` board, unchanged.
6. CHALKBOARD. ArenaStage reads the coach thread and `streaming` from
   `useCoachSession()` (`client/src/context/CoachSessionContext.jsx`;
   read only, do not edit it). While an answer streams: thinking dots
   on the board and on the Coach strip (1-3 dots stepping every ~280ms,
   3 steady under reduced motion - this is the only new loop, and it
   runs only while streaming). Otherwise `chalkLines(latest coach
   answer)` on the board (line 1 bright, line 2 softer) and on the
   Coach strip. The chalkboard's up-close fine print stays only while
   the board shows fewer than 3 lines (as today). Full-view line on
   Coach: `The coach is thinking` while streaming; else the answer's
   first sentence cut at a word to 60 characters; else today's line.
7. NOT IN THIS UNIT (AR5's): the History seat, the near stands, the
   banners, the Library and Profile STRIP headlines. Coach stays on the
   strip (do not open it tall); no swipe-to-walk.

ACCEPTANCE CRITERIA (machine-checkable):
- From `client/`: `npm run build` compiles with no errors.
- From `server/`: `npm run test:unit` green (unchanged suite).
- `node scripts/check-hex.mjs` (repo root) reports no new literal colours.
- Scope: `git status --short --untracked-files=all` lists only files in
  FILES TO TOUCH; each page file's diff is the import + one publish site.
- From the repo root this prints `ok`:
  `node --input-type=module -e "import('./client/src/lib/arenaBoards.js').then(m=>{const a=(x,y)=>{if(JSON.stringify(x)!==JSON.stringify(y))throw new Error(JSON.stringify(x)+' != '+JSON.stringify(y))};const s={perMuscle:[{muscle:'chest',effectiveSets:14.4},{muscle:'back',effectiveSets:22.2},{muscle:'quads',effectiveSets:9}],perExercise:[{name:'Bench Press',topSet:{weight:185,reps:8},e1rmSeries:[{epley:220},{epley:226},{epley:231.4}]},{name:'Back Squat',topSet:{weight:225,reps:5},e1rmSeries:[{epley:250}],e1rmTrend:{delta:15}}],execution:[],prs:[{},{}]};const f=m.analyticsFaces(s);a(f.map(x=>x.title),['MUSCLES','STRENGTH','EXERCISES','EXECUTION']);a(f.map(x=>x.lines),[['BACK','22 SETS'],['E1RM 231','BENCH'],['BACK','225X5'],['ON PLAN','--']]);a(f[0].rows.map(r=>r.label),['BAC','CHE','QUA']);a(f[2].rows.map(r=>r.set),['225X5','185X8']);a(m.analyticsFaces({...s,execution:[{loadAdherence:1,volumeAdherence:1,effortDrift:null},{loadAdherence:0.8,volumeAdherence:0.5,effortDrift:null},{loadAdherence:null,volumeAdherence:null,effortDrift:null}]})[3].lines,['50','ON PLAN']);a(m.analyticsFaces(null),null);a(m.weekFaces({sets:23,workouts:2,summary:s}),[['7 DAYS','23 SETS'],['7 DAYS','2 WORKOUTS'],['TOP SET','225X5'],['TOP GAIN','+15 LB'],['RECORDS','2']]);a(m.weekFaces({sets:1,workouts:1,summary:null}),[['7 DAYS','1 SET'],['7 DAYS','1 WORKOUT']]);a(m.chalkLines('From your last four weeks: the plan is working. Keep the loads.'),['FROM YOUR','LAST FOUR']);a(m.chalkLines('Yes.'),['YES']);a(m.chalkLines(''),['ASK ME','ANYTHING']);a(m.chalkLines(null),['ASK ME','ANYTHING']);const p={currentWeekOrder:2,weeks:[{order:1,days:[{status:'done'},{status:'done'},{status:'done'}]},{order:2,days:[{status:'done'},{status:'todo'},{status:'todo'}]},{order:3,days:[{status:'todo'},{status:'todo'},{status:'todo'}]}]};a(m.blockBoard({name:'X',progress:p}),{label:'BLOCK W2',done:4,total:9,cells:[[2,2,2],[2,1,0],[0,0,0]]});a(m.blockBoard(null),null);console.log('ok')})"`
- No new requests: in the phone profile, the network requests made by
  visiting Home -> Analytics -> Library -> Coach are the same list
  (method + path) with Arena view ON and OFF, and the same as before
  the change (report both lists).
- Arena view ON, Playwright phone profile, dark, champ, at 412 x 839 AND
  360 x 740, `scrollWidth === innerWidth` on each, screenshots (paths in
  DELIVERY.md) of: the Analytics board on each of the four views; the
  Analytics strip (scrolled) on two views; the Home board and strip on
  TOP SET, TOP GAIN and RECORDS faces (seed has a PR in the last 7 days,
  or state why a face is absent); Library with a running block (board
  reads `BLOCK W<n>` with lit cells - start one on the smoke account if
  none runs, through the UI); Coach mid-answer (dots) and after the
  answer (chalk lines) - the smoke rig's coach is the mock provider.
- Fallback: a fresh load straight onto `/` then the full view walked to
  Analytics / Library without visiting those pages shows today's faces,
  not blanks (screenshot).
- The ar1 ride still holds: on Home at scrollY 0, 60 and 2000 the sheet
  top minus the stage bottom is the same number until the strip holds
  (report the numbers).
- No `requestAnimationFrame` callbacks for 2 s at rest on Home, on
  Analytics (board open), on Library and on Coach after an answer
  (state the counts). Dots run only while streaming.
- `prefers-reduced-motion: reduce`: no charge-in, Home shows the first
  week face only, steady dots while streaming (state how checked).
- Arena view OFF: state how you checked nothing renders differently
  (the publish calls are the only change reached).

Tooling for the phone-profile proofs (cloud lane): `bash
scripts/cloud-smoke-up.sh` from this worktree's root stands up a local
API + seeded smoke account + the Vite client on port 5173;
`scripts/smoke-rig.cjs` drives it (header documents `open({ arena,
theme, palette, reduced })`, `shot`, `geom`, `rafIdle`, `sheet`). Pass
`theme: "dark"`. Throwaway local DB only - never staging, never prod.
Stop the servers before you end your turn.

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
