# TASK ar2f: Arena - the open size shows the whole picture (prototype sizes), strip and board polish

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
Fix unit of the ARENA wave, after ar1 + ar2 (both landed). Seth smoked
them on his phone on Nov 12: "Some instances don't show the full picture,
or if it does it shows it in an odd way with the half screen" (History
shows only a slab of stands; Library cuts the PROGRAMS board off at the
top), and "not sure it fully 1 to 1s the artifacts". Root cause, found by
the reviewer: the prototype `docs/design/mocks/motion/arena-draft-2.html`
gives the SHEET 42-46% of the screen at the open size (its `PLACES[..].sheet`
and `sheetFrac`), so the ROOM has 54-62%. The ar1 block wrote those
numbers down as the room's share (28-42svh). This unit puts the
prototype's sizes back and folds in the reviewer's polish notes from the
headless smoke. The prototype stays the reference of record - open it and
compare each place at the open size before and after.

Everything here exists only under Arena view (Profile > Appearance >
"Arena view (beta)"). With the switch off nothing may change. The ONE
MOTION rule from ar1 stands untouched: the camera height never changes,
the stage rides the sheet's top edge, scrolling folds it 1:1.

FILES TO TOUCH:
- client/src/lib/arenaSheet.js               (sizes + one new pure helper)
- client/src/components/arena/arenaEngine.js
- client/src/components/arena/ArenaStage.jsx
- client/src/components/arena/arena.css      (only if a size or the peek line needs it)
Do NOT modify anything outside these files.

CHANGE:
1. OPEN SIZES = THE PROTOTYPE'S. The room's share at the open size (svh):
   Home 58, Analytics 62, History 56, Library (`/templates`) 54,
   Profile 58. Strip stays 18. These supersede the numbers in the ar1
   block (its node check is replaced by the one below).
2. A LIVE WORKOUT FOLDS HOME (prototype `foldDefault`). `arenaSize`
   takes a third field: `arenaSize({ pathname, tour, live })`. With
   `live: true` and pathname `/` it returns the strip
   (`{ mode: "strip", svh: 18 }`); `tour` still wins over everything;
   `live` changes no other route. `ArenaStage` passes whether a workout
   is in progress (it already has the live session). When the workout
   ends Home is back at the open size, so the saved moment plays in the
   open room as it does today.
3. THE WHOLE SUBJECT IS IN VIEW at the open size on every open route, at
   412 x 839 and at 360 x 740: Home - the scoreboard with its crown and
   the platform; Analytics - the whole board with its crown; History -
   the stands up to their top row and the lit-seat row; Library - the
   whole PROGRAMS board and the rack; Profile - the three banners and the
   lockers. With the sizes in (1) this should already hold on the phone
   scale (4 css px per pixel); if a place still clips at 360 x 740, move
   that place's drawing down inside the room - do NOT move the camera
   and do NOT give a route its own scale.
4. HOME BOARD FACES, room board and strip alike: the top line stays
   `7 DAYS`; only the second line changes every 4.2 s between
   `<n> SETS` and `<n> WORKOUTS` (singular `1 WORKOUT`, `1 SET`).
   Today's second face (`WORKOUTS` huge over a tiny number) goes.
5. NAMES CUT AT A WORD. New pure export in `arenaSheet.js`:
   `ledFit(value, max)` -> uppercase; every character outside
   `A-Z 0-9 :` and space becomes a space; runs of spaces collapse; trim;
   if the result is longer than `max`, keep the leading whole words that
   fit in `max`; if the first word alone is longer than `max`, cut it at
   `max`. The engine's `ledText` is replaced by it everywhere. The room
   board keeps its 9-character lines; the STRIP's second line may use as
   many characters as fit between the crown and the same margin on the
   right at scale 1, so `SAVED` shows more of the workout's name there.
6. THE LOG'S CHEER IS SEEN. While the Log cheers in the full view, the
   one line above the bottom nav reads `LOG CHAMP` for the length of the
   cheer, then goes back to the place's line. (Zoomed in on the Log the
   scoreboard is off screen, so today nobody sees the board change.)
   No other copy mentions the Log.
7. ANALYTICS FOLLOWS THE PAGE'S RANGE. The Analytics board header, the
   strip and the full-view line use the range the page is on, read
   through `loadAnalyticsWeeks` in `client/src/lib/analyticsRangePref.js`
   (import it; do not edit that file). `ArenaStage` already has 8 weekly
   bars: show the last n of them, n = min(range, 8); header `<n> WK`,
   strip `<n> WEEKS` / `<sum> SETS`, line `Last <n> weeks: <sum> sets`.
   Re-read the range when the Analytics route is entered and on the
   window `storage` event; a same-tab change of the range chip may show
   on the next visit (no new events in files outside this block).
8. STRIP LAYOUT. The text block (line 1, line 2, the day lamps when
   shown) is centred top-to-bottom in the strip, and the crown is centred
   on that same block. Today the block sits high and the crown hangs
   below line 1.

ACCEPTANCE CRITERIA (machine-checkable):
- From `client/`: `npm run build` compiles with no errors.
- `node scripts/check-hex.mjs` (repo root) reports no new literal colours.
- From the repo root this prints `ok`:
  `node --input-type=module -e "import('./client/src/lib/arenaSheet.js').then(m=>{const a=(x,y)=>{if(JSON.stringify(x)!==JSON.stringify(y))throw new Error(JSON.stringify(x)+' != '+JSON.stringify(y))};a(m.ARENA_STRIP_SVH,18);a(m.arenaSize({pathname:'/',tour:false}),{mode:'open',svh:58});a(m.arenaSize({pathname:'/',tour:false,live:true}),{mode:'strip',svh:18});a(m.arenaSize({pathname:'/',tour:true,live:true}),{mode:'tour',svh:100});a(m.arenaSize({pathname:'/analytics',tour:false,live:true}),{mode:'open',svh:62});a(m.arenaSize({pathname:'/sessions',tour:false}),{mode:'open',svh:56});a(m.arenaSize({pathname:'/templates',tour:false}),{mode:'open',svh:54});a(m.arenaSize({pathname:'/profile',tour:false}),{mode:'open',svh:58});a(m.arenaSize({pathname:'/coach',tour:false}),{mode:'strip',svh:18});a(m.arenaSize({pathname:'/sessions/12',tour:false}),{mode:'strip',svh:18});a(m.ledFit('Quad-Focused Leg Day',9),'QUAD');a(m.ledFit('Quad-Focused Leg Day',18),'QUAD FOCUSED LEG');a(m.ledFit('Upper B',9),'UPPER B');a(m.ledFit('Supercalifragilistic',9),'SUPERCALI');a(m.ledFit('  rest: 1:30 ',9),'REST:');a(m.ledFit('',9),'');a(m.ledFit(null,9),'');a(m.stageRide({scrollY:900,openPx:400,stripPx:150}),250);a(m.stripReveal({ride:250,openPx:400,stripPx:150}),1);a(m.clampFocus({x:5,y:300}),{x:20,y:152});console.log('ok')})"`
- `grep -n "ledText" client/src/components/arena/arenaEngine.js` prints nothing.
- In a Playwright phone profile with Arena view ON, at 412 x 839 AND at
  360 x 740, a screenshot of each open route at scrollY 0 (Home,
  Analytics, History, Library, Profile), paths listed in DELIVERY.md,
  each showing the whole subject named in CHANGE 3; plus for each the
  measured `.arena-stage` bottom edge y and `.arena-sheet` top edge y
  (equal), and `document.documentElement.scrollWidth === window.innerWidth`.
- The ar1 ride checks still hold with the new sizes: on Home at scrollY
  0, 60 and 2000 the sheet top minus the stage bottom is the same number
  until the strip holds; three samples during Home -> Coach vary by no
  more than 1px. Report the numbers.
- A screenshot of the Home strip on each face, of the strip reading
  `SAVED` with a long workout name, and of the full view mid-cheer with
  the line reading `LOG CHAMP`.
- With the analytics range set to 4 (`localStorage`
  `workoutdb-analytics-weeks` = `4`): the Analytics board shows four
  bars under `4 WK` and the full-view line starts `Last 4 weeks:`.
- No `requestAnimationFrame` callbacks for 2 s at rest on Home and on
  Analytics after the changes (state the count).
- Arena view OFF: `git diff --stat` touches only the files above and
  none of them is reached when the switch is off (state how you checked).
- `prefers-reduced-motion: reduce`: the Home strip shows the first face
  only; nothing new animates.

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
