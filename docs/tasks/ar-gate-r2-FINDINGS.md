# DELIVERY — ar-gate-r2 (REPORT LANE)

## Files touched
- `DELIVERY.md` (this report only)

## Test output
REPORT lane — no unit/build lanes allowed. No commands beyond reading commits/files and `git status --porcelain` for the acceptance check.

```
(no test lane)
```

## Acceptance criteria

| Criterion | Evidence |
|---|---|
| `git status --porcelain` shows only `DELIVERY.md` | `DELIVERY.md` is gitignored (`/.gitignore:48`), so default porcelain is empty (no other dirty paths). `git status --porcelain --ignored` → `!! DELIVERY.md` only. |
| Every finding has `file:line` and a failure scenario | Ranked list below. |

## Method
Read commits `92531ff`, `bc6fa84`, `479363b`, `7c9edc6`, `e3292cc`, `88a9527`, `a6338da`, `f669edd` (`git show <sha> -- client/src`) and the **current** trees of every scope file listed in the block (later Arena commits changed some callers; defects are judged on current code).

---

## Ranked findings (most severe first)

### 1. P2 — Workout-saved face still moves under reduced motion
- **Where:** `client/src/styles/workout-saved.css:24-45` (face `transition` + `transform: translateY(...)`); stamp opacity transition at `:75-84`. Keyframe motion is gated at `:102`, but these transitions are **not**.
- **Failure:** OS/browser has `prefers-reduced-motion: reduce` → finish a workout → land on Home. File comment (`:6`) promises “faces swap, nothing travels.” Instead the idle/saved faces still slide (`translateY(±10px)`) and fade over 260–420ms, and the stamp fades in over 260ms.
- **Contrast:** Champ Arena live layer correctly clears its transition under reduce (`client/src/index.css:566-569`); this surface does not.

### 2. P2 — Crown intro overlay has no auto-unmount if the frame loop never finishes dissolve
- **Where:** `client/src/components/motion/CrownIntro.jsx:69-105` (engine lifecycle); `client/src/components/motion/crownIntroEngine.js:552-557`, `591-597` (dissolve / skip still require `requestAnimationFrame`); `client/src/components/motion/crownIntroStore.js:40-41` (1.2s timeout only resolves the **login navigation promise**, does not tear down the overlay).
- **Failure:** Boot or post-login intro is mounted (`z-index: 2000`, `touch-action: none` — `crown-intro.css:3-9`). If `rAF` never advances dissolve to `finish()` (frozen/broken compositor, or a stuck phase where `skip()` sets `dissolve` but no frame runs), the fixed overlay keeps swallowing every pointer. Tap-to-skip cannot help without a frame. Slow copy at 4s (`CrownIntro.jsx:101,117-120`) does not force `end()`.
- **Note:** Sync `startCrownIntro` throws are handled (`CrownIntro.jsx:93-98`). The gap is post-start stall. Marked with partial confidence on how often rAF dies in the wild — mechanism is in the code; frequency UNVERIFIED on device.

### 3. P3 — Shedder canvas can orphan on mid-drag unmount / `resetKey` reset
- **Where:** `createShedder` remove path `pixelScatter.js:268-271,311-317` (canvas removed only if `stopped === true`); hook cleanup `useSwipeDismiss.js:450-456` (`resetKey` nulls `gestureRef` without `shedder.stop()`); unmount cleanup `useSwipeDismiss.js:458-463` (clears timers only, no shedder/capture).
- **Failure:** Drag PersistentWorkoutBar or CoachWorkingBar past `ARM_PX` (shedding starts, `useSwipeDismiss.js:338-340`) → then either (a) coach answer lands and bumps `resetKey` (`CoachWorkingBar.jsx:166-169`), or (b) route change unmounts the bar mid-drag. `stop()` never runs → when pixels die, `step` hits the `parts.length === 0` branch with `stopped === false` and **leaves** the full-viewport canvas on `document.body` (`z-index: 1400`).
- **Impact:** pointer-events none (no input block); DOM/memory leak until next full navigation. Normal pointerup path does call `g.shedder?.stop()` (`useSwipeDismiss.js:389`).

### 4. P3 — Elapsed-time interval keeps ticking while the workout bar is not on screen
- **Where:** `client/src/components/workout/PersistentWorkoutBar.jsx:99-103`
- **Failure:** Active session exists but the component returns `null` (Home `/`, `/coach`, `/blocks/import`, or bar hidden via swipe — `:122-133`). The `setInterval(..., 15000)` still runs and `setNow`s whenever `activeSession` is set. Hidden tab or Home with a live session = wakeups for a clock that is not rendered.

### 5. P3 — Logger live clock interval ignores `document.hidden`
- **Where:** `client/src/components/workout/LoggerLiveStrip.jsx:19-22`
- **Failure:** Stay on a live logger, background the tab. `setInterval` at 1s keeps scheduling React updates while the tab is hidden (no visibility gate). Battery/CPU only; cleaned on unmount.

---

## Checklist areas — no defect (or intentional)

### Swipe-dismiss data loss
- **No defect:** Workout swipe only calls `setHiddenWorkoutBarId` (`PersistentWorkoutBar.jsx:82-85`); discard still requires the X + `ConfirmPanel` (`:188-220`). Coach swipe only sets `dismissed: true` (`CoachSessionContext.jsx:210-214`); thread/answer stay; a working dismiss is re-shown once as finished (`:207-209`).
- `pointercancel` → `springBack` (`useSwipeDismiss.js:419-432`).
- Multi-touch: non-primary ignored (`:271`).
- Drag that starts on Resume/X/Read: after axis lock, `onClickCapture` suppresses the click (`:435-446`); armed release hides the bar, does not discard.
- Drag during exit: `phase === "dismiss" || "gone"` ignores new downs (`:275`); scatter path goes `gone` synchronously (`:397-406`).

### Storage (in scope)
- **No defect:** Only in-scope storage helper is `workoutBarHidden.js:9-33` — reads/writes wrapped in `try/catch`; private-mode throw keeps in-memory id.

### Reduced motion (other surfaces in scope)
- Crown intro never mounts when reduce (`CrownIntro.jsx:20`, `crownIntroStore.js:32`).
- Crown play / loading coin / hand-off / resume-bar rise: all under `prefers-reduced-motion: no-preference` (`crown-play.css`).
- Logger floor animations gated (`logger-motion.css:110`).
- Champ Arena cheer keyframes gated; live on/off transition zeroed under reduce (`index.css:535-569`).
- Swipe recognition kept, motion skipped via `useReducedMotion` (`useSwipeDismiss.js`).
- **Exception:** finding #1 (workout-saved face transitions).

### Logged-out / error / loader hand-off
- Boot skipped without stored token / on connector (`CrownIntro.jsx:18-23`).
- 401 clears token and ends `authLoading` (`AuthContext.jsx:69-86`) → boot `isReady()` true → intro can settle; underneath `ProtectedRoute` sends `/login`.
- Loader → login: `noteLoaderCrown` / `stampLoaderCrown` / `takeLoaderCrown` with 500ms window and RM null-out (`crownIntroStore.js:61-79`; `LoadingState.jsx:205-210`; `AuthLayout.jsx:14-27`). If the page loader never became visible (`delayMs` 400), `from` is null → normal arrival, no hand-off. **No defect found** in that path.
- `playCrownIntro` 1.2s timeout prevents the **form** from waiting forever (`crownIntroStore.js:40-41`); overlay teardown is separate (finding #2).

### Tokens-only
- **No defect found** in scope CSS/JS outside `index.css`: no `#hex` / `rgb()` / `rgba()` / `hsl()` literals in crown-*, logger-motion, workout-saved, or the scoped components (colours via `var(...)` / `color-mix` / canvas token probe).

### Teardown that is correct
- Crown engine `stop()` cancels rAF + resize (`crownIntroEngine.js:599-603`); CrownIntro effect cleanup calls it.
- `scatterBar` self-removes canvas when pixels die (`pixelScatter.js:231-232`) — fire-and-forget by design.
- Coach bar observers/listeners removed on cleanup (`CoachWorkingBar.jsx:122-128,149-152`).
- `CrownEgg` rain timer cleared (`CrownEgg.jsx:32-35`); portal is `pointer-events: none`.
- `sceneCheer` replaces its timeout (`sceneSignal.js:36-44`); `setSceneLive(false)` on inactive (`ActiveSessionContext.jsx:90-91`).

### UNVERIFIED (could not confirm by reading alone)
- Whether any real mobile browser leaves `requestAnimationFrame` permanently dead while the page is still interactive (needed for finding #2 to strand a user who already tried to tap-skip).
- bfcache restore interaction with module-level `bootPlayed` / in-flight intro (no runtime pageshow trace in this pass).
- Private-mode behaviour beyond the `try/catch` shape (no WebKit private-mode run here).

---

## Deviations
None. REPORT lane only; no repo edits except this file; no git ops.

## `git status --porcelain` (acceptance)

```
# git status --porcelain --untracked-files=all
(empty — no tracked/untracked dirty paths)

# git status --porcelain --ignored DELIVERY.md
!! DELIVERY.md
```

No other files modified.
