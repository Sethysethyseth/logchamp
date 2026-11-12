# DELIVERY — ar-fid: Arena prototype fidelity audit

STATUS: complete (REPORT ONLY)
MODEL: auto
MODE: 1-relay

## Files touched

- none (report only). This file (`DELIVERY.md`) is the deliverable; it is gitignored.

## Lanes run

- none allowed by the block (report only; no unit/integration/client build required).

## Scope

Side-by-side of `docs/design/mocks/motion/arena-draft-2.html` (script = spec) vs the app Arena in `client/src/components/arena/`, `client/src/lib/arenaSheet.js`, `arenaTour.js`, `arenaPref.js`, and `client/src/components/Layout.jsx`.

Groups: (a) room drawing, (b) sizes and motion, (c) boards / strip / peek, (d) sheet skin, (e) behaviour prototype has and app lacks.

Known open-size height inversion (prototype `PLACES[..].sheet` = sheet share; app used those numbers as room/`svh`) is listed once under (b) and not dwelled on — another lane is fixing it.

---

## (a) The room's drawing

### Shared skeleton (close ports)

Platform slab/ramp, bar + plates, twin towers, scoreboard shell + posts + crown, far stands + Log, near stands tiers, coach chalkboard/stool/bottle, rack plate-tree + dumbbell shelves + program board frame, lockers + bench + three banners — geometry in the app largely matches the prototype draw block (html ~507–596 vs `arenaEngine.js` ~265–424). Lighting field, Bayer dither, and crown/font glyphs are the same idea.

### Place-by-place element diffs

| Element | Prototype | App | Notes |
| --- | --- | --- | --- |
| **Platform / bar / plates** | html 527–532: plates `1 + floor(done()/2)` | `arenaEngine.js` 294–303: plates `1 + floor(sets/3)` | Same silhouette; plate count ramps slower in the app. |
| **Towers** | html 533–536: left on when `power > 0.62`, right when `lit` (>0.85) | `arenaEngine.js` 305–310: both wait for `towerAt[]` timestamps after live start, and require `lit` | App stages left→right on start; prototype thresholds on power only. |
| **Scoreboard rise** | html 538–539: `by = 82 - round(10*b)` | `arenaEngine.js` 314–318: `by = 82 - round(4*b)` | App barely rises (comment: keep board in Analytics frame). |
| **Scoreboard open face** | html 542–548: four Analytics views (muscles / E1RM sparkline / lifts / ON PLAN 92) | `arenaEngine.js` 324–332: only `SETS` / `8 WK` bar chart from `s.bars` | Multi-view board not ported. |
| **Scoreboard closed face** | html 549–558: REST / live clock / SAVED / LOG CHAMP / analytics headline / **five** `WEEK_FACES` | `arenaEngine.js` 333–352: REST / live / SAVED / LOG CHAMP / static `7 DAYS` + sets; week lamps from real `week.days` | No TOP SET / TOP GAIN / RECORDS cycle on the room board. |
| **Far stands + Log** | html 507–514, 474–487 | `arenaEngine.js` 265–279, 211–235 | Match (cheer wave, blink, overhead bar). |
| **Near stands (History)** | html 515–525: hash “crowd” dots per tier; this-visit seats only on front row `80 - i*4`; blinking history cursor | `arenaEngine.js` 66–71, 281–288: no hash crowd; `SEATS` fills every precomputed seat across 22 tiers from lifetime `seats` | Stands look different: random crowd vs progressive seat lamps; no selected-seat blinker. |
| **Floor line** | html 526: `px(-5, FLOOR, …, 520, 1)` | `arenaEngine.js` 290–292: long floor `-400…1400` + `thudUntil` flash under platform | Thud is app-only. |
| **Chalkboard** | html 560–567: dynamic `s.chalk`, thinking dots, fine print only if `chalk.length < 3` | `arenaEngine.js` 355–363: always `ASK ME` / `ANYTHING`; fine print whenever `zz > 2.2` | No coach answer text / thinking animation on the board. |
| **Rack / program board** | html 568–580: `BLOCK W{n}`; cells filled / today-blink from `blockDone` | `arenaEngine.js` 369–393: label `PROGRAMS`; all 6×3 cells empty `RAMP[3]` | Block progress not drawn. |
| **Lockers** | html 581–588: locker `#1` + zoomed `"1"` | `arenaEngine.js` 395–408 | Match. |
| **Banners** | html 590–596: first always earned (crown); `100` / `1K` labels unearned | `arenaEngine.js` 413–424: earned by `seats >= 1/100/1000`; earned-with-label paints the number bright; first may show `"1"` text path | Thresholds differ from prototype’s hard-coded first-earned. |

---

## (b) Sizes and motion

### World size, place spacing, pixel scale, camera

| Topic | Prototype | App |
| --- | --- | --- |
| World / floor | `W=100`, `H=178`, `FLOOR=150` (html 349); floor span ~520 | Same `FLOOR=150`; canvas `W/H` from CSS ÷ scale (`arenaEngine.js` 702–712); floor line much longer |
| Place X meaning | `PLACES.x` = **camera left** (html 378–385, 443): history 0, home 100, coach 200, library 300, profile 400 → centres ~50 / 150 / 250 / 350 / 450 | `ARENA_PLACES.x` = **centre** (`arenaEngine.js` 52–58): 46 / 150 / 254 / 358 / 450; `targetX` = centre − W/2 (199–202) |
| Spacing | Even 100-unit steps between place left-edges | History/coach/library centres nudged (46 / 254 / 358 vs 50 / 250 / 350) |
| Phone pixel scale | Fixed bitmap 100×178 stretched into phone (html 319, 349) ≈ ~3.4 CSS px/px on a 340-wide mock | Phone: **4 CSS px per pixel** (`arenaEngine.js` 706); wide: ~190 rows for full view |
| Camera Y | Fixed target `y: 3` (html 443) | `cam.y = FLOOR + FLOOR_MARGIN - H` = `157 - H` (`arenaEngine.js` 712); full-view framing tied to `--arena-room-h` |
| Zoom framing | `sh = H*(1-TOUR)`; focus blend (html 491–493) | `zoomView` in `arenaSheet.js` 55–62; zoom 3 (`ARENA_ZOOM`) |

### Fold / open / strip / scroll / coach / library

| Topic | Prototype | App |
| --- | --- | --- |
| Size model | `sheetFrac()` = **sheet** share (html 433–440): `TOUR=0.135`, open = `PLACES[].sheet`, `FOLD=0.82`, library+`blockOpen` → 0.56 | `arenaSize` = **stage/room** `svh` (`arenaSheet.js` 12–26): tour ≈ full minus peek+nav; open `/` 42, `/analytics` 38, `/sessions` 34, `/templates` 30, `/profile` 28; else strip 18 |
| **Known height inversion** | e.g. home sheet 42% → room ~58% (html 380) | home open **42svh room** (`arenaSheet.js` 13) — sheet/room numbers swapped vs prototype; listed, not dwelled |
| Fold triggers | `foldDefault`: live+home OR coach with chat (434); `folded`: fold OR analytics advanced (435); typing `focusin` folds (1045–1047); grip toggles (972–976) | No `fold` flag. Coach / live logger / unknown routes → strip mode always (`arenaSheet.js` 25; `ArenaStage.jsx` `placeFor` 18–29). No grip. No input-focus fold. |
| Scroll ride | `syncScroll` raises sheet 1:1 with padding cancel (html 1037–1043); `--mq` strip reveal after 70% (893) | Window scroll + sticky spacer (`arena.css` 23–30; `stageRide` / `stripReveal` in `arenaSheet.js` 29–42; `ArenaStage.jsx` 87–112). Same 70% strip fade idea. |
| Start → fold | Hold room ~950ms then fold (html 991–992) | Live routes are strip-sized; `SETTLE_MS` 460 keeps drawing room until covered (`ArenaStage.jsx` 15, 108–110) |
| Finish → open | `finishNow` sets `fold=false` so room gets the moment (html 942) | Finish flashes / SAVED face (`ArenaStage.jsx` 403–405) but size stays on the live/strip route |
| Tour | Sheet 13.5%; peek + nav (html 433, 867–874, 898–899) | Stage fills `100svh - tour-gap`; peek button (`arena.css` 15–20, 124–148; `ArenaStage.jsx` 450–453) |
| Library block open | Taller sheet 0.56 (html 439) | not in the app — Library open size is fixed `/templates` 30svh |

### Carried motion / eggs

| Motion | Prototype | App |
| --- | --- | --- |
| Log cheer | `cheer` / `logChamp` (html 474–487, 1106, 1148) | `tapLog` / `logChamp` (`arenaEngine.js` 211–235, 673–683) — match |
| Crown rain | five taps → `s.rain` (html 946–950, 597–601) | `CrownEgg` → `sceneSignal("rain")` → `arena.rain` (`ArenaStage.jsx` 408–412; engine 426–433, 686–690); starts at visible top (`rainTop`) |
| Hold Start / lift | html 1050–1063, 529; ease in tick 646 | `sceneSignal("lift"|"drop")` → `hold` (`ArenaStage.jsx` 413–416; engine 297, 531–534, 693–700) + thud |
| Set flash | `flashUntil` on log (html 1016) | `SCENE_SIGNAL` kind `set` → `flash(220)` (`ArenaStage.jsx` 384–388) |
| Finish flash | 2000ms (html 941) | `flash(2000)` + SAVED 5s (`ArenaStage.jsx` 403–405) |
| Towers on start | via power ramp | timed `towerAt` (`arenaEngine.js` 633–636) |
| Crown coin flip | CSS `.crown-btn.flip` (html 205–206, 948) | Lives on page crown (`CrownEgg`), not arena mast — mast wordmark absent in app |

---

## (c) What the boards / strip / one-line summary say

### Room scoreboard (closed)

- Prototype cycles `WEEK_FACES` (html 401, 556): `7 DAYS/23 SETS`, `WORKOUTS/2`, `TOP SET/225X5`, `TOP GAIN/+15 LB`, `RECORDS/1`; analytics uses view headlines (555).
- App shows one face: `7 DAYS` + `{week.sets} SETS` (`arenaEngine.js` 334–335); no analytics closed headlines when `board` is low on Analytics (board eases open instead).

### Strip / marquee

| State | Prototype `marqueeLines` (html 606–616) + `drawMarquee` (618–628) | App `stripFace` / `drawStrip` (`arenaEngine.js` 438–489) |
| --- | --- | --- |
| Coach | live chalk lines, or thinking dots | always `ASK ME` / `ANYTHING` |
| Rest | REST + mm:ss + drain bar | same idea (`bar` fraction) |
| Live home | clock + `SET n` or `n OF total` (block) | clock + `SET n` only (no block “OF”) |
| SAVED | SAVED + name | SAVED + `ledText(name, 9)` |
| Cheer | (on room board; not a special marquee branch) | strip can show `LOG` / `CHAMP` while cheering |
| Home idle | five `WEEK_FACES`, period 4200ms; week lamps | two faces only (`7 DAYS`/`SETS`, `WORKOUTS`/`n`), `FACE_MS` 4200; lamps |
| Analytics | per-view pairs e.g. `BACK/22 SETS`, `E1RM 231/BENCH`, … | fixed `8 WEEKS` / total sets from bars |
| History | `HISTORY` / `19 WORKOUTS` | `HISTORY` / `{seats} WORKOUTS` |
| Library | `BLOCK Wn` / `n OF 18 DAYS` | falls through to `LOGCHAMP` / `""` (no library facet) |
| Profile | `STREAK` / `3 WEEKS` | same fallback `LOGCHAMP` |
| Layout | fixed 100×32; crown at (5,13); big type if len≤8 | strip sized to CSS; crown at `(4, SH/2-3)`; vertical centering block |

### Peek / one-line summary

| Place | Prototype `PEEK` (html 867–874) | App `peekLine` (`ArenaStage.jsx` 71–83) |
| --- | --- | --- |
| Home live | `In progress · {done} of {total} sets logged` | `In progress · {n} set(s) logged` (no “of total”) |
| Home idle | `Last 7 days: 2 workouts · 23 sets · next {day}` | `Last 7 days: {n} workout(s) · {m} set(s)` (no “next …”) |
| Analytics | `{View} · last {range} weeks · sets up 4…` | `Last 8 weeks: {n} set(s)` |
| History | `19 workouts · one lit seat each` | `{n} workout(s) · one lit seat each` |
| Coach | `The coach knows your block and your last sessions` | `Ask the coach anything` |
| Library | `Imported block · week n of 6 · …` | `Your workouts and blocks` |
| Profile | `3 week streak · 1 of 3 banners hung` | `{n} workout(s) logged` |

---

## (d) The sheet's own look (prototype skin not built in the app)

The app wraps the **existing** pages in `.arena-sheet` (`Layout.jsx` 40–45; `arena.css` 167–190): opaque `var(--color-bg)`, 2px accent-mix top border, 34×3 grip pseudo, tour min-height. It does **not** restyle page content to the draft’s squared panel system.

Prototype CSS that defines that skin (and is not mirrored as an Arena sheet design system in the app) — feed for the next unit:

**Tokens / type (html 8–21):** `--night`, `--panel`, `--panel-2`, `--line`, `--ink`, `--ink-2`, `--accent`, `--btn`, `--btn-ink`, `--display: "Chakra Petch"`, `--body: "Inter"`.

**Sheet chrome (64–76, 180–181):** `.sheet` height/`--sheet`, panel fill, 2px accent border-top; `.grip` + `::before` pill; `.body` padding/gap; `.peek` 10px secondary line.

**Squared panels / lists (77–105, 114–175):** `.card`, `.list button`, `.seg`, `.tiles`, `.set` / `.row` grids with square inputs (`border-radius: 0` on inputs 115), `.panel`, `.day`, `.meter`, `.tbl`, `.setup`, `.ex` / `.ex-h` / `.ex-b`, `.warn`, `.bubble`, `.chips` pills, `.ask` composer.

**Draft-2 week + motion skin (207–233):** `.wk`, `.lamps`, `.stats4`, `.prrow`, `.chip-pr`, `.card.saved` + `.stamp`, glint/wash/tickin keyframes.

**Nav / mast (55–60, 104–106, 182):** `.mast` wordmark + place label; `.coach-btn` pill; `.nav` 5-col + sliding `i` accent bar; `.wbar` in-progress chip.

**Fold / strip coupling (186–192):** `#scene` bottom ride; `#marquee` 18% strip; `#wordmark` fades with `--mq`.

App counterpart is only the thin `.arena-sheet` / `.arena-peek` / `.arena-strip` chrome (`arena.css`); page UI stays the shipping LogChamp components.

---

## (e) Behaviour the prototype has and the app lacks

| Behaviour | Prototype | App |
| --- | --- | --- |
| Swipe arena to walk places | drag cam, snap to nearest `WALK` place (html 1134–1157) | **not in the app** — camera walks only when the route/`place` changes (`arenaEngine.js` 501–517; tabs via real nav) |
| Grip / manual fold override | html 972–976 | **not in the app** |
| Fold on typing | html 1045–1047 | **not in the app** |
| Analytics “advanced” forces fold | html 435, 997 | **not in the app** |
| Library block-open taller sheet | html 439, 995 | **not in the app** |
| Finish drops sheet for the moment | html 942 | **not in the app** (flash only) |
| History seat selection blinker | html 522–525 | **not in the app** |
| Dynamic chalk from coach answers | html 926–932, 564–565 | **not in the app** |
| Program board tracks block days | html 576–580 | **not in the app** (`PROGRAMS` empty) |
| Week faces TOP SET / TOP GAIN / RECORDS on board+strip | html 401, 556, 612 | **not in the app** |
| Mast wordmark + place label + coach pill on canvas | html 321–324, 904 | **not in the app** (pages keep their own chrome) |
| In-arena crown button (coin flip on canvas mast) | html 323, 946–950 | Crown egg is on the page; rain still lands in canvas |
| FONT glyphs `+` and `.` | html 361 | **not in the app** FONT (`arenaEngine.js` 40–48) |

Behaviours the app **does** carry: tour sticky across tabs until arena/peek tap (`arenaTour.js`); hold/pinch zoom 3×, pan, Log tap; scroll→strip reveal; live clock/rest/SAVED; set/finish flashes; lift; rain; reduced-motion cuts.

---

## Ranked top ten (what a person notices first on a phone)

1. **Open stage heights feel wrong / inverted** — home/analytics/etc. room share uses the prototype’s *sheet* fractions as *room* `svh` (`arenaSheet.js` 12–17 vs html 378–385). Biggest first-impression size miss (known; other lane).
2. **Coach (and live logging) jump straight to the strip** — prototype opens Coach tall then folds after chat (html 434–438); app Coach is always strip (`arenaSize` fallback + `placeFor`).
3. **Near stands read differently** — prototype hash crowd + few front-row seats (html 515–521) vs app lighting seats up the whole stand from lifetime workouts (`arenaEngine.js` 66–71, 288).
4. **Analytics board is a single SETS/8 WK chart** — prototype’s dropping multi-view board (html 542–548) never arrived (`arenaEngine.js` 324–332).
5. **Home strip/board week story is thinner** — missing TOP SET / TOP GAIN / RECORDS faces (html 401 vs engine strip 446–451 / board 334–335); “WORKOUTS” face still leads with the label (matches smoke polish note).
6. **Program board says PROGRAMS with empty cells** — prototype’s live `BLOCK Wn` grid (html 576–580 vs engine 392–393).
7. **Chalkboard never changes** — always ASK ME / ANYTHING; no thinking dots or answer chalk (html 564–565 vs engine 361–362).
8. **No swipe-to-walk the room** — prototype drag between places (html 1154–1157); app only walks on tab change.
9. **Sheet content still looks like today’s app** — not the draft’s squared Chakra/Inter panels (html 64–175 vs `arena.css` 167–190 only).
10. **Pixel scale / framing** — app’s 4 CSS px/px and full-view camera tied to `--arena-room-h` (`arenaEngine.js` 706–712) vs fixed 100×178 and `cam.y=3` (html 349, 443); reads as chunkier pixels and more empty dark above the room in full view (smoke polish note).

---

## Acceptance criteria

| Criterion | Evidence |
| --- | --- |
| `DELIVERY.md` at repo root with difference list in groups (a)–(e), every entry with prototype line # and app file:line (or “not in the app” / “not in the prototype”) | This file; tables above. |
| `git status --short` shows no tracked file modified | See verbatim output below. |

## Verbatim check

```
$ git status --short --untracked-files=all

```

(empty: no tracked modifications. `DELIVERY.md` is gitignored — `.gitignore:48:/DELIVERY.md`.)

## Deviations

- None from the block. Report only; no code or git operations.
- The known open-size height inversion is listed under (b) once per the block’s instruction.
