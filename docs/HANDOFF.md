# HANDOFF — current state

> **WHERE WE ARE (Nov 10): MOTION WAVE (MX) OPEN on `motion-wave` - mid-wave,
> MX7-MX16 still TODO in ROADMAP.** Every smoke item through MXF10 PASSED
> (Nov 9). Nov 10: a cloud Fable session built DIRECTLY at Seth's ask (no
> Cursor blocks - the cloud box cannot reach the lane worktrees): MX-CI
> crown intro, crown play, MXF12 (bar pixel exit + any-direction drag +
> crown loader + loader->login hand-off), then MX7a (logger floor + the
> Home saved moment, `a6338da`). All pushed, NONE phone-smoked;
> verified only in headless Chromium at 400x860 against a mocked API
> (normal + reduced motion, no page errors). Smoke list below.
> Seth's direction: "wicked" motion and graphics, analytics first; Fable in
> Cursor is the designer and its suggestions win; the Claude Code seat
> writes briefs and audits. Motion stance: AGENTS.md.
> - Design of record: `docs/design/mocks/motion/MOTION-DIRECTION.md`
>   (Seth's rulings at the top win: PR celebration RARE, milestones at
>   100/1,000/10,000 workouts, per-palette scenes) + `ROADMAP.md` (the
>   wave's state: MX1-MX16 + MX-S + SRV-1/2, "Last checkpoint" line) +
>   `IDEAS.md` (15 PARKED ideas; IDEAS 16 PROMOTED -> MXF11).
> - LANDED: MX0 `f651c21`, MX1-4 `2cdeee0`, MX5-6 `d309919`, MXF1
>   `97d028d`, MXF2 `20daef5`, MXC1 `266554f`, MXF3 `ff2c4e0`, MXF4
>   `d6ae69b`, MXF5 `3378250`, MXF6 `f14762d` (SERVER-touching: coach
>   finish + save on disconnect, `POST /coach/stop`), MXF7 `fec6d06`,
>   MXF8 `9a500e8` (Analytics replays faster on return), MXF9 `78a4cd6`
>   (exercise detail inline under the tapped row), MXF10 `f5826af` (coach
>   box above the Android keyboard), MXF11 `1bf3ee7` (swipe bars away).
>   QUEUE.md holds every audit.
> - **Cursor models (Nov 9):** Fable 5.2 is live on the CLI
>   (`claude-fable-5-2-low|medium|high|xhigh|max`); 5.1 still listed.
>   Use 5.2 for the next design-heavy block (Seth: "a useful option").
> - Previews (private Artifacts): analytics X52VRgnoGLer3gGgphQnBU, PR
>   2kWaZboR6dtMGXgwJqhPSN, navigation T5WpDyvFkAX5rdex1Y5k67, session
>   flow 7dk9zTUhc2nxAbjDLS9i2S, scenes PTk4q9Gww5xhBy5cHkgQBx
>   (claude.ai/artifact/<id>).
> - Cursor caps are monthly per model (reset on the 18th): every Fable run
>   must leave ROADMAP.md current. The MX 5.1 chat is
>   `eb56cfff-dfbb-4abc-99f2-6d794c36b307` (`run-lane.ps1 -Resume`). Seth:
>   never dispatch the next unit until the current Fable run has fully
>   delivered; never stop a run mid-flight. Claude Code's low-memory
>   reaper can kill a background lane run - resume the same chat with a
>   salvage `-Note` (MXF9 precedent), don't ask.
> - Staging Render serves `motion-wave` (probed Oct 11: `POST
>   /coach/stop` -> 401, a bogus path -> 404). No migrations on this
>   branch, so the deploy does not migrate.
> - `main` = `b82ad8c` (QOL wave, live on prod). `quality-of-life-updates`
>   = main + docs; `motion-wave` was cut from it.

**Next action (human):** smoke the Nov 10 work on the phone (list below),
say what feels off; then pick MX7 (recommended) or MX5b / MX10 next.

## Smoke for the next round (carry forward - fill at each landing)

Everything through MXF10 is smoked and PASSED (Nov 9; history in the
archive). MXF11 `1bf3ee7` - functionally passes per Seth ("definitely
works in the barest sense"), feel NOT signed off. Its items, to re-run
after the feel pass (start a workout so the bar shows, then go to
Analytics):
- Drag the workout bar left or right: it follows your finger and fades;
  let go early -> springs back; past about a third, or a quick flick ->
  flies off. Reopen the app (close it fully) -> the bar is back.
- Scrolling the page with your thumb on the bar never moves it.
- Swipe starting on the bar's X -> it hides; it does NOT ask to discard.
  A plain tap on the X still asks.
- Ask the coach something, leave, swipe the "working" bar away -> when
  the answer is ready the bar returns once as "Coach answered"; swipe it
  again -> gone for good. The answer is in History > Coach either way.
MX-CI crown intro (Nov 10, built directly in a cloud Fable session at
Seth's ask - no Cursor block; NOT yet smoked on a phone):
- Sign in from the login screen: the login crown breaks into pixel
  ribbons, builds a big crown, flashes, spins twice like a coin, drops
  into the LOGCHAMP wordmark, and the screen dithers away to Home (~3 s).
- Close the app fully and reopen while signed in: the shorter version
  plays (~2 s). On a slow server wake the crown keeps spinning and
  "Taking longer than usual..." appears after 4 s.
- Tap anywhere during either: it wipes out at once.
- Reduced motion on: no intro at all, sign-in and boot as before.
- Signed out, open the app: straight to the login form, no intro.
Crown play (Nov 10, same session, CSS-only, not yet smoked):
- Login screen: the wordmark rises, the crown drops on with a bounce,
  then glints every ~6 s. A wrong password shakes the error once.
- Home: tap the masthead crown -> it flips like a coin. Five quick taps
  -> it rains crowns for ~3 s (easter egg; one short buzz on Android).
Round 3 (Nov 10, same session, not yet smoked):
- Slow first load while signed out (server waking): the full-page wait
  is now the pixel crown tossed and spinning over a pixel shadow with the
  wordmark under it - no barbell.
- MXF12 bar exit: start a workout, go to Analytics, swipe the resume bar
  sideways -> it breaks into pixels the way it was thrown; the accent
  pixels fly to the Home tab, Home pops, and a small square pip stays on
  Home while the bar is hidden. Coach bar: same scatter, no fly-home.
- Tap Home > Resume (or open the live workout any way), back out -> the
  bar is there again and the pip is gone. Without resuming it stays
  hidden until the next app open, as before.
- Reduced motion: bar simply gone (pip still shows), crown holds still.
- Loader -> login hand-off (round 4): signed out + slow server, when the
  wait ends the big crown shrinks into the login wordmark's crown, flashes
  and throws four pixels. Arriving at login any other way: the crown
  drops on as before.
- Any-direction bar drag (round 5, Seth: "omnidirectional" - REPLACES
  the Nov 9 sideways-only ruling): drag the resume or coach bar any way;
  it lags behind the finger and tilts; past ~72 px its edge lights, it
  dims, buzzes once and sheds pixels; let go there (or flick) and it
  scatters the way it was thrown. A short pull springs back. A drag that
  starts on the bar no longer scrolls the page. Swipe it away, resume,
  back out, swipe again - must work (was a bug, fixed).
- Polish 1: every crown landing flashes + throws four pixels (loading
  coin each loop, Home crown flip, login hand-off); the resume bar rises
  in when it appears.
MX7a logger floor + saved moment (Nov 10, second cloud Fable session,
built directly at Seth's ask; `a6338da`; headless-checked only, champ +
crimson dark, champ + forest light, reduced motion):
- Open a quick workout: under "Log workout" a line reads LIVE + a running
  clock + the set count. No "Live session. Updates save..." sentence.
- Log weight + reps on a set: a square tick springs in on the set, the
  row washes once, the header's live pixel pings and the count pops.
  Typing is never interrupted; a focused row never moves.
- "+ Add set" / "+ Add exercise": the new row or lift drops in.
- First set logged: one glint crosses Finish workout.
- The name field reads "WORKOUT NAME", bigger type, the long helper
  sentence is gone (placeholder says it is named for you at finish).
- Finish: Home has NO green "Workout saved" card. The Start card itself
  reads WORKOUT SAVED + the workout's name + sets / minutes, a pixel
  crown stamps onto its corner, a light runs once round the frame; after
  ~5 s it rolls back to "Start a workout". Both buttons work throughout.
- Reduced motion: same words, no travel.
- NOT touched: the block-day logger (its own header and grid), the rest
  dock, the finish sheet (MX9). Block-day finishes still get the saved
  hero.
Champ Arena is the DEFAULT scene (Seth, Nov 10: "PLEASE add champ arena
and make it the new default"; headless-checked only):
- Dark mode, Champ palette: the skyline is gone. The bottom of every page
  is an arena - lifting platform, loaded bar, two light towers, the crown
  banner, stands. Light mode shows it washed, as the skyline was.
- Start a workout: the left tower switches on, then the right, and the
  lights STAY up on every page while the workout is live.
- Finish: the lights flicker like camera flashes for ~2 s, then go low.
- Rest timer runs out: the lights blink once (with the buzz).
- Other palettes: unchanged. Reduced motion: lights just on or off.
- Easter egg: press and hold Start empty workout - the dumbbell curls.
- Stills: `client/src/assets/scenes/champ.png` + `champ-live.png`, drawn by
  `scripts/gen-champ-arena.cjs`; the old skyline is kept at
  `docs/design/mocks/champ-city-retired.jpg`. Wiring: `lib/sceneSignal.js`
  sets `data-scene-live` / `data-scene-cheer` on <html>; the lit layer is
  `html::after` (index.css, "Champ Arena"). Preview page:
  `docs/design/mocks/motion/champ-arena.html` (Artifact
  B89CfhvmvGiF86h7oN4AsE) - its "Room to grow" ideas (seats fill with
  history, plates match the last top set, milestone banners) are NOT built.
UI overhaul direction (Seth, Nov 10 - PROTOTYPES ONLY, nothing in the
app): Seth wants the arena brought forward ("we are absolutely onto
something"). `docs/design/mocks/motion/arena-ui-concepts.html` (three
concepts, Artifact DHV5E4bdodEXcwcsAVNBiL) -> he picked the full rethink
-> `arena-ui-v2.html` ("LogChamp Arena", Artifact in the session log):
one continuous arena, tabs are places (platform / scoreboard / stands /
coach's corner / rack / locker room), one sheet holds all input. His
stated fear: losing what is built. The v2 page's answer: second skin
over existing components, an "Arena view" switch in Appearance (off by
default), one place at a time, Home + logger first. NOT decided, NOT
planned into ROADMAP. Open: light mode, long pages, desktop, keyboard.
ARENA VIEW (BETA) IS IN THE APP (Seth, Nov 10: "one last trial holding
all of the features of the old into the new" - built as a real switch,
not a third mock; headless-checked only, phone + 1280 desktop):
- Profile > Appearance > "Arena view (beta)": Classic / Arena. Off by
  default, this device only (`workoutdb-arena`).
- On: a pixel arena fills the top of every screen and the page is a sheet
  that scrolls up over it. Tabs move the camera: Home = platform,
  Analytics = scoreboard (widens into 8 weeks of sets), History = stands
  (one lit seat per finished workout), Coach = chalkboard, Library = rack,
  Profile = lockers + banners. EVERY page is the existing page, unchanged.
- Board on Home: sets in the last 7 days + a lamp per trained day. Live
  workout: lights up, running clock, SET n, plates added as sets land;
  rest timer = REST m:ss with the lights dipping; finish = flashes +
  SAVED + the workout name.
- Works in all palettes (the room is mixed from the accent) and in light
  mode (the stage stays dark - not designed yet).
- Smoke: every tab, a full workout incl. rest timer and finish, the coach
  page WITH THE KEYBOARD OPEN (never exercised - /coach has its own
  keyboard fit), scrolling long pages, switching back to Classic.
- Code: `components/arena/` (ArenaStage.jsx, arenaEngine.js, arena.css),
  `lib/arenaPref.js`, `lib/sceneSignal.js` (now also emits "set"),
  `Layout.jsx`. Under `html[data-arena]` the bottom scene band is hidden.
- FIXED after Seth's first phone try (same day): the sheet's full-bleed
  trick (100vmax shadow + pseudo) made the page 3x wide, so Android Chrome
  zoomed the whole app out. The sheet is now a real wrapper
  (`.arena-sheet`, Layout.jsx). LESSON: desktop-headless screenshots do
  not show this - check `documentElement.scrollWidth` under a phone device
  profile (Playwright `devices`) for any layout change.
- Not done: analytics views on the board (it shows weekly sets only),
  coach answers on the chalkboard, the block on the program board,
  swipe-to-walk, light-mode arena. Decision pending Seth's phone run:
  keep going place by place, or cut.
Seth, Nov 10: crown intro timing stays AS IS (every cold open).
RESOLVED - was: is ~2 s on EVERY cold open right, or only the first open
of the day? (`TIMING` in `crownIntroEngine.js` holds every duration.)
Open questions for Seth: keep the crown on coach answers + the Analytics
coach card, or the bubble everywhere? `/coach/status` and `/coach/stop`
count against the coach limit - OK? Tapping outside the "still answering"
sheet counts as Open anyway (the answer still saves) - fine?

## PICK UP HERE (next session)

0. **Nov 10 follow-ups (after Seth's phone smoke of MX-CI / MXF12):**
   - The MXF11 feel pass is ANSWERED by MXF12: Seth asked for the
     preview's any-direction drag + pixel exit, and for the bar to return
     after resuming. Sideways-only (Nov 9) is superseded. Reopen only if
     the phone smoke says the drag feels wrong (numbers: `TETHER_PX`,
     `ARM_PX` in `lib/swipeDismiss.js`).
   - Seth asked for a polish pass over ALL the new animations; only
     "polish 1" is done (shared landing flash + sparks, bar rise-in). Not
     yet revisited: the crown intro itself, login arrival, crown rain,
     error shake. Ask him what he wants pushed further before spending.
   - Never exercised: the coach bar's scatter, the boot intro's slow-server
     loop + "Taking longer..." text, a real touch drag (mouse only), any
     palette beyond champ/forest/iron/crimson spot checks.
   - Known and accepted: a drag starting on a bar no longer scrolls the
     page; the boot intro covers the app ~2 s on every cold open (tap
     skips); crown rain mounts (invisible) under reduced motion.
   - None of this has a What's New entry yet - add at the wave's What's
     New unit.
1. **Continue the MX wave** (opened Oct 9, see the top block):
   - next unit after 0 = the first non-DONE unit in `ROADMAP.md` (MX7
     logger floor, recommended to Seth Nov 9 - or MX5b / MX10 scenes if
     he picks those); write a broad brief (MX0/MX1-4/MX5-6 briefs are the
     pattern), dispatch on Fable 5.2 (named rung), land via `land-unit`.
     The old Fable 5.1 chat `eb56cfff...` can still be resumed for MX
     context, but a fresh 5.2 chat is fine - ROADMAP carries the state.
   - every wave ends with a What's New unit (`_WHATS_NEW.md`); release
     bullets stay at 25 words or fewer. The ledger has the MX section.
   - known lint noise from MX1-4 (lint is not in CI): Cascade.jsx `Tag`
     unused (JSX false positive) + mixed exports; useCountUp setState in
     effect - same patterns as pre-existing files.
   - legacy `.exercise-roster-stat*` rules in index.css are now unmatched
     (cleanup later); `--chart-up/down` live on `.analytics-page`
     (promote to `:root` when MX8/MX9 need them).
2. **Prod migration-history drift - reconcile under "migrate prod"
   before anyone points `prisma migrate deploy` at prod** (found Oct 9):
   - prod HAS the schema for `20260929120000_blocks_v2` and
     `20261006200000_block_exercise_per_side` (`BlockRun` exists,
     `perSide` exists) but NO `_prisma_migrations` rows for them; the
     Oct 7 note that their checksums were copied was wrong. Fix: insert the
     two rows with staging's checksums.
   - plus the older Sept 26 drift (Housekeeping).
   - the helper used for the coach migration (staging-checksum,
     prod-precheck, prod-apply, prod-verify, all through `pg` with the
     creds file) was session scratch; rebuild it the same way - the
     RUNBOOK section 3 ritual, one transaction, never print the URL.
3. **Gate follow-ups (not blockers, none authored):**
   - saved coach conversations have no per-user cap (bounded by the 40 per
     15 min coach limit and the hosted weekly cap)
   - the `/coach` 2 MB JSON parser runs before auth (same shape as
     `/block-templates/import`)
   - conversation paging cursors on `updatedAt` alone (a same-millisecond
     tie could skip a row)
   - `.bk-log-effort-slot` (`bk-log.css`) is an unused rule
   - carried: qol13 cold-server "Loading session" for logged-out visitors;
     qolf1 bar column matched by pathname; qolf1 ConfirmPanel focus ring on
     tap; qol11 `scripts/smoke-coach.mjs --key` inert; no rate limiter on
     `/block-templates/import*` or `/block-runs`; STOWED summary endpoint
     should exclude unfinished sessions (qolf7)
   - MXF6: `/coach/stop` counts against the app-level coach limiter; a
     dropped connection no longer aborts a hung provider stream (provider
     timeouts govern); early stops are held in memory (2 min, 1000 cap)

## Stowed (none authored)

- **Exercise search synonyms - HELD for Seth's own planned change (Oct 7).**
  The pure `searchCatalog` already AND-matches words. "single leg calf"
  misses on a SYNONYM gap ("single" vs "one"). Fold it into Seth's change
  (likely `server/data/exercise-aliases.json` + its rationale doc).
- **Swap an exercise for today on a block day** - PARKED by Seth.
- **Privacy page + ToS (BK0)** - DRAFT until Seth supplies the operator
  name, the contact email and the US state. **BK0's copy must change
  before it queues:**
  - qol10 STORES coach chat content, so the "records only who and when"
    claim is no longer true
  - qol11 makes "encrypted at rest" true for BYO keys
- **CP3** only if prod Render spins down when idle (QUEUE's CP2 notes).
- **CR2 polish** remains the live UI work order (REFERENCE "Still
  governing").
- **Gate note (Oct 7):** no rate limiter on `/block-templates/import*` or
  `/block-runs` (authed, DB-only).

## Open on prod - Seth's checks, none blocking

- **F/E-wave PROD smoke** - still open (the QOL and BK merges were
  smoked on prod Oct 9 / Oct 7 - done):

Covers the F-wave AND the still-open E-wave prod smoke. Staging passed Aug 4.

- **Login still works.** F0 added six selects to `sessionController`.
- Start a workout from a template with RIR on -> the RIR field appears untouched.
- Log a set with effort -> the signal control locks and says why; Finish enables
  once every core-logged set has a value. **Enter RIR 0 and confirm it counts as
  filled** - the highest-value case in the vocabulary.
- Open an OLD completed session -> nothing demanded retroactively.
- E-wave leftovers: the Analytics effort rationale line renders, legacy nudge
  reads correctly.

## Housekeeping

- **Staging Render tracks `motion-wave`** (probed Oct 11). Repoint it to
  each new wave branch. The STAGING WorkOS
  External Sign-in URI is pinned to the `ai-connector-wave` Vercel PREVIEW
  host - never delete `ai-connector-wave` (or its preview) while that URI
  points at it. If staging ever looks stale, check Render -> Settings ->
  Branch FIRST (Sept 29 lesson).
- **`quality-of-life-updates` = `main` + docs-only state commits** until
  they reach `main` with the next merge.
- **Git cleanup done Oct 7 (Seth's OK):** 112 merged local `cursor/*` and
  `gate/*` branches deleted (`git branch -d`, none refused); the merge
  worktree `merge-main-0927` removed. Old wave branches, `recon/*`,
  `parked/*`, `stash-preserve/*` and all REMOTE branches untouched.
- **Stale `.git/worktrees/merge-main`, `merge-main-0927`, `merge-main-1007` admin dirs**
  (OneDrive lock): git prints `failed to delete ... Permission denied` on
  fetch/commit. Harmless; `git worktree prune` once the lock clears.
- **`claudefiledrop/` (untracked, keep):** holds Seth's Oct 10 smoke
  screenshots (`Screenshot_20261010-170614/-171027.png`). Three older
  tracked PNGs show as deleted - his call, unstaged.
- **Pre-wave migration drift** found in the Sept 26 prod-vs-staging diff, NOT
  from any recent wave and not blocking (prod's build never runs `migrate
  deploy`): checksums differ on `20260325143000_block_weeks` and
  `20260707130000_add_exercise_fk_linkage`; staging alone carries a stray
  `20260527120000_add_exercise_catalog` row and a DUPLICATE
  `20260707120000_add_exercise_catalog` row. Reconcile before anyone ever
  points `migrate deploy` at prod.

## Repo / deploy state (Oct 9, night - verify from the services)

- **`main` = `b82ad8c`.** Prod Render `workout-db-l3gc` and prod Vercel
  `https://workout-db-psi.vercel.app` serve it - probed Oct 9:
  `/coach/conversations`, `/coach/status`,
  `/sessions/:id/last-performance` and `/block-runs/active` all 401;
  bundle `index-d4dwyLkk.js` holds the QOL release and the setup bar. Any
  push to `main` is prod-bound (gate 2).
- **Prod DB migrations:** `add_ai_consent` (Sept 26), `CoachUsage` +
  `WorkoutSession.reopenedAt` (Sept 27), `blocks_v2` +
  `block_exercise_per_side` (Oct 7, by Seth - schema present, history rows
  MISSING, see PICK UP HERE item 2), `coach_key_and_history` (Oct 9, by
  Claude Code under "migrate prod": SQL + `_prisma_migrations` row with
  staging's checksum `e7370e9e...dc64e` in one transaction, verified).
  Prod's build never migrates.
- **Prod migrations are trigger-phrase tier since Oct 9** (AGENTS.md gate
  3): "migrate prod", one command at a time, Seth approves each. The
  write-capable URL is in `C:\dev\secrets\prod-db.env` (bare URL, owner
  role, pooled host - strip `-pooler` for the direct host); the prod
  `COACH_KEY_SECRET` value is `C:\dev\secrets\coach-key-secret.txt`.
  Read both only at run time; never print them.
- **Staging DB** has the same plus everything via Render's `migrate deploy`
  (a staging Render DEPLOY is also a staging MIGRATION).
- Stable topology (prod env, WorkOS, verify-from-services, branch-deletion
  cautions): REFERENCE -> "Deploy topology".

## Lanes + verification (Nov 9)

- `cursor-lane` on `cursor/mxf11` @ `1bf3ee7` (Nov 9), `-2` on
  `cursor/mxf7` @ `fec6d06`, `-3` on `cursor/qol-gate-r3` @ `ac40874`; all
  porcelain clean, no DELIVERY.md (moved to session scratch).
  Before a dispatch: `git checkout -B cursor/<unit> <wave-branch>`. Lane 2's
  `server` has its own install WITH `@cursor/sdk` (live coach calls); lane
  3's `node_modules` are junctions into lane 1; lane 3 holds three
  untracked mock PNGs in `client/src/assets/scenes/` - never stage them.
  Lessons: REFERENCE.
- **Simpler recipe used Nov 9** (MXF9-11): the MAIN tree's API from
  `server/` with `COACH_PROVIDER=mock PORT=3001 CLIENT_ORIGIN=
  http://localhost:5174` set in the PowerShell session, then `Start-Process
  node src/server.js` (child inherits env; passing `$env:` inside a
  `-Command` string broke and the client fell back to PROD - kill it at
  once if that happens); lane client `VITE_API_URL=http://localhost:3001`
  via `Start-Process npx.cmd vite --port 5174`. Log in with a fetch to
  `/auth/login` from the page. CORS refuses any origin not in
  CLIENT_ORIGIN. Synthetic touch `PointerEvent`s drive swipe checks.
- **Real-app check recipe** (MXF6/7): the LANE's API on the STAGING DB -
  from the lane's `server/`: `DOTENV_CONFIG_PATH=<main tree>/server/.env
  COACH_PROVIDER=mock PORT=3001 CLIENT_ORIGIN=http://localhost:5174,
  http://localhost:5175 node -r dotenv/config src/server.js`; lane clients
  with `VITE_API_URL=http://localhost:3001 npx vite --port 5174`
  (`client/.env` = PROD - never use it); Playwright MCP 390x844. The coach
  limiter (40 / 15 min, ALL `/coach` paths, in memory) trips in testing -
  restart the API. Stop all servers after.
- **Staging accounts:** `test123` / `password` (Seth's smoke account -
  READ-ONLY for agents; running "Imported block" run 8 with W1 D1 in
  progress, "Upper/Lower Strength - 4wk" paused at W1 · Lower A) and
  `demo.critic@example.com` / `CriticDemo!2026` (writable; running "Phase 1"
  run 3, W1 · Day 3 next, no custom exercises - leave it that way).

## Seth items (decisions, not work)

- Still open:
  - **BOOKMARKED for discussion (Oct 9):** which button the "N sets have no
    RIR" finish sheet focuses by default. It stays "Finish anyway" for now;
    critic r2 #10 suggested "Add RIR".
  - the R6 tagline pick (a one-line `AuthLayout.jsx` swap)
  - FP8 icon PNGs (drop them into `claudefiledrop/`)
  - the Cursor model-routing question
  - the `docs/parked/*` ruling
  - BK0's open facts (operator name, contact email, US state)
- Settled Oct 8, recorded in the wave spec section 1: connector hardening
  (in), BYO-key design (server-encrypted), coach history (kept until
  deleted; History > Coach since MXC1).

> **Standing rule:** the Next action line is filled on EVERY rewrite and is
> never empty or deferred - one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** November 9, 2026 (Opus seat). Session log (Nov 9; the Oct
10-11 log is in the archive):
- Nov 9 (Opus seat): Seth's smoke - MXF8 passes; coach box still cut off
  (shot without the readout; asked again for `/coach?kbdebug=1`, no third
  guess shipped). His ask: exercise detail inline under the tapped row ->
  MXF9 authored (`9757e26`), dispatched auto rung (run 1 reaped by low
  memory, resumed same chat), landed `78a4cd6` with 3 reviewer fixes +
  real-app check (QUEUE has the audit). What's New mxf9 added.
- Nov 9: Seth sent the kbdebug shot. Chrome's virtualKeyboard rect is off
  by the nav strip under edge-to-edge (461 vs ~425). MXF10 `f5826af`
  (direct): /coach drops viewport-fit=cover in Chromium. PICK UP HERE 0
  is superseded by this unless his re-smoke still misses.
- Nov 9: Seth re-smoked - MXF9 + MXF10 pass. IDEAS 16 promoted with his
  rulings (asked: sideways only, hide until next app open with X staying
  discard, coach bar returns once as answered, this wave) -> MXF11
  authored `cbace35`, Fable 5.1 named rung, landed `1bf3ee7` clean (no
  reviewer fixes; real-app check in QUEUE). Fable 5.2 appeared on the
  CLI mid-run. Corrected in chat: the wave is NOT near its end - ROADMAP
  MX7-MX16 remain; next unit is Seth's pick.
- Nov 9, end: Seth on MXF11 - "it definitely works in the barest sense";
  asked to update HANDOFF and hand off to another agent. No feel
  specifics given -> PICK UP HERE 0 asks him first. Aged log + closed
  coach-keyboard item archived verbatim; lane DELIVERY.md to scratch.

**Rule:** rewritten in place at the end of every working session; kept CAPPED
(~300 lines). Aged session logs move VERBATIM - never summarized - to
`docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated, never
versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy
state from ground truth before trusting it.
