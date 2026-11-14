# TASK ar-r1b: ARENA round 1 - build the design of record (strip from the room, the rail, one-row logger, roof, skinned sheets, Coach + Finish fixes)

STATUS: BOUNCED (1)
MODEL: opus
MODE: 1-relay

CONTEXT:
Step 2 of ARENA round 1 (the one build unit). Step 1 is done: the design
seat ruled every item of `docs/tasks/ar-critique-ledger.md` (1-10 and two
open calls), drew them in `docs/design/mocks/motion/arena-draft-3.html`,
and wrote `docs/design/mocks/motion/ARENA-ROUND-1.md` (rulings, state
matrix, "Nothing is lost", the build file list). Seth looked on Nov 14
and said go ("Looks and feels good"), on one condition: every feature of
the app carries over (he named importing workouts).

**The spec is ARENA-ROUND-1.md plus the artifact. Read both in full
before writing code, and open the artifact in a browser - its switches
set every state.** Where this block and those two disagree, they win,
and the artifact wins over the .md. `arena-draft-2.html` is history -
never build from it. This block adds no visual rule of its own: if you
need a state or a look the artifact does not draw, STOP and report it
in DELIVERY.md; do not invent one.

Everything here lives under Arena view (`html[data-arena]`, set from
`useArenaView` in `client/src/lib/arenaPref.js` by `Layout.jsx`). With
Arena view OFF the app must be pixel-identical and behave exactly as
today. The ONE MOTION rule stands untouched (ARENA-ROUND-1.md, "What is
NOT changing").

The app on staging is at AR5 (the old black-LED strip on every working
route). Landed patterns to follow BY NAME: `arenaSize` / `stageRide` /
`stripReveal` / `ledFit` in `lib/arenaSheet.js` (pure, node-checkable);
`lib/arenaBoards.js` faces (pure); `lib/arenaFacts.js` (pages publish
what they already fetched - no new requests); `styles/arena-skin.css`
(every selector under `html[data-arena]`); `useActiveSession` for the
live workout and its id.

FILES TO TOUCH (all under client/src/ - the list in ARENA-ROUND-1.md,
"App files the build will touch", one-line reasons there):
- components/arena/arenaEngine.js
- components/arena/ArenaStage.jsx
- components/arena/arena.css
- lib/arenaSheet.js
- lib/arenaBoards.js
- styles/arena-skin.css
- styles/coach-page.css
- pages/SessionDetailPage.jsx
- components/prefs/TrainingPrefsStrip.jsx
- components/prefs/TrainingPrefsSheet.jsx
- components/templates/ViewModeToggle.jsx
- components/layout/BottomNav.jsx
- components/motion/RouteTransition.jsx
Do NOT modify anything outside these files. `components/motion/navOrder.js`
is explicitly off-limits (the route transition's direction reads it). If
you find you need another file, STOP and say so in DELIVERY.md rather
than widening quietly. If the build would hide or strand any feature
the app has today, STOP and report it - do not pick a new home yourself.

CHANGE (each item is ruled in full in ARENA-ROUND-1.md under the same
number; artifact line refs are into arena-draft-3.html):

1. FIX - COACH ASK BOX ON SCREEN (ledger 1). The composer is pinned
   directly above the tabs on every Coach visit, with or without a live
   workout; with the keyboard up it sits on the keyboard and the rail
   stays at the top. Cause per the ledger: `.coach-page` height is
   `100dvh` minus the nav, but under Arena the page starts under the
   stage (plus the sheet's 2px rule and 14px top padding). Under
   `html[data-arena]`, subtract the stage's real height from ONE
   variable (Coach sits under the rail after item 8) - never a second
   hard-coded number. Confirm the real cause first; if it is something
   else, fix what it is and say so.

2. THE STRIP IS A SLICE OF THE ROOM (ledger 2). Replace the flat black
   LED panel: the strip is the room's own drawing cut close to the
   scoreboard over the platform (same lighting field, same board code,
   same ramp), on every route that shows it. ONE face function feeds the
   room board and the strip - port the artifact's `boardFace` (line 692)
   and `drawFace` (line 716): first match wins - REST (countdown at
   double size + drain bar inside the frame) / SAVED + name (~5 s) /
   LOG CHAMP (the cheer) / logging: name over `m:ss · SET n` (block day:
   `m:ss · n OF total`) / the place's own face. Two lines, label then
   value, at the room board's size. Board 38 wide; widens to 64 for the
   live line and REST; a wide face draws only once the board is wide.
   The face DATA lives in `lib/arenaBoards.js` and stays pure (see the
   node check). No separate strip edge line, no full-width rest line.

3. HOME OWNS THE LIVE WORKOUT (ledger 3). Under Arena, while
   `/sessions/<active id>` is open, BottomNav lights Home. A past
   workout (`/sessions/<any other id>`) still lights History. Do it in
   `BottomNav.jsx`, not `navOrder.js`. Arena off: unchanged.

4. ONE CLOCK (ledger 4). Under Arena the logger's own LIVE clock / set
   count line is not shown; the strip is the header and the only clock.
   The logged-set flash that exists today stays. The rest controls
   (-15s / +15s / Skip) stay in the page; the countdown is on the board
   only.

5. THE ROOF (ledger 5). Draw the house above row 63 exactly as the
   artifact's `house()` (line 732) and the table in ARENA-ROUND-1.md
   item 5: purlins + rafters, the main truss (rows 22-28), lamp cans at
   columns 50, 112, 188, 254, 350, 450 (the one over the current place
   lit, with a faint shaft), the upper deck (rows 39-51, a few seats
   flash on Finish), the balcony front (rows 55-63) lettered THE STANDS
   / THE PLATFORM or THE SCOREBOARD / COACH'S CORNER / THE RACK / LOCKER
   ROOM, the current place's name bright. Scoreboard hangs from the
   truss (cables at 120 and 180, spreader at row 66, two posts); banners
   hang from the balcony front (top row 63). Camera, pixel size, place
   positions: unchanged. A taller phone shows more roof. Below row 63
   nothing changes except the board's rigging, face and width and the
   banners' hanging point. The wordmark / Coach button / place label are
   NOT drawn on the canvas (artifact-only moves, no app change).

6. SKIN THE SLIDE-UP SHEETS (ledger 6). CSS only, in `arena-skin.css`,
   under `html[data-arena]`: every portaled sheet (outside `#root`) -
   the Finish confirm, the other confirm panels (finish with sets left,
   discard), the start-workout picker, training prefs, add exercise, the
   two info sheets - gets square corners, the 2px accent rule on top,
   the 34 x 3 grip mark, display-face title, square dark inputs, squared
   outlined list rows. Main button stays rounded. Backdrop stays. Motion
   untouched. Tokens only.

7. FIX - NO PAGE ERROR ON FINISH (ledger 7). The error is "Transition
   was aborted because of invalid state. Viewport size changed". Under
   Arena, do not hold a view-transition snapshot across a navigation
   that changes the stage's height out of the live logger (take the
   existing fade branch), AND never leave a view transition's promises
   unhandled (`ready` as well as `finished` - today only `finished` has
   a catch in `RouteTransition.jsx`). The SAVED moment still plays and
   the room still opens in one motion. Find the real cause first; if it
   is not this, fix what it is and say so.

8. THE RAIL (ledger 8). Folded has two sizes, chosen by route only:
   - STRIP (18svh): the live logger (`/sessions/<active id>`) and Home
     while a workout runs. Nowhere else.
   - RAIL (11 room rows at the room's pixel size; ~44px on a 412 x 839
     phone): every other folded state - any open route once scrolled to
     the fold's end, Coach (always), a past workout, every route not in
     the open list, and any page with the keyboard up (the logger keeps
     the strip with the keyboard up).
   The rail is the room cut at the balcony front (world rows 54-64)
   over the current place - artifact `draw(now, "rail")` (line 571-574)
   and `railFace` (line 709): one line, first match wins - `REST m:ss`
   with the balcony's bottom edge draining / `SAVED <name>` ~5 s / the
   place's name. Open routes keep today's open size and fold 1:1; the
   fold simply continues to the rail, and the rail fades in place over
   the last 30% of the fold (same rule as `stripReveal`). The stage's
   height never changes with state (idle / live / resting / finished).
   Tapping the rail opens the full view. The History / Library /
   Profile / Analytics STRIP faces are retired from the strip (they
   stay on the room's board when open).
   The artifact also folds an "Advanced analytics view"; the app has no
   such view - build nothing for it.

9. ONE-ROW LOGGER (ledger 9). Under Arena, the live logger's top is ONE
   row - name box (no label; placeholder says what it is), a Setup
   button, the X - then the lifts (artifact `logger()`, line 852, the
   `lg-head` row). Per the table in ARENA-ROUND-1.md item 9: "Log
   workout" title gone; LIVE clock gone; `TrainingPrefsStrip` hotbar
   not rendered (Setup opens the existing Logging setup sheet,
   `TrainingPrefsSheet`); `ViewModeToggle` not rendered (a Layout line,
   Builder / Table, in the Setup sheet when opened from the live
   logger); "Add a workout note" moves below "+ Add exercise";
   "Autosaves as you go..." and "Log at least one set..." lines gone -
   the Finish button reads `Log a set to finish` (disabled) until a set
   is logged, then `Finish workout`. Setup sheet order: weight unit,
   effort scale, layout, exercise notes, set notes, repeat last time's
   numbers, rest timer, rest length; the block's locked-effort note
   shows in it; a change redraws the sheet in place (no second slide).
   Everything inside every exercise card, the rest controls, the Finish
   and Discard confirms, and the finished "Workout summary" page are
   untouched. Arena off: the logger is exactly today's.

10. NOTE (ledger 10) - no change: with the rest timer off the strip
    still shows elapsed + set; REST never appears.

Open calls, already ruled: Coach always folded (the rail); no
swipe-to-walk; no light-mode arena (AR6).

ACCEPTANCE CRITERIA (machine-checkable):

Lanes
- From `server/`: `npm run test:unit` green (state the count).
- From `client/`: `npm run build` compiles with no errors.
- From the repo root: `node scripts/check-hex.mjs` reports no new
  literal colours.

Pure contract - from the repo root this prints `ok` (it replaces the
ar2f check; `/sessions/7` is the active workout, `/sessions/12` a past one):
```
node --input-type=module -e "import('./client/src/lib/arenaSheet.js').then(m=>{const a=(x,y)=>{if(JSON.stringify(x)!==JSON.stringify(y))throw new Error(JSON.stringify(x)+' != '+JSON.stringify(y))};a(m.ARENA_STRIP_SVH,18);a(m.ARENA_RAIL_ROWS,11);a(m.arenaSize({pathname:'/',tour:false}),{mode:'open',svh:58});a(m.arenaSize({pathname:'/',tour:false,live:true,activeId:7}),{mode:'strip',svh:18});a(m.arenaSize({pathname:'/sessions/7',tour:false,live:true,activeId:7}),{mode:'strip',svh:18});a(m.arenaSize({pathname:'/sessions/12',tour:false,live:true,activeId:7}),{mode:'rail',rows:11});a(m.arenaSize({pathname:'/sessions/12',tour:false}),{mode:'rail',rows:11});a(m.arenaSize({pathname:'/coach',tour:false}),{mode:'rail',rows:11});a(m.arenaSize({pathname:'/coach',tour:false,live:true,activeId:7}),{mode:'rail',rows:11});a(m.arenaSize({pathname:'/blocks/import',tour:false}),{mode:'rail',rows:11});a(m.arenaSize({pathname:'/analytics',tour:false,live:true,activeId:7}),{mode:'open',svh:62});a(m.arenaSize({pathname:'/sessions',tour:false}),{mode:'open',svh:56});a(m.arenaSize({pathname:'/templates',tour:false}),{mode:'open',svh:54});a(m.arenaSize({pathname:'/profile',tour:false}),{mode:'open',svh:58});a(m.arenaSize({pathname:'/',tour:true,live:true,activeId:7}),{mode:'tour',svh:100});a(m.stageRide({scrollY:900,openPx:400,stripPx:150}),250);a(m.stripReveal({ride:250,openPx:400,stripPx:150}),1);a(m.ledFit('Quad-Focused Leg Day',9),'QUAD');console.log('ok')})"
```
- A second node one-liner of your own, pasted verbatim in DELIVERY.md
  with its `ok`, proving the face function in `lib/arenaBoards.js` with
  first-match-wins order: resting beats saved beats cheer beats logging
  beats place; logging face = `{ l1: <name>, l2: '12:34 · SET 4', wide:
  true }` for 754 s elapsed and 3 sets done (block day: `12:34 · 3 OF
  18`); empty name -> `WORKOUT`; History `WORKOUTS` / count; Library
  `BLOCK W1` / `1 OF 18`; Profile `STREAK` / `3 WEEKS`; every non-wide
  line <= 9 characters. And the rail line: resting -> `REST 1:05`;
  saved -> `SAVED <name>` cut at a word; else the place's balcony name.

State matrix - Playwright, phone profile, Arena ON, at 412 x 839 AND
360 x 740, dark champ, using a real account and a real live workout:
- Every cell of the table in ARENA-ROUND-1.md "State matrix" (8 routes
  x idle / live / resting / just finished, where reachable) proven: a
  screenshot path per cell, and in each cell every text box named there
  focused and typed into with a real character (value read back), every
  button named there found on screen and enabled. A failing cell is a
  failed criterion, not a note.
- Each cell's screenshot paired side by side with the same state in the
  artifact (set by its switches) as one contact sheet per route, paths
  in DELIVERY.md.
- Item 1: at scroll 0, no keyboard, on `/coach` with and without a live
  workout: composer top > stage bottom AND composer bottom <= bottom-nav
  top (report the four numbers per size); then focus it and type.
- Item 7: with a `pageerror` and `console` listener attached from page
  load: start a workout, log a set, finish - zero page errors and zero
  console errors at both sizes; the board reads SAVED (screenshot).
- Item 8: on every route but the live logger and live Home, scrolled to
  the fold's end: the stage's visible height = 11 x the room's pixel
  size (report both numbers) and the sheet's top = the stage's bottom;
  the stage height is the same number in idle, live and resting (report
  three); with a rest running the rail reads `REST m:ss`; tapping the
  rail opens the full view.
- Item 9: Arena on, a new empty workout with one exercise added, 412 x
  839, no scroll: the first exercise's name and its first weight box are
  both inside the viewport (report rects). Toggle each Setup setting and
  show the logger behind it changed (one line per setting).
- Item 3: on `/sessions/<active id>` the Home nav item has `.active` and
  History does not; on a past workout History has it.
- Keyboard row and Full view row of the "Across every route" table:
  proven on Home, Coach, the logger, and Library search.
- "Nothing is lost": with Arena ON at 412 x 839, every route listed in
  ARENA-ROUND-1.md "Nothing is lost" (builder, `/templates/public`, block
  builder, `/blocks/import`, `/blocks/current`, `/log-workout`, every
  `/profile/*` page, `/hello`) opened: its primary action on screen and
  enabled, every text box typeable - including the import page's paste
  box and its Import button. One line per route.
- Every screen above: `document.documentElement.scrollWidth ===
  window.innerWidth`.
- All five palettes: one screenshot each of Home open, the strip
  (logger, resting) and the rail (Analytics scrolled), dark mode.
- At rest: zero `requestAnimationFrame` callbacks for 2 s on Home open,
  on the rail, and on the strip with no clock running (state counts);
  with a clock running, the strip redraws at most once a second.
- `prefers-reduced-motion: reduce`: sizes and faces cut, the week face
  does not cycle (state how checked).

Arena OFF
- Screenshots of Home, the live logger (fresh workout, one set logged),
  Coach and Analytics with Arena OFF, before (stash-free: take them
  first, from the untouched tree) and after the change, pixel-diffed:
  zero differing pixels (report the diff counts). State how every new
  code path is gated on Arena.

BOUNCE 1 (reviewer, Nov 14 - first delivery on the auto rung, audited in
the cloud smoke rig). The working tree in the lane holds your first
delivery; FIX these on top of it, keep everything else, then rewrite
DELIVERY.md in full (a new "Bounce 1" section first, evidence per item):

B1. THE STRIP IS MISCUT (blocker, ledger 2). On the live logger and live
    Home the strip shows the board blown up past the room's pixel size and
    cut off at the top (unreadable glyphs, the lamps as big bars). The
    artifact (State: Live workout, View: Folded) shows the WHOLE scoreboard
    at the room's own pixel size: crown, `PUSH DAY` over `12:35 · SET 4`,
    the two tower lamps either side, the week's seven lamps under it - its
    `draw(now, strip)` uses zoom 1 and `cx = 100, cy = 106 - SH` (line
    571-576). Same pixel size as the room (4 css px per room pixel on a
    phone), the board centred in the strip. Proof: a crop of the strip at
    412 x 839 and 360 x 740 beside a crop of the artifact's strip in the
    same state, and the measured room-pixel size in the strip vs the open
    room (equal).
B2. BLOCK DAY LOSES ITS PROGRESS (ledger 4 + "Nothing is lost"). Under
    Arena you hide `BlockSessionHeader` (sets logged of total) and the
    strip falls back to `SET n` (your deviation 1). The page already holds
    `blockProgress`: publish it (and the workout's name and start time if
    the stage does not already have them) through `publishArenaFacts` from
    `lib/arenaFacts.js` - import it, do not edit that file - so the strip
    reads `m:ss · n OF total` on a block day. Prove it on a real block day
    (create a block and start a day in the rig if the seed has none).
B3. WHAT THE LIVE LINE CARRIED. Today's `LoggerLiveStrip` also shows the
    reopened state and the template it came from. Under Arena say in
    DELIVERY.md where each one is shown now; if nowhere, STOP and report
    it (do not invent a home).
B4. SLIDE-UP SHEETS NOT ALL SKINNED (ledger 6). Only the start picker and
    the confirm panels got the skin. Also skin the Logging setup sheet
    (`TrainingPrefsSheet`), add exercise, and the two info sheets: square
    corners, 2px accent rule, the 34 x 3 grip, title in the display face,
    square dark inputs and segmented controls, squared list rows; main
    button stays rounded. One screenshot each beside the artifact's
    Finish sheet / Start picker / Setup sheet.
B5. CONSOLE ERROR. "flushSync was called from inside a lifecycle method"
    fires in the live logger (seen in your 360 Finish run and again in
    the reviewer's run: open logger, Setup, discard). Find which call
    fires it. If your change causes it, fix it. If it also fires on the
    untouched base (`git stash` is NOT allowed - check the same flow
    against a second worktree at the base commit or read the code path
    and prove it), say so with the evidence.
B6. RAIL LETTERING. The rail reads "COACH 5 CORNER" - the apostrophe
    comes out as a glyph that reads as a 5. Draw it as the artifact does.
B7. ARENA OFF NOT PROVEN for Home and Coach (1744 px and "large"). Redo
    before/after on the same data (the same session state, the Coach note
    dismissed in both) so the diff is 0, or show the diff is only data.
    "Before" = a second worktree at the base commit, not a stash.
B8. STATE MATRIX INCOMPLETE. The block asks for every cell of the matrix
    with typing proof and one contact sheet per route beside the
    artifact; you sent representative shots and two contact sheets.
    Supply the full matrix, including Resting (REST on the strip with the
    drain bar, `REST m:ss` on the rail with its edge draining, stage
    height unchanged) and Just finished (SAVED on board and rail).
Accepted as is: `components/prefs/TrainingPrefsForm.jsx` outside FILES TO
TOUCH (the Layout line; reported, small, gated on a prop) - you may keep
editing it for B4. The rig DB has three stray live workouts from the first
run; clear them in the throwaway DB before the matrix.

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
