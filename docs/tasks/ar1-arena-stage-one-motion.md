# TASK ar1: Arena stage v2 - one motion, three sizes, the scoreboard strip, a full view that sticks

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
First unit of the ARENA wave (`motion-wave`; plan in
`docs/design/mocks/motion/ROADMAP.md`, "ARENA wave (AR)"). Seth approved
the prototype `docs/design/mocks/motion/arena-draft-2.html` on Nov 11
("I'm ready to transition over to this"). The app already has the
scaffold behind Profile > Appearance > "Arena view (beta)":
`client/src/components/arena/` (ArenaStage.jsx, arenaEngine.js,
arena.css), `client/src/lib/arenaPref.js`, `Layout.jsx`. This unit makes
that scaffold MOVE the way the prototype does. Seth's complaint about the
old motion, which this unit exists to fix: going between the full view
and the half view "can give a headache" - the room panned on its own
while the sheet moved. His rule: the background "can't get in the way of
the beautiful app behind it".

The prototype is the reference of record for behaviour and feel. Open it
in a browser and use it before writing code. Its script names the same
ideas used below (`sheetFrac`, `syncScroll`, `applySize`, `drawMarquee`,
`marqueeLines`, `PEEK`). It is a mock with one inner scroller; the APP
keeps the window as the only scroller (see CHANGE 1). Do not port its
DOM - port its behaviour.

Nothing outside Arena view may change: with the switch off the app must
render exactly as it does today.

FILES TO TOUCH:
- client/src/lib/arenaSheet.js              (NEW - pure helpers, no DOM, no
                                             React, no imports; contract below)
- client/src/lib/arenaTour.js               (NEW - the full-view switch, a
                                             tiny store in the style of
                                             `arenaPref.js`)
- client/src/components/arena/ArenaStage.jsx
- client/src/components/arena/arenaEngine.js
- client/src/components/arena/arena.css
- client/src/components/Layout.jsx
Do NOT modify anything outside these files.

CHANGE:
1. THE ONE-MOTION RULE (the heart of this unit). The room is drawn framed
   for the full view and its camera height NEVER changes. The camera only
   walks sideways between places. Everything vertical is the stage element
   moving as one rigid piece with the top edge of the sheet (`.arena-sheet`):
   - The window stays the only scroller (the beta's invariant - keep it).
     As the page scrolls, the stage translates up 1:1 with the sheet's top
     edge until only the strip height is left visible, then holds. Scrolling
     back reverses it exactly. `transform` only; no layout per scroll frame.
   - When a route change gives the stage a different height, the stage and
     the sheet edge move together with ONE duration and ONE easing (today's
     `--mx-ease-out-expo`, 440 ms). At no instant may the room move relative
     to the sheet's top edge.
   - Delete the engine's vertical camera logic (`ARENA_PLACES[..].top`,
     `floorView`, the `cam.y` easing). `cam.y` is a constant.
2. THREE SIZES, decided by a pure function in `arenaSheet.js`:
   - `tour`: the arena has the screen. The sheet is put away except one
     summary line and the bottom nav.
   - `open`: arrival size on browsing routes. Heights (svh): Home 42,
     Analytics 38, History list 34, Library (`/templates`) 30, Profile 28.
   - `strip`: 18svh, on every working route - the live workout logger
     (`/sessions/<activeId>`), `/log-workout`, `/coach`, any other
     `/sessions/<id>`, and every route not listed under `open` (builders,
     editors, import, block pages, profile sub-pages).
   Exports (exact names, the reviewer runs them with node):
   - `ARENA_STRIP_SVH = 18`
   - `arenaSize({ pathname, tour })` -> `{ mode, svh }` where mode is
     `"tour" | "open" | "strip"`; `tour: true` always wins and returns
     `{ mode: "tour", svh: 100 }`.
   - `stageRide({ scrollY, openPx, stripPx })` -> px the stage has moved
     up: `Math.max(0, Math.min(scrollY, openPx - stripPx))`, and `0` when
     `openPx <= stripPx`.
   - `stripReveal({ ride, openPx, stripPx })` -> 0..1, the strip's opacity:
     0 until 70% of the ride, linear to 1 at 100%; `1` when
     `openPx <= stripPx` (a strip route).
3. THE SCOREBOARD STRIP. When the visible stage is down to strip height
   (by scrolling an open route, or on a strip route) the strip shows a flat
   scoreboard instead of a sliver of the room: fixed at the top, opaque,
   above the sheet, fading in place per `stripReveal` - it never slides.
   Draw it with the engine's existing ramp, font and `crown` helpers
   (prototype: `drawMarquee`). What it reads, first match wins:
   - rest timer running: `REST` + `m:ss`, plus a thin bar draining along
     the bottom edge (any place - the clock follows you around the app)
   - live workout: running clock + `SET n` (existing `live` state)
   - just finished: `SAVED` + the workout name (existing `savedUntil`)
   - Coach route: `ASK ME` / `ANYTHING`
   - Home: cycles `7 DAYS` / `<n> SETS` and `WORKOUTS` / `<n>` every 4.2 s,
     with the seven day lamps; reduced motion shows the first face only
   - Analytics: `8 WEEKS` / `<n> SETS`; History: `HISTORY` /
     `<n> WORKOUTS`; anything else: `LOGCHAMP`
   Use only data `ArenaStage` already has (`roomFacts`, the live session,
   the rest run). No new fetches. The set flash and finish flashes light
   the strip's edge as they light the room today.
4. THE FULL VIEW STICKS. The stage takes taps (it is `pointer-events: none`
   today). A tap on the stage toggles the full view. While it is on:
   the sheet's content is hidden and `inert`; one line of text (per place,
   prototype `PEEK`, built from the same data as the strip) sits above the
   bottom nav and is itself a button that ends the full view; the bottom
   nav keeps working; `PersistentWorkoutBar` and `CoachWorkingBar` are
   hidden. Changing tab does NOT end it - the camera walks and the line
   changes. It ends only by tapping the stage, tapping the line, or
   reloading (the store in `arenaTour.js` is in-memory, not persisted;
   follow `arenaPref.js`'s `useSyncExternalStore` shape BY NAME). A tap on
   the strip also opens the full view. A vertical drag that starts on the
   stage must still scroll the page (`touch-action: pan-y`).
5. FRAME BUDGET. Keep the engine's rule: no frames at rest. While the
   camera walks, draw every animation frame (not a throttled rate) with a
   time-based ease, so a walk is smooth. The strip redraws once a second
   while a clock is showing, otherwise only on change.
6. Reduced motion: no transitions, the camera cuts, the strip appears
   without a fade. Desktop (>= 720px) keeps working as the beta does
   (stage behind the top navbar).

ACCEPTANCE CRITERIA (machine-checkable):
- From `client/`: `npm run build` compiles with no errors.
- `node scripts/check-hex.mjs` (repo root) reports no new literal colours
  in the touched files.
- From the repo root this prints `ok`:
  `node --input-type=module -e "import('./client/src/lib/arenaSheet.js').then(m=>{const a=(x,y)=>{if(JSON.stringify(x)!==JSON.stringify(y))throw new Error(JSON.stringify(x)+' != '+JSON.stringify(y))};a(m.ARENA_STRIP_SVH,18);a(m.arenaSize({pathname:'/',tour:false}),{mode:'open',svh:42});a(m.arenaSize({pathname:'/analytics',tour:false}),{mode:'open',svh:38});a(m.arenaSize({pathname:'/sessions',tour:false}),{mode:'open',svh:34});a(m.arenaSize({pathname:'/sessions/12',tour:false}),{mode:'strip',svh:18});a(m.arenaSize({pathname:'/coach',tour:false}),{mode:'strip',svh:18});a(m.arenaSize({pathname:'/templates',tour:false}),{mode:'open',svh:30});a(m.arenaSize({pathname:'/blocks/current',tour:false}),{mode:'strip',svh:18});a(m.arenaSize({pathname:'/profile',tour:false}),{mode:'open',svh:28});a(m.arenaSize({pathname:'/profile/appearance',tour:false}),{mode:'strip',svh:18});a(m.arenaSize({pathname:'/coach',tour:true}),{mode:'tour',svh:100});a(m.stageRide({scrollY:0,openPx:400,stripPx:150}),0);a(m.stageRide({scrollY:100,openPx:400,stripPx:150}),100);a(m.stageRide({scrollY:900,openPx:400,stripPx:150}),250);a(m.stageRide({scrollY:50,openPx:150,stripPx:150}),0);a(m.stripReveal({ride:0,openPx:400,stripPx:150}),0);a(m.stripReveal({ride:175,openPx:400,stripPx:150}),0);a(m.stripReveal({ride:250,openPx:400,stripPx:150}),1);a(m.stripReveal({ride:0,openPx:150,stripPx:150}),1);console.log('ok')})"`
- `grep -n "floorView\|\.top ==\|top: " client/src/components/arena/arenaEngine.js`
  shows no vertical camera targeting left in the engine.
- With Arena view OFF: `git diff --stat` touches only the files above and
  `Layout.jsx` renders the same tree as before for `arena === false`
  (state this with the diff hunk in DELIVERY.md).
- In a phone-sized browser (390 x 844 or a Playwright phone profile) with
  Arena view ON, report each of these in DELIVERY.md with the measured
  numbers:
  - `document.documentElement.scrollWidth === window.innerWidth` on Home,
    Analytics, History, Coach, Library, Profile and a live workout (this
    exact check exists because an over-wide sheet once zoomed Seth's phone
    out - desktop screenshots do not show it).
  - On Home, at scrollY 0, 60 and 2000: (sheet top edge y) minus (stage
    bottom edge y) is the same number at all three until the strip holds.
  - Sample the same difference three times DURING the Home -> Coach route
    change: it does not vary by more than 1px.
  - Tap the stage on Home, then tap Analytics, History, Profile in the
    bottom nav: the full view is still on after each; tap the stage: the
    page is back.
  - `/coach` with the composer focused still sits above the keyboard as
    it does today (`coachKeyboardFit.js` untouched).
- `prefers-reduced-motion: reduce`: no `transition` or animation runs on
  `.arena-stage`, the spacer or the strip (state how you checked).

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
