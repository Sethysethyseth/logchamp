# TASK ar5: Arena - places (History seat follows the workout, near stands as drawn, banners, Library + Profile strips)

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
ARENA wave unit AR5, after ar4 (same arena files - it must be landed
first; build on what it added: `client/src/lib/arenaBoards.js`,
`client/src/lib/arenaFacts.js`). Today the near stands light one seat per
lifetime workout up the whole stand, there is no marker for the workout
you are looking at, the banners paint their number when earned, and the
Library and Profile strips fall through to `LOGCHAMP`. The design of
record, `docs/design/mocks/motion/arena-draft-2.html`, draws the near
stands as a hashed crowd with a front row of fresh seats and a marker on
the selected workout (html 515-525), hangs earned banners as crowns
(590-596), and gives every place a strip headline (`marqueeLines`,
606-616) and a one-line summary (`PEEK`, 867-874). Recon:
`docs/tasks/ar-fid-FINDINGS.md`, ranked item 3, groups (a) and (c).
Where the app and the prototype differ and this block does not rule,
the prototype wins.

THE DATA RULE (as ar4): only data the app already has - the sessions
list from `useActiveSession()`, the route, and the ar4 store. No new
endpoints, no new requests.

Everything here shows only under Arena view (`html[data-arena]`). With
the switch off the app renders exactly as today. The ONE MOTION rule
stands untouched: the camera height never changes, the stage rides the
sheet's top edge, gap 0. Coach stays on the strip; no swipe-to-walk.

FILES TO TOUCH:
- client/src/lib/arenaBoards.js               (new pure exports below)
- client/src/components/arena/arenaEngine.js  (stands, seat marker, banners, strip faces)
- client/src/components/arena/ArenaStage.jsx  (selected workout, facts, peek lines)
- client/src/components/arena/arena.css       (only if needed)
- client/src/pages/MyTemplatesPage.jsx        (extend ar4's ONE publish site with the saved-workout count)
Do NOT modify anything outside these files.

CHANGE:
1. NEW PURE EXPORTS in `arenaBoards.js` (no DOM / React):
   - `seatIndex(sessions, selectedId)` -> the selected workout's index
     among COMPLETED sessions ordered oldest first (0 = the first ever
     workout); when `selectedId` is missing or not a completed session,
     the newest one's index; `-1` when there are none.
   - `historyStrip({ seats, selected })` -> with a selected workout
     (`{ title, completedAt }`): `["<MON> <D>", title]` (month as three
     uppercase letters, local date, no leading zero); without:
     `["HISTORY", "<n> WORKOUTS"]` (`1 WORKOUT`).
   - `libraryStrip({ block, workouts })` -> with `block` (the
     `blockBoard(...)` result): `[block.label, "<done> OF <total> DAYS"]`;
     without: `["LIBRARY", "<n> WORKOUTS"]` (`1 WORKOUT`) where n is the
     saved-workout count; with neither known: `["LIBRARY", ""]`.
   - `profileStrip({ streak, workouts })` -> streak >= 1:
     `["STREAK", "<n> WEEKS"]` (`1 WEEK`); else
     `["PROFILE", "<n> WORKOUTS"]` (`1 WORKOUT`).
   - `banners(workouts)` -> `[{ label: "", earned: w >= 1 },
     { label: "100", earned: w >= 100 }, { label: "1K", earned: w >= 1000 }]`.
     These are the milestones: first workout, 100, 1000.
2. NEAR STANDS, as the prototype draws them. Every tier keeps its
   shape; along each tier the crowd is the prototype's hash pattern
   (`hash(x, tier)`: < 0.05 bright, < 0.36 mid, else dark) - fixed, not
   tied to the count. One seat per workout keeps its meaning through:
   (a) the FRONT ROW - one lit seat per workout finished in the last 7
   days, newest brightest, laid out as the prototype's front-row lamps
   (`80 - i*4` on the floor edge, as many as fit); (b) the SEAT MARKER -
   the selected workout's seat (index from `seatIndex`, mapped onto
   today's `SEATS` order, front row of the stand first, clamped to the
   last seat) gets a bright 3x3 marker. STEADY, no blink (zero frames at
   rest; the prototype's blink is dropped on purpose). Drawn always, so
   the full view and the History open size both show it.
3. THE SELECTED WORKOUT. On `/sessions/:id` for a COMPLETED workout (not
   the live one - `placeFor` already routes the live one Home), the
   selected id is that `:id`; on `/sessions` and elsewhere there is no
   selection (the marker sits on the newest seat). Changing the
   workout moves the marker with no camera move. The route sizes from
   ar2f stay as they are (`/sessions/<id>` is the strip): the strip on a
   past workout reads `historyStrip` with its title (via
   `sessionDisplayTitle`, already imported) and date, line 2 fitted with
   `ledFit` as wide as the strip allows (ar2f rule 5).
4. BANNERS. Earned banners show the crown (all three, as the
   prototype), unearned ones their label in the dim tone. No other
   change to the locker room.
5. STRIP HEADLINES. The strip's last fallback (`LOGCHAMP` / `""`) goes:
   Library reads `libraryStrip` (block from ar4's store via
   `blockBoard`, saved-workout count from MyTemplatesPage's publish -
   add `library: { workouts: <n> }` at ar4's publish site, nothing
   else on the page changes); Profile reads `profileStrip` with
   `weekStreak` and `countCompleted` from
   `client/src/lib/profileStats.js` (import; do not edit it). Every
   route now has a headline; `LOGCHAMP` remains only where no place
   applies.
6. ONE-LINE SUMMARIES (the full-view line, `peekLine`):
   - History, selected: `<title> · seat <k+1> of <n>`; not selected:
     today's line.
   - Library, with a block: `<block name> · week <w> of <total weeks>`;
     else today's line.
   - Profile: `<streak> week streak · <k> of 3 banners hung` when the
     streak is >= 1, else `<n> workouts logged · <k> of 3 banners hung`
     (singulars: `1 week`, `1 workout`).

ACCEPTANCE CRITERIA (machine-checkable):
- From `client/`: `npm run build` compiles with no errors.
- From `server/`: `npm run test:unit` green (unchanged suite).
- `node scripts/check-hex.mjs` (repo root) reports no new literal colours.
- Scope: `git status --short --untracked-files=all` lists only files in
  FILES TO TOUCH; the MyTemplatesPage diff only extends ar4's publish.
- ar4's contract still prints `ok` (re-run the node check in
  `docs/tasks/ar4-arena-boards-from-real-data.md`), and from the repo
  root this prints `ok`:
  `node --input-type=module -e "import('./client/src/lib/arenaBoards.js').then(m=>{const a=(x,y)=>{if(JSON.stringify(x)!==JSON.stringify(y))throw new Error(JSON.stringify(x)+' != '+JSON.stringify(y))};const S=[{id:7,completedAt:'2026-11-03T18:00:00Z'},{id:9,completedAt:null},{id:4,completedAt:'2026-10-01T18:00:00Z'},{id:12,completedAt:'2026-11-10T18:00:00Z'}];a(m.seatIndex(S,7),1);a(m.seatIndex(S,4),0);a(m.seatIndex(S,12),2);a(m.seatIndex(S,9),2);a(m.seatIndex(S,null),2);a(m.seatIndex([],null),-1);a(m.historyStrip({seats:19,selected:{title:'Quad-Focused Leg Day',completedAt:new Date(2026,10,10,18).toISOString()}}),['NOV 10','Quad-Focused Leg Day']);a(m.historyStrip({seats:19,selected:null}),['HISTORY','19 WORKOUTS']);a(m.historyStrip({seats:1,selected:null}),['HISTORY','1 WORKOUT']);a(m.libraryStrip({block:{label:'BLOCK W2',done:4,total:9,cells:[]},workouts:3}),['BLOCK W2','4 OF 9 DAYS']);a(m.libraryStrip({block:null,workouts:1}),['LIBRARY','1 WORKOUT']);a(m.libraryStrip({block:null,workouts:null}),['LIBRARY','']);a(m.profileStrip({streak:3,workouts:19}),['STREAK','3 WEEKS']);a(m.profileStrip({streak:1,workouts:19}),['STREAK','1 WEEK']);a(m.profileStrip({streak:0,workouts:19}),['PROFILE','19 WORKOUTS']);a(m.banners(150).map(b=>b.earned),[true,true,false]);a(m.banners(0).map(b=>b.label),['','100','1K']);console.log('ok')})"`
- Arena view ON, Playwright phone profile, dark, champ, at 412 x 839 AND
  360 x 740, `scrollWidth === innerWidth` on each, screenshots (paths in
  DELIVERY.md) of: History at the open size (hashed crowd, front row,
  marker on the newest seat); full view at History after opening an
  older workout from the History list (marker moved - report the two
  seat indexes); the strip on that past workout (date + name); Library
  strip (scrolled) with and without a running block; Profile at the
  open size (banners as crowns / labels) and its strip; the full-view
  line on History (selected), Library and Profile.
- No new requests: the network list for Home -> History -> a past
  workout -> Library -> Profile is the same with Arena view ON and OFF
  (report it).
- The ar1 ride still holds: on Home at scrollY 0, 60 and 2000 the sheet
  top minus the stage bottom is the same number until the strip holds
  (report the numbers).
- No `requestAnimationFrame` callbacks for 2 s at rest on History, on a
  past workout, on Library and on Profile (state the counts).
- `prefers-reduced-motion: reduce`: nothing new animates (state how).
- Arena view OFF: state how you checked nothing renders differently.

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
