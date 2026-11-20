# TASK bl1: Arena room in tab order - the coach's corner out, Analytics gets its own place

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
Block Lens wave (BL), branch `claude/wonderful-gauss-xxyvet`. Today the
arena's places sit in a different order from the nav tabs, so a sideways
tab swipe walks the camera the wrong way: Home -> Analytics does not move
(same place), Analytics -> History walks LEFT, History -> Library crosses
the whole room. Seth's rulings (Nov 20): the coach's chalkboard corner is
removed from the room (the AI coach itself stays), Analytics gets its own
place with its own standing board, and the room runs in tab order:
Home, Analytics, History, Library, Profile - one place per screen, every
swipe one even step in the finger's direction.
Design of record: `docs/design/mocks/block-lens/` (read README.md there).
`arena-in-tab-order.prototype.diff` is a WORKING prototype of this unit
(it applies to the current tree and builds); `frames/new/*.jpg` and
`mock/new-*.jpg` are screenshots of it running. Your job is to land it
properly, not to redesign it.

FILES TO TOUCH:
- client/src/components/arena/arenaEngine.js
- client/src/components/arena/ArenaStage.jsx
- client/src/lib/arenaBoards.js   (only if the coach's balcony entry or
                                    anything place-keyed needs it)
Do NOT modify anything outside these files.

CHANGE:
1. Start from the prototype diff (`git apply` it, then clean up). It:
   - sets `ARENA_PLACES` to home 150, analytics 254, history 358,
     library 462, profile 554 and a room width of 608 (`targetX` clamps to
     it; a view wider than the room centres it);
   - moves `CANS`, `BALCONY_SX` and the place lights to match; every place
     has its own balcony lettering (the home/analytics skip is gone);
   - removes the coach's corner drawing and draws Analytics' own standing
     board at x 254: weekly SETS bars from a distance, and the view the
     page is on (`viewBoard`, driven by `ease.board`) as the camera arrives;
   - the board hung over the platform no longer opens - it shows Home's
     faces (and the coach's face when the coach page is open, see 3);
   - mirrors the History stands so the tiers rise toward a back wall at
     x 404, front row nearest the platform side;
   - shifts the rack (Library) and the lockers + banners (Profile) one
     place right.
2. Clean-up the prototype skipped (this is the real work):
   - the rack / locker / program-board coordinates were shifted with a
     blunt +104 on every literal. Re-express them relative to their place
     (e.g. an origin constant per place) so the next move is one number.
   - anything else that still assumes the old layout: zoom focus
     (`clampFocus` / the closer-look focus points), the selected-workout
     seat marker on the stands (`s.spot`), crowd seating order, the
     crown-rain bounds, rail mode for each place, lamp-can on-states,
     `wantWide`, the folded strip (must look exactly as today on every
     route - it is a cut of the hung board).
   - remove dead coach-corner code (chalkboard drawing helpers used only
     there). KEEP the chalk face on the board: `boardFace` place "coach"
     and the thinking dots still show on the strip and the hung board.
3. `/coach` stands at Home: `placeFor` returns `["home", "coach"]`; the
   peek line and board face read the facet (the prototype does this in
   `peekLine` and `faceInput`).
4. Tab swipe (`useTabSwipe` / `arena.scrub`) needs no change - it scrubs
   the camera toward `ARENA_PLACES[to]`; verify it now walks the finger's
   way on all four swipes.
Follow the existing engine patterns by name: `px` / `text` / `mid` /
`crown`, `light(...)`, the `at(place)` highlight idiom, the RAMP steps.
Reduced motion: camera and zoom cut, nothing new animates.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` clean; `node scripts/check-hex.mjs` clean;
  `npm run test:unit` green from `server/` (unchanged count).
- `cd client && node -e "import('./src/components/arena/arenaEngine.js').then(m=>{const p=m.ARENA_PLACES,o=['home','analytics','history','library','profile'];if(!o.every((k,i)=>!i||p[k].x>p[o[i-1]].x)||'coach' in p)throw new Error('order');console.log('ok')})"`
  prints `ok` (if the module cannot be imported under node, say so and
  prove the same with a grep of the literal in DELIVERY.md).
- `grep -n "coach's corner\|chalkboard, stool" client/src/components/arena/arenaEngine.js` returns nothing.
- No bare `+104`-style shifted literals left in the rack / locker code:
  DELIVERY.md shows the per-place origin constants.
- Cloud smoke rig (`bash scripts/cloud-smoke-up.sh`, driver
  `scripts/smoke-rig.cjs`, Arena on, champ, 412 and 360 wide):
  - a five-tab swipe Home -> Profile (raw touches, as the block-lens
    frames were made): every mid-swipe frame shows the room moving the
    finger's way; contact sheet beside `frames/new/` in DELIVERY.md.
  - each tab at rest matches `mock/new-<n>-<tab>.jpg` (contact sheet).
  - STATE MATRIX, each with every control on screen and usable: Home idle,
    Home with a live workout (the platform + REST face + wide board),
    resting (REST face counts down), just finished (SAVED face); Analytics
    on each of its four views (the standing board shows that view);
    `/coach` while an answer streams (dots on the strip) and after (chalk
    lines); History with a past workout open (seat marker on its fan);
    the closer look (hold/pinch) on Home, Analytics and History;
    folded strip and rail on every tab; full view.
  - `prefers-reduced-motion`: a tab change cuts the camera; zero rAF at
    rest (`r.rafIdle`) on every tab.
  - zero console errors; `scrollWidth == innerWidth` everywhere.

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
