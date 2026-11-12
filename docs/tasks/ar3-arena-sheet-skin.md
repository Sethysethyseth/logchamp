# TASK ar3: Arena - the page's skin under Arena view (squared panels, accent rules, display face)

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
ARENA wave unit AR3, after ar1 / ar2 / ar2f (all landed). Today, with
Arena view on, the room is the prototype's but the sheet under it is
still today's app: rounded, shadowed, filled cards in the body face. The
design of record, `docs/design/mocks/motion/arena-draft-2.html`, draws
the sheet as squared, outlined panels with accent-mixed rules, square
dark inputs, and the display face (Chakra Petch) on every title and
number. Its CSS is lines 8-21 (tokens), 64-105 and 110-175 (sheet,
panels, lists, set rows, logger), 207-233 (week card, saved card).
Recon of what differs is `docs/tasks/ar-fid-FINDINGS.md` group (d).
Seth ruled Nov 12: no extra notes, build from the prototype. Where the
app and the prototype differ and this block does not rule, the
prototype wins.

This is a judgment-heavy VISUAL unit: the prototype IS the spec. Open
the prototype in the browser beside the app at each step.

Everything here exists only under Arena view (Profile > Appearance >
"Arena view (beta)", which sets `html[data-arena]` - see
`client/src/components/Layout.jsx`). With the switch off the app must
render exactly as today.

FILES TO TOUCH:
- client/src/styles/arena-skin.css   (NEW - the whole skin, one file)
- client/src/main.jsx                (ONE added line: import the new
                                      stylesheet, after `./index.css`)
Do NOT modify anything outside these files. In particular: no JSX, no
`client/src/index.css`, nothing under `client/src/components/arena/`
(a parallel unit owns it), no new tokens. If a surface truly cannot be
reached from CSS on today's classes, leave it as today and list it in
DELIVERY.md.

CHANGE:
1. ONE STYLESHEET, FULLY SCOPED. Every selector in `arena-skin.css`
   starts with `html[data-arena]` (inside `@media` blocks too). No
   `@font-face`, no `@import`, no keyframes (the skin adds no motion).
   Chakra Petch is already loaded by `client/index.html` and named by the
   existing token `--font-display`; Inter is NOT loaded and must not be
   added - the body face stays `--font-sans`.
2. TOKEN MAPPING (prototype -> app; use ONLY existing tokens, never a
   literal colour):
   `--night` -> `--color-bg`; `--panel` -> `--color-surface-1`;
   `--panel-2` -> `--color-surface-2`; `--line` -> `--color-border`;
   `--ink` -> `--color-text`; `--ink-2` -> `--color-text-secondary`;
   `--accent` -> `--color-interactive` (text painted in the accent uses
   `--color-interactive-ink`); `--btn` / `--btn-ink` ->
   `--color-btn-primary-bg` / `--color-btn-primary-fg`;
   `--display` -> `--font-display`. Accent mixes follow the prototype's
   recipes through `color-mix(in srgb, var(--color-interactive) N%,
   var(--color-border))`.
3. THE SHEET FIELD. The page area under the room is the prototype's
   `--panel` (`html[data-arena] .arena-sheet` background
   `--color-surface-1`). Colour ONLY - the skin must not set any
   geometry on `.arena-stage` / `.arena-sheet` / the strip / the peek
   (no height, padding, margin, top, position, transform, border width):
   the ONE MOTION rule (camera height never changes, the stage rides the
   sheet's top edge, gap 0) is ar1's and stays untouched.
4. SQUARED PANELS (prototype `.card`, `.panel`, `.wk`, `.setup`, `.ex`,
   `.day`, `.tiles div`, `.list button`). Every card / panel / list row /
   tile on the pages: corner radius 0, no box-shadow, no gradient, no
   fill of its own (it sits on the sheet field), 1px border. Feature
   cards (the prototype's `.card`, `.setup`, `.wk` - the hero / summary
   card of a page, the live workout card, the saved card) take the
   accent rule `color-mix(... interactive 45%, border)`; plain panels,
   list rows and tiles take `--color-border`. Selected / current / next
   items (the prototype's `[aria-pressed="true"]`, `.day.next`,
   `.set.next`) take an accent border and the `--color-surface-2` fill.
   The live in-progress card keeps its `card--live` meaning (the accent
   L-bar stays - restyle its corners only).
5. CONTROLS. Text inputs, number inputs, selects and textareas: radius
   0, `--color-bg` fill, 1px `--color-border`, focus = accent border with
   no glow ring; numeric inputs in the display face 700. Plain buttons:
   radius 0, `--color-surface-2` fill, 1px border, body face 600.
   KEPT ROUND, as in the prototype: the primary call to action (the
   prototype's `.go`: `--color-btn-primary-bg` fill, radius 8px, display
   face not required), the set-done tick (radius 6px), and chip / pill
   controls (filters, suggestion chips, range chips, the coach pill -
   radius 999px). Segmented controls follow the prototype's `.seg`:
   square cells, the pressed one accent border + accent ink + surface-2.
6. TYPE. The display face (`--font-display`, weight 700, line-height
   ~1.1-1.2) on: page and section titles, card titles, exercise names in
   the logger, every big number (stats, set weights / reps, timers,
   counts) with `font-variant-numeric: tabular-nums`. Small labels and
   eyebrows follow the prototype's `.body small` / `.eyebrow`: uppercase,
   letter-spaced (0.07-0.14em), 9-11px, `--color-text-secondary` (an
   eyebrow over a section may take the accent ink). Body copy stays
   `--font-sans`.
7. RULES. Table rows, list separators and section dividers are 1px
   `--color-border` lines (prototype `.tbl`); meters / progress bars are
   square (prototype `.meter`: `--color-bg` track, 1px border, accent
   fill); week day lamps square (prototype `.lamps`); the PR chip follows
   `.chip-pr` (accent fill, `--color-btn-primary-fg` ink, display face
   700 9px, square). The bottom nav keeps its sliding tab mark (MX) and
   gets the prototype's 1px top rule.
8. ORDER OF WORK AND COVERAGE. HOME FIRST, THEN THE LOGGER, both done
   in full: Home (`client/src/pages/DashboardPage.jsx` and what it
   renders: masthead, start-workout hero, Last 7 days card, recent list,
   saved-workout quick start, in-progress bar) and the live logger
   (`/sessions/:id` on a live workout, `SessionDetailPage` with the
   exercise cards / set rows / rest bar / Finish, and the block run page
   `BlockRunPage`). Rules 4-7 are written against the shared primitives
   (cards, inputs, buttons, chips, tables, headings), so they reach
   Analytics, History, Coach, Library and Profile too - check those five
   render cleanly and list any surface you left as today.
9. DARK FIRST, ALL FIVE PALETTES. Judge in dark mode on champ, then
   check iron, chill, forest, crimson dark. Light mode is AR6's (out of
   scope): it only has to stay readable (no text on a same-coloured
   field) - tokens give that for free if rule 2 holds.
10. REDUCED MOTION. The skin adds no animation and no transition. Any
   existing transition it touches stays as today.

ACCEPTANCE CRITERIA (machine-checkable):
- From `client/`: `npm run build` compiles with no errors.
- `node scripts/check-hex.mjs` (repo root) reports no new literal colours.
- Scope: `git status --short --untracked-files=all` lists exactly
  `client/src/main.jsx` (modified) and `client/src/styles/arena-skin.css`
  (new); `git diff client/src/main.jsx` is one added import line.
- Fully scoped - from the repo root this prints `ok`:
  `node -e "const c=require('fs').readFileSync('client/src/styles/arena-skin.css','utf8').replace(/\/\*[\s\S]*?\*\//g,'');const sel=[];c.replace(/([^{}]+)\{/g,(m,s)=>{s=s.trim();if(!s.startsWith('@'))sel.push(...s.split(','));return m});const bad=sel.map(s=>s.trim()).filter(s=>s&&!s.startsWith('html[data-arena]'));if(/@keyframes|@font-face|@import/.test(c))throw new Error('keyframes/font-face/import present');if(bad.length)throw new Error('unscoped: '+bad.join(' | '));console.log('ok',sel.length)"`
- Every `var(--...)` the new file uses is defined in
  `client/src/index.css` (list them in DELIVERY.md with the grep).
- No geometry on the stage: the new file sets none of `height`,
  `min-height`, `padding`, `margin`, `top`, `bottom`, `position`,
  `transform`, `inset` on any selector naming `arena-stage`,
  `arena-sheet`, `arena-strip` or `arena-peek` (state the grep).
- Arena view OFF: on Home and the live logger, a screenshot before and
  after the change (same seed, same viewport) is pixel-identical, or the
  computed `border-radius`, `background-color`, `font-family` of the
  page's first card, first input and h1 are equal before / after (report
  the numbers).
- Arena view ON, Playwright phone profile, dark, champ, at 412 x 839 AND
  360 x 740: screenshots of Home (top, and scrolled to the Last 7 days
  card), the live logger with two exercises and a done set, Analytics,
  History, Coach, Library, Profile; on each,
  `document.documentElement.scrollWidth === window.innerWidth`.
  Report for Home and the logger the computed `border-radius` of a card,
  an input and the primary button (0 / 0 / 8px) and the `font-family`
  of the page title and a set weight (Chakra Petch first).
- Same Home + logger screenshots in iron, chill, forest, crimson dark
  (412 x 839 only), plus one light-mode Home showing readable text.
- The ar1 ride still holds: on Home at scrollY 0, 60 and 2000 the sheet
  top minus the stage bottom is the same number until the strip holds
  (report the numbers).
- No `requestAnimationFrame` callbacks for 2 s at rest on Home and on
  the logger (state the count).
- `prefers-reduced-motion: reduce`: no animation or transition is added
  (state how you checked).

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
