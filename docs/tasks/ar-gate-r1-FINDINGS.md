# DELIVERY — ar-gate-r1: REPORT — is the Arena ready to be everyone's default?

STATUS: complete (REPORT LANE — zero repo edits beyond this file)
MODE: 1-relay report
BRANCH: `cursor/ar-gate-r1` (vs `origin/main`)

## Files touched

- `DELIVERY.md` (this report only)

## Lanes / tests

Report lane only — no code lanes, no `test:unit`, no client build.
Acceptance check after write:

```
$ git status --porcelain
(empty — no tracked/untracked edits)

$ git check-ignore -v DELIVERY.md
.gitignore:48:/DELIVERY.md	DELIVERY.md

$ git status --porcelain --ignored
!! DELIVERY.md
```

`DELIVERY.md` is gitignored by design (AGENTS.md). Working tree has no other changes; the only new file is this report.

## Acceptance criteria

| Criterion | Evidence |
|---|---|
| `git status --porcelain` shows only `DELIVERY.md` | Porcelain empty (file is ignored); `--ignored` shows only `!! DELIVERY.md`. No other edits. |
| Every finding has `file:line` | Sections 1–8 below. |
| Unverifiable claims marked UNVERIFIED | Called out inline (AR7 default flip not in tree; private-mode default semantics after AR7). |

## Deviations

None. REPORT LANE: no code edits, no git ops, no HANDOFF/QUEUE edits.

---

## 1. Surfaces outside the arena shell

### Routes not under `Layout`

| Surface | file:line | Under Layout? | `html[data-arena]` CSS applies? | Why |
|---|---|---|---|---|
| Auth shell | `App.jsx:52-56` | No (`AuthLayout`) | **No** | Layout never mounts → attribute never set |
| `/login` | `App.jsx:53` | No | **No** | Auth only |
| `/register` | `App.jsx:54` | No | **No** | Auth only |
| `/connector/login` | `App.jsx:55` | No | **No** | Auth only |
| Catch-all `*` | `App.jsx:236` | Redirect only | N/A | `<Navigate to="/" />` — no dedicated 404 page |
| `CrownIntroHost` | `App.jsx:50` | Outside Routes | **No** | Sibling of Routes; not Layout |

### Other surfaces

| Surface | file:line | Location | `data-arena` CSS? | Why |
|---|---|---|---|---|
| Onboarding (`HelloPage`) | `App.jsx:217-223` | **Inside** Layout | Yes *if* arena on | Protected route under Layout |
| Username modal | `ProtectedRoute.jsx:24-26` | Inside Layout outlet | Yes *if* arena on | Replaces children; Layout still mounts; `.card` matches arena-skin under `#root` |
| Auth / session loader | `ProtectedRoute.jsx:11-17` | Inside Layout | Yes *if* arena on | `.loading-state` skinned at `arena-skin.css:24` |
| WhatsNew gate | `Layout.jsx:50` | Inside Layout | Partial | Gate in Layout; portaled sheets stay Classic per `arena-skin.css:10` |
| Error boundary | — | **None found** | N/A | No `ErrorBoundary` / `componentDidCatch` in `client/src` |
| Dedicated 404 | — | **None** | N/A | Catch-all redirects home |

### CSS file applicability without Layout / without attribute

| File | Applies without Layout/`data-arena`? | Why |
|---|---|---|
| `arena-skin.css` | **No** | Every rule is `html[data-arena]…` (`arena-skin.css:14+`); loaded from `main.jsx:5` but inert |
| `arena.css` | Stage DOM only when Arena mounts; vars need attribute | Stage only when `Layout.jsx:39`; `html[data-arena]{…}` vars at `arena.css:17-25` |
| `index.css` | **Yes** | Global theme tokens / chrome always |

### When is `data-arena` set? Flash of Classic?

| Finding | file:line | Why |
|---|---|---|
| Pref default **off** today | `arenaPref.js:3-4,9-14` | `localStorage === "1"` only; else false |
| React read is sync | `arenaPref.js:36-37` | `useSyncExternalStore` → client can know arena on first React render |
| Attribute set **after paint** | `Layout.jsx:17-20` | `useEffect`, not `useLayoutEffect` |
| Cleanup removes attr | `Layout.jsx:19` | Leaving Layout (→ auth) clears `data-arena` |
| No boot script for arena | `index.html` / module entry | Theme uses layout effect; arena has no pre-paint boot |
| **Flash risk if Arena becomes default** | `Layout.jsx:17-20` + `arena-skin.css:14` | First paint can mount stage/sheet (`Layout.jsx:39-45`) while `html` lacks `data-arena` → skin/vars miss one frame → FOUC / flash of Classic card chrome |

Contrast: Classic-default today avoids Arena FOUC. Flipping default ON without a pre-paint `data-arena` boot is the readiness gap.

---

## 2. Light mode / palettes

### Fixed-dark vs token-reading

**`arena.css`** — no `#hex` / `rgba(` literals. Token reads:
- `arena.css:61` stage `background: var(--color-bg)`
- `arena.css:83,167` outline `var(--color-interactive)`
- `arena.css:155` peek `var(--color-text-secondary)`
- `arena.css:192-204` sheet `var(--color-bg)`, border `color-mix(… var(--color-interactive) …)`, handle `var(--color-border)`
- `arena.css:172-174` hides scene `body::after` under `html[data-arena]`

**`arena-skin.css`** — no fixed hex/rgba. All `var(--color-*)` / `var(--font-*)` / `color-mix` (e.g. lines 15, 27, 67, 222, 435, 567).

**`arenaEngine.js` — fixed dark mix targets + token interactive:**
- `arenaEngine.js:101-112` `readRamp()`: mixes `var(--color-interactive)` into hardcoded **`"black"`** (8 steps) and **`"white"`** (1 highlight) via `color-mix` + `getComputedStyle`
- Canvas fill uses that ramp only — no palette-specific branches

**`ArenaStage.jsx`:**
- No fixed canvas colours; CSS vars only
- Recolors on theme/palette: `ArenaStage.jsx:396-397` observes `data-theme`, `data-palette`, `style`

### What `data-theme="light"` sees

| Layer | Behavior | Why |
|---|---|---|
| Sheet / stage chrome | Light tokens (`--color-bg`, surfaces) | Stage/sheet use those vars |
| Pixel room | Still a **dark interactive-on-black ramp** | `readRamp` always mixes into `"black"` (`arenaEngine.js:109`) |
| Accent LEDs | One step mixed into `"white"` | `arenaEngine.js:110` |
| Overall | Light UI sheet + dark pixel art | No light-mode canvas path (AR6 not in this round) |

### Palettes `champ | iron | chill | forest | crimson | custom`

| Finding | file:line | Why |
|---|---|---|
| No arena palette-specific CSS | `arena-skin.css` / `arena.css` | Only shared tokens |
| Ramp follows `--color-interactive` | `arenaEngine.js:106-109` | Palette changes that token → ramp recolors via MutationObserver |
| Custom palette | Theme inline tokens + `ArenaStage.jsx:396-397` | Observes `style` and recolors |
| Verdict | Same structure all palettes | Hue shifts with interactive; not a distinct arena look per palette |

---

## 3. Desktop / wide screens (>= 900px)

**Note:** Shell/arena desktop breakpoint is **720px**, not 900. `900px` is profile hub only (`index.css:1892`).

| Behavior | file:line | Why |
|---|---|---|
| Phone: hide desktop Navbar | `index.css:890-892` | `@media (max-width: 719px)` `.app:has(.bottom-nav) .nav { display: none }` |
| Desktop: hide BottomNav | `index.css:884-887` | `@media (min-width: 720px) .bottom-nav { display: none }` |
| Navbar is desktop masthead | `Navbar.jsx:9-13` | Comment: hidden under 720 where BottomNav takes over |
| Arena measures nav height → `--arena-top` | `ArenaStage.jsx:188-190,382-390` | 0 when nav `display:none` (phone); desktop offset |
| Arena desktop tour gap | `arena.css:215-222` | `@media (min-width: 720px)` `--arena-tour-gap: var(--arena-peek-h)`; peek `bottom: 0` |
| Sheet min-height uses `--arena-top` | `arena.css:187-189` | Desktop navbar eats vertical room |
| Navbar.jsx itself | no media queries | Visibility is pure CSS in `index.css` |
| BottomNav arena live-Home highlight | `BottomNav.jsx:69-73` | Logic runs when arena on; bar hidden ≥720 so no visible effect |
| Phone-only finish dock lift | `index.css:4174-4182` | `@media (max-width: 719px)` sets `bottom: var(--finish-dock-bottom, …)` |
| ≥900 profile grid only | `index.css:1892` | Unrelated to arena stage |

**Wide-screen Arena summary:** top Navbar stays; BottomNav gone; stage sits under measured `--arena-top`; full-view peek sits at `bottom: 0`; no phone-only media on the stage itself beyond the 720 tour-gap rule.

---

## 4. Classic must still be whole

Diff base: `origin/main...HEAD -- client/src`. Layout-affecting changes on the named surfaces that are **not** gated by `data-arena` / `useArenaView()` / `[data-arena]`:

### `Layout.jsx`

| Change | file:line (HEAD) | Classic user sees |
|---|---|---|
| `CoachWorkingBar` always in page tree | `Layout.jsx:24` | Coach working chip can appear above pages with Arena off |
| Arena stage/sheet | `Layout.jsx:39-45` | Gated — Classic unchanged path `page` at `47` |

### `BottomNav.jsx`

| Change | file:line | Classic user sees |
|---|---|---|
| Sliding indicator + shared `NAV_SECTIONS` | `BottomNav.jsx:78-83` | Accent bar FLIPs between tabs (was per-item `::before`) |
| Tap icon pop | `BottomNav.jsx:94-101` | Icon remounts/pops on tap |
| Workout pip when bar dismissed | `BottomNav.jsx:65-66,112` | Accent pip on Home if live workout bar hidden |
| Live-logger forces Home active | `BottomNav.jsx:69-73,91` | **Arena-gated** — Classic unaffected |

### `Navbar.jsx`

| Change | file:line | Classic user sees |
|---|---|---|
| Auth-loading returns `null` | `Navbar.jsx:29` | No masthead during session resolve |
| Same 5 tabs as phone + SlidingIndicator | `Navbar.jsx:39-58` | Profile is a real tab; sliding active indicator |
| Flattened brand/links structure | `Navbar.jsx:32-38` | Layout chrome restructure (no arena gate) |

### `RouteTransition.jsx` (new)

| Change | file:line | Classic user sees |
|---|---|---|
| Wraps all Layout pages | `App.jsx:62`, `RouteTransition.jsx:50-193` | Shared-axis slide / View Transitions / WAAPI enter on every nav |
| Arena scroll/fade branches | `RouteTransition.jsx:85-99,116` | Gated on `data-arena` — Classic gets normal push-to-top + axis slide |

### `SessionDetailPage.jsx` + Finish dock

| Change | file:line | Classic user sees |
|---|---|---|
| Finish dock measures `.bottom-nav` → `--finish-dock-bottom` | `SessionDetailPage.jsx:2730-2746`, `4993-4995` | Dock sits flush on measured nav height (all live sessions) |
| CSS uses that var on phones | `index.css:4174-4181` | **Unscoped** phone dock `bottom` — Classic layout change |
| Logger layout persisted (`LOGGER_LAYOUT_KEY`) | `SessionDetailPage.jsx:2690-2704` | Builder/table choice sticks across workouts |
| `logger--settled` delayed class | `SessionDetailPage.jsx:2757-2763` | Enter motion after ~700ms on Classic logger |
| `session-detail-page--arena`, in-flow Finish, tally, strip rest | `4399-4405`, `5002-5010`, `arena-skin.css:178-193` | **Arena-gated** — Classic keeps fixed Finish dock + dock-mounted rest |

### Related unscoped chrome

| Change | file:line | Classic user sees |
|---|---|---|
| Bottom-nav indicator CSS rewrite | `index.css` (~794-836 region in branch) | Active tab uses `.mx-slide-ind` instead of item `::before` |

**Verdict:** Classic is not untouched. CoachWorkingBar, RouteTransition, BottomNav/Navbar motion, Finish-dock measurement + phone CSS, logger settled/layout persistence all hit Classic without `data-arena`.

---

## 5. First-run and empty states under Arena

Brand-new account, zero workouts — what draws:

| Surface | file:line | What a brand-new account gets |
|---|---|---|
| Room facts | `ArenaStage.jsx:85-106` | `days`/`bars` all zeros, `seats=0`, `crowd` = 11 zeros |
| Home week faces | `arenaBoards.js:350-351` + engine week faces | `{ l1:"7 DAYS", l2:"0 SETS" }` fallback |
| Analytics board | `arenaBoards.js:106-108` | `analyticsFaces` → null → engine draws **zero-height weekly SETS bars** (`arenaEngine.js:595-608`) |
| History board | `arenaBoards.js:329-331` | `"WORKOUTS"` / `"0"` |
| History stands | `arenaEngine.js:532-545` | All empty seats (`fans\|\|0`, no stood fan) |
| Library board (no publish) | `arenaBoards.js:338-339` | `workouts: null` → `"LIBRARY"` + **empty `l2`** |
| Library rack | `arenaEngine.js:656-659` | No block → `"PROGRAMS"` + dark placeholder cells |
| Profile board | `arenaBoards.js:342-348` | `"PROFILE"` / `"0 WORKOUTS"` |
| Banners | `arenaBoards.js:254-260` | All `earned:false` at `w=0` |
| Coach chalk | `arenaBoards.js:323-324` | `"ASK ME"` / `"ANYTHING"` |
| Peek line (Home) | `ArenaStage.jsx:138-139` | `"Last 7 days: 0 workouts · 0 sets"` |
| `arenaFacts` | `arenaFacts.js:7,23-25,41-45` | In-memory `{}` until pages publish; stage resets on mount |

### Guards present

| Guard | file:line | Why |
|---|---|---|
| `list()` coerces non-arrays | `arenaBoards.js:21` | Avoids iterating `undefined` |
| `finishedAt` NaN → null | `arenaBoards.js:22-25` | Bad dates never seat |
| `executionFace` skips `/0` | `arenaBoards.js:97-99` | `if (!paired) return … pct:null` |
| `peak = Math.max(1, …bars)` | `arenaEngine.js:600` | Zero sets → peak 1, heights 0 |
| `programBoard` `Math.max(1, weeks/days)` | `arenaEngine.js:435-436` | Avoids `/0` on empty cells |
| Rest bar only if `durationSec > 0` | `arenaBoards.js:368-369` | No `/0` on rest face |
| `sessions \|\| []` | `ArenaStage.jsx:92` | Null session list safe |
| `crowd[i] \|\| 0` | `arenaEngine.js:539` | Initial empty crowd still draws empty seats |

### Guards absent / latent

| Issue | file:line | Why |
|---|---|---|
| `72 / bars.length` if `bars=[]` | `arenaEngine.js:601` | Normal path seeds 8 zeros; empty array → `Infinity` slot — **latent** |
| `1 - left / s.rest.durationMs` | `arenaEngine.js:774` | No `durationMs > 0` check (face path has it); `durationMs===0` → `Infinity` — **latent** |
| Library `l2: ""` until Library publishes | `arenaBoards.js:339` | First-run Library second line blank vs History/Profile `"0 WORKOUTS"` |

**Verdict:** Zero-workout path is largely guarded and draws intentional empties. Sharpest first-run UX hole is Library empty second line; crash risk is low.

---

## 6. Storage keys added on this branch

Compared to `origin/main` (`git grep` — only `workoutdb-home-has-run` existed on main among these). **Not new:** `workoutdb-home-has-run`.

| Key | File | On throw (private mode) |
|---|---|---|
| `workoutdb-arena` | `arenaPref.js:5,10-13,18-22` | Read → `false` (Arena **off**); write → silent, switch does not stick |
| `workoutdb-workout-bar-hidden` | `workoutBarHidden.js:6,10-15,28-32` | Read → `null`; write ignored; **in-memory id still used** |
| `workoutdb-weekly-mode` | `WeeklyReport.jsx` (`WEEKLY_MODE_KEY`) | Read → `"compact"`; write ignored |
| `workoutdb-coach-keeps-working` | `CoachLeaveNote.jsx:3,10-13,18-21` | Read throw → **`true` (treated as seen)** — note never shown; write ignored |
| `workoutdb-coach-active-id` | `CoachSessionContext.jsx:13,20-28,33-37` | Read → `null`; write ignored |
| `workoutdb-coach-pending` | `CoachSessionContext.jsx:14,42-56,61-64,91-94` | Read → `null`; write/remove ignored |
| `workoutdb-logger-layout` | `SessionDetailPage.jsx:2690-2702` | Read → `"builder"`; write ignored |
| `workoutdb-history-side` | `SessionsPage.jsx` (`HISTORY_SIDE_KEY`) | Read → `"workouts"`; write ignored |

All listed new keys wrap storage in `try/catch`. **No uncaught storage throws** on these paths.

**Arena-as-default implication:** Today private mode forces Arena **off** (`arenaPref.js:12`). When AR7 flips default ON, that catch semantics must change or private-mode users stay on Classic forever — **UNVERIFIED** until AR7 lands (not in this tree).

---

## 7. Performance guards (`requestAnimationFrame`)

### `client/src/components/arena/`

| Loop | file:line | Stops when | Gaps |
|---|---|---|---|
| Main `frame` | `arenaEngine.js:728-807` | No reschedule unless `walk.dur \|\| easing \|\| flashing \|\| moving`; `moving` requires `visible && !reduced` (`756,795-803`); `destroy` cancels (`1010-1016`) | While `document.hidden`, mid-walk/ease can still schedule briefly; live `setInterval` clock (`863-870`) still `kick()`s every 1s when live/saved |
| `kick` → one frame | `arenaEngine.js:826-827` | Single shot unless frame reschedules | OK |
| Visibility resume | `ArenaStage.jsx:399-401` | `visibilitychange` → `arena.set({})` → kick | OK |
| Reduced motion | `arenaEngine.js:736-741,756-757,768` | Snaps cam/zoom/lift; no cheer/rain motion frames | OK |

**No unbounded arena rAF with zero stop condition.** At-rest home uses **timers** (`syncClock` / `FACE_MS`, `syncDots`, `syncBlink`), not continuous rAF (`810-811` comment).

### `client/src/components/motion/`

| Loop | file:line | Stops when | Gaps |
|---|---|---|---|
| `crownIntroEngine` `frame` | `crownIntroEngine.js:565,589` | Phase → `finish()` / `stop()` cancel (`568-571,599-601`); reduced skips whole intro | **No `document.hidden` pause** — runs full intro while tab backgrounded |
| `pixelScatter` burst | `pixelScatter.js:231-234` | Stops when `alive===0` | No hidden-tab pause; short-lived |
| `createShedder` | `pixelScatter.js:268,306-308,311-316` | Stops when `parts` empty; `stop()` cancels | No hidden-tab pause |
| `useCrownThrow` `fly` | `useCrownThrow.js:65,118` | Exits screen → timeout reset; cleanup `reset()`; reduced → no bind | No `document.hidden` pause mid-flight |
| `RouteTransition` double rAF | `RouteTransition.jsx:115` | One-shot snap cleanup | OK |
| `SlidingIndicator` | `SlidingIndicator.jsx:60-61` | One-shot + cancel on cleanup | OK |

**Flagged:** `crownIntroEngine.js` is the only continuous loop with **no hidden-tab stop** (only complete/unmount). Arena main loop is gated; motion bursts are finite but ignore visibility.

---

## 8. Accessibility

| Finding | file:line | Why |
|---|---|---|
| Stage canvas hidden from AT | `ArenaStage.jsx:702` | `aria-hidden="true"` on room canvas |
| Stage control labelled | `ArenaStage.jsx:686-691` | Wrapping `<button aria-label="Full view of the arena" aria-pressed={tour}>` |
| Folded strip clickable but AT-invisible | `ArenaStage.jsx:707` + `arena.css:111-129` | `<canvas class="arena-strip" aria-hidden="true" onClick=…>` — when `--full`, `pointer-events:auto`, **not focusable, no name** |
| Peek exit control named | `ArenaStage.jsx:709-711` | `<button>` text = peek sentence |
| Probes decorative | `ArenaStage.jsx:704-705` | `aria-hidden` |
| Focus ring exists | `arena.css:82-85,166-168` | `:focus-visible` on stage + peek |
| No unnamed focusable **inside** stage button | `ArenaStage.jsx:686-702` | Only hidden canvas child — OK |
| Real gap: folded → open | `ArenaStage.jsx:707` | After fold, strip is the reopen affordance; **keyboard/SR users cannot activate it** |

---

## Top 10 — most likely to hurt a real user first (Arena as default)

1. **Folded strip not accessible** — `ArenaStage.jsx:707` — After scroll-fold, only path back to full view is an `aria-hidden` canvas click; keyboard/SR users stuck under the rail.
2. **`data-arena` set post-paint** — `Layout.jsx:17-20` — If Arena is default ON, first paint can flash Classic sheet chrome before the attribute lands (FOUC).
3. **Private mode keeps Arena off (today's pref)** — `arenaPref.js:10-13` — Storage throw → `false`; as default ships, Safari private / blocked storage users may never get Arena (or never stick opt-out) unless AR7 redesigns the default — **UNVERIFIED AR7**.
4. **Light sheet + dark room** — `arenaEngine.js:109` — `data-theme="light"` users get a light UI over a permanently dark pixel arena (AR6 not shipped); reads as unfinished / broken theme for some.
5. **New-user empty Library board line** — `arenaBoards.js:339` — `"LIBRARY"` with blank second line until Library publishes count; looks broken vs History/Profile `"0 WORKOUTS"`.
6. **First-run visual emptiness without non-canvas copy** — `ArenaStage.jsx:138-139`, empty stands — Empty stands + `"0 sets"` is intentional but easy to read as "Arena broken" for day-one users; peek helps only when tour open.
7. **Coach leave-note never shows in private mode** — `CoachLeaveNote.jsx:12-13` — Catch returns `true` (seen); first-run coach tip skipped.
8. **Login crown intro rAF ignores hidden tab** — `crownIntroEngine.js:565` — Backgrounded login still burns frames until dissolve.
9. **Live-workout 1s timer wakes frames while hidden** — `arenaEngine.js:863-870` + `804` — Tab backgrounded during a live session still `kick()`s every second.
10. **Classic Finish-dock measurement is unscoped** — `SessionDetailPage.jsx:2730-2746`, `index.css:4174-4181` — Arena-default work already changed Classic phone dock layout; if measurement fails (nav `display:none` on desktop / keyboard hide), Classic and Arena-off users keep last/fallback bottom — worth gate eyes.

---

## Compact readiness read (search, not judgment)

- Auth / Crown / redirect never get Arena skin; attribute only from Layout `useEffect` → **post-paint**.
- Light + all palettes: chrome is token-correct; canvas is always dark interactive-on-black.
- Desktop is **720px**, not 900; Arena accounts for top nav via `--arena-top`.
- Classic is **not** untouched (Finish dock measure, nav motion, RouteTransition, CoachWorkingBar, logger layout persistence).
- Zero-workout draw path is mostly guarded; a11y of the folded strip and storage/default semantics are the sharpest "everyone's default" tripwires.
