# TASK ar2: Arena - look closer (zoom), the Log and the up-close details, existing easter eggs moved into the room

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
Second unit of the ARENA wave (`motion-wave`; plan in
`docs/design/mocks/motion/ROADMAP.md`, "ARENA wave (AR)"). RUNS AFTER ar1
HAS LANDED - it edits the same engine files and builds on ar1's full view
(`client/src/lib/arenaTour.js`). Reference of record:
`docs/design/mocks/motion/arena-draft-2.html` - open it, tap the arena,
hold a finger on the crowd behind the platform, tap what you find; tap the
crown five times; press and hold "Start empty workout". Its script has
every piece named below (`logChamp`, `LOG`, `LOG_INK`, `zoomIn`, `cheer`,
`crownTap`, the `s.lift` / `s.rain` / `s.egg` state). Seth's ask, Nov 11:
"all the easter eggs / visual animations we made bring it over to the new
look", plus one new subtle find you only see zoomed in.

Everything here exists only under Arena view. With the switch off, the
app's existing eggs (crown coin flip, five-tap crown rain, the Start
dumbbell curl) behave exactly as today.

FILES TO TOUCH:
- client/src/components/arena/arenaEngine.js
- client/src/components/arena/ArenaStage.jsx
- client/src/components/arena/arena.css
- client/src/lib/arenaSheet.js              (pure helpers added, contract below)
- client/src/lib/sceneSignal.js             (new signal kinds only)
- client/src/components/motion/CrownEgg.jsx (emit a signal; under Arena view
                                             the rain falls in the room)
- client/src/components/workout/StartWorkoutHero.jsx (emit hold signals)
Do NOT modify anything outside these files.

CHANGE:
1. LOOK CLOSER. In the full view (and from the open size, where it first
   turns the full view on): press and hold the stage ~480 ms, or pinch
   out, to zoom to 3x centred on that point; drag pans; a tap anywhere
   else steps back to 1x; pinch in steps back. Changing tab steps back.
   The engine draws every world coordinate through one scale so detail
   authored in THIRDS of a pixel resolves only when zoomed (prototype:
   `px` with `zz`, and `text(..., 1 / 3)`). The lighting field is sampled
   per canvas pixel, so the dither stays fine when zoomed. Zoom eases
   with the same time-based ease as the camera walk; reduced motion cuts.
   A hold must not select text, open the context menu, or scroll the page.
   Pure helpers in `arenaSheet.js` (the reviewer runs them):
   - `ARENA_ZOOM = 3`
   - `clampFocus({ x, y })` -> `{ x: clamp(x, 20, 480), y: clamp(y, 48, 152) }`
   - `zoomView({ camX, camY, viewW, viewH, focus, zoom })` -> `{ x, y }`,
     the world coordinate at the view's top-left: with
     `t = (zoom - 1) / (ARENA_ZOOM - 1)`, centre =
     lerp((camX + viewW/2, camY + viewH/2), focus, t), result =
     centre - (viewW/2/zoom, viewH/2/zoom).
2. THE LOG (the design detail IS the spec - reproduce it exactly). The
   app's namesake sits in the front row of the far stands at world
   (178, 135). At 1x it is one fan a little brighter than the rest: a
   3x2 block of ramp step 5 at (177, 135) with one ramp-7 pixel at
   (178, 134). At zoom >= 1.8 draw the sprite below in thirds of a pixel,
   top-left at (176.3, 134.3). Characters -> ramp step: `#` 8, `o` 4,
   `b` 6, `w` 8, `m` 1, `s` 5, `d` 4, `.` nothing.
   ```
   ..#..#..#..
   ..#######..
   .ooooooooo.
   obbbbbbbbbo
   obbwbbbwbbo
   obbbbbbbbbo
   obbbmmmbbbo
   obsbbbbbsbo
   obbbbbbbbbo
   .ooooooooo.
   ..d.....d..
   ```
   It blinks (the `w` eyes drop to step 6 for ~150 ms every ~3.4 s) while
   zoomed. A tap within 6 world px of (178, 135) while zoomed makes it
   cheer for 2.6 s: it hops and presses a tiny bar overhead, a wave runs
   left to right through the far stands twice (fans within 6 px of the
   wave front rise one pixel and brighten), the scoreboard / strip reads
   `LOG` / `CHAMP`, one short haptic tick where supported. Reduced
   motion: arms and bar up, board text, no hop, no wave.
   Two smaller up-close details (zoom > 2.2 only): fine print along the
   bottom of the coach's chalkboard, `LOG IT OR IT DIDNT HAPPEN`, and a
   `1` on your locker's nameplate. Never mention any of this in UI copy.
3. EXISTING EGGS, IN THE ROOM (Arena view on only):
   - Five-tap crown rain (`CrownEgg`): the crowns fall inside the arena
     canvas and land on the floor instead of over the page. The coin flip
     on a single tap is unchanged.
   - Press and hold a Start button on Home (`StartWorkoutHero`): the bar
     on the platform leaves the floor for as long as you hold (eased up
     ~9 world px with a slight bob, the two towers go to full power),
     and drops with one short floor flash on release. The existing CSS
     dumbbell curl keeps running on the button. Whether releasing a
     long press starts a workout stays exactly as it is today - do not
     add or remove a start; say which it is in DELIVERY.md.
   - Workout start: the two light towers switch on one at a time (left,
     then right), not together.
   Carry these through `sceneSignal.js` as new kinds (follow its existing
   `sceneSignal(kind)` / `SCENE_SIGNAL_EVENT` pattern BY NAME); the
   components must not import the engine.
4. Cost: zoom, cheer, rain and lift run frames only while they are moving;
   the engine is back to zero frames at rest afterwards. Covered or
   hidden stage draws nothing (existing rule).

ACCEPTANCE CRITERIA (machine-checkable):
- From `client/`: `npm run build` compiles with no errors.
- `node scripts/check-hex.mjs` (repo root) reports no new literal colours.
- From the repo root this prints `ok`:
  `node --input-type=module -e "import('./client/src/lib/arenaSheet.js').then(m=>{const a=(x,y)=>{if(JSON.stringify(x)!==JSON.stringify(y))throw new Error(JSON.stringify(x)+' != '+JSON.stringify(y))};a(m.ARENA_ZOOM,3);a(m.clampFocus({x:5,y:300}),{x:20,y:152});a(m.clampFocus({x:178,y:135}),{x:178,y:135});a(m.zoomView({camX:100,camY:3,viewW:100,viewH:154,focus:{x:178,y:135},zoom:1}),{x:100,y:3});const z=m.zoomView({camX:100,camY:3,viewW:100,viewH:150,focus:{x:178,y:135},zoom:3});a([Math.round(z.x*100)/100,Math.round(z.y*100)/100],[161.33,110]);console.log('ok')})"`
- ar1's node check still prints `ok` (re-run it; paste both outputs).
- `grep -n "arenaEngine" client/src/components/motion/CrownEgg.jsx client/src/components/workout/StartWorkoutHero.jsx`
  prints nothing.
- In a phone-sized browser with Arena view ON, report in DELIVERY.md, with
  a screenshot path for each: the Log at 1x, the Log zoomed, the Log
  mid-cheer; crown rain inside the canvas; the lifted bar while a Start
  button is held. State the measured frame activity at rest after each
  (no `requestAnimationFrame` callbacks for 2 s).
- `document.documentElement.scrollWidth === window.innerWidth` on Home
  while zoomed.
- Arena view OFF: the five-tap rain still falls over the page and the
  dumbbell still curls (state how you checked).
- `prefers-reduced-motion: reduce`: zoom cuts, no wave, no hop, no rain
  travel (crown taps stay inert as today).

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
