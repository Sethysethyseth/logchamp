# TASK bl4: Analytics block scope - "All training" or one block, in block weeks

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
Block Lens wave (BL). AFTER bl3 lands (it adds `GET /analytics/block-runs`
and `GET /analytics/block-run/:id` plus their client calls in
`analyticsApi.js`; read bl3's landed code for the exact response shape).
AFTER bl2 lands too (both touch `client/src/index.css`).
Design of record: `docs/design/mocks/block-lens/mock/block-1.jpg` and
`block-2.jpg` (and `preview.html`, section 3, beside today's page in
`mock/today-a1.jpg`). Block scope shows only the selected block's
workouts, read in block weeks. "All training" is today's page, unchanged.

FILES TO TOUCH:
- client/src/pages/AnalyticsPage.jsx
- client/src/components/analytics/block/        (new: the block cards)
- client/src/index.css                          (block card styles,
                                                 tokens only)
- client/src/pages/BlockRunPage.jsx             (one link)
- client/src/lib/arenaFacts.js / arenaBoards.js (ONLY if the board needs
                                                 to say BLOCK on its face;
                                                 optional - skip if not
                                                 trivial)
Do NOT modify anything outside these files.

CHANGE:
1. Scope chips at the top of Analytics, in place of the range chips while
   a block is selected: "All training" plus one chip per run from
   `getBlockRuns()` (active run first, then the 3 most recent ended runs;
   label = block name). Hidden entirely when the user has no runs. The
   selection lives in the URL (`?block=<runId>`, removed for All
   training) so a link from the block page opens the scope. Same chip
   component and sliding indicator as the range chips (`range-chip`,
   `mx-slide-host` / SlidingIndicator).
2. In block scope, from top to bottom (match the mocks):
   - Header card: progress ring (week / weeksTotal), "Week N of M",
     "X of Y days done - A of B this week".
   - Headline tiles in the existing StatTiles style: "Since week 1 -
     <lift>" e1rm delta for the two lifts with the biggest positive delta
     (green up tone, "estimated 1RM" sub), "On plan" `onPlanPct`%,
     "Off-block workouts" count with "left out of this view".
   - "Sets logged, of planned": one bar per block week, "38/40", the
     current week hatched while unfinished.
   - One chart card per lift with 2+ weeks of data: "Top set by block
     week", x = W1..Wn, lines for Left and Right on per-side lifts (one
     line otherwise), the planned load dashed, a crosshair tooltip
     ("Week 4 / Left 205 lbs - Right 210 lbs / Planned 210 lbs"), and the
     existing ChartTableToggle table view. Follow StrengthTrendChart for
     scales, unit display (`formatWeight` / weight unit pref), legends,
     the chart-tip host pattern and the scroll-into-view draw-in.
   - The existing Execution card fed from `onPlan` (reuse the component).
   The four view tabs, range chips and coach panel are hidden in block
   scope.
3. Link: BlockRunPage gets an "Analytics" link to `/analytics?block=<id>`
   in its header actions, styled like its other header links.
4. Loading: skeleton on first load (existing `LoadingState` analytics
   variant); switching scope dims and refreshes in place like a range
   change. A 404 for the run falls back to All training.
Motion: the existing Cascade on the cards, CountUp on numbers, chart
draw-in on scroll - nothing new.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` clean; `node scripts/check-hex.mjs` clean;
  `npm run test:unit` green from `server/` (unchanged count).
- `grep -n "#[0-9a-fA-F]\{3,6\}" client/src/components/analytics/block/` returns nothing.
- Cloud smoke rig (create a block + run for the smoke account, log two
  block workouts incl. one per-side lift and one off-block workout):
  - contact sheet of block scope beside `mock/block-1.jpg` /
    `block-2.jpg`, Arena and Classic, champ + crimson, 412 and 360 wide.
  - `/analytics?block=<id>` opens block scope; the chip for All training
    removes the param and shows today's page unchanged (contact sheet
    beside `mock/today-a1.jpg`).
  - the per-side chart shows two lines + dashed planned; the tooltip
    text matches the format above (quote it).
  - a run id of another account in the URL falls back to All training
    (no error toast, no data from that run - quote the network response).
  - STATE MATRIX with every control on screen and usable: account with
    no runs (no scope chips), active run, ended run, run with no logged
    workouts yet (empty states, not blank cards), reduced motion.
  - zero console errors; `scrollWidth == innerWidth`.

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
