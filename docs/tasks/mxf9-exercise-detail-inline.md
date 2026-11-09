# TASK mxf9: Analytics Exercises - the exercise detail opens inline, right under the tapped row

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth smoke, Nov 9 2026 (motion wave, `motion-wave` branch). On Analytics >
Exercises, tapping a roster row opens the exercise detail panel BELOW THE
WHOLE LIST, so on a phone the lifter taps "Barbell Bench Press" and nothing
visible happens - the panel is a long scroll away. Seth wants it to open
directly under the row he tapped, like an accordion, and to be "nice and big"
for the user.

Today (`client/src/components/analytics/ExercisesView.jsx`): `ExercisesView`
renders `<ul className="exercise-roster">` of `RosterRow`s and then, after the
list, `{parsedExercise ? <ExerciseDetailPanel .../> : null}`. Selection is
URL-driven: `exerciseParam` (the `?exercise=` search param, owned by
`AnalyticsPage.jsx`) via `selectRow` / `closeDetail` /
`onExerciseParamChange`; `serializeExerciseParam` / `parseExerciseParam`
encode identity. That URL contract stays exactly as is.

FILES TO TOUCH:
- client/src/components/analytics/ExercisesView.jsx   (render placement,
  selected-row behaviour, scroll handling)
- client/src/styles/analytics-motion.css and/or client/src/index.css
  (ONLY the `.exercise-roster*` / `.ex-detail-*` / `.ex-*` rules this
  change needs)
Do NOT modify anything outside these files. `AnalyticsPage.jsx` must not
change - the `?exercise=` param contract is unchanged.

CHANGE:
1. Inline placement. The detail panel for the selected exercise renders
   inside the roster, immediately after the selected row (same `<li>` or a
   sibling `<li>` right after it - your call), not after the list. Exactly
   one panel can be open. Nothing renders at the bottom of the list any
   more.
2. Behaviour (unchanged semantics, new placement):
   - tap a closed row -> its panel opens under it, any other open panel
     closes;
   - tap the open row again -> it closes (existing `selectRow` toggle);
   - the panel's Close button -> closes (existing `closeDetail`);
   - loading (skeleton) and error (with its "Back to list" button) states
     also render inline under the row.
   - The selected row keeps `aria-pressed` and gets `aria-expanded` +
     `aria-controls` pointing at the panel's id.
3. Keep the tapped row in view. When a panel opens, the tapped row's top
   must end up on screen (below any sticky header the Analytics page has),
   including the case where a panel ABOVE it was open and closes in the
   same tap (the list shifts up). Scroll only when the row would otherwise
   be off screen or above the sticky header; never scroll on initial page
   load from a deep link unless the row is off screen. Honour
   `prefers-reduced-motion` (instant scroll, no smooth). Follow the
   existing reduced-motion pattern in this codebase BY NAME (grep for the
   reduced-motion hook the MX wave added) rather than inventing one.
4. "Nice and big." The open panel spans the full width of the roster
   (same left/right edges as the rows), reads as attached to its row (the
   selected row and panel visually join - selected row keeps its
   `is-selected` look), and its content is sized for a phone: the
   exercise name, the totals row and the hero numbers in the sub-cards
   should be noticeably larger than the roster rows' text, with
   comfortable padding - no cramped 4-across text at 390 px. On wide
   screens it may use a 2-column card layout inside the panel. Tokens
   only (no hex - `scripts/check-hex.mjs` must pass); `card--live` is
   NOT to be used.
5. Motion (MX wave, analytics-first): the panel opens with a short
   height/opacity reveal using the existing `--mx-*` timing tokens from
   `analytics-motion.css`; closing may be instant. No reveal under
   `prefers-reduced-motion`. Opening must not block the tap or delay
   the row's pressed state.
6. Do not change the data fetching (`getExerciseDetail` effect), the
   sort order of the roster, search, or the Active/All lens.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors.
- `node scripts/check-hex.mjs` (from repo root) passes.
- `npm run test:unit` from `server/` green (sanity; no server change).
- Static: in `ExercisesView.jsx`, `ExerciseDetailPanel` is rendered from
  inside the roster map (adjacent to the selected row), and there is NO
  `ExerciseDetailPanel` render after the closing `</ul>` of
  `.exercise-roster`.
- Static: the selected row's button carries `aria-expanded={selected}` and
  `aria-controls` matching the rendered panel's `id`.
- Behaviour, described with evidence in DELIVERY.md (code path walk-through
  is acceptable since the lane has no browser): with rows [A, B, C, D] and
  `?exercise=` unset -> tap B: URL `?exercise=<B>`, panel DOM node is the
  next sibling content after B and before C; tap D: URL `?exercise=<D>`,
  B's panel gone, panel between D and the end; tap D again: param removed,
  no panel in the DOM; Close button: same as tapping D again.
- Search filtering that hides the selected row hides its panel too (the
  panel lives with the row); clearing the search shows both again.

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
