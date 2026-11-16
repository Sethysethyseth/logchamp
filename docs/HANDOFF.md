# HANDOFF — current state

> **Nov 16, 2026 (cloud session, post-merge spring cleaning).** No wave is
> open. Everything is on `main` and live on both Render services. This
> file was rewritten from scratch: the previous 530-line version (MX wave,
> ARENA wave, gate notes, Nov 9-16 session logs) moved VERBATIM to the top
> of `docs/HANDOFF-ARCHIVE.md`. Items still open were carried below.
> Same session, docs cleanup: QUEUE's "Active" heading now says the
> waves are merged, ROADMAP's AR table shows real statuses (AR6 closed by
> ruling), the master prompt carries a "superseded" banner plus inline
> corrections, README names LogChamp, and the `author-task-block` skill
> names the Opus seat. Dead CSS removed (`.exercise-roster-stat*`,
> `.bk-log-effort-slot`; lanes green: build, unit 587/587, check-hex).

**Next action (Seth):** smoke PROD on the phone. Log in, check that the
What's New pop-up shows once, open Appearance > Look (Arena | Classic),
drag sideways between tabs, pull the full view in and out, then log one
workout.

## Repo / deploy state (verified Nov 16 from the Render API)

- **`main` = `d5a9b9d`** (the merge `3a03bc5` plus the two post-merge
  direct builds `729f2b4`, `d5a9b9d`, plus this session's docs/CSS
  commits). Any push to `main` is prod-bound (gate 2).
- **Prod Render** `workout-db-l3gc` (srv-d7fsvlhj...): branch `main`,
  auto-deploy on, live on `d5a9b9d` (01:59Z). Build `npm install && npx
  prisma generate` - prod's build never migrates.
- **Staging Render** `workout-db-staging`: **repointed to `main`**, auto-deploy
  on, live on `d5a9b9d` (02:04Z). Its build runs `prisma migrate deploy`,
  so a staging deploy is also a staging migration. Repoint it to each new
  wave branch.
- **Prod Vercel** `https://workout-db-psi.vercel.app` builds from `main`
  (not probed this session).
- **No schema change** since `coach_key_and_history` (Oct 9). Prod DB
  migration history and drift: see "Prod migration-history drift" below.
- Remote branches: `main` + this session's `claude/*` branch only.
- Stable topology (prod env, WorkOS, verify-from-services): REFERENCE ->
  "Deploy topology".

## On main, NOT yet seen on a phone

From the Nov 15-16 sessions (detail in the archive, Nov 16 entry):
- Arena as the default on a fresh device; the What's New pop-up (prod only;
  staging shows it at `/profile/whats-new?preview=1`).
- Appearance "Look" = Arena | Classic (Light / Dark / System only under
  Classic). "Make your own" is hidden behind `SHOW_STUDIO = false` in
  `AppearancePage.jsx`. A saved custom palette still lists.
- Pull down at the top of an open page goes to the full view; push up
  returns. Short drags spring back, a flick decides, a tap still toggles.
  `overscroll-behavior-y: contain` on open + full-view pages, so there is
  no browser pull-to-refresh there.
- Drag sideways between tabs: the page follows 1:1, the next tab's outline
  rides in, and the room's camera follows (`motion/useTabSwipe.js`,
  `lib/tabSwipe.js`). Known: Analytics -> History walks the camera LEFT
  while the finger goes left (room layout, same as a tap).
- Analytics board: pixel body map (Muscles), a bar loaded plate by plate
  (Strength / Exercises).
- Crown loader as a rigid body (first synthetic touch after load never
  reached it in the rig, so check the first grab on a real phone), the
  stepped-M wordmark, the Finish gap fix, the fold carrying through a
  rail-only page, and crown throw.
- Lint (not in CI): only pre-existing errors (`arenaEngine.js` paintFace
  `bh`, `Cascade.jsx`, `RouteTransition.jsx` ref-in-render).

## PICK UP HERE (next session)

1. **Seth picks the next wave.** Nothing is authored. Candidates:
   - MX units still TODO in `docs/design/mocks/motion/ROADMAP.md`
     (MX5b, rest of MX7, MX8 PR moment, MX9, MX10 other palettes,
     MX11-MX16). Most were written before the Arena, so re-check each
     against it before authoring.
   - The Arena's unbuilt "room to grow" ideas (seats fill with history,
     plates match the last top set, milestone banners).
   - QUEUE "Candidates" (per-side L/R comparison analytics, A5B picker in
     builders, duplicate in-progress UI on Home, iOS login flash).
   - Small fixes offered Nov 10, NOT re-checked under the Arena: bottom
     nav highlights History while logging; exercise header truncates
     early; the logger's X means discard; exercise-notes box open by
     default; RPE helper repeated per set; two near-duplicate hint lines
     in the Finish dock.
   A wave needs Seth's go, a ROADMAP/spec section and Opus-authored blocks
   (`author-task-block`).
2. **Prod migration-history drift. Reconcile under "migrate prod" before
   anyone points `prisma migrate deploy` at prod** (found Oct 9):
   - prod HAS the schema for `20260929120000_blocks_v2` and
     `20261006200000_block_exercise_per_side` but NO `_prisma_migrations`
     rows for them. Fix: insert the two rows with staging's checksums.
   - older Sept 26 drift: checksums differ on `20260325143000_block_weeks`
     and `20260707130000_add_exercise_fk_linkage`; staging alone carries a
     stray `20260527120000_add_exercise_catalog` row and a DUPLICATE
     `20260707120000_add_exercise_catalog` row.
   - method: RUNBOOK section 3 ritual, one transaction, never print the URL
     (the Oct 9 helper was session scratch; rebuild it the same way).
3. **Follow-ups (not blockers, none authored):**
   - Arena: the folded strip is not keyboard-reachable (scrolling up
     reopens the room); login / signup pages look Classic (outside Layout).
   - saved coach conversations have no per-user cap (bounded by the 40 per
     15 min coach limit and the hosted weekly cap)
   - the `/coach` 2 MB JSON parser runs before auth (same shape as
     `/block-templates/import`)
   - conversation paging cursors on `updatedAt` alone (a same-millisecond
     tie could skip a row)
   - no rate limiter on `/block-templates/import*` or `/block-runs`
   - MXF6: `/coach/stop` counts against the app-level coach limiter; a
     dropped connection no longer aborts a hung provider stream; early
     stops are held in memory (2 min, 1000 cap)
   - carried: qol13 cold-server "Loading session" for logged-out visitors;
     qolf1 bar column matched by pathname; qolf1 ConfirmPanel focus ring on
     tap; qol11 `scripts/smoke-coach.mjs --key` inert; STOWED summary
     endpoint should exclude unfinished sessions (qolf7)
   - `--chart-up/down` live on `.analytics-page` (promote to `:root` if a
     later unit needs them)

## Open questions for Seth (decisions, not work)

- Coach answers: keep the crown on coach answers + the Analytics coach
  card, or the bubble everywhere?
- `/coach/status` and `/coach/stop` count against the coach limit. OK?
- Tapping outside the "still answering" sheet counts as Open anyway (the
  answer still saves). Fine?
- BOOKMARKED (Oct 9): which button the "N sets have no RIR" finish sheet
  focuses by default (stays "Finish anyway"; critic suggested "Add RIR").
- The R6 tagline pick (a one-line `AuthLayout.jsx` swap).
- FP8 icon PNGs (drop them into `claudefiledrop/`).
- The `docs/parked/*` ruling.
- BK0's open facts (operator name, contact email, US state).

## Stowed (none authored)

- **Exercise search synonyms - HELD for Seth's own planned change (Oct 7).**
  "single leg calf" misses on a SYNONYM gap ("single" vs "one"). Fold it
  into Seth's change (likely `server/data/exercise-aliases.json` + its
  rationale doc).
- **Swap an exercise for today on a block day** - PARKED by Seth.
- **Privacy page + ToS (BK0)** - DRAFT until Seth supplies the facts above.
  Its copy must change before it queues: qol10 STORES coach chat content
  (the "records only who and when" claim is no longer true); qol11 makes
  "encrypted at rest" true for BYO keys.
- **CP3** only if prod Render spins down when idle (QUEUE's CP2 notes).
- **CR2 polish** - REFERENCE "Still governing" names it the UI work order;
  much of it predates the MX + ARENA waves, so re-check before authoring.

## Open on prod - Seth's checks, none blocking

- **F/E-wave PROD smoke** (staging passed Aug 4): login works; start from a
  template with RIR on (field appears untouched); log a set with effort
  (signal control locks, Finish enables once every core-logged set has a
  value, **RIR 0 counts as filled**); an OLD completed session demands
  nothing retroactively; Analytics effort rationale line + legacy nudge.

## Housekeeping

- **Staging WorkOS External Sign-in URI** is pinned to the
  `ai-connector-wave` Vercel PREVIEW host - never delete that preview
  while the URI points at it. If staging ever looks stale, check Render ->
  Settings -> Branch FIRST.
- **Laptop-only:** stale `.git/worktrees/merge-main*` admin dirs (OneDrive
  lock) make git print `failed to delete ... Permission denied`. Harmless;
  `git worktree prune` once the lock clears.
- **`claudefiledrop/`** (tracked): `relay-dash.png`, `relay-working.png`
  and one Vercel analytics screenshot. Old smoke drops. Deleting them is
  Seth's call.

## Lanes + verification (last known Nov 9 - laptop lanes, verify before use)

- `cursor-lane`, `-2`, `-3` under `C:\dev\worktrees\`. Before a dispatch:
  `git checkout -B cursor/<unit> <wave-branch>`. Lane 2's `server` has
  its own install WITH `@cursor/sdk`; lane 3's `node_modules` are
  junctions into lane 1; lane 3 holds three untracked mock PNGs in
  `client/src/assets/scenes/` - never stage them. Lessons: REFERENCE.
- **Cloud sessions:** the smoke rig (`scripts/cloud-smoke-up.sh` +
  `scripts/smoke-rig.cjs`, REFERENCE "Cloud smoke rig") replaces the
  laptop recipes; lane worktree `/home/user/worktrees/cursor-lane`.
- **Laptop recipe (Nov 9):** the MAIN tree's API from `server/` with
  `COACH_PROVIDER=mock PORT=3001 CLIENT_ORIGIN=http://localhost:5174` set in
  the PowerShell session, then `Start-Process node src/server.js`; lane
  client `VITE_API_URL=http://localhost:3001` via `Start-Process npx.cmd
  vite --port 5174` (`client/.env` = PROD - never use it; if the client
  falls back to prod, kill it at once). The coach limiter (40 / 15 min,
  all `/coach` paths, in memory) trips in testing - restart the API.
- **Staging accounts:** `test123` / `password` (Seth's smoke account -
  READ-ONLY for agents) and `demo.critic@example.com` / `CriticDemo!2026`
  (writable; no custom exercises - leave it that way).

## Standing notes for the Opus seat

- **Fable is not a standing dependency.** Check `cursor-agent
  --list-models` before dispatch; quota refusal -> descend the ladder
  (`dispatch-unit` section 3) and log it in QUEUE. Without Fable the Opus
  seat draws design passes itself in the artifact; never fill a design
  gap with invented rules. Record who delivered (model + rung) in QUEUE.
- **Verification lesson:** a layout change is not checked until
  `documentElement.scrollWidth` equals the screen width under a PHONE
  device profile. Desktop-headless screenshots do not show an over-wide
  page.
- Every wave ends with a What's New unit (`docs/tasks/_WHATS_NEW.md`);
  release bullets stay at 25 words or fewer.

> **Standing rule:** the Next action line is filled on EVERY rewrite and is
> never empty or deferred - one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. `land-unit` section 5 keeps it maintained.

**Updated:** November 16, 2026 (cloud session). Session log:
- Nov 16 (post-merge): Seth: "everything is pushed to main, do some spring
  cleaning". Verified Render: prod + staging both on `main` @ `d5a9b9d`.
  HANDOFF rewritten (old one archived verbatim); stale state fixed in
  QUEUE, ROADMAP, REFERENCE, master prompt, README, author-task-block
  skill; dead CSS removed.

**Rule:** rewritten in place at the end of every working session; kept CAPPED
(~300 lines). Aged session logs move VERBATIM - never summarized - to
`docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated, never
versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy
state from ground truth before trusting it.
